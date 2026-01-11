import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("loan-installment");

import {
  sanitizeLoanInstallment,
  sanitizeLoan,
} from "../../../utils/sanitizeData.js";
import LoanInstallment from "../models/loanInstallmentModel.js";
import Loan from "../models/loanModel.js";
import Journal from "../models/journalModel.js";
import Account from "../models/accountModel.js";
import JournalEntry from "../models/journalEntryModel.js";
import {
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";

export const getInstallmentsService = asyncHandler(async (req) => {
  const filter = {};

  // Add loan filter if provided
  if (req.query.loanId) {
    filter.loanId = req.query.loanId;
  }

  // Add status filter if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Add date range filter if provided
  if (req.query.from || req.query.to) {
    filter.dueDate = {};
    if (req.query.from) filter.dueDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.dueDate.$lte = new Date(req.query.to);
  }

  const result = await getAllService(
    LoanInstallment,
    req.query,
    "loan-installment",
    filter,
    {
      populate: [
        {
          path: "loanId",
          select: "borrower borrowerType loanAmount status",
        },
        {
          path: "createdBy",
          select: "name email",
        },
      ],
    }
  );

  await logger.info("Fetched loan installments", {
    count: result.results,
    filters: Object.keys(filter),
  });

  return {
    data: result.data.map(sanitizeLoanInstallment),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getInstallmentService = asyncHandler(async (id) => {
  const installment = await getSpecificService(LoanInstallment, id, {
    populate: [
      {
        path: "loanId",
        select:
          "borrower borrowerType loanAmount totalPayable remainingBalance status",
        populate: {
          path: "borrower",
          select: "name tradeName email phone",
        },
      },
      {
        path: "createdBy",
        select: "name email",
      },
    ],
  });

  await logger.info("Fetched specific installment", { id });

  return sanitizeLoanInstallment(installment);
});

export const deleteInstallmentService = asyncHandler(async (id) => {
  const installment = await LoanInstallment.findById(id);

  if (!installment) {
    await logger.error("Installment to delete not found", { id });
    throw new ApiError(`🛑 No installment found with ID: ${id}`, 404);
  }

  // Prevent deleting paid installments
  if (installment.status === "paid") {
    await logger.error("Cannot delete paid installment", { id });
    throw new ApiError("🛑 Cannot delete paid installment", 400);
  }

  await deleteService(LoanInstallment, id);

  await logger.info("Installment deleted", { id });
});

export const payInstallmentService = asyncHandler(
  async (installmentId, paymentData, userId) => {
    await logger.info("Paying installment", { installmentId });

    const installment = await LoanInstallment.findById(installmentId).populate({
      path: "loanId",
      select: "borrower borrowerType remainingBalance status",
      populate: {
        path: "borrower",
        select: "name tradeName",
      },
    });

    if (!installment) {
      await logger.error("Installment not found", { installmentId });
      throw new ApiError(
        `🛑 No installment found with ID: ${installmentId}`,
        404
      );
    }

    if (installment.status === "paid") {
      await logger.error("Installment already paid", { installmentId });
      throw new ApiError("🛑 Installment has already been paid", 400);
    }

    // Mark installment as paid
    installment.markAsPaid(paymentData);
    await installment.save({ validateBeforeSave: false });

    // Update loan remaining balance
    const loan = await Loan.findById(installment.loanId);
    if (loan) {
      loan.remainingBalance = Math.max(
        0,
        loan.remainingBalance - installment.amount
      );

      // Check if loan is fully paid
      if (loan.remainingBalance <= 0) {
        loan.status = "completed";
      }

      await loan.save({ validateBeforeSave: false });
    }

    // Create journal entry for payment
    const journal = await Journal.findOne({ journalType: "loan/payment" });
    const debitAccount = await Account.findOne({ name: "cash/bank" });
    const creditAccount = await Account.findOne({ name: "Loan Payable" });

    if (!journal || !debitAccount || !creditAccount) {
      await logger.info("Accounting setup incomplete, skipping journal entry");
    } else {
      // Create journal entry
      await JournalEntry.create({
        journalId: journal._id,
        lines: [
          {
            accountId: debitAccount._id,
            description: `Loan installment payment for ${
              installment.loanId.borrower?.name ||
              installment.loanId.borrower?.tradeName
            }`,
            debit: installment.amount,
            credit: 0,
          },
          {
            accountId: creditAccount._id,
            description: `Reduction in loan payable`,
            debit: 0,
            credit: installment.amount,
          },
        ],
        reference: `INST-${installmentId}`,
        notes: `Installment payment for loan ${installment.loanId._id}`,
        status: "posted",
      });

      // Update account balances
      debitAccount.amount -= installment.amount;
      creditAccount.amount -= installment.amount;
      await debitAccount.save({ validateBeforeSave: false });
      await creditAccount.save({ validateBeforeSave: false });
    }

    await logger.info("Installment paid successfully", {
      installmentId,
      amount: installment.amount,
      loanId: installment.loanId._id,
      remainingBalance: loan?.remainingBalance,
    });

    return {
      installment: sanitizeLoanInstallment(installment),
      loan: loan ? sanitizeLoan(loan) : null,
      journalEntryCreated: !!(journal && debitAccount && creditAccount),
    };
  }
);

export const getOverdueInstallmentsService = asyncHandler(async (req) => {
  const now = new Date();

  const result = await getAllService(
    LoanInstallment,
    req.query,
    "loan-installment",
    {
      status: { $in: ["pending", "overdue"] },
      dueDate: { $lt: now },
    },
    {
      populate: [
        {
          path: "loanId",
          select: "borrower borrowerType loanAmount",
          populate: {
            path: "borrower",
            select: "name tradeName email phone",
          },
        },
      ],
    }
  );

  const totalOverdue = result.data.reduce((sum, i) => sum + i.amount, 0);

  await logger.info("Fetched overdue installments", {
    count: result.results,
    totalOverdue,
  });

  return {
    data: result.data.map(sanitizeLoanInstallment),
    results: result.results,
    totalOverdue,
    paginationResult: result.paginationResult,
  };
});
