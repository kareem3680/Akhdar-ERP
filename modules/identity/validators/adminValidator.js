import { check } from "express-validator";

import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 3 })
    .withMessage("name must be at least 3 characters")
    .isLength({ max: 30 })
    .withMessage("name must be at most 30 characters"),

  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid"),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Phone number must be a valid Egyptian or Saudi mobile number"
    ),

  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters")
    .custom((password) => {
      const invalidFormat = !/(?=.*[a-zA-Z])(?=.*\d)/.test(password);
      if (invalidFormat) {
        throw new Error(
          "Password must contain at least one letter and one number"
        );
      }
      return true;
    }),

  check("passwordConfirmation")
    .notEmpty()
    .withMessage("password confirmation is required")
    .custom((confirm, { req }) => {
      if (confirm !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),

  check("role")
    .optional()
    .isIn(["admin", "employee", "customer", "supplier", "CEO"])
    .withMessage("Invalid role value"),

  check("position")
    .optional()
    .isString()
    .withMessage("Position must be a string"),

  check("organizations")
    .optional()
    .isArray()
    .withMessage("Organizations must be an array"),

  check("organizations.*.organization_id")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization_id format"),

  validatorMiddleWare,
];

export const updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Phone number must be a valid Egyptian or Saudi mobile number"
    ),

  check("role")
    .optional()
    .isIn(["admin", "employee", "customer", "supplier", "CEO"])
    .withMessage("Invalid role value"),

  check("position")
    .optional()
    .isString()
    .withMessage("Position must be a string"),

  check("organizations")
    .optional()
    .isArray()
    .withMessage("Organizations must be an array"),

  check("organizations.*.organization_id")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization_id format"),

  validatorMiddleWare,
];

export const getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];

export const deactivateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];

export const activateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User Id Format"),
  validatorMiddleWare,
];
