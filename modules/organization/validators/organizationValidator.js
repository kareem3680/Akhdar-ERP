import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Organization from "../../organization/models/organizationModel.js";
import User from "../../identity/models/userModel.js";

export const createOrganizationValidator = [
  check("tradeName")
    .notEmpty()
    .withMessage("Enter trade name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Trade name must be at least 2 characters")
    .isLength({ max: 200 })
    .withMessage("Trade name must be at most 200 characters"),

  check("address")
    .notEmpty()
    .withMessage("Enter address")
    .trim()
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters")
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  check("country")
    .notEmpty()
    .withMessage("Enter organization's country")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  check("email")
    .notEmpty()
    .withMessage("Enter email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email")
    .custom(async (value) => {
      const organization = await Organization.findOne({ email: value });
      if (organization) {
        throw new Error("Email already in use by another organization");
      }
      return true;
    }),

  check("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[+]?[\d\s\-()]+$/.test(value)) {
        throw new Error("Invalid phone number");
      }
      return true;
    }),

  check("website").optional().trim().isURL().withMessage("Invalid website URL"),

  check("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),

  check("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Status must be active, inactive, or suspended"),

  check("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format")
    .custom(async (value) => {
      const user = await User.findById(value);
      if (!user) {
        throw new Error("User not found");
      }
      return true;
    }),

  check("logo")
    .optional()
    .isString()
    .withMessage("Logo must be a string (URL)"),

  check("taxId")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tax ID must be at most 50 characters"),

  check("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry must be at most 100 characters"),

  check("locations")
    .optional()
    .isArray()
    .withMessage("Locations must be an array"),

  check("locations.*")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Each location must be at least 2 characters"),

  validatorMiddleware,
];

export const updateOrganizationValidator = [
  check("id").isMongoId().withMessage("Invalid Organization ID Format"),

  check("tradeName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Trade name must be at least 2 characters")
    .isLength({ max: 200 })
    .withMessage("Trade name must be at most 200 characters"),

  check("address")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters")
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  check("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  check("email")
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email")
    .custom(async (value, { req }) => {
      const organization = await Organization.findOne({
        email: value,
        _id: { $ne: req.params.id },
      });
      if (organization) {
        throw new Error("Email already in use by another organization");
      }
      return true;
    }),

  check("phone")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^[+]?[\d\s\-()]+$/.test(value)) {
        throw new Error("Invalid phone number");
      }
      return true;
    }),

  check("website").optional().trim().isURL().withMessage("Invalid website URL"),

  check("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),

  check("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Status must be active, inactive, or suspended"),

  check("logo")
    .optional()
    .isString()
    .withMessage("Logo must be a string (URL)"),

  check("taxId")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tax ID must be at most 50 characters"),

  check("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry must be at most 100 characters"),

  check("locations")
    .optional()
    .isArray()
    .withMessage("Locations must be an array"),

  check("locations.*")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Each location must be at least 2 characters"),

  validatorMiddleware,
];

export const getOrganizationValidator = [
  check("id").isMongoId().withMessage("Invalid Organization ID Format"),
  validatorMiddleware,
];

export const deleteOrganizationValidator = [
  check("id").isMongoId().withMessage("Invalid Organization ID Format"),
  validatorMiddleware,
];
