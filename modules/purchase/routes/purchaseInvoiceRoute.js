import { Router } from "express";
const router = Router();

import {
  createInvoice,
  getInvoices,
  getSpecificInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/purchaseInvoiceController.js";
import {
  createInvoiceValidator,
  getInvoiceValidator,
  updateInvoiceValidator,
  deleteInvoiceValidator,
} from "../validators/purchaseInvoiceValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/:purchaseOrderId",
  protect,
  allowedTo("admin", "CEO"),
  createInvoiceValidator,
  createInvoice
);

router.get("/", protect, allowedTo("admin", "CEO"), getInvoices);

router.get(
  "/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  getInvoiceValidator,
  getSpecificInvoice
);

router.patch(
  "/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  updateInvoiceValidator,
  updateInvoice
);

router.delete(
  "/:invoiceId",
  protect,
  allowedTo("admin", "CEO"),
  deleteInvoiceValidator,
  deleteInvoice
);

export default router;
