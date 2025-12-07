import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Category from "../models/categoryModel.js";

export const createProductValidator = [
  check("name")
    .notEmpty()
    .withMessage("enter product name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Product name must be at least 2 characters")
    .isLength({ max: 100 })
    .withMessage("Product name must be at most 100 characters"),

  check("code")
    .notEmpty()
    .withMessage("enter product code")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Product code must be at least 2 characters"),

  check("price")
    .notEmpty()
    .withMessage("enter product price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  check("tax")
    .notEmpty()
    .withMessage("enter tax for product")
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  check("description")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Description must be at least 5 characters")
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),

  check("category")
    .notEmpty()
    .withMessage("select category for your product")
    .isMongoId()
    .withMessage("Invalid Category ID Format")
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  check("unit")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Unit must be a positive integer"),

  check("img").optional().isArray().withMessage("Images must be an array"),

  check("img.*")
    .optional()
    .isString()
    .withMessage("Each image must be a string (URL)"),

  validatorMiddleware,
];

export const updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product ID Format"),

  check("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Product name must be at least 2 characters")
    .isLength({ max: 100 })
    .withMessage("Product name must be at most 100 characters"),

  check("code")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Product code must be at least 2 characters"),

  check("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  check("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  check("description")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Description must be at least 5 characters")
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid Category ID Format")
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  check("unit")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Unit must be a positive integer"),

  check("img").optional().isArray().withMessage("Images must be an array"),

  check("img.*")
    .optional()
    .isString()
    .withMessage("Each image must be a string (URL)"),

  validatorMiddleware,
];

export const getProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product ID Format"),
  validatorMiddleware,
];

export const deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid Product ID Format"),
  validatorMiddleware,
];

export const productsByCategoryValidator = [
  check("categoryId").isMongoId().withMessage("Invalid Category ID Format"),
  validatorMiddleware,
];
