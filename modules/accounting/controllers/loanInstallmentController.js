import asyncHandler from "express-async-handler";
import {
  getInstallmentsService,
  getInstallmentService,
  deleteInstallmentService,
  payInstallmentService,
  getOverdueInstallmentsService,
} from "../services/loanInstallmentService.js";

export const getInstallments = asyncHandler(async (req, res) => {
  const response = await getInstallmentsService(req);

  res.status(200).json({
    message: "Loan installments fetched successfully",
    ...response,
  });
});

export const getInstallment = asyncHandler(async (req, res) => {
  const data = await getInstallmentService(req.params.installmentId);

  res.status(200).json({
    message: "Installment retrieved successfully",
    data,
  });
});

export const deleteInstallment = asyncHandler(async (req, res) => {
  await deleteInstallmentService(req.params.installmentId);

  res.status(204).json({
    message: "Installment deleted successfully",
  });
});

export const payInstallment = asyncHandler(async (req, res) => {
  const data = await payInstallmentService(
    req.params.installmentId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    message: "Installment paid successfully",
    data,
  });
});

export const getOverdueInstallments = asyncHandler(async (req, res) => {
  const response = await getOverdueInstallmentsService(req);

  res.status(200).json({
    message: "Overdue installments fetched successfully",
    ...response,
  });
});
