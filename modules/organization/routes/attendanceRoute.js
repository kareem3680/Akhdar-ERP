import { Router } from "express";
const router = Router();

import {
  getDailyAttendance,
  getAttendanceByDay,
  getAllAttendance,
  getMonthlyAttendance,
  checkIn,
  checkOut,
} from "../controllers/attendanceController.js";
import {
  checkInValidator,
  checkOutValidator,
  getAttendanceByDayValidator,
  validateAttendanceDate,
  validateAttendanceHours,
} from "../validators/attendanceValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import {
  checkAttendanceTime,
  checkMinimumHours,
  checkDateNotFuture,
} from "../../../middlewares/attendanceMiddlewares.js";

// Protected routes
router.route("/").get(protect, getAllAttendance);

router.route("/today").get(protect, getDailyAttendance);

router.route("/month").get(protect, getMonthlyAttendance);

router
  .route("/day/:day")
  .get(protect, getAttendanceByDayValidator, getAttendanceByDay);

router
  .route("/check-in/:attendanceId")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    checkInValidator,
    checkAttendanceTime,
    checkIn
  );

router
  .route("/check-out/:attendanceId")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    checkOutValidator,
    checkMinimumHours,
    checkOut
  );

// Additional routes for attendance management
router
  .route("/:id")
  .patch(
    protect,
    allowedTo("CEO", "admin"),
    validateAttendanceDate,
    validateAttendanceHours,
    checkDateNotFuture
  )
  .delete(protect, allowedTo("admin"));

export default router;
