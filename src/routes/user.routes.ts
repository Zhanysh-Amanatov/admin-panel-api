/*External dependencies */
import { Router } from "express";

/*Local dependencies */
import {
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../controllers/user.controller";
import {
  authenticateToken,
  authorizeRoles,
  authorizeSelfOrAdmin,
} from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/", authorizeRoles("admin"), listUsers);
router.delete("/:id", authorizeRoles("admin"), deleteUser);

router.get("/:id", authorizeSelfOrAdmin, getUser);
router.put("/:id", authorizeSelfOrAdmin, updateUser);

export default router;
