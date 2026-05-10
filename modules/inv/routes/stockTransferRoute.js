// routes/stockTransferRoutes.js
import { Router } from "express";
const router = Router();

import {
  createStockTransfer,
  getStockTransfers,
  getTransferDocument,
} from "../controllers/stockTransferController.js";
import {
  createStockTransferValidator,
  getTransferDocumentValidator,
} from "../validators/stockTransferValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Stock transfer routes
router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createStockTransferValidator,
  createStockTransfer,
);

router.get("/", protect, allowedTo("admin", "CEO"), getStockTransfers);

// Documents
router.get(
  "/document/:transferId",
  protect,
  allowedTo("admin", "CEO"),
  getTransferDocumentValidator,
  getTransferDocument,
);

export default router;
