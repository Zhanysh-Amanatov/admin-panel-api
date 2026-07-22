/*External dependencies */
import { NextFunction, Response } from "express";

/*Local dependencies */
import { AuthenticatedRequest } from "../middleware/types";
import * as userRepository from "../repositories/user.repository";

export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const deleted = await userRepository.deleteUserById(id as string);

    if (!deleted) {
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

    const user = await userRepository.findUserById(id as string);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
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
    const users = await userRepository.findAllUsers();

    res.json({ users });
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

    if (!email && !role) {
      res.status(400).json({ error: "No valid fields provided for update" });

      return;
    }

    const updatedUser = await userRepository.updateUserById(id as string, {
      email,
      role: isAdmin ? role : undefined,
    });

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });

      return;
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).json({ message: "Email already in use" });

      return;
    }

    next(error);
  }
}
