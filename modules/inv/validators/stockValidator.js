import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createStockValidator = [
  check("inventoryId").isMongoId().withMessage("Invalid inventory ID format"),

  check("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID format"),

  check("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isFloat({ min: 0 })
    .withMessage("Quantity cannot be negative"),

  check("minQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum quantity cannot be negative"),

  check("maxQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum quantity cannot be negative"),

  validatorMiddleWare,
];

export const getStockValidator = [
  check("inventoryId").isMongoId().withMessage("Invalid inventory ID format"),

  check("stockId").isMongoId().withMessage("Invalid stock ID format"),

  validatorMiddleWare,
];

export const updateStockValidator = [
  check("stockId").isMongoId().withMessage("Invalid stock ID format"),

  check("quantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Quantity cannot be negative"),

  check("minQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum quantity cannot be negative"),

  check("maxQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum quantity cannot be negative"),

  check("status")
    .optional()
    .isIn(["in-stock", "low-stock", "out-of-stock", "overstock"])
    .withMessage("Invalid stock status"),

  validatorMiddleWare,
];

export const deleteStockValidator = [
  check("stockId").isMongoId().withMessage("Invalid stock ID format"),

  validatorMiddleWare,
];
