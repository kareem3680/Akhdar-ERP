import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createJournalValidator = [
  check("name")
    .notEmpty()
    .withMessage("Journal name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Journal name must be between 2 and 100 characters"),

  check("journalType")
    .notEmpty()
    .withMessage("Journal type is required")
    .isIn([
      "sales",
      "purchases",
      "payroll",
      "expenses",
      "invoice/payment",
      "general",
      "adjustment",
      "closing",
    ])
    .withMessage("Invalid journal type"),

  check("code")
    .notEmpty()
    .withMessage("Journal code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Journal code must be between 2 and 20 characters"),

  validatorMiddleWare,
];

export const getJournalValidator = [
  check("journalId").isMongoId().withMessage("Invalid journal ID format"),

  validatorMiddleWare,
];
