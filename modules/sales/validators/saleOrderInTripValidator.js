import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createSaleOrderInTripValidator = [
  check("tripId").isMongoId().withMessage("Invalid trip ID format"),

  check("customer")
    .notEmpty()
    .withMessage("Customer is required")
    .isMongoId()
    .withMessage("Invalid customer ID format"),

  check("orderDate")
    .optional()
    .isISO8601()
    .withMessage("Order date must be a valid date"),

  check("goods")
    .isArray({ min: 1 })
    .withMessage("Goods must be an array with at least one item"),

  check("goods.*.product")
    .notEmpty()
    .withMessage("Product is required")
    .isMongoId()
    .withMessage("Invalid product ID format"),

  check("goods.*.code")
    .optional()
    .isString()
    .withMessage("Code must be a string"),

  check("goods.*.unit")
    .notEmpty()
    .withMessage("Unit is required")
    .isNumeric()
    .withMessage("Unit must be a number"),

  check("goods.*.price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number"),

  check("goods.*.discount")
    .optional()
    .isNumeric()
    .withMessage("Discount must be a number")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  validatorMiddleWare,
];

export const getSaleOrderInTripValidator = [
  check("id").isMongoId().withMessage("Invalid sale order ID format"),
  validatorMiddleWare,
];
