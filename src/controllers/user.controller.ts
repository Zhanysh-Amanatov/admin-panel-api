/*External dependencies */
import { NextFunction, Request, Response } from "express";

/*Local dependencies */
import pool from "../config/db";
import { AuthenticatedRequest } from "../middleware/types";

export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });

      return;
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user?.role !== "admin" && req.user?.id !== id) {
      res.status(403).json({ error: "Forbidden: access denied" });

      return;
    }

    const result = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });

      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const isAdmin = req.user?.role === "admin";
    const isSelf = req.user?.id === id;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: "Forbidden: access denied" });
      return;
    }

    if (role && !isAdmin) {
      res
        .status(403)
        .json({ error: "Forbidden: only admins can update roles" });

      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (email) {
      values.push(email);
      updates.push(`email = $${values.length}`);
    }

    if (role && isAdmin) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No valid fields provided for update" });
      return;
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = $${values.length} 
      RETURNING id, email, role, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).json({ message: "Email already in use" });

      return;
    }

    next(error);
  }
}

export function validateInput(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { email } = req.body;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (id && !UUID_REGEX.test(id as string)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email address format" });
    }
  }

  next();
}
