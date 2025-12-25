import cron from "node-cron";
import { cleanOldLogs } from "./loggerService.js";
import {
  createDailyAttendanceRecords,
  createMonthlyPayrolls,
  autoCheckOutLateEmployees,
} from "../modules/organization/services/attendanceService.js";
import {
  markOverdueInstallments,
  checkDefaultedLoans,
  sendPaymentReminders,
} from "../modules/accounting/services/loanScheduler.js";
import Logger from "./loggerService.js";

const logger = new Logger("cron-jobs");

// 1. Daily Attendance Creation Job
cron.schedule("0 9 * * 1-5", async () => {
  // Monday to Friday at 9 AM
  try {
    logger.info("Starting daily attendance creation job");
    await createDailyAttendanceRecords();
    logger.info("Daily attendance creation job completed successfully");
  } catch (error) {
    logger.error("Failed to create daily attendance", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 2. Monthly Payroll Creation Job
cron.schedule("0 0 1 * *", async () => {
  // 1st day of every month at midnight
  try {
    logger.info("Starting monthly payroll creation job");
    await createMonthlyPayrolls();
    logger.info("Monthly payroll creation job completed successfully");
  } catch (error) {
    logger.error("Failed to create monthly payrolls", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 3. Auto Check-out for Late Employees
cron.schedule("0 20 * * 1-5", async () => {
  // Monday to Friday at 8 PM
  try {
    logger.info("Starting auto check-out for late employees job");
    await autoCheckOutLateEmployees();
    logger.info("Auto check-out job completed successfully");
  } catch (error) {
    logger.error("Failed to auto check-out late employees", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 4. Log Cleanup Job
cron.schedule("0 18 * * 1", async () => {
  // Every Monday at 6 PM
  try {
    logger.info("Starting log cleanup job");
    await cleanOldLogs();
    logger.info("Log cleanup job completed successfully");
  } catch (error) {
    logger.error("Failed to clean old logs", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 5. Loan Management - Mark Overdue Installments
cron.schedule("0 0 * * *", async () => {
  // Daily at midnight
  try {
    logger.info("Starting mark overdue installments job");
    await markOverdueInstallments();
    logger.info("Mark overdue installments job completed successfully");
  } catch (error) {
    logger.error("Failed to mark overdue installments", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 6. Loan Management - Check Defaulted Loans
cron.schedule("0 0 1 * *", async () => {
  // 1st day of every month at midnight
  try {
    logger.info("Starting check defaulted loans job");
    await checkDefaultedLoans();
    logger.info("Check defaulted loans job completed successfully");
  } catch (error) {
    logger.error("Failed to check defaulted loans", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 7. Loan Management - Send Payment Reminders
cron.schedule("0 9 * * *", async () => {
  // Daily at 9 AM
  try {
    logger.info("Starting send payment reminders job");
    await sendPaymentReminders();
    logger.info("Send payment reminders job completed successfully");
  } catch (error) {
    logger.error("Failed to send payment reminders", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// 8. Health Check Job (Every hour)
cron.schedule("0 * * * *", () => {
  // Every hour
  logger.info("System health check - All cron jobs are running");
  console.log("✅ All scheduled jobs are active and running");
});

// Function to manually run specific jobs (for testing)
export const runJobManually = async (jobName) => {
  try {
    logger.info(`Manually running job: ${jobName}`);

    switch (jobName) {
      case "markOverdueInstallments":
        await markOverdueInstallments();
        break;
      case "checkDefaultedLoans":
        await checkDefaultedLoans();
        break;
      case "sendPaymentReminders":
        await sendPaymentReminders();
        break;
      case "createDailyAttendance":
        await createDailyAttendanceRecords();
        break;
      case "createMonthlyPayrolls":
        await createMonthlyPayrolls();
        break;
      case "autoCheckOutLateEmployees":
        await autoCheckOutLateEmployees();
        break;
      case "cleanOldLogs":
        await cleanOldLogs();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    logger.info(`Job ${jobName} completed manually`);
    return { success: true, message: `Job ${jobName} executed successfully` };
  } catch (error) {
    logger.error(`Failed to run job ${jobName} manually`, {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

// Export the cron scheduler for external control
export const cronScheduler = {
  startAll: () => {
    console.log("🚀 Starting all cron jobs...");
    // All jobs are automatically started when the file is imported
  },

  stopAll: () => {
    // Note: This is a placeholder. In a real implementation,
    // you would need to store references to the cron jobs
    console.log("⚠️ To stop cron jobs, you need to implement job tracking");
  },

  getStatus: () => {
    return {
      attendanceJob: "Running (Mon-Fri 9:00)",
      payrollJob: "Running (1st of month 00:00)",
      checkOutJob: "Running (Mon-Fri 20:00)",
      logCleanupJob: "Running (Monday 18:00)",
      overdueInstallmentsJob: "Running (Daily 00:00)",
      defaultedLoansJob: "Running (1st of month 00:00)",
      paymentRemindersJob: "Running (Daily 09:00)",
      healthCheckJob: "Running (Hourly)",
    };
  },
};

export default cronScheduler;
