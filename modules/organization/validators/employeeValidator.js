import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";
import employeeModel from "../models/employeeModel.js";

export const createEmployeeValidator = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 100 })
    .withMessage("Name must be at most 100 characters")
    .trim(),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail()
    .custom(async (value) => {
      const existingEmployee = await employeeModel.findOne({ email: value });
      if (existingEmployee) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  check("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Phone number must be a valid Egyptian or Saudi mobile number"
    ),

  check("nationalId")
    .notEmpty()
    .withMessage("National ID is required")
    .isLength({ min: 14, max: 14 })
    .withMessage("National ID must be 14 characters")
    .isNumeric()
    .withMessage("National ID must contain only numbers")
    .custom(async (value) => {
      // Validate Egyptian national ID format
      if (!/^\d+$/.test(value)) {
        throw new Error("National ID must contain only digits");
      }

      const centuryCode = parseInt(value.charAt(0));
      if (![2, 3].includes(centuryCode)) {
        throw new Error("Invalid Egyptian national ID format");
      }

      // Check if national ID is unique
      const existingEmployee = await employeeModel.findOne({
        nationalId: value,
      });
      if (existingEmployee) {
        throw new Error("National ID already exists");
      }

      return true;
    }),

  check("jobTitle")
    .notEmpty()
    .withMessage("Job title is required")
    .isLength({ min: 2 })
    .withMessage("Job title must be at least 2 characters"),

  check("department")
    .notEmpty()
    .withMessage("Department is required")
    .isMongoId()
    .withMessage("Invalid department ID format"),

  check("workLocation").notEmpty().withMessage("Work location is required"),

  check("role")
    .optional()
    .isIn([
      "admin",
      "employee",
      "manager",
      "HR",
      "CEO",
      "accountant",
      "supervisor",
    ])
    .withMessage(
      "Role must be one of: admin, employee, manager, HR, CEO, accountant, supervisor"
    )
    .default("employee"),

  check("manager")
    .optional()
    .isMongoId()
    .withMessage("Invalid manager ID format")
    .custom(async (value, { req }) => {
      // Check if manager is not the same as employee being created
      if (req.body._id && value === req.body._id) {
        throw new Error("Employee cannot be their own manager");
      }

      // Check if manager exists and is active
      const manager = await employeeModel.findById(value);
      if (!manager || !manager.active) {
        throw new Error("Manager not found or is not active");
      }

      return true;
    }),

  check("salary")
    .notEmpty()
    .withMessage("Salary is required")
    .isFloat({ min: 1 })
    .withMessage("Salary must be greater than 0")
    .custom((value, { req }) => {
      // Validate salary based on job title (example logic)
      const jobTitle = req.body.jobTitle?.toLowerCase() || "";

      if (jobTitle.includes("manager") && value < 3000) {
        throw new Error("Manager salary should be at least 3000");
      }

      if (jobTitle.includes("director") && value < 5000) {
        throw new Error("Director salary should be at least 5000");
      }

      return true;
    }),

  check("employmentDate")
    .notEmpty()
    .withMessage("Employment date is required")
    .isISO8601()
    .withMessage("Employment date must be a valid date")
    .custom((value) => {
      const employmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (employmentDate > today) {
        throw new Error("Employment date cannot be in the future");
      }
      return true;
    }),

  check("levelOfExperience")
    .notEmpty()
    .withMessage("Level of experience is required")
    .isIn(["junior", "mid", "senior", "expert"])
    .withMessage(
      "Level of experience must be one of: junior, mid, senior, expert"
    ),

  check("employmentType")
    .notEmpty()
    .withMessage("Employment type is required")
    .isIn([
      "full_time",
      "part_time",
      "contractor",
      "intern",
      "temporary",
      "casual",
      "freelancer",
      "probation",
    ])
    .withMessage("Invalid employment type"),

  check("alternativePhone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Alternative phone must be a valid Egyptian or Saudi mobile number"
    ),

  check("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Birth date must be a valid date")
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        // Adjust age if birthday hasn't occurred this year
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < 18) {
          throw new Error("Employee must be at least 18 years old");
        }

        if (age > 80) {
          throw new Error("Employee cannot be older than 80 years");
        }
      }
      return true;
    }),

  check("bonus")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bonus cannot be negative"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  validatorMiddleWare,
];

export const updateEmployeeValidator = [
  check("employeeId").isMongoId().withMessage("Invalid Employee Id Format"),

  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 100 })
    .withMessage("Name must be at most 100 characters")
    .trim(),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value) {
        const existingEmployee = await employeeModel.findOne({
          email: value,
          _id: { $ne: req.params.employeeId },
        });
        if (existingEmployee) {
          throw new Error("Email already exists");
        }
      }
      return true;
    }),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Phone number must be a valid Egyptian or Saudi mobile number"
    ),

  check("nationalId")
    .optional()
    .isLength({ min: 14, max: 14 })
    .withMessage("National ID must be 14 characters")
    .isNumeric()
    .withMessage("National ID must contain only numbers")
    .custom(async (value, { req }) => {
      if (value) {
        // Validate Egyptian national ID format
        if (!/^\d+$/.test(value)) {
          throw new Error("National ID must contain only digits");
        }

        const centuryCode = parseInt(value.charAt(0));
        if (![2, 3].includes(centuryCode)) {
          throw new Error("Invalid Egyptian national ID format");
        }

        const existingEmployee = await employeeModel.findOne({
          nationalId: value,
          _id: { $ne: req.params.employeeId },
        });
        if (existingEmployee) {
          throw new Error("National ID already exists");
        }
      }
      return true;
    }),

  check("salary")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Salary must be greater than 0"),

  check("employmentType")
    .optional()
    .isIn([
      "full_time",
      "part_time",
      "contractor",
      "intern",
      "temporary",
      "casual",
      "freelancer",
      "probation",
    ])
    .withMessage("Invalid employment type"),

  check("alternativePhone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage(
      "Alternative phone must be a valid Egyptian or Saudi mobile number"
    ),

  check("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Birth date must be a valid date")
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        // Adjust age if birthday hasn't occurred this year
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < 18) {
          throw new Error("Employee must be at least 18 years old");
        }

        if (age > 80) {
          throw new Error("Employee cannot be older than 80 years");
        }
      }
      return true;
    }),

  check("bonus")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Bonus cannot be negative"),

  check("address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  check("manager")
    .optional()
    .isMongoId()
    .withMessage("Invalid manager ID format")
    .custom(async (value, { req }) => {
      if (value && req.params.employeeId) {
        // Check if manager is not the same as employee
        if (value === req.params.employeeId) {
          throw new Error("Employee cannot be their own manager");
        }

        // Check if manager exists and is active
        const manager = await employeeModel.findById(value);
        if (!manager || !manager.active) {
          throw new Error("Manager not found or is not active");
        }
      }
      return true;
    }),

  check("role")
    .optional()
    .isIn([
      "admin",
      "employee",
      "manager",
      "HR",
      "CEO",
      "accountant",
      "supervisor",
    ])
    .withMessage(
      "Role must be one of: admin, employee, manager, HR, CEO, accountant, supervisor"
    ),

  validatorMiddleWare,
];

export const getEmployeeValidator = [
  check("employeeId").isMongoId().withMessage("Invalid Employee Id Format"),
  validatorMiddleWare,
];

export const deleteEmployeeValidator = [
  check("employeeId").isMongoId().withMessage("Invalid Employee Id Format"),
  validatorMiddleWare,
];

export const activateEmployeeValidator = [
  check("employeeId").isMongoId().withMessage("Invalid Employee Id Format"),
  validatorMiddleWare,
];
