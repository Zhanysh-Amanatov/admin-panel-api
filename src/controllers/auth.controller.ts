/*External dependencies */
import { Request, Response } from "express";

/*Local dependencies */
import pool from "../config/db";
import { generateToken } from "../utils/jwt";
import { comparePassword } from "../utils/password";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const invalidCredentialsMsg = "Invalid email or password";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });

    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: invalidCredentialsMsg });
    }

    const user = result.rows[0];

    const isPasswordValid = await comparePassword({
      plainPassword: password,
      hashId: user.password_hash,
    });

    if (!isPasswordValid) {
      res.status(401).json({ error: invalidCredentialsMsg });

      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({ error: "Internal server error" });
  }
}
