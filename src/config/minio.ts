/*External dependencies */
import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "",
  port: parseInt(process.env.MINIO_PORT || "", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const AVATAR_BUCKET = process.env.MINIO_AVATAR_BUCKET || "";

// Initialize bucket on server startup
export const initMinioBucket = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(AVATAR_BUCKET);

    if (!exists) {
      await minioClient.makeBucket(AVATAR_BUCKET, "us-east-1");

      // Set public read policy on the bucket
      const readOnlyPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${AVATAR_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(
        AVATAR_BUCKET,
        JSON.stringify(readOnlyPolicy),
      );
    }
  } catch (error) {
    console.error("Failed to initialize MinIO bucket:", error);

    throw error;
  }
};
