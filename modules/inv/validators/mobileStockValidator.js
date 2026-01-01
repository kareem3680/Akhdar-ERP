import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createMobileStockValidator = [
  check("representative")
    .notEmpty()
    .withMessage("Representative is required")
    .isMongoId()
    .withMessage("Invalid representative ID format"),

  check("goods")
    .isArray({ min: 1 })
    .withMessage("Goods must be an array with at least one item"),

  check("goods.*.stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isMongoId()
    .withMessage("Invalid stock ID format"),

  check("goods.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  check("capacity")
    .notEmpty()
    .withMessage("Capacity is required")
    .isNumeric()
    .withMessage("Capacity must be a number")
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),

  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),

  validatorMiddleWare,
];

export const getMobileStockValidator = [
  check("id").isMongoId().withMessage("Invalid mobile stock ID format"),
  validatorMiddleWare,
];

export const updateMobileStockValidator = [
  check("id").isMongoId().withMessage("Invalid mobile stock ID format"),
  check("capacity")
    .optional()
    .isNumeric()
    .withMessage("Capacity must be a number"),
  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  validatorMiddleWare,
];

export const deleteMobileStockValidator = [
  check("id").isMongoId().withMessage("Invalid mobile stock ID format"),
  validatorMiddleWare,
];
