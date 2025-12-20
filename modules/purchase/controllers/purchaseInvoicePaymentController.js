import asyncHandler from "express-async-handler";
import {
  createPaymentService,
  getPaymentsService,
  getPaymentStatsService,
} from "../services/purchaseInvoicePaymentService.js";

export const createPayment = asyncHandler(async (req, res) => {
  const data = await createPaymentService(req.params.invoiceId, req.body);

  res.status(201).json({
    message: "Payment recorded successfully",
    data,
  });
});

export const getPayments = asyncHandler(async (req, res) => {
  const response = await getPaymentsService(req.params.invoiceId, req);

  res.status(200).json({
    message: "Payments retrieved successfully",
    ...response,
  });
});

export const getPaymentStats = asyncHandler(async (req, res) => {
  const data = await getPaymentStatsService(req.params.invoiceId);

  res.status(200).json({
    message: "Payment statistics retrieved successfully",
    data,
  });
});
