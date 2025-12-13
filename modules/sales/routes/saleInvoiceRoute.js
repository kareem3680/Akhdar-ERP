import { Router } from "express";
const router = Router();

import {
  createSaleOrderInvoice,
  getAllSaleOrderInvoices,
  getSaleOrderInvoice,
  updateSaleOrderInvoice,
  deleteSaleOrderInvoice,
  recordPayment,
} from "../controllers/saleInvoiceController.js";
import {
  createSaleInvoiceValidator,
  updateSaleInvoiceValidator,
  getSaleInvoiceValidator,
  deleteSaleInvoiceValidator,
} from "../validators/saleInvoiceValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Protected routes
router.route("/").get(protect, getAllSaleOrderInvoices);

router.post(
  "/:saleOrderId",
  protect,
  allowedTo("admin", "employee"),
  createSaleInvoiceValidator,
  createSaleOrderInvoice
);

router
  .route("/:id")
  .get(protect, getSaleInvoiceValidator, getSaleOrderInvoice)
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updateSaleInvoiceValidator,
    updateSaleOrderInvoice
  )
  .delete(
    protect,
    allowedTo("admin"),
    deleteSaleInvoiceValidator,
    deleteSaleOrderInvoice
  );

// Record payment route
router.post(
  "/payments/:id",
  protect,
  allowedTo("admin", "employee"),
  getSaleInvoiceValidator,
  recordPayment
);

export default router;
