import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import SaleOrder from "../models/saleOrderModel.js";
import SaleInvoice from "../models/saleInvoiceModel.js";

export const createSaleInvoiceValidator = [
  check("saleOrderId")
    .isMongoId()
    .withMessage("Invalid Sale Order ID format")
    .custom(async (value) => {
      const saleOrder = await SaleOrder.findById(value);
      if (!saleOrder) {
        throw new Error("Sale order not found");
      }

      // Check if invoice already exists for this sale order
      const existingInvoice = await SaleInvoice.findOne({ saleOrderId: value });
      if (existingInvoice) {
        throw new Error("Invoice already exists for this sale order");
      }
      return true;
    }),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  validatorMiddleware,
];

export const updateSaleInvoiceValidator = [
  check("id").isMongoId().withMessage("Invalid Invoice ID Format"),

  check("paymentStatus")
    .optional()
    .isIn(["paid", "unpaid", "partial"])
    .withMessage("Payment status must be paid, unpaid, or partial"),

  check("amountPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount paid must be a positive number"),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  check("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),

  validatorMiddleware,
];

export const getSaleInvoiceValidator = [
  check("id").isMongoId().withMessage("Invalid Invoice ID Format"),
  validatorMiddleware,
];

export const deleteSaleInvoiceValidator = [
  check("id").isMongoId().withMessage("Invalid Invoice ID Format"),
  validatorMiddleware,
];
