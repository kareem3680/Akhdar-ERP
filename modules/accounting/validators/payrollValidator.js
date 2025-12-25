import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createPayrollValidator = [
  check("employee")
    .notEmpty()
    .withMessage("Employee ID is required")
    .isMongoId()
    .withMessage("Invalid employee ID format"),

  check("salary")
    .notEmpty()
    .withMessage("Salary is required")
    .isFloat({ min: 0 })
    .withMessage("Salary cannot be negative"),

  check("date")
    .notEmpty()
    .withMessage("Payroll date is required")
    .isISO8601()
    .withMessage("Date must be in valid format"),

  check("overtime")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Overtime cannot be negative"),

  check("bonus.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bonus amount cannot be negative"),

  check("deduction.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deduction amount cannot be negative"),

  check("paymentMethod")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "online"])
    .withMessage("Invalid payment method"),

  validatorMiddleWare,
];

export const getPayrollValidator = [
  check("payrollId").isMongoId().withMessage("Invalid payroll ID format"),

  validatorMiddleWare,
];

export const payPayrollValidator = [
  check("payrollId").isMongoId().withMessage("Invalid payroll ID format"),

  check("paymentMethod")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "online"])
    .withMessage("Invalid payment method"),

  validatorMiddleWare,
];
