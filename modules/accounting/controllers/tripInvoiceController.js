import asyncHandler from "express-async-handler";
import {
  createTripInvoiceService,
  getTripInvoicesService,
} from "../services/tripInvoiceService.js";

export const createTripInvoice = asyncHandler(async (req, res) => {
  const data = await createTripInvoiceService(req.params.saleOrderId);
  res.status(201).json({
    message: "Trip invoice created successfully",
    data,
  });
});

export const getTripInvoices = asyncHandler(async (req, res) => {
  const response = await getTripInvoicesService(req);
  res.status(200).json({
    message: "Trip invoices fetched successfully",
    ...response,
  });
});
