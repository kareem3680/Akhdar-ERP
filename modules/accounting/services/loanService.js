import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("loan");

import { sanitizeLoan } from "../../../utils/sanitizeData.js";
import Loan from "../models/loanModel.js";
import LoanInstallment from "../models/loanInstallmentModel.js";
import Journal from "../models/journalModel.js";
import Account from "../models/accountModel.js";
import JournalEntry from "../models/journalEntryModel.js";
import {
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";

// Import sanitizeLoanInstallment if needed
const sanitizeLoanInstallment = (installment) => {
  // Your sanitize function implementation
  return installment;
};

export const createLoanService = asyncHandler(async (body, userId) => {
  await logger.info("Creating new loan", {
    borrower: body.borrower,
    amount: body.loanAmount,
  });

  const loan = await Loan.create({
    ...body,
    createdBy: userId,
  });

  await logger.info("Loan created successfully", {
    loanId: loan._id,
    amount: loan.loanAmount,
    installments: loan.installmentNumber,
  });

  return sanitizeLoan(loan);
});

export const getLoansService = asyncHandler(async (req) => {
  const filter = {};

  // Add status filter if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Add borrower filter if provided
  if (req.query.borrower) {
    filter.borrower = req.query.borrower;
  }

  const result = await getAllService(Loan, req.query, "loan", filter, {
    populate: [
      {
        path: "borrower",
        select: "name tradeName email",
      },
      {
        path: "createdBy",
        select: "name email",
      },
      {
        path: "approvedBy",
        select: "name email",
      },
    ],
  });

  await logger.info("Fetched loans", {
    count: result.results,
    status: req.query.status || "all",
  });

  return {
    data: result.data.map(sanitizeLoan),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getLoanService = asyncHandler(async (id) => {
  const loan = await getSpecificService(Loan, id, {
    populate: [
      {
        path: "borrower",
        select: "name tradeName email phone",
      },
      {
        path: "createdBy",
        select: "name email",
      },
      {
        path: "approvedBy",
        select: "name email",
      },
      {
        path: "installments",
      },
    ],
  });

  await logger.info("Fetched specific loan", { id });

  return sanitizeLoan(loan);
});

export const updateLoanService = asyncHandler(async (id, body, userId) => {
  const loan = await Loan.findById(id);

  if (!loan) {
    await logger.error("Loan to update not found", { id });
    throw new ApiError(`🛑 No loan found with ID: ${id}`, 404);
  }

  // Prevent updating approved or active loans
  if (loan.status !== "pending" && body.status && body.status !== loan.status) {
    await logger.error("Cannot update non-pending loan", {
      id,
      currentStatus: loan.status,
    });
    throw new ApiError("🛑 Can only update pending loans", 400);
  }

  Object.assign(loan, body);
  if (body.status && body.status !== loan.status) {
    loan.updatedBy = userId;
  }
  await loan.save();

  await logger.info("Loan updated", {
    id,
    updatedBy: userId,
    updatedFields: Object.keys(body),
  });

  return sanitizeLoan(loan);
});

export const deleteLoanService = asyncHandler(async (id) => {
  const loan = await Loan.findById(id);

  if (!loan) {
    await logger.error("Loan to delete not found", { id });
    throw new ApiError(`🛑 No loan found with ID: ${id}`, 404);
  }

  // Check if loan has installments
  const installments = await LoanInstallment.find({ loanId: id });
  if (installments.length > 0) {
    await logger.error("Cannot delete loan with installments", {
      id,
      installmentCount: installments.length,
    });
    throw new ApiError("🛑 Cannot delete loan with existing installments", 400);
  }

  await deleteService(Loan, id);

  await logger.info("Loan deleted", { id });
});

export const approveLoanService = asyncHandler(async (loanId, userId) => {
  await logger.info("Approving loan", { loanId });

  const loan = await Loan.findById(loanId).populate({
    path: "borrower",
    select: "name tradeName",
  });

  if (!loan) {
    await logger.error("Loan not found", { loanId });
    throw new ApiError(`🛑 No loan found with ID: ${loanId}`, 404);
  }

  if (!loan.canApprove()) {
    await logger.error("Loan cannot be approved", {
      loanId,
      currentStatus: loan.status,
    });
    throw new ApiError("🛑 Only pending loans can be approved", 400);
  }

  // Create installments
  const installments = [];
  for (let i = 0; i < loan.installmentNumber; i++) {
    const dueDate = new Date(loan.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const installment = await LoanInstallment.create({
      loanId: loan._id,
      amount: loan.installmentAmount,
      dueDate,
      createdBy: userId,
    });

    installments.push(installment);
  }

  // Find journal and accounts for accounting entry
  const journal = await Journal.findOne({ journalType: "loan" });
  const debitAccount = await Account.findOne({ name: "Loan Payable" });
  const creditAccount = await Account.findOne({ name: "cash/bank" });

  if (!journal || !debitAccount || !creditAccount) {
    await logger.info("Accounting setup incomplete, skipping journal entry");
  } else {
    // Create journal entry
    await JournalEntry.create({
      journalId: journal._id,
      lines: [
        {
          accountId: debitAccount._id,
          description: `Loan payable - ${
            loan.borrower?.name || loan.borrower?.tradeName
          }`,
          debit: loan.totalPayable,
          credit: 0,
        },
        {
          accountId: creditAccount._id,
          description: `Cash received from bank for loan`,
          debit: 0,
          credit: loan.totalPayable,
        },
      ],
      reference: `LOAN-${loanId}`,
      notes: `Loan approval for ${
        loan.borrower?.name || loan.borrower?.tradeName
      }`,
      status: "posted",
    });

    // Update account balances
    debitAccount.amount += loan.totalPayable;
    creditAccount.amount += loan.totalPayable;
    await debitAccount.save({ validateBeforeSave: false });
    await creditAccount.save({ validateBeforeSave: false });
  }

  // Update loan status
  loan.status = "active";
  loan.approvedBy = userId;
  await loan.save({ validateBeforeSave: false });

  await logger.info("Loan approved successfully", {
    loanId,
    approvedBy: userId,
    installmentsCreated: installments.length,
    totalAmount: loan.totalPayable,
  });

  return {
    loan: sanitizeLoan(loan),
    installments: installments.map(sanitizeLoanInstallment),
    journalEntryCreated: !!(journal && debitAccount && creditAccount),
  };
});

export const getLoanSummaryService = asyncHandler(async (loanId) => {
  const loan = await getLoanService(loanId);

  const installments = await LoanInstallment.find({ loanId });

  const summary = {
    totalInstallments: installments.length,
    paidInstallments: installments.filter((i) => i.status === "paid").length,
    pendingInstallments: installments.filter((i) => i.status === "pending")
      .length,
    overdueInstallments: installments.filter((i) => i.status === "overdue")
      .length,
    totalPaid: installments
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0),
    totalPending: installments
      .filter((i) => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + i.amount, 0),
    nextDueDate: installments
      .filter((i) => i.status === "pending")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate,
  };

  return {
    loan,
    summary,
  };
});

// Export loan service functions
export const loanService = {
  createLoanService,
  getLoansService,
  getLoanService,
  updateLoanService,
  deleteLoanService,
  approveLoanService,
  getLoanSummaryService,
};
