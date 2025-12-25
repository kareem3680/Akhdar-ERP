import asyncHandler from "express-async-handler";
import {
  createStockTransferService,
  getStockTransfersService,
  updateStockTransferService,
  shipTransferService,
  deliverTransferService,
  getTransferDocumentService,
} from "../services/stockTransferService.js";

export const createStockTransfer = asyncHandler(async (req, res) => {
  const data = await createStockTransferService(req.body, req.user.id);

  res.status(201).json({
    message: "Stock transfer created successfully",
    data,
  });
});

export const getStockTransfers = asyncHandler(async (req, res) => {
  const response = await getStockTransfersService(req);

  res.status(200).json({
    message: "Stock transfers fetched successfully",
    ...response,
  });
});

export const updateStockTransfer = asyncHandler(async (req, res) => {
  const data = await updateStockTransferService(
    req.params.stockTransferId,
    req.body
  );

  res.status(200).json({
    message: "Stock transfer updated successfully",
    data,
  });
});

export const shipTransfer = asyncHandler(async (req, res) => {
  const data = await shipTransferService(
    req.params.transferOrderId,
    req.body.shippingCost,
    req.user.id
  );

  res.status(200).json({
    message: "Transfer shipped successfully",
    data,
  });
});

export const deliverTransfer = asyncHandler(async (req, res) => {
  const data = await deliverTransferService(req.params.transferOrderId);

  res.status(200).json({
    message: "Transfer delivered successfully",
    data,
  });
});

export const getTransferDocument = asyncHandler(async (req, res) => {
  const data = await getTransferDocumentService(req.params.transferOrderId);

  res.status(200).json({
    message: "Transfer document retrieved successfully",
    data,
  });
});
