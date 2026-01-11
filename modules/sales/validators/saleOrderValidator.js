import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Customer from "../../customer/models/customerModel.js";
import Organization from "../../organization/models/organizationModel.js";
import Product from "../../product/models/productModel.js";
import Inventory from "../../inv/models/inventoryModel.js";

export const createSaleOrderValidator = [
  check("customerId")
    .notEmpty()
    .withMessage("select customer you want to sell to")
    .isMongoId()
    .withMessage("Invalid Customer ID format")
    .custom(async (value) => {
      const customer = await Customer.findById(value);
      if (!customer) {
        throw new Error("Customer not found");
      }
      return true;
    }),

  check("organizationId")
    .notEmpty()
    .withMessage("select organization")
    .isMongoId()
    .withMessage("Invalid Organization ID format")
    .custom(async (value) => {
      const organization = await Organization.findById(value);
      if (!organization) {
        throw new Error("Organization not found");
      }
      return true;
    }),

  check("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  check("products.*.productId")
    .notEmpty()
    .withMessage("select product")
    .isMongoId()
    .withMessage("Invalid Product ID format")
    .custom(async (value) => {
      const product = await Product.findById(value);
      if (!product) {
        throw new Error("Product not found");
      }
      return true;
    }),

  check("products.*.quantity")
    .notEmpty()
    .withMessage("enter quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  check("products.*.wholesalePrice")
    .notEmpty()
    .withMessage("enter wholesalePrice of the product")
    .isFloat({ min: 0 })
    .withMessage("wholesalePrice must be a positive number"),

  check("products.*.retailPrice")
    .notEmpty()
    .withMessage("enter retailPrice of the product")
    .isFloat({ min: 0 })
    .withMessage("retailPrice must be a positive number"),

  check("products.*.discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  check("products.*.tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  check("products.*.inventoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Inventory ID format")
    .custom(async (value) => {
      const inventory = await Inventory.findById(value);
      if (!inventory) {
        throw new Error("Inventory not found");
      }
      return true;
    }),

  check("expectedDeliveryDate")
    .notEmpty()
    .withMessage("Expected delivery date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expected delivery date must be in the future");
      }
      return true;
    }),

  check("currency")
    .notEmpty()
    .withMessage("Currency is required")
    .isIn(["EGP", "SAR", "AED", "QAR", "EUR", "USD"])
    .withMessage("Invalid currency"),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  check("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),

  validatorMiddleware,
];

export const updateSaleOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Sale Order ID Format"),

  check("customerId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Customer ID format")
    .custom(async (value) => {
      const customer = await Customer.findById(value);
      if (!customer) {
        throw new Error("Customer not found");
      }
      return true;
    }),

  check("products")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  check("products.*.productId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Product ID format")
    .custom(async (value) => {
      const product = await Product.findById(value);
      if (!product) {
        throw new Error("Product not found");
      }
      return true;
    }),

  check("products.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  check("products.*.wholesalePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("wholesalePrice must be a positive number"),

  check("products.*.discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  check("products.*.tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  check("expectedDeliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Expected delivery date must be in the future");
      }
      return true;
    }),

  check("status")
    .optional()
    .isIn(["draft", "approved", "shipped", "delivered", "canceled", "invoiced"])
    .withMessage("Invalid status"),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  check("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),

  validatorMiddleware,
];

export const getSaleOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Sale Order ID Format"),
  validatorMiddleware,
];

export const deleteSaleOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Sale Order ID Format"),
  validatorMiddleware,
];

export const updateStatusValidator = [
  check("id").isMongoId().withMessage("Invalid Sale Order ID Format"),
  check("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["approved", "shipped", "delivered", "canceled"])
    .withMessage("Invalid status for update"),
  validatorMiddleware,
];
