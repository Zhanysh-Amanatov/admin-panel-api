/*External dependencies */
import jwt from "jsonwebtoken";

/*Local dependencies */
import pool from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

interface TestData {
  adminToken: string;
  adminId: string;
  user1Token: string;
  user1Id: string;
  user2Id: string;
}

export const createTestData = async (): Promise<TestData> => {
  // 1. Delete existing rows
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");

  const dummyPassword = "hashed_password_123";

  // 2. Insert Admin
  const adminRes = await pool.query(
    `INSERT INTO users (email, password, role) VALUES ('admin@test.com', $1, 'admin') RETURNING id`,
    [dummyPassword],
  );
  const adminId = adminRes.rows[0].id;

  // 3. Insert Regular User 1
  const user1Res = await pool.query(
    `INSERT INTO users (email, password, role) VALUES ('user1@test.com', $1, 'user') RETURNING id`,
    [dummyPassword],
  );
  const user1Id = user1Res.rows[0].id;

  // 4. Insert Regular User 2
  const user2Res = await pool.query(
    `INSERT INTO users (email, password, role) VALUES ('user2@test.com', $1, 'user') RETURNING id`,
    [dummyPassword],
  );
  const user2Id = user2Res.rows[0].id;

  // 5. Generate signed JWT tokens matching user IDs and roles
  const adminToken = jwt.sign({ id: adminId, role: "admin" }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const user1Token = jwt.sign({ id: user1Id, role: "user" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { adminToken, user1Token, adminId, user1Id, user2Id };
};
