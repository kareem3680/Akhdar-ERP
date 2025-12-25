import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createStockTransferValidator = [
  check("from")
    .notEmpty()
    .withMessage("Source inventory is required")
    .isMongoId()
    .withMessage("Invalid source inventory ID"),

  check("to")
    .notEmpty()
    .withMessage("Destination inventory is required")
    .isMongoId()
    .withMessage("Invalid destination inventory ID"),

  check("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  check("products.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  check("products.*.unit")
    .notEmpty()
    .withMessage("Unit is required")
    .isFloat({ min: 1 })
    .withMessage("Unit must be at least 1"),

  check("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost cannot be negative"),

  validatorMiddleWare,
];

export const updateStockTransferValidator = [
  check("stockTransferId")
    .isMongoId()
    .withMessage("Invalid stock transfer ID format"),

  check("status")
    .optional()
    .isIn(["draft", "shipping", "delivered", "cancelled"])
    .withMessage("Invalid status"),

  check("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost cannot be negative"),

  validatorMiddleWare,
];

export const transferActionValidator = [
  check("transferOrderId")
    .isMongoId()
    .withMessage("Invalid transfer order ID format"),

  check("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost cannot be negative"),

  validatorMiddleWare,
];
