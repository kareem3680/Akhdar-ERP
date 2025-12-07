import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";

export const createCategoryValidator = [
  check("category")
    .notEmpty()
    .withMessage("category name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("category name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("category name must be at most 50 characters"),

  validatorMiddleware,
];

export const updateCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid Category ID Format"),

  check("category")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("category name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("category name must be at most 50 characters"),

  validatorMiddleware,
];

export const getCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid Category ID Format"),
  validatorMiddleware,
];

export const deleteCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid Category ID Format"),
  validatorMiddleware,
];
