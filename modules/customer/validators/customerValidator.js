import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Customer from "../models/customerModel.js";

export const createCustomerValidator = [
  check("name")
    .notEmpty()
    .withMessage("enter your name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 150 })
    .withMessage("Name must be at most 150 characters"),

  check("email")
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("enter valid email")
    .custom(async (value) => {
      if (value) {
        const customer = await Customer.findOne({ email: value });
        if (customer) {
          throw new Error("Email already in use");
        }
      }
      return true;
    }),

  check("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[+]?[\d\s\-()]+$/.test(value)) {
        throw new Error("enter valid phone number");
      }
      return true;
    }),

  check("currency")
    .notEmpty()
    .withMessage("select your currency")
    .isIn(["EGP", "SAR", "AED", "QAR", "EUR", "USD"])
    .withMessage("Invalid currency value"),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  check("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  check("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  check("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be at most 100 characters"),

  check("taxNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tax number must be at most 100 characters"),

  check("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  check("organizationId")
    .optional()
    .isArray()
    .withMessage("Organization IDs must be an array"),

  check("organizationId.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid Organization ID format"),

  validatorMiddleware,
];

export const updateCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer ID Format"),

  check("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 150 })
    .withMessage("Name must be at most 150 characters"),

  check("email")
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("enter valid email")
    .custom(async (value, { req }) => {
      if (value) {
        const customer = await Customer.findOne({
          email: value,
          _id: { $ne: req.params.id },
        });
        if (customer) {
          throw new Error("Email already in use by another customer");
        }
      }
      return true;
    }),

  check("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[+]?[\d\s\-()]+$/.test(value)) {
        throw new Error("enter valid phone number");
      }
      return true;
    }),

  check("currency")
    .optional()
    .isIn(["EGP", "SAR", "AED", "QAR", "EUR", "USD"])
    .withMessage("Invalid currency value"),

  check("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),

  check("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  check("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  check("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be at most 100 characters"),

  check("taxNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tax number must be at most 100 characters"),

  check("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),

  check("organizationId")
    .optional()
    .isArray()
    .withMessage("Organization IDs must be an array"),

  check("organizationId.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid Organization ID format"),

  validatorMiddleware,
];

export const getCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer ID Format"),
  validatorMiddleware,
];

export const deleteCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer ID Format"),
  validatorMiddleware,
];

export const softDeleteCustomerValidator = [
  check("id").isMongoId().withMessage("Invalid Customer ID Format"),
  validatorMiddleware,
];

export const addOrganizationValidator = [
  check("customerId").isMongoId().withMessage("Invalid Customer ID Format"),
  check("organizationId")
    .isMongoId()
    .withMessage("Invalid Organization ID Format"),
  validatorMiddleware,
];
