import { Router } from "express";
const router = Router();

import { updateMyPassword } from "../controllers/updatePasswordController.js";
import { updatePasswordValidator } from "../validators/updatePasswordValidator.js";
import { protect } from "../controllers/authController.js";

router.patch("/", protect, updatePasswordValidator, updateMyPassword);

export default router;
