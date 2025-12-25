import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createInventoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Inventory name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Inventory name must be between 2 and 100 characters"),

  check("location")
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Location must be between 2 and 200 characters"),

  check("capacity")
    .notEmpty()
    .withMessage("Capacity is required")
    .isFloat({ min: 1 })
    .withMessage("Capacity must be at least 1"),

  check("organizationId")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization ID format"),

  check("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  check("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Invalid status"),

  check("managerId")
    .optional()
    .isMongoId()
    .withMessage("Invalid manager ID format"),

  check("contactPhone")
    .optional()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage("Please provide a valid phone number"),

  validatorMiddleWare,
];

export const getInventoryValidator = [
  check("inventoryId").isMongoId().withMessage("Invalid inventory ID format"),

  validatorMiddleWare,
];

export const updateInventoryValidator = [
  check("inventoryId").isMongoId().withMessage("Invalid inventory ID format"),

  check("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Inventory name must be between 2 and 100 characters"),

  check("location")
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage("Location must be between 2 and 200 characters"),

  check("capacity")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Capacity must be at least 1"),

  check("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Invalid status"),

  validatorMiddleWare,
];

export const deleteInventoryValidator = [
  check("inventoryId").isMongoId().withMessage("Invalid inventory ID format"),

  validatorMiddleWare,
];
