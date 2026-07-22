/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../app";
import pool from "../config/db";
import { AVATAR_BUCKET, initMinioBucket, minioClient } from "../config/minio";
import { createTestData } from "./helper";

describe("PUT /api/users/:id/avatar Integration Test", () => {
  let user1Token: string;
  let user1Id: string;

  beforeAll(async () => {
    await initMinioBucket();

    const testData = await createTestData();
    user1Token = testData.user1Token;
    user1Id = testData.user1Id;
  });

  afterAll(async () => {
    await pool.end();

    // Terminate idle MinIO HTTP keep-alive sockets
    // @ts-ignore
    if (minioClient.transport?.agent) {
      // @ts-ignore
      minioClient.transport.agent.destroy();
    }
  });

  it("should successfully upload a Base64 image, save to MinIO, and update the database", async () => {
    // 1x1 transparent PNG Data URI
    const sampleBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    const res = await request(app)
      .put(`/api/users/${user1Id}/avatar`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ image: sampleBase64 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Avatar uploaded successfully");
    expect(res.body.user).toHaveProperty("avatar_url");
    expect(res.body.user.avatar_url).toContain(
      `/${AVATAR_BUCKET}/avatars/${user1Id}-`,
    );

    // Verify PostgreSQL state directly
    const dbResult = await pool.query(
      "SELECT avatar_url FROM users WHERE id = $1",
      [user1Id],
    );
    expect(dbResult.rows[0].avatar_url).toBe(res.body.user.avatar_url);

    // Verify MinIO file persistence directly
    const objectName = res.body.user.avatar_url.split(`/${AVATAR_BUCKET}/`)[1];
    const minioObjectStat = await minioClient.statObject(
      AVATAR_BUCKET,
      objectName,
    );
    expect(minioObjectStat.size).toBeGreaterThan(0);
  });

  it("should return 400 when an invalid UUID format is provided", async () => {
    const res = await request(app)
      .put("/api/users/not-a-valid-uuid/avatar")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ image: "data:image/png;base64,iVBORw0KGgo=" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid user ID format" });
  });

  it("should return 400 when image format is unsupported", async () => {
    const res = await request(app)
      .put(`/api/users/${user1Id}/avatar`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        image:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error:
        "Invalid image format. Must be a valid JPEG, PNG, or WEBP Data URI",
    });
  });
});
