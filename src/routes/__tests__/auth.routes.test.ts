/*External dependencies */
import request from "supertest";

/*Local dependencies */
import app from "../../app";
import pool from "../../config/db";
import * as jwtUtils from "../../utils/jwt";
import * as passwordUtils from "../../utils/password";

jest.mock("../../utils/password");
jest.mock("../../utils/jwt");

describe("POST /api/auth/login", () => {
  const querySpy = jest.spyOn(pool, "query");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail with 400 status code when email or password are missing", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" }); // Missing password

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email and password are required" });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("should fail with 401 status code when user is not found in database", async () => {
    // Mock DB returning 0 rows
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "password123" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password" });
  });

  it("should fail with 401 status code when password does not match", async () => {
    const mockUser = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
      password_hash: "$2a$10$fakehashedpassword",
      role: "user",
    };

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockUser],
    });

    // Password check fails
    (passwordUtils.comparePassword as jest.Mock).mockResolvedValueOnce(false);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password" });
  });

  it("should fail with 500 status code database throws an exception", async () => {
    // Force DB query to reject with an error
    (pool.query as jest.Mock).mockRejectedValueOnce(
      new Error("DB Connection Error"),
    );

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });

  it("should successfully return 200 status code and a JWT token on successful login", async () => {
    const mockUser = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
      password_hash: "$2a$10$fakehashedpassword",
      role: "user",
    };

    // Return the Promise directly (or make the spy implementation async)
    querySpy.mockImplementationOnce(async () => {
      return {
        rows: [mockUser],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      };
    });

    // Mock password comparison returning true
    (passwordUtils.comparePassword as jest.Mock).mockResolvedValueOnce(true);

    // Mock token generation
    (jwtUtils.generateToken as jest.Mock).mockReturnValue("fake_jwt_token");

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Login successful",
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      },
      token: "fake_jwt_token",
    });

    // Verify DB was queried with the correct email
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      ["test@example.com"],
    );
  });
});
