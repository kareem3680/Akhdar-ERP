import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createPaymentValidator = [
  check("invoiceId").isMongoId().withMessage("Invalid invoice ID format"),

  check("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1 })
    .withMessage("Amount must be a positive number"),

  check("paymentMethod")
    .optional()
    .isIn(["cash", "bank", "credit"])
    .withMessage("Invalid payment method"),

  check("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  validatorMiddleWare,
];

export const getPaymentsValidator = [
  check("invoiceId").isMongoId().withMessage("Invalid invoice ID format"),

  validatorMiddleWare,
];
