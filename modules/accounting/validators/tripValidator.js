import { check, body } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createTripValidator = [
  check("representative")
    .notEmpty()
    .withMessage("Representative is required")
    .isMongoId()
    .withMessage("Invalid representative ID format"),

  check("car")
    .notEmpty()
    .withMessage("Car (mobile stock) is required")
    .isMongoId()
    .withMessage("Invalid mobile stock ID format"),

  check("driver")
    .notEmpty()
    .withMessage("Driver is required")
    .isLength({ min: 2 })
    .withMessage("Driver name must be at least 2 characters"),

  check("location").notEmpty().withMessage("Location is required"),

  check("date").optional().isISO8601().withMessage("Date must be a valid date"),

  check("products")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one product"),

  body("products.*.product")
    .if(body("products").exists())
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID format"),

  body("products.*.quantity")
    .if(body("products").exists())
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("products.*.price")
    .if(body("products").exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("products.*.notes")
    .if(body("products").exists())
    .optional()
    .isString()
    .withMessage("Notes must be a string"),

  body("products.*.status")
    .if(body("products").exists())
    .optional()
    .isIn(["pending", "loaded", "sold", "returned"])
    .withMessage("Invalid product status"),

  validatorMiddleWare,
];

export const updateTripValidator = [
  check("id").isMongoId().withMessage("Invalid trip ID format"),
  check("driver")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Driver name must be at least 2 characters"),
  check("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),
  check("expenseses")
    .optional()
    .isNumeric()
    .withMessage("Expenses must be a number"),
  check("sales").optional().isNumeric().withMessage("Sales must be a number"),
  check("status")
    .optional()
    .isIn(["inprogress", "completed"])
    .withMessage("Status must be either 'inprogress' or 'completed'"),

  check("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),

  body("products.*.product")
    .if(body("products").exists())
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID format"),

  body("products.*.quantity")
    .if(body("products").exists())
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be 0 or more"),

  body("products.*.price")
    .if(body("products").exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("products.*.status")
    .if(body("products").exists())
    .optional()
    .isIn(["pending", "loaded", "sold", "returned"])
    .withMessage("Invalid product status"),

  body("products.*.returnedQuantity")
    .if(body("products").exists())
    .optional()
    .isInt({ min: 0 })
    .withMessage("Returned quantity must be 0 or more"),

  validatorMiddleWare,
];

export const getTripValidator = [
  check("id").isMongoId().withMessage("Invalid trip ID format"),
  validatorMiddleWare,
];

export const deleteTripValidator = [
  check("id").isMongoId().withMessage("Invalid trip ID format"),
  validatorMiddleWare,
];

export const completeTripValidator = [
  check("id").isMongoId().withMessage("Invalid trip ID format"),
  check("expenseses")
    .optional()
    .isNumeric()
    .withMessage("Expenses must be a number"),
  validatorMiddleWare,
];
