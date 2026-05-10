// validators/stockTransferValidator.js
import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createStockTransferValidator = [
  check("from")
    .notEmpty()
    .withMessage("Source inventory is required")
    .isMongoId()
    .withMessage("Invalid source inventory ID"),

  check("to")
    .optional()
    .isMongoId()
    .withMessage("Invalid destination inventory ID"),

  check("toMobileStock")
    .optional()
    .isMongoId()
    .withMessage("Invalid destination mobile stock ID"),

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

  check("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),

  validatorMiddleWare,
];

export const getTransferDocumentValidator = [
  check("transferId").isMongoId().withMessage("Invalid transfer ID format"),

  validatorMiddleWare,
];
