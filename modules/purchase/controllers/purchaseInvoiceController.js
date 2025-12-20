import asyncHandler from "express-async-handler";
import {
  createInvoiceService,
  getInvoicesService,
  getSpecificInvoiceService,
  updateInvoiceService,
  deleteInvoiceService,
} from "../services/purchaseInvoiceService.js";

export const createInvoice = asyncHandler(async (req, res) => {
  const data = await createInvoiceService(req.params.purchaseOrderId, req.body);

  res.status(201).json({
    message: "Invoice created successfully",
    data,
  });
});

export const getInvoices = asyncHandler(async (req, res) => {
  const response = await getInvoicesService(req);

  res.status(200).json({
    message: "Invoices fetched successfully",
    ...response,
  });
});

export const getSpecificInvoice = asyncHandler(async (req, res) => {
  const data = await getSpecificInvoiceService(req.params.invoiceId);

  res.status(200).json({
    message: "Invoice retrieved successfully",
    data,
  });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const data = await updateInvoiceService(req.params.invoiceId, req.body);

  res.status(200).json({
    message: "Invoice updated successfully",
    data,
  });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  await deleteInvoiceService(req.params.invoiceId);

  res.status(204).json({
    message: "Invoice deleted successfully",
  });
});
