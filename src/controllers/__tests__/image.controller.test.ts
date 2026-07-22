/*External dependencies */
import { NextFunction, Request, Response } from "express";

/*Local dependencies */
import pool from "../../config/db";
import { minioClient } from "../../config/minio";
import { uploadImage } from "../image.controller";

jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../config/minio", () => ({
  AVATAR_BUCKET: "user-avatars",
  minioClient: {
    putObject: jest.fn(),
  },
}));

describe("upload image api test", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const validUserId = "123e4567-e89b-12d3-a456-426614174000";
  const bas64Image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: validUserId },
      body: { image: bas64Image },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should return 400 if user ID is not a valid UUID", async () => {
    req.params = { id: "invalid-uuid" };

    await uploadImage(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid user ID format" });
  });

  it("should return 400 if image payload is missing", async () => {
    req.body = {};

    await uploadImage(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Base64 image string is required",
    });
  });

  it("should return 400 if image format is not a supported Base64 Data URI", async () => {
    req.body = {
      image:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    };

    await uploadImage(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        "Invalid image format. Must be a valid JPEG, PNG, or WEBP Data URI",
    });
  });

  it("should return 400 if file size exceeds 5MB", async () => {
    // Generate a ~6MB dummy base64 string
    const largeBase64 = "A".repeat(6 * 1024 * 1024 * 1.35);
    req.body = { image: `data:image/png;base64,${largeBase64}` };

    await uploadImage(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Image size exceeds maximum limit of 5MB",
    });
  });

  it("should return 404 if user is not found in database", async () => {
    (minioClient.putObject as jest.Mock).mockResolvedValue(true);
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    await uploadImage(req as Request, res as Response, next);

    expect(minioClient.putObject).toHaveBeenCalled();
    expect(pool.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should successfully upload avatar to MinIO and update user in database", async () => {
    const mockUser = {
      id: validUserId,
      email: "test@example.com",
      role: "USER",
      avatar_url: "http://localhost:9000/user-avatars/avatars/test.png",
      updated_at: new Date(),
    };

    (minioClient.putObject as jest.Mock).mockResolvedValue(true);
    (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

    await uploadImage(req as Request, res as Response, next);

    expect(minioClient.putObject).toHaveBeenCalledWith(
      "user-avatars",
      expect.stringMatching(
        /^avatars\/123e4567-e89b-12d3-a456-426614174000-[a-f0-9]+\.png$/,
      ),
      expect.any(Buffer),
      expect.any(Number),
      { "Content-Type": "image/png" },
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE users"),
      [expect.any(String), validUserId],
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Avatar uploaded successfully",
      user: mockUser,
    });
  });

  test("should pass unhandled errors to Express error handler (next)", async () => {
    const dbError = new Error("Database error");
    (minioClient.putObject as jest.Mock).mockResolvedValue(true);
    (pool.query as jest.Mock).mockRejectedValue(dbError);

    await uploadImage(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
