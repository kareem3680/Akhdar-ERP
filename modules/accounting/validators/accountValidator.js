import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createAccountValidator = [
  check("name")
    .notEmpty()
    .withMessage("Account name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Account name must be between 2 and 100 characters"),

  check("code")
    .notEmpty()
    .withMessage("Account code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Account code must be between 2 and 20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      "Account code must contain only uppercase letters and numbers"
    ),

  check("type")
    .notEmpty()
    .withMessage("Account type is required")
    .isIn(["asset", "liability", "equity", "revenue", "expense"])
    .withMessage("Invalid account type"),

  check("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount cannot be negative"),

  check("parentAccount")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent account ID"),

  check("currency")
    .optional()
    .isIn(["EGP", "USD", "EUR"])
    .withMessage("Invalid currency"),

  validatorMiddleWare,
];

export const getAccountValidator = [
  check("accountId").isMongoId().withMessage("Invalid account ID format"),

  validatorMiddleWare,
];
