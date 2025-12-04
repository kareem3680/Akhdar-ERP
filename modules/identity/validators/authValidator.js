import { check } from "express-validator";

import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const signUpValidator = [
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

export const logInValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("password").notEmpty().withMessage("password is required"),

  validatorMiddleWare,
];
