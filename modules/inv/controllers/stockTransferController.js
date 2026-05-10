import asyncHandler from "express-async-handler";
import {
  createStockTransferService,
  getStockTransfersService,
  getTransferDocumentService,
} from "../services/stockTransferService.js";

export const createStockTransfer = asyncHandler(async (req, res) => {
  const data = await createStockTransferService(req.body, req.user.id);

  res.status(201).json({
    message: "Stock transfer completed successfully",
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

export const getTransferDocument = asyncHandler(async (req, res) => {
  const data = await getTransferDocumentService(req.params.transferId);

  res.status(200).json({
    message: "Transfer document retrieved successfully",
    data,
  });
});
