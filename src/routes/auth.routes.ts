/*External dependencies */
import { Router } from "express";

/*Local dependencies */
import { login } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);

export default router;
