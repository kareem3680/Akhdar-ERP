import { Router } from "express";
const router = Router();

import {
  signUp,
  logIn,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import {
  signUpValidator,
  logInValidator,
} from "../validators/authValidator.js";

import { protect } from "../controllers/authController.js";

router.post("/signUp", signUpValidator, signUp);
router.post("/logIn", logInValidator, logIn);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);

export default router;
