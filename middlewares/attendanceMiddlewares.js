import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";

// Middleware to check if check-in time is between 6 AM and 11 PM
export const checkAttendanceTime = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 6 || hour > 23) {
    return next(
      new ApiError("Check-in time must be between 6 AM and 11 PM", 400)
    );
  }

  next();
});

// Middleware to check minimum 4 hours before check-out
export const checkMinimumHours = asyncHandler(async (req, res, next) => {
  const { attendanceId } = req.params;

  if (!attendanceId) {
    return next(new ApiError("Attendance ID is required", 400));
  }

  // In a real scenario, you would fetch the attendance record
  // and check the difference between check-in and current time
  // For now, we'll assume this check is done in the service layer

  next();
});

// Middleware to check if date is not in the future
export const checkDateNotFuture = asyncHandler(async (req, res, next) => {
  const { date } = req.body;

  if (date) {
    const attendanceDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      return next(new ApiError("Attendance date cannot be in the future", 400));
    }
  }

  next();
});

// Middleware to validate check-in before check-out
export const validateCheckInBeforeCheckOut = asyncHandler(
  async (req, res, next) => {
    const { checkIn, checkOut } = req.body;

    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);

      if (checkOutTime <= checkInTime) {
        return next(
          new ApiError("Check-out time must be after check-in time", 400)
        );
      }
    }

    next();
  }
);

// Middleware to prevent duplicate attendance for same day
export const preventDuplicateAttendance = asyncHandler(
  async (req, res, next) => {
    const { employee, date } = req.body;

    if (employee && date) {
      const Attendance = (await import("../models/attendanceModel.js")).default;
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const existingAttendance = await Attendance.findOne({
        employee,
        date: attendanceDate,
      });

      if (existingAttendance && !req.params.attendanceId) {
        return next(
          new ApiError(
            "Attendance record already exists for this employee on this date",
            400
          )
        );
      }
    }

    next();
  }
);
