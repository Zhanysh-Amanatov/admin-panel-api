/*External dependencies */
import { Request, Response } from "express";

/*Local dependencies */
import * as userRepository from "../repositories/user.repository";
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
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      res.status(401).json({ error: invalidCredentialsMsg });

      return;
    }

    const isPasswordValid = await comparePassword({
      plainPassword: password,
      hashId: user.password,
    });

    if (!isPasswordValid) {
      res.status(401).json({ error: invalidCredentialsMsg });

      return;
    }

    const token = generateToken({ id: user.id, role: user.role });

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
