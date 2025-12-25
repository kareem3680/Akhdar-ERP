import { Router } from "express";
const router = Router();

import {
  createStockTransfer,
  getStockTransfers,
  updateStockTransfer,
  shipTransfer,
  deliverTransfer,
  getTransferDocument,
} from "../controllers/stockTransferController.js";
import {
  createStockTransferValidator,
  updateStockTransferValidator,
  transferActionValidator,
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
  createStockTransfer
);

router.get("/", protect, allowedTo("admin", "CEO"), getStockTransfers);

router.patch(
  "/:stockTransferId",
  protect,
  allowedTo("admin", "CEO"),
  updateStockTransferValidator,
  updateStockTransfer
);

// Transfer status management
router.patch(
  "/ship/:transferOrderId",
  protect,
  allowedTo("admin", "CEO"),
  transferActionValidator,
  shipTransfer
);

router.patch(
  "/deliver/:transferOrderId",
  protect,
  allowedTo("admin", "CEO"),
  transferActionValidator,
  deliverTransfer
);

// Documents
router.get(
  "/document/:transferOrderId",
  protect,
  allowedTo("admin", "CEO"),
  transferActionValidator,
  getTransferDocument
);

export default router;
