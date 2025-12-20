import { Router } from "express";
const router = Router();

import { getStats, getStatsHistory } from "../controllers/statsController.js";
import { getStatsValidator } from "../validators/statsValidator.js";
import {
  protect,
  allowedTo,
} from "../../../modules/identity/controllers/authController.js";

// Same exact endpoint
router.get(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  getStatsValidator,
  getStats
);

// New endpoint for statistics history
router.get(
  "/history",
  protect,
  allowedTo("admin", "CEO"),
  getStatsValidator,
  getStatsHistory
);

export default router;
