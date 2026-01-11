import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Supplier from "../../inv/models/supplierModel.js";
import Organization from "../../organization/models/organizationModel.js";
import Product from "../../product/models/productModel.js";
import Inventory from "../../inv/models/inventoryModel.js";

export const createPurchaseOrderValidator = [
  check("supplierId")
    .notEmpty()
    .withMessage("Purchase order must be associated with a supplier")
    .isMongoId()
    .withMessage("Invalid Supplier ID format")
    .custom(async (value) => {
      const supplier = await Supplier.findById(value);
      if (!supplier) {
        throw new Error("Supplier not found");
      }
      return true;
    }),

  check("organizationId")
    .notEmpty()
    .withMessage("Purchase order must belong to an organization")
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
    .withMessage("Product ID is required")
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
    .withMessage("Product quantity is required")
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

  check("products.*.inventoryId")
    .notEmpty()
    .withMessage("Inventory ID is required")
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

  validatorMiddleware,
];

export const updatePurchaseOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Purchase Order ID Format"),

  check("supplierId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Supplier ID format")
    .custom(async (value) => {
      const supplier = await Supplier.findById(value);
      if (!supplier) {
        throw new Error("Supplier not found");
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

  validatorMiddleware,
];

export const getPurchaseOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Purchase Order ID Format"),
  validatorMiddleware,
];

export const deletePurchaseOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Purchase Order ID Format"),
  validatorMiddleware,
];

export const updateStatusValidator = [
  check("id").isMongoId().withMessage("Invalid Purchase Order ID Format"),
  check("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["approved", "shipped", "delivered", "canceled"])
    .withMessage("Invalid status for update"),
  validatorMiddleware,
];

export const deliverPurchaseOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Purchase Order ID Format"),
  check("deliveredQuantities")
    .notEmpty()
    .withMessage("Delivered quantities array is required")
    .isArray()
    .withMessage("Delivered quantities must be an array"),
  check("deliveredQuantities.*")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Each delivered quantity must be a positive number"),
  validatorMiddleware,
];
