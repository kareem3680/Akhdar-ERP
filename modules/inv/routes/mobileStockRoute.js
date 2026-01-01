import { Router } from "express";
const router = Router();

import {
  createMobileStock,
  getMobileStocks,
  getMobileStock,
  updateMobileStock,
  deleteMobileStock,
} from "../controllers/mobileStockController.js";

import {
  createMobileStockValidator,
  getMobileStockValidator,
  updateMobileStockValidator,
  deleteMobileStockValidator,
} from "../validators/mobileStockValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .post(
    protect,
    allowedTo("admin", "CEO"),
    createMobileStockValidator,
    createMobileStock
  )
  .get(protect, allowedTo("admin", "CEO"), getMobileStocks);

router
  .route("/:id")
  .get(
    protect,
    allowedTo("admin", "CEO"),
    getMobileStockValidator,
    getMobileStock
  )
  .patch(
    protect,
    allowedTo("admin", "CEO"),
    updateMobileStockValidator,
    updateMobileStock
  )
  .delete(
    protect,
    allowedTo("admin", "CEO"),
    deleteMobileStockValidator,
    deleteMobileStock
  );

export default router;
