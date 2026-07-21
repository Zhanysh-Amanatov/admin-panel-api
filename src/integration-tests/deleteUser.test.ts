/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../app";
import pool from "../config/db";
import { createTestData } from "./helper";

describe("delete user api test", () => {
  let adminToken: string;
  let user2Id: string;

  beforeAll(async () => {
    const testData = await createTestData();
    adminToken = testData.adminToken;
    user2Id = testData.user2Id;
  });

  afterAll(async () => {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    await pool.end();
  });

  it("should successfully allow admin to delete a user row", async () => {
    const res = await request(app)
      .delete(`/api/users/${user2Id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify row deletion in DB
    const dbCheck = await pool.query("SELECT * FROM users WHERE id = $1", [
      user2Id,
    ]);
    expect(dbCheck.rows.length).toBe(0);
  });
});
