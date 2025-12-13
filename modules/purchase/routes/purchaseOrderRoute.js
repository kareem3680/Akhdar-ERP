import { Router } from "express";
const router = Router();

import {
  createPurchaseOrder,
  getAllPurchases,
  getPurchase,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getAllDraft,
  getAllApproved,
  getAllDelivered,
  markAsApproved,
  markAsShipped,
  markAsDelivered,
  cancelPurchaseOrder,
} from "../controllers/purchaseOrderController.js";
import {
  createPurchaseOrderValidator,
  updatePurchaseOrderValidator,
  getPurchaseOrderValidator,
  deletePurchaseOrderValidator,
  updateStatusValidator,
  deliverPurchaseOrderValidator,
} from "../validators/purchaseOrderValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Status-based routes
router.get("/status/draft", protect, getAllDraft);
router.get("/status/approved", protect, getAllApproved);
router.get("/status/delivered", protect, getAllDelivered);

// Status update routes
router.patch(
  "/approve/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  markAsApproved
);

router.patch(
  "/ship/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  markAsShipped
);

router.patch(
  "/deliver/:id",
  protect,
  allowedTo("admin", "employee"),
  deliverPurchaseOrderValidator,
  markAsDelivered
);

router.patch(
  "/cancel/:id",
  protect,
  allowedTo("admin", "employee"),
  updateStatusValidator,
  cancelPurchaseOrder
);

// CRUD routes
router
  .route("/")
  .get(protect, getAllPurchases)
  .post(
    protect,
    allowedTo("admin", "employee"),
    createPurchaseOrderValidator,
    createPurchaseOrder
  );

router
  .route("/:id")
  .get(protect, getPurchaseOrderValidator, getPurchase)
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updatePurchaseOrderValidator,
    updatePurchaseOrder
  )
  .delete(
    protect,
    allowedTo("admin"),
    deletePurchaseOrderValidator,
    deletePurchaseOrder
  );

export default router;
