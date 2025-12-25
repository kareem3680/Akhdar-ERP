import { Router } from "express";
const router = Router();

import {
  createStock,
  getStock,
  getInventoryStocks,
  updateStock,
  deleteStock,
  stockIn,
  stockOut,
} from "../controllers/stockController.js";
import {
  createStockValidator,
  getStockValidator,
  updateStockValidator,
  deleteStockValidator,
} from "../validators/stockValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Stock management routes
router.post(
  "/:inventoryId",
  protect,
  allowedTo("admin", "CEO"),
  createStockValidator,
  createStock
);

router.get(
  "/stocks/:inventoryId",
  protect,
  allowedTo("admin", "CEO"),
  getInventoryStocks
);

router.get(
  "/:inventoryId/stocks/:stockId",
  protect,
  allowedTo("admin", "CEO"),
  getStockValidator,
  getStock
);

router.patch(
  "/:stockId",
  protect,
  allowedTo("admin", "CEO"),
  updateStockValidator,
  updateStock
);

router.delete(
  "/:stockId",
  protect,
  allowedTo("admin", "CEO"),
  deleteStockValidator,
  deleteStock
);

// Stock in/out operations
router.post(
  "/purchase-orders/stock-in/:purchaseOrderId",
  protect,
  allowedTo("admin", "CEO"),
  stockIn
);

router.post(
  "/sale-orders/stock-out/:saleOrderId",
  protect,
  allowedTo("admin", "CEO"),
  stockOut
);

export default router;
