/*External dependencies */
import { Router } from "express";

/*Local dependencies */
import { uploadImage } from "../controllers/image.controller";
import {
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  validateInput,
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
router.put("/:id", authorizeSelfOrAdmin, validateInput, updateUser);

router.put("/:id/avatar", authenticateToken, uploadImage);

export default router;
