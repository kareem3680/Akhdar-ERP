import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getInstallmentValidator = [
  check("installmentId")
    .isMongoId()
    .withMessage("Invalid installment ID format"),

  validatorMiddleWare,
];

export const payInstallmentValidator = [
  check("installmentId")
    .isMongoId()
    .withMessage("Invalid installment ID format"),

  check("paymentMethod")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "online"])
    .withMessage("Invalid payment method"),

  check("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  validatorMiddleWare,
];
