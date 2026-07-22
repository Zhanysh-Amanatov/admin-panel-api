/*Local dependencies */
import pool from "../config/db";
import { User, UserRow } from "./types";

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    "SELECT id, email, password, role FROM users WHERE email = $1",
    [email],
  );

  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT id, email, role, created_at FROM users WHERE id = $1",
    [id],
  );

  return result.rows[0] || null;
}

export async function findAllUsers(): Promise<User[]> {
  const result = await pool.query<User>(
    "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
  );

  return result.rows;
}

export async function deleteUserById(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateUserById(
  id: string,
  fields: { email?: string; role?: string },
): Promise<User | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (fields.email) {
    values.push(fields.email);
    updates.push(`email = $${values.length}`);
  }

  if (fields.role) {
    values.push(fields.role);
    updates.push(`role = $${values.length}`);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE users 
    SET ${updates.join(", ")} 
    WHERE id = $${values.length} 
    RETURNING id, email, role, created_at
  `;

  const result = await pool.query<User>(query, values);

  return result.rows[0] || null;
}
