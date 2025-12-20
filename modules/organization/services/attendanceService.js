import asyncHandler from "express-async-handler";
import Attendance from "../../organization/models/attendanceModel.js";
import Employee from "../../organization/models/employeeModel.js";
import Payroll from "../../accounting/models/payrollModel.js";
import { sanitizeAttendance } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("attendance");

// ========================
// Helper Functions (Logic)
// ========================

const calculateHoursHelper = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const totalHoursMs = checkOut - checkIn;
  return totalHoursMs / (1000 * 60 * 60);
};

const calculateOvertimeDeductionHelper = (totalHours, fixedHours) => {
  let overtime = 0;
  let deduction = 0;

  if (totalHours > fixedHours) {
    overtime = totalHours - fixedHours;
  } else if (totalHours < fixedHours) {
    deduction = fixedHours - totalHours;
  }

  return { overtime, deduction };
};

const updatePayrollHelper = async (attendance, employee) => {
  const { overtime, deduction, date } = attendance;

  // Find current month's payroll
  const payrollDate = new Date(date.getFullYear(), date.getMonth(), 1);
  let payroll = await Payroll.findOne({
    employee: employee._id,
    date: payrollDate,
  });

  if (!payroll) {
    payroll = await Payroll.create({
      employee: employee._id,
      date: payrollDate,
      salary: employee.salary,
      bonus: { amount: employee.bonus || 0 },
      overtime: 0,
      deduction: { amount: 0 },
      total: employee.salary + (employee.bonus || 0),
    });
  }

  // Calculate hourly rate
  const workDaysPerMonth = 22;
  const fixedHoursPerDay = 8;
  const hourlyRate = employee.salary / (workDaysPerMonth * fixedHoursPerDay);

  // Update payroll
  payroll.overtime += overtime * hourlyRate;
  payroll.deduction.amount += Math.abs(deduction) * hourlyRate;
  payroll.bonus.amount = employee.bonus || 0;
  payroll.total =
    employee.salary +
    payroll.overtime +
    payroll.bonus.amount -
    payroll.deduction.amount;

  await payroll.save();

  return payroll;
};

// Logic: Determine attendance status based on check-in time
const determineStatusHelper = (checkInTime) => {
  const checkInHour = checkInTime.getHours();
  if (checkInHour > 11) {
    return "late";
  }
  return "present";
};

// Logic: Check if minimum 4 hours worked
const checkMinimumHoursHelper = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return false;
  const hoursWorked = calculateHoursHelper(checkIn, checkOut);
  return hoursWorked >= 4;
};

// Logic: Validate check-in time (6 AM to 11 PM)
const validateCheckInTimeHelper = (checkInTime) => {
  const hour = checkInTime.getHours();
  return hour >= 6 && hour <= 23;
};

// Logic: Calculate monthly attendance rate
const calculateAttendanceRateHelper = (presentDays, totalDays) => {
  if (totalDays === 0) return 0;
  return (presentDays / totalDays) * 100;
};

// ========================
// Main Services
// ========================

// Get Daily Attendance
export const getDailyAttendanceService = asyncHandler(async (req) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await getAllService(
    Attendance,
    {},
    "attendance",
    { date: today },
    {
      populate: [
        {
          path: "employee",
          select: "name email phone jobTitle department",
        },
      ],
    }
  );

  await logger.info("Fetched daily attendance", {
    date: today.toISOString().split("T")[0],
    count: result.results,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeAttendance),
  };
});

// Get Attendance by Day
export const getAttendanceByDayService = asyncHandler(async (day) => {
  const currentDate = new Date();
  const targetDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    parseInt(day)
  );

  if (isNaN(targetDate.getTime())) {
    throw new ApiError("Invalid date", 400);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await getAllService(
    Attendance,
    {},
    "attendance",
    { date: { $gte: startOfDay, $lte: endOfDay } },
    {
      populate: [
        {
          path: "employee",
          select: "name jobTitle department",
        },
      ],
    }
  );

  await logger.info("Fetched attendance by day", {
    day,
    date: targetDate.toISOString().split("T")[0],
    count: result.results,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeAttendance),
  };
});

// Get All Attendance
export const getAllAttendanceService = asyncHandler(async (req) => {
  const filter = { isActive: true };

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.employee) {
    filter.employee = req.query.employee;
  }

  const result = await getAllService(
    Attendance,
    req.query,
    "attendance",
    filter,
    {
      populate: [
        {
          path: "employee",
          select: "name email jobTitle department",
        },
      ],
    }
  );

  await logger.info("Fetched all attendance", {
    count: result.results,
    filters: Object.keys(filter).length,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeAttendance),
    paginationResult: result.paginationResult,
  };
});

// Get Monthly Attendance
export const getMonthlyAttendanceService = asyncHandler(async (req) => {
  const month = req.query.month || new Date().getMonth();
  const year = req.query.year || new Date().getFullYear();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, parseInt(month) + 1, 0);

  const employees = await Employee.find({ active: true })
    .select("name email jobTitle department salary")
    .lean();

  const attendanceSummary = await Promise.all(
    employees.map(async (employee) => {
      const attendances = await Attendance.find({
        employee: employee._id,
        date: { $gte: startDate, $lte: endDate },
        isActive: true,
      }).select("date status checkIn checkOut totalHours overtime deduction");

      const presentDays = attendances.filter(
        (a) => a.status === "present" || a.status === "checked-out"
      ).length;
      const absentDays = attendances.filter(
        (a) => a.status === "absent"
      ).length;
      const leaveDays = attendances.filter((a) => a.status === "leave").length;
      const totalDays = presentDays + absentDays + leaveDays;

      const totalHours = attendances.reduce(
        (sum, a) => sum + (a.totalHours || 0),
        0
      );
      const totalOvertime = attendances.reduce(
        (sum, a) => sum + (a.overtime || 0),
        0
      );

      // Logic: Calculate attendance rate
      const attendanceRate = calculateAttendanceRateHelper(
        presentDays,
        totalDays
      );

      return {
        employee: {
          id: employee._id,
          name: employee.name,
          jobTitle: employee.jobTitle,
          department: employee.department,
        },
        statistics: {
          presentDays,
          absentDays,
          leaveDays,
          totalHours: totalHours.toFixed(2),
          totalOvertime: totalOvertime.toFixed(2),
          attendanceRate: attendanceRate.toFixed(2),
        },
        attendances: attendances.map((att) => ({
          date: att.date,
          status: att.status,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          hours: att.totalHours,
          overtime: att.overtime,
        })),
      };
    })
  );

  await logger.info("Fetched monthly attendance summary", {
    month: parseInt(month) + 1,
    year,
    employeeCount: employees.length,
  });

  return {
    month: parseInt(month) + 1,
    year,
    results: attendanceSummary.length,
    data: attendanceSummary,
  };
});

// Check In Service
export const checkInService = asyncHandler(async (attendanceId, userId) => {
  const attendance = await getSpecificService(Attendance, attendanceId);

  if (!attendance) {
    throw new ApiError("Attendance record not found", 404);
  }

  if (attendance.checkIn) {
    throw new ApiError("Employee already checked in today", 400);
  }

  const now = new Date();

  // Logic: Validate check-in time
  if (!validateCheckInTimeHelper(now)) {
    throw new ApiError("Check-in time must be between 6 AM and 11 PM", 400);
  }

  // Logic: Determine status based on check-in time
  attendance.checkIn = now;
  attendance.status = determineStatusHelper(now);

  const updatedAttendance = await attendance.save();

  await logger.info("Employee checked in", {
    attendanceId: updatedAttendance._id,
    employeeId: updatedAttendance.employee,
    checkInTime: updatedAttendance.checkIn,
    status: updatedAttendance.status,
    performedBy: userId,
  });

  return sanitizeAttendance(updatedAttendance);
});

// Check Out Service
export const checkOutService = asyncHandler(async (attendanceId, userId) => {
  const attendance = await getSpecificService(Attendance, attendanceId);

  if (!attendance) {
    throw new ApiError("Attendance record not found", 404);
  }

  if (!attendance.checkIn) {
    throw new ApiError("Employee must check in before checking out", 400);
  }

  if (attendance.checkOut) {
    throw new ApiError("Employee already checked out today", 400);
  }

  const now = new Date();

  // Logic: Check minimum 4 hours requirement
  if (!checkMinimumHoursHelper(attendance.checkIn, now)) {
    throw new ApiError("Minimum 4 hours required before check-out", 400);
  }

  attendance.checkOut = now;
  attendance.status = "checked-out";

  // Calculate hours
  const totalHours = calculateHoursHelper(
    attendance.checkIn,
    attendance.checkOut
  );
  attendance.totalHours = totalHours;

  // Get employee for shift hours
  const employee = await Employee.findById(attendance.employee);
  const shiftStart = employee.shift?.start?.getHours() || 9;
  const shiftEnd = employee.shift?.end?.getHours() || 17;
  const fixedHours = shiftEnd - shiftStart;

  // Logic: Calculate overtime and deduction
  const { overtime, deduction } = calculateOvertimeDeductionHelper(
    totalHours,
    fixedHours
  );
  attendance.overtime = overtime;
  attendance.deduction = deduction;

  // Update payroll
  await updatePayrollHelper(attendance, employee);

  const updatedAttendance = await attendance.save();

  await logger.info("Employee checked out", {
    attendanceId: updatedAttendance._id,
    employeeId: updatedAttendance.employee,
    checkInTime: updatedAttendance.checkIn,
    checkOutTime: updatedAttendance.checkOut,
    totalHours: updatedAttendance.totalHours,
    overtime: updatedAttendance.overtime,
    deduction: updatedAttendance.deduction,
    performedBy: userId,
  });

  return sanitizeAttendance(updatedAttendance);
});

// ========================
// Cron Job Services
// ========================

// Create Daily Attendance Records (For Cron Job)
export const createDailyAttendanceRecords = asyncHandler(async () => {
  const employees = await Employee.find({ active: true });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendancePromises = employees.map(async (employee) => {
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!existingAttendance) {
      return Attendance.create({
        employee: employee._id,
        date: today,
        status: "absent",
      });
    }
    return null;
  });

  const results = await Promise.all(attendancePromises);
  const createdCount = results.filter((result) => result !== null).length;

  await logger.info("Daily attendance records created (Cron Job)", {
    date: today.toISOString().split("T")[0],
    totalEmployees: employees.length,
    createdRecords: createdCount,
  });

  return createdCount;
});

// Create Monthly Payrolls (For Cron Job)
export const createMonthlyPayrolls = asyncHandler(async () => {
  const employees = await Employee.find({ active: true });
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const payrollDate = new Date(currentYear, currentMonth, 1);

  const payrollPromises = employees.map(async (employee) => {
    const existingPayroll = await Payroll.findOne({
      employee: employee._id,
      date: payrollDate,
    });

    if (!existingPayroll) {
      return Payroll.create({
        employee: employee._id,
        date: payrollDate,
        salary: employee.salary,
        bonus: { amount: employee.bonus || 0 },
        overtime: 0,
        deduction: { amount: 0 },
        total: employee.salary + (employee.bonus || 0),
      });
    }
    return null;
  });

  const results = await Promise.all(payrollPromises);
  const createdCount = results.filter((result) => result !== null).length;

  await logger.info("Monthly payrolls created (Cron Job)", {
    month: currentMonth + 1,
    year: currentYear,
    totalEmployees: employees.length,
    createdPayrolls: createdCount,
  });

  return createdCount;
});

// Auto Check-out for Late Employees (For Cron Job)
export const autoCheckOutLateEmployees = asyncHandler(async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lateAttendances = await Attendance.find({
    date: today,
    status: { $in: ["present", "late"] },
    checkIn: { $exists: true },
    checkOut: { $exists: false },
  }).populate("employee");

  const updatePromises = lateAttendances.map(async (attendance) => {
    attendance.checkOut = new Date();
    attendance.status = "checked-out";

    // Calculate hours
    const totalHours = calculateHoursHelper(
      attendance.checkIn,
      attendance.checkOut
    );
    attendance.totalHours = totalHours;

    // Get shift hours
    const shiftStart = attendance.employee.shift?.start?.getHours() || 9;
    const shiftEnd = attendance.employee.shift?.end?.getHours() || 17;
    const fixedHours = shiftEnd - shiftStart;

    // Logic: Calculate overtime and deduction
    const { overtime, deduction } = calculateOvertimeDeductionHelper(
      totalHours,
      fixedHours
    );
    attendance.overtime = overtime;
    attendance.deduction = deduction;

    // Update payroll
    await updatePayrollHelper(attendance, attendance.employee);

    return attendance.save();
  });

  const results = await Promise.all(updatePromises);

  await logger.info("Auto check-out for late employees (Cron Job)", {
    date: today.toISOString().split("T")[0],
    autoCheckedOut: results.length,
  });

  return results.length;
});
