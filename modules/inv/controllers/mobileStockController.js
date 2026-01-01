import asyncHandler from "express-async-handler";
import {
  createMobileStockService,
  getMobileStocksService,
  getMobileStockService,
  updateMobileStockService,
  deleteMobileStockService,
} from "../services/mobileStockService.js";

export const createMobileStock = asyncHandler(async (req, res) => {
  const data = await createMobileStockService(req.body);
  res.status(201).json({
    message: "Mobile stock created successfully",
    data,
  });
});

export const getMobileStocks = asyncHandler(async (req, res) => {
  const response = await getMobileStocksService(req);
  res.status(200).json({
    message: "Mobile stocks fetched successfully",
    ...response,
  });
});

export const getMobileStock = asyncHandler(async (req, res) => {
  const data = await getMobileStockService(req.params.id);
  res.status(200).json({
    message: "Mobile stock retrieved successfully",
    data,
  });
});

export const updateMobileStock = asyncHandler(async (req, res) => {
  const data = await updateMobileStockService(req.params.id, req.body);
  res.status(200).json({
    message: "Mobile stock updated successfully",
    data,
  });
});

export const deleteMobileStock = asyncHandler(async (req, res) => {
  await deleteMobileStockService(req.params.id);
  res.status(204).json({
    message: "Mobile stock deleted successfully",
  });
});
