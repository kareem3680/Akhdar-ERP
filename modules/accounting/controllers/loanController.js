import asyncHandler from "express-async-handler";
import {
  createLoanService,
  getLoansService,
  getLoanService,
  updateLoanService,
  deleteLoanService,
  approveLoanService,
  getLoanSummaryService,
} from "../services/loanService.js";

export const createLoan = asyncHandler(async (req, res) => {
  const data = await createLoanService(req.body, req.user.id);

  res.status(201).json({
    message: "Loan created successfully",
    data,
  });
});

export const getLoans = asyncHandler(async (req, res) => {
  const response = await getLoansService(req);

  res.status(200).json({
    message: "Loans fetched successfully",
    ...response,
  });
});

export const getLoan = asyncHandler(async (req, res) => {
  const data = await getLoanService(req.params.loanId);

  res.status(200).json({
    message: "Loan retrieved successfully",
    data,
  });
});

export const updateLoan = asyncHandler(async (req, res) => {
  const data = await updateLoanService(
    req.params.loanId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    message: "Loan updated successfully",
    data,
  });
});

export const deleteLoan = asyncHandler(async (req, res) => {
  await deleteLoanService(req.params.loanId);

  res.status(204).json({
    message: "Loan deleted successfully",
  });
});

export const approveLoan = asyncHandler(async (req, res) => {
  const data = await approveLoanService(req.params.loanId, req.user.id);

  res.status(200).json({
    message: "Loan approved successfully",
    data,
  });
});

export const getLoanSummary = asyncHandler(async (req, res) => {
  const data = await getLoanSummaryService(req.params.loanId);

  res.status(200).json({
    message: "Loan summary retrieved successfully",
    data,
  });
});
