/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../app";
import pool from "../config/db";
import { createTestData } from "./helper";

describe("list users api test", () => {
  let adminToken: string;
  let user1Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const testData = await createTestData();
    adminToken = testData.adminToken;
    user1Token = testData.user1Token;
    user1Id = testData.user1Id;
    user2Id = testData.user2Id;
  });

  afterAll(async () => {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    await pool.end();
  });

  it("should fail to list users as a regular user role", async () => {
    const result = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(result.status).toBe(403);
    expect(result.body.error).toEqual("Forbidden: insufficient permissions");
  });

  it("should successfully list users as ADMIN role", async () => {
    const result = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(result.status).toBe(200);
    expect(Array.isArray(result.body.users)).toBe(true);
    expect(result.body.users.length).toBe(3); // admin, user1, user2
  });
});
