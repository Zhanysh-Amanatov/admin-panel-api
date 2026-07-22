/*External dependencies */
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

/*Local dependencies */
import pool from "../config/db";
import { AVATAR_BUCKET, minioClient } from "../config/minio";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE64_IMAGE_REGEX = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i;

export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { image } = req.body;

    if (!UUID_REGEX.test(id as string)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Base64 image string is required" });
    }

    const match = image.match(BASE64_IMAGE_REGEX);

    if (!match) {
      return res.status(400).json({
        error:
          "Invalid image format. Must be a valid JPEG, PNG, or WEBP Data URI",
      });
    }

    const [, mimeType, ext, base64Data] = match;
    const imageBuffer = Buffer.from(base64Data, "base64");

    if (imageBuffer.length > MAX_FILE_SIZE) {
      return res
        .status(400)
        .json({ error: "Image size exceeds maximum limit of 5MB" });
    }

    // MinIO Upload
    const objectName = `avatars/${id}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    await minioClient.putObject(
      AVATAR_BUCKET,
      objectName,
      imageBuffer,
      imageBuffer.length,
      {
        "Content-Type": mimeType,
      },
    );

    const host = process.env.MINIO_ENDPOINT || "localhost";
    const port = process.env.MINIO_PORT || "9000";
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const avatarUrl = `${protocol}://${host}:${port}/${AVATAR_BUCKET}/${objectName}`;

    const result = await pool.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, role, avatar_url, updated_at`,
      [avatarUrl, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
