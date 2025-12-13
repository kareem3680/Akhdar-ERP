import asyncHandler from "express-async-handler";
import {
  createSaleInvoiceService,
  getSaleInvoicesService,
  getSpecificSaleInvoiceService,
  updateSaleInvoiceService,
  deleteSaleInvoiceService,
  recordPaymentService,
} from "../services/saleInvoiceService.js";

export const createSaleOrderInvoice = asyncHandler(async (req, res) => {
  const data = await createSaleInvoiceService(
    req.params.saleOrderId,
    req.body,
    req.user._id
  );
  res.status(201).json({
    message: "Sale invoice created successfully",
    data,
  });
});

export const getAllSaleOrderInvoices = asyncHandler(async (req, res) => {
  const response = await getSaleInvoicesService(req);
  res.status(200).json({
    message: "Sale invoices fetched successfully",
    ...response,
  });
});

export const getSaleOrderInvoice = asyncHandler(async (req, res) => {
  const data = await getSpecificSaleInvoiceService(req.params.id, req);
  res.status(200).json({
    message: "Sale invoice retrieved successfully",
    data,
  });
});

export const updateSaleOrderInvoice = asyncHandler(async (req, res) => {
  const data = await updateSaleInvoiceService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Sale invoice updated successfully",
    data,
  });
});

export const deleteSaleOrderInvoice = asyncHandler(async (req, res) => {
  await deleteSaleInvoiceService(req.params.id, req);
  res.status(204).json({
    message: "Sale invoice deleted successfully",
  });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const data = await recordPaymentService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Payment recorded successfully",
    data,
  });
});
