import { check } from "express-validator";
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

  validatorMiddleWare,
];

export const getTripValidator = [
  check("id").isMongoId().withMessage("Invalid trip ID format"),
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
