import { Router } from "express";
const router = Router();

import {
  createSaleOrder,
  getAllSaleOrders,
  getSaleOrder,
  updateSaleOrder,
  deleteSaleOrder,
  getAllDraftedSaleOrders,
  getAllApprovedSaleOrders,
  getAllDeliveredSaleOrders,
  updatedSaleOrderIntoApproved,
  updateToShipped,
  updateToDelivered,
  cancelSaleOrder,
} from "../controllers/saleOrderController.js";
import {
  createSaleOrderValidator,
  updateSaleOrderValidator,
  getSaleOrderValidator,
  deleteSaleOrderValidator,
  updateStatusValidator,
} from "../validators/saleOrderValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Status-based routes
router.get("/status/draft", protect, getAllDraftedSaleOrders);
router.get("/status/approved", protect, getAllApprovedSaleOrders);
router.get("/status/delivered", protect, getAllDeliveredSaleOrders);

// Status update routes
router.patch(
  "/approve/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  updatedSaleOrderIntoApproved
);

router.patch(
  "/ship/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  updateToShipped
);

router.patch(
  "/deliver/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  updateToDelivered
);

router.patch(
  "/cancel/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  cancelSaleOrder
);

// CRUD routes
router
  .route("/")
  .get(protect, getAllSaleOrders)
  .post(
    protect,
    allowedTo("admin", "employee"),
    createSaleOrderValidator,
    createSaleOrder
  );

router
  .route("/:id")
  .get(protect, getSaleOrderValidator, getSaleOrder)
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updateSaleOrderValidator,
    updateSaleOrder
  )
  .delete(
    protect,
    allowedTo("admin"),
    deleteSaleOrderValidator,
    deleteSaleOrder
  );

export default router;
