import { check } from "express-validator";
import validatorMiddleware from "../../../middlewares/validatorMiddleware.js";
import Attendance from "../models/attendanceModel.js";

export const checkInValidator = [
  check("attendanceId")
    .isMongoId()
    .withMessage("Invalid Attendance ID Format")
    .custom(async (value) => {
      const attendance = await Attendance.findById(value);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }
      if (attendance.checkIn) {
        throw new Error("Employee already checked in");
      }
      return true;
    }),
  validatorMiddleware,
];

export const checkOutValidator = [
  check("attendanceId")
    .isMongoId()
    .withMessage("Invalid Attendance ID Format")
    .custom(async (value) => {
      const attendance = await Attendance.findById(value);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }
      if (!attendance.checkIn) {
        throw new Error("Employee must check in before checking out");
      }
      if (attendance.checkOut) {
        throw new Error("Employee already checked out");
      }
      return true;
    }),
  validatorMiddleware,
];

export const getAttendanceByDayValidator = [
  check("day")
    .notEmpty()
    .withMessage("Day is required")
    .isInt({ min: 1, max: 31 })
    .withMessage("Day must be between 1 and 31"),
  validatorMiddleware,
];

export const getAttendanceValidator = [
  check("id").isMongoId().withMessage("Invalid Attendance ID Format"),
  validatorMiddleware,
];

// New Validations
export const validateAttendanceDate = [
  check("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date > today) {
        throw new Error("Attendance date cannot be in the future");
      }
      return true;
    }),
  validatorMiddleware,
];

export const validateAttendanceHours = [
  check("checkIn")
    .optional()
    .isISO8601()
    .withMessage("Check-in time must be a valid date"),

  check("checkOut")
    .optional()
    .isISO8601()
    .withMessage("Check-out time must be a valid date")
    .custom((value, { req }) => {
      if (req.body.checkIn && value) {
        const checkIn = new Date(req.body.checkIn);
        const checkOut = new Date(value);

        if (checkOut <= checkIn) {
          throw new Error("Check-out time must be after check-in time");
        }
      }
      return true;
    }),

  check("totalHours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total hours cannot be negative"),

  check("overtime")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Overtime cannot be negative"),

  check("deduction")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deduction cannot be negative"),

  validatorMiddleware,
];
