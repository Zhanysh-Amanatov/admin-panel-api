/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../app";
import pool from "../config/db";
import { createTestData } from "./helper";

describe("get user api test", () => {
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

  it("should fail for user from fetching ANOTHER user's record", async () => {
    const res = await request(app)
      .get(`/api/users/${user2Id}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(403);
  });

  it("should successfully allow user to fetch their OWN record", async () => {
    const res = await request(app)
      .get(`/api/users/${user1Id}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user1@test.com");
  });

  it("should successfully allow user to fetch OTHERS record with ADMIN role", async () => {
    const res = await request(app)
      .get(`/api/users/${user1Id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user1@test.com");
  });
});
