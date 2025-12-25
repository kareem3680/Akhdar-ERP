import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("payroll");

import { sanitizePayroll } from "../../../utils/sanitizeData.js";
import Payroll from "../models/payrollModel.js";
import Account from "../models/accountModel.js";
import Journal from "../models/journalModel.js";
import JournalEntry from "../models/journalEntryModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";

export const getPayrollsService = asyncHandler(async (req) => {
  const result = await getAllService(
    Payroll,
    req.query,
    "payroll",
    {},
    {
      populate: [
        { path: "employee", select: "name email position" },
        { path: "createdBy", select: "name email" },
      ],
    }
  );

  await logger.info("Fetched payrolls", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizePayroll),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const updatePayrollService = asyncHandler(async (id, body) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    await logger.error("Payroll to update not found", { id });
    throw new ApiError(`🛑 No payroll found with ID: ${id}`, 404);
  }

  // Prevent updating paid payrolls
  if (payroll.status === "paid") {
    await logger.error("Cannot update paid payroll", { id });
    throw new ApiError("🛑 Cannot update paid payroll", 400);
  }

  // Update specific fields
  if (body.bonus !== undefined) {
    payroll.bonus = body.bonus;
  }

  if (body.deduction !== undefined) {
    payroll.deduction = body.deduction;
  }

  if (body.overtime !== undefined) {
    payroll.overtime = body.overtime;
  }

  if (body.salary !== undefined) {
    payroll.salary = body.salary;
  }

  if (body.status !== undefined) {
    payroll.status = body.status;
  }

  if (body.paymentMethod !== undefined) {
    payroll.paymentMethod = body.paymentMethod;
  }

  if (body.paymentDate !== undefined) {
    payroll.paymentDate = body.paymentDate;
  }

  await payroll.save();

  await logger.info("Payroll updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizePayroll(payroll);
});

export const payPayrollService = asyncHandler(
  async (payrollId, paymentData) => {
    await logger.info("Processing payroll payment", { payrollId });

    const payroll = await Payroll.findById(payrollId).populate({
      path: "employee",
      select: "name email",
    });

    if (!payroll) {
      await logger.error("Payroll not found", { payrollId });
      throw new ApiError(`🛑 No payroll found with ID: ${payrollId}`, 404);
    }

    if (payroll.status === "paid") {
      await logger.error("Payroll already paid", { payrollId });
      throw new ApiError("🛑 Payroll has already been paid", 400);
    }

    // Find required accounts
    const bankAccount = await Account.findOne({ name: "cash/bank" });
    const payrollAccount = await Account.findOne({ name: "HR Salaries" });

    if (!bankAccount || !payrollAccount) {
      await logger.error("Required accounts not found", {
        bankAccount: !!bankAccount,
        payrollAccount: !!payrollAccount,
      });
      throw new ApiError("🛑 Required accounting accounts not found", 404);
    }

    // Find payroll journal
    const payrollJournal = await Journal.findOne({
      journalType: "payroll/payment",
    });
    if (!payrollJournal) {
      await logger.error("Payroll journal not found");
      throw new ApiError("🛑 Payroll journal not found", 404);
    }

    // Create journal entry
    const journalEntry = await JournalEntry.create({
      journalId: payrollJournal._id,
      lines: [
        {
          accountId: bankAccount._id,
          description: `Payroll payment for employee ${
            payroll.employee.name
          } for ${payroll.date.toLocaleDateString()}. Amount: ${payroll.total}`,
          debit: 0,
          credit: payroll.total,
        },
        {
          accountId: payrollAccount._id,
          description: `Payroll expense for employee ${
            payroll.employee.name
          } for ${payroll.date.toLocaleDateString()}`,
          debit: payroll.total,
          credit: 0,
        },
      ],
      reference: `PAY-${Date.now()}`,
      notes: `Payment of payroll #${payrollId}`,
      status: "posted",
    });

    // Update payroll status
    payroll.status = "paid";
    payroll.paymentDate = new Date();
    payroll.paymentMethod = paymentData.paymentMethod || "bank_transfer";
    await payroll.save({ validateBeforeSave: false });

    // Update account balances
    bankAccount.amount -= payroll.total;
    payrollAccount.amount += payroll.total;

    await bankAccount.save({ validateBeforeSave: false });
    await payrollAccount.save({ validateBeforeSave: false });

    await logger.info("Payroll payment completed", {
      payrollId,
      employee: payroll.employee.name,
      amount: payroll.total,
      journalEntryId: journalEntry._id,
    });

    return {
      payroll: sanitizePayroll(payroll),
      journalEntry: sanitizeJournalEntry(journalEntry),
    };
  }
);

export const getEmployeePayrollHistoryService = asyncHandler(
  async (employeeId) => {
    const result = await getAllService(
      Payroll,
      {},
      "payroll",
      {
        employee: employeeId,
      },
      {
        populate: [{ path: "employee", select: "name email position" }],
      }
    );

    const totalPaid = result.data
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.total, 0);

    const pendingAmount = result.data
      .filter((p) => p.status === "pending" || p.status === "draft")
      .reduce((sum, p) => sum + p.total, 0);

    await logger.info("Fetched employee payroll history", {
      employeeId,
      totalEntries: result.results,
      totalPaid,
      pendingAmount,
    });

    return {
      employeeId,
      payrolls: result.data.map(sanitizePayroll),
      summary: {
        totalPayrolls: result.results,
        paidCount: result.data.filter((p) => p.status === "paid").length,
        pendingCount: result.data.filter(
          (p) => p.status === "pending" || p.status === "draft"
        ).length,
        totalPaid,
        pendingAmount,
      },
      paginationResult: result.paginationResult,
    };
  }
);
