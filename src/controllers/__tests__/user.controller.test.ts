/*External dependencies */
import express, { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

/*Local dependencies */
import pool from "../../config/db";
import userRoutes from "../../routes/user.routes";

jest.mock("../../config/db", () => ({
  query: jest.fn(),
}));

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app: Express = express();
app.use(express.json());
app.use("/api/users", userRoutes);

// Helper to generate test JWT tokens
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "1h" });
};

describe("User Controller & Route Protection", () => {
  const adminToken = generateToken("admin-123", "admin");
  const userToken = generateToken(
    "d92441a1-cc60-498e-b3aa-5884bdc13e08",
    "user",
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("listUsers api test", () => {
    it("should successfully list users to admin", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              id: "d92441a1-cc60-498e-b3aa-5884bdc13e08",
              email: "user@test.com",
            },
          ],
        }) // Users query
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }); // Count query

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
    });

    it("should fail non-admin users with 403 Forbidden to list users", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("getUser api test", () => {
    it("should successfully allow a regular user to get their OWN profile", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: "d92441a1-cc60-498e-b3aa-5884bdc13e08",
            email: "user@test.com",
            role: "user",
          },
        ],
      });

      const response = await request(app)
        .get("/api/users/d92441a1-cc60-498e-b3aa-5884bdc13e08")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(
        "d92441a1-cc60-498e-b3aa-5884bdc13e08",
      );
    });

    it("should successfully allow an admin to get ANY user profile", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: "user-456", email: "other@test.com", role: "user" }],
      });

      const response = await request(app)
        .get("/api/users/user-456")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe("user-456");
    });

    it("should reject regular user attempting to view ANOTHER user profile", async () => {
      const response = await request(app)
        .get("/api/users/user-456") // Target ID differs from user-123 in token
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("updateUser api test", () => {
    it("should fail to update user when invalid email format is provided", async () => {
      const response = await request(app)
        .put("/api/users/d92441a1-cc60-498e-b3aa-5884bdc13e08")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual("Invalid email address format");
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("should reject regular user attempting to update ANOTHER user", async () => {
      const response = await request(app)
        .put("/api/users/user-456")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "hacked@test.com" });

      expect(response.status).toBe(403);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("should successfully allow user to update their OWN email", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: "d92441a1-cc60-498e-b3aa-5884bdc13e08",
            email: "newemail@test.com",
            role: "user",
          },
        ],
      });

      const response = await request(app)
        .put("/api/users/d92441a1-cc60-498e-b3aa-5884bdc13e08")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "newemail@test.com" });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("newemail@test.com");
    });

    it("should prevent regular user from updating their role to admin", async () => {
      const response = await request(app)
        .put("/api/users/d92441a1-cc60-498e-b3aa-5884bdc13e08")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ role: "admin" });

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/only admins can update roles/i);
    });
  });

  describe("DELETE /api/users/:id (deleteUser)", () => {
    it("should successfully allow admin to delete a user", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: "user-456" }],
      });

      const response = await request(app)
        .delete("/api/users/user-456")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it("should reject non-admin users from deleting accounts", async () => {
      const response = await request(app)
        .delete("/api/users/user-456")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
