import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createSupplierValidator = [
  check("name")
    .notEmpty()
    .withMessage("Supplier name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),

  check("address")
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Address must be between 5 and 500 characters"),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),

  check("organizationId")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization ID format"),

  check("taxId")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Tax ID must not exceed 50 characters"),

  check("website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid website URL"),

  check("contactPerson.name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Contact person name must not exceed 100 characters"),

  check("paymentTerms")
    .optional()
    .isIn(["net-30", "net-60", "net-90", "prepaid", "cod"])
    .withMessage("Invalid payment terms"),

  check("currency")
    .optional()
    .isIn(["EGP", "SAR", "AED", "QAR", "EUR", "USD"])
    .withMessage("Invalid currency"),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  validatorMiddleWare,
];

export const getSupplierValidator = [
  check("supplierId").isMongoId().withMessage("Invalid supplier ID format"),

  validatorMiddleWare,
];

export const updateSupplierValidator = [
  check("supplierId").isMongoId().withMessage("Invalid supplier ID format"),

  check("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),

  validatorMiddleWare,
];

export const addOrganizationValidator = [
  check("supplierId").isMongoId().withMessage("Invalid supplier ID format"),

  check("organizationId")
    .isMongoId()
    .withMessage("Invalid organization ID format"),

  validatorMiddleWare,
];
