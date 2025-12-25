import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createJournalEntryValidator = [
  check("journalId")
    .notEmpty()
    .withMessage("Journal ID is required")
    .isMongoId()
    .withMessage("Invalid journal ID format"),

  check("lines")
    .isArray({ min: 2 })
    .withMessage("At least 2 lines are required"),

  check("lines.*.accountId")
    .notEmpty()
    .withMessage("Account ID is required")
    .isMongoId()
    .withMessage("Invalid account ID format"),

  check("lines.*.debit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Debit must be a non-negative number"),

  check("lines.*.credit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Credit must be a non-negative number"),

  check("reference")
    .optional()
    .isString()
    .withMessage("Reference must be a string"),

  check("notes").optional().isString().withMessage("Notes must be a string"),

  validatorMiddleWare,
];

export const getJournalEntryValidator = [
  check("journalEntryId")
    .isMongoId()
    .withMessage("Invalid journal entry ID format"),

  validatorMiddleWare,
];
