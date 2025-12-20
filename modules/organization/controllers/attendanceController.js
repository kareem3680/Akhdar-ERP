import asyncHandler from "express-async-handler";
import {
  getDailyAttendanceService,
  getAttendanceByDayService,
  getAllAttendanceService,
  getMonthlyAttendanceService,
  checkInService,
  checkOutService,
} from "../services/attendanceService.js";

export const getDailyAttendance = asyncHandler(async (req, res) => {
  const response = await getDailyAttendanceService(req);
  res.status(200).json({
    message: "Daily attendance fetched successfully",
    ...response,
  });
});

export const getAttendanceByDay = asyncHandler(async (req, res) => {
  const response = await getAttendanceByDayService(req.params.day);
  res.status(200).json({
    message: "Attendance by day fetched successfully",
    ...response,
  });
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const response = await getAllAttendanceService(req);
  res.status(200).json({
    message: "All attendance fetched successfully",
    ...response,
  });
});

export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const response = await getMonthlyAttendanceService(req);
  res.status(200).json({
    message: "Monthly attendance fetched successfully",
    ...response,
  });
});

export const checkIn = asyncHandler(async (req, res) => {
  const data = await checkInService(req.params.attendanceId, req.user._id);
  res.status(200).json({
    message: "Employee checked in successfully",
    data,
  });
});

export const checkOut = asyncHandler(async (req, res) => {
  const data = await checkOutService(req.params.attendanceId, req.user._id);
  res.status(200).json({
    message: "Employee checked out successfully",
    data,
  });
});
