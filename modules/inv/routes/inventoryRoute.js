import { Router } from "express";
const router = Router();

import {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/inventoryController.js";
import {
  createInventoryValidator,
  getInventoryValidator,
  updateInventoryValidator,
  deleteInventoryValidator,
} from "../validators/inventoryValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import upload from "../../../middlewares/uploadMiddleware.js";

router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  upload.single("avatar"),
  createInventoryValidator,
  createInventory
);

router.get("/", protect, allowedTo("admin", "CEO"), getInventories);

router.get(
  "/:inventoryId",
  protect,
  allowedTo("admin", "CEO"),
  getInventoryValidator,
  getInventory
);

router.patch(
  "/:inventoryId",
  protect,
  allowedTo("admin", "CEO"),
  updateInventoryValidator,
  updateInventory
);

router.delete(
  "/:inventoryId",
  protect,
  allowedTo("admin", "CEO"),
  deleteInventoryValidator,
  deleteInventory
);

export default router;
