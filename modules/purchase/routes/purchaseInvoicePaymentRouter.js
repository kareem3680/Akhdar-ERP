import { Router } from "express";
const router = Router();

import {
  createPayment,
  getPayments,
  getPaymentStats,
} from "../controllers/purchaseInvoicePaymentController.js";
import {
  createPaymentValidator,
  getPaymentsValidator,
} from "../validators/purchaseInvoicePaymentValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/pay/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  createPaymentValidator,
  createPayment
);

router.get(
  "/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  getPaymentsValidator,
  getPayments
);

router.get(
  "/stats/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  getPaymentsValidator,
  getPaymentStats
);

export default router;
