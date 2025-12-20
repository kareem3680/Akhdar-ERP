import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createInvoiceValidator = [
  check("purchaseOrderId")
    .isMongoId()
    .withMessage("Invalid purchase order ID format"),

  check("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  validatorMiddleWare,
];

export const getInvoiceValidator = [
  check("invoiceId").isMongoId().withMessage("Invalid invoice ID format"),

  validatorMiddleWare,
];

export const updateInvoiceValidator = [
  check("invoiceId").isMongoId().withMessage("Invalid invoice ID format"),

  check("paymentStatus")
    .optional()
    .isIn(["paid", "unpaid", "partial"])
    .withMessage("Invalid payment status"),

  check("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "completed"])
    .withMessage("Invalid status"),

  check("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be in valid format"),

  check("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  validatorMiddleWare,
];

export const deleteInvoiceValidator = [
  check("invoiceId").isMongoId().withMessage("Invalid invoice ID format"),

  validatorMiddleWare,
];
