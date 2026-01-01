import { Router } from "express";
const router = Router();

import {
  createTripInvoice,
  getTripInvoices,
} from "../controllers/tripInvoiceController.js";

import { createTripInvoiceValidator } from "../validators/tripInvoiceValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.route("/").get(protect, allowedTo("admin", "CEO"), getTripInvoices);

router
  .route("/:saleOrderId")
  .post(
    protect,
    allowedTo("admin", "CEO"),
    createTripInvoiceValidator,
    createTripInvoice
  );

export default router;
