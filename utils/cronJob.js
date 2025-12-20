import cron from "node-cron";
import { cleanOldLogs } from "./loggerService.js";
import {
  createDailyAttendanceRecords,
  createMonthlyPayrolls,
  autoCheckOutLateEmployees,
} from "../modules/organization/services/attendanceService.js";
import Logger from "./loggerService.js";

const logger = new Logger("cron-jobs");

// 1. Daily Attendance Creation Job
cron.schedule("0 9 * * 1-5", async () => {
  // Monday to Friday at 9 AM
  try {
    await createDailyAttendanceRecords();
  } catch (error) {
    logger.error("Failed to create daily attendance", {
      error: error.message,
    });
  }
});

// 2. Monthly Payroll Creation Job
cron.schedule("0 0 1 * *", async () => {
  // 1st day of every month at midnight
  try {
    await createMonthlyPayrolls();
  } catch (error) {
    logger.error("Failed to create monthly payrolls", {
      error: error.message,
    });
  }
});

// 3. Auto Check-out for Late Employees
cron.schedule("0 20 * * 1-5", async () => {
  // Monday to Friday at 8 PM
  try {
    await autoCheckOutLateEmployees();
  } catch (error) {
    logger.error("Failed to auto check-out late employees", {
      error: error.message,
    });
  }
});

// 4. Log Cleanup Job
cron.schedule("0 18 * * 1", () => {
  // Every Monday at 6 PM
  console.log("🧹 Daily log cleanup started");
  cleanOldLogs();
});
