import LoanInstallment from "../models/loanInstallmentModel.js";
import Loan from "../models/loanModel.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("loan-scheduler");

// Daily job to mark overdue installments
export const markOverdueInstallments = async () => {
  try {
    const now = new Date();

    const result = await LoanInstallment.updateMany(
      {
        status: "pending",
        dueDate: { $lt: now },
      },
      {
        status: "overdue",
        updatedAt: now,
      }
    );

    if (result.modifiedCount > 0) {
      await logger.info("Marked overdue installments", {
        count: result.modifiedCount,
        date: now.toISOString().split("T")[0],
      });
    }
  } catch (error) {
    await logger.error("Error marking overdue installments", {
      error: error.message,
    });
  }
};

// Monthly job to check for defaulted loans
export const checkDefaultedLoans = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find loans with overdue installments older than 30 days
    const overdueInstallments = await LoanInstallment.aggregate([
      {
        $match: {
          status: "overdue",
          dueDate: { $lt: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$loanId",
          overdueCount: { $sum: 1 },
        },
      },
    ]);

    const loanIds = overdueInstallments.map((i) => i._id);

    if (loanIds.length > 0) {
      const result = await Loan.updateMany(
        {
          _id: { $in: loanIds },
          status: "active",
        },
        {
          status: "defaulted",
          updatedAt: new Date(),
        }
      );

      if (result.modifiedCount > 0) {
        await logger.info("Marked loans as defaulted", {
          count: result.modifiedCount,
          loanIds: loanIds.slice(0, 5), // Log first 5 IDs
        });
      }
    }
  } catch (error) {
    await logger.error("Error checking defaulted loans", {
      error: error.message,
    });
  }
};

// Weekly job to send payment reminders (3 days before due date)
export const sendPaymentReminders = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingInstallments = await LoanInstallment.find({
      status: "pending",
      dueDate: {
        $gte: new Date(),
        $lte: threeDaysFromNow,
      },
    }).populate({
      path: "loanId",
      populate: {
        path: "borrower",
        select: "name email phone tradeName",
      },
    });

    let remindersSent = 0;

    for (const installment of upcomingInstallments) {
      // Here you would implement your notification logic
      // For example: send email, SMS, or push notification

      await logger.info("Payment reminder ready to send", {
        installmentId: installment._id,
        dueDate: installment.dueDate,
        amount: installment.amount,
        borrower:
          installment.loanId.borrower?.name ||
          installment.loanId.borrower?.tradeName,
      });

      remindersSent++;
    }

    if (remindersSent > 0) {
      await logger.info(`Payment reminders processed`, {
        count: remindersSent,
      });
    }
  } catch (error) {
    await logger.error("Error sending payment reminders", {
      error: error.message,
    });
  }
};

// Export all scheduler functions (without cron scheduling)
export const loanScheduler = {
  markOverdueInstallments,
  checkDefaultedLoans,
  sendPaymentReminders,
};
