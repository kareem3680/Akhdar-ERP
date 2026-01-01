import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createRepresentativeValidator = [
  check("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("Invalid user ID format"),

  check("region")
    .notEmpty()
    .withMessage("Region is required")
    .isString()
    .withMessage("Region must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Region must be between 2 and 50 characters"),

  check("territory")
    .notEmpty()
    .withMessage("Territory is required")
    .isString()
    .withMessage("Territory must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Territory must be between 2 and 100 characters"),

  check("supervisor")
    .optional()
    .isMongoId()
    .withMessage("Invalid supervisor ID format"),

  check("commissionRate")
    .optional()
    .isNumeric()
    .withMessage("Commission rate must be a number")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission rate must be between 0 and 100"),

  check("targetSales")
    .optional()
    .isNumeric()
    .withMessage("Target sales must be a number")
    .isFloat({ min: 0 })
    .withMessage("Target sales must be at least 0"),

  check("currentSales")
    .optional()
    .isNumeric()
    .withMessage("Current sales must be a number")
    .isFloat({ min: 0 })
    .withMessage("Current sales must be at least 0"),

  validatorMiddleWare,
];

export const updateRepresentativeValidator = [
  check("id").isMongoId().withMessage("Invalid representative ID format"),

  check("region")
    .optional()
    .isString()
    .withMessage("Region must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Region must be between 2 and 50 characters"),

  check("territory")
    .optional()
    .isString()
    .withMessage("Territory must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Territory must be between 2 and 100 characters"),

  check("commissionRate")
    .optional()
    .isNumeric()
    .withMessage("Commission rate must be a number")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission rate must be between 0 and 100"),

  check("targetSales")
    .optional()
    .isNumeric()
    .withMessage("Target sales must be a number")
    .isFloat({ min: 0 })
    .withMessage("Target sales must be at least 0"),

  check("currentSales")
    .optional()
    .isNumeric()
    .withMessage("Current sales must be a number")
    .isFloat({ min: 0 })
    .withMessage("Current sales must be at least 0"),

  check("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be a boolean value"),

  validatorMiddleWare,
];

export const getRepresentativeValidator = [
  check("id").isMongoId().withMessage("Invalid representative ID format"),
  validatorMiddleWare,
];

export const deleteRepresentativeValidator = [
  check("id").isMongoId().withMessage("Invalid representative ID format"),
  validatorMiddleWare,
];
