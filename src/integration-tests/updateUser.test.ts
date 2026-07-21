/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../app";
import pool from "../config/db";
import { createTestData } from "./helper";

describe("update user api test", () => {
  let user1Token: string;
  let user1Id: string;

  beforeAll(async () => {
    const testData = await createTestData();
    user1Token = testData.user1Token;
    user1Id = testData.user1Id;
  });

  afterAll(async () => {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    await pool.end();
  });

  it("should successfully allow user to update their own email", async () => {
    const result = await request(app)
      .put(`/api/users/${user1Id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ email: "user1_new@test.com" });

    expect(result.status).toBe(200);
    expect(result.body.user.email).toBe("user1_new@test.com");

    // Direct verification in DB
    const dbCheck = await pool.query("SELECT email FROM users WHERE id = $1", [
      user1Id,
    ]);
    expect(dbCheck.rows[0].email).toBe("user1_new@test.com");
  });

  it("should trigger PostgreSQL unique constraint on duplicate email (23505)", async () => {
    const result = await request(app)
      .put(`/api/users/${user1Id}`)
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ email: "user2@test.com" }); // Already owned by user2

    expect(result.status).toBe(409);
    expect(result.body.message).toEqual("Email already in use");
  });
});
