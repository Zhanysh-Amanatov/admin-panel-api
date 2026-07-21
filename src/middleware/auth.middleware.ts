/*External dependencies */
import { NextFunction, Response } from "express";

/*Local dependencies */
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "./types";

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });

    return;
  }

  try {
    const decoded = verifyToken(token);

    req.user = decoded as any;

    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
};

export function authorizeSelfOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const { id } = req.params;
  const isAdmin = req.user?.role === "admin";
  const isSelf = req.user?.id === id;

  if (isAdmin || isSelf) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: access denied" });
  }
}
