import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";
import departmentModel from "../models/departmentModel.js";

export const createDepartmentValidator = [
  check("name")
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2 })
    .withMessage("Department name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Department name must be at most 50 characters")
    .trim()
    .custom((value) => {
      if (!/^[a-zA-Z\s\u0600-\u06FF]+$/.test(value)) {
        throw new Error("Department name can only contain letters and spaces");
      }
      return true;
    })
    .custom(async (value) => {
      // Check if department name is unique (case-insensitive)
      const existingDepartment = await departmentModel.findOne({
        name: { $regex: new RegExp(`^${value}$`, "i") },
      });

      if (existingDepartment) {
        throw new Error("Department name already exists");
      }
      return true;
    }),

  check("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget cannot be negative"),

  check("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Invalid color code. Must be a valid HEX color"),

  validatorMiddleWare,
];

export const updateDepartmentValidator = [
  check("departmentId").isMongoId().withMessage("Invalid Department Id Format"),

  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Department name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Department name must be at most 50 characters")
    .trim()
    .custom((value) => {
      if (!/^[a-zA-Z\s\u0600-\u06FF]+$/.test(value)) {
        throw new Error("Department name can only contain letters and spaces");
      }
      return true;
    })
    .custom(async (value, { req }) => {
      // Check if department name is unique (case-insensitive) excluding current department
      const existingDepartment = await departmentModel.findOne({
        name: { $regex: new RegExp(`^${value}$`, "i") },
        _id: { $ne: req.params.departmentId },
      });

      if (existingDepartment) {
        throw new Error("Department name already exists");
      }
      return true;
    }),

  check("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget cannot be negative"),

  check("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Invalid color code. Must be a valid HEX color"),

  check("manager")
    .optional()
    .isMongoId()
    .withMessage("Invalid manager ID format")
    .custom(async (value) => {
      // Check if manager exists (optional validation)
      // You might want to check if the manager is an active employee
      return true;
    }),

  validatorMiddleWare,
];

export const getDepartmentValidator = [
  check("departmentId").isMongoId().withMessage("Invalid Department Id Format"),
  validatorMiddleWare,
];

export const deleteDepartmentValidator = [
  check("departmentId").isMongoId().withMessage("Invalid Department Id Format"),
  validatorMiddleWare,
];

// New Validations
export const validateDepartmentCode = [
  check("code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage("Department code must be between 3 and 10 characters")
    .isUppercase()
    .withMessage("Department code must be uppercase")
    .custom(async (value, { req }) => {
      // Check if department code is unique
      const query = { code: value };

      if (req.params.departmentId) {
        query._id = { $ne: req.params.departmentId };
      }

      const existingDepartment = await departmentModel.findOne(query);

      if (existingDepartment) {
        throw new Error("Department code already exists");
      }
      return true;
    }),

  validatorMiddleWare,
];
