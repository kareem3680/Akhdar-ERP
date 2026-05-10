import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createMobileStockValidator = [
  check("representative").notEmpty().withMessage("Representative is required"),
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

  check("year")
    .notEmpty()
    .withMessage("year is required")
    .isNumeric()
    .withMessage("year must be a number")
    .isInt({ min: 2000 })
    .withMessage("year must be at least 2000"),

  check("brand")
    .notEmpty()
    .withMessage("brand is required")
    .isLength({ min: 2 })
    .withMessage("brand must be at least 2 characters"),

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
