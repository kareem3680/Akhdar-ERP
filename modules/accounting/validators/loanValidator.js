import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createLoanValidator = [
  check("borrowerType")
    .notEmpty()
    .withMessage("Borrower type is required")
    .isIn(["Organization", "User"])
    .withMessage("Invalid borrower type"),

  check("borrower")
    .notEmpty()
    .withMessage("Borrower is required")
    .isMongoId()
    .withMessage("Invalid borrower ID format"),

  check("loanAmount")
    .notEmpty()
    .withMessage("Loan amount is required")
    .isFloat({ min: 1 })
    .withMessage("Loan amount must be at least 1"),

  check("installmentNumber")
    .notEmpty()
    .withMessage("Number of installments is required")
    .isInt({ min: 1 })
    .withMessage("At least 1 installment is required"),

  check("interestRate")
    .notEmpty()
    .withMessage("Interest rate is required")
    .isFloat({ min: 0 })
    .withMessage("Interest rate cannot be negative"),

  check("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be in valid format")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),

  check("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  validatorMiddleWare,
];

export const getLoanValidator = [
  check("loanId").isMongoId().withMessage("Invalid loan ID format"),

  validatorMiddleWare,
];

export const updateLoanValidator = [
  check("loanId").isMongoId().withMessage("Invalid loan ID format"),

  check("status")
    .optional()
    .isIn([
      "pending",
      "approved",
      "active",
      "rejected",
      "completed",
      "defaulted",
    ])
    .withMessage("Invalid loan status"),

  check("interestRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Interest rate cannot be negative"),

  validatorMiddleWare,
];

export const approveLoanValidator = [
  check("loanId").isMongoId().withMessage("Invalid loan ID format"),

  validatorMiddleWare,
];
