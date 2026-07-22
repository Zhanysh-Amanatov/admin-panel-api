/*External dependencies */
import { NextFunction, Request, Response } from "express";

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
