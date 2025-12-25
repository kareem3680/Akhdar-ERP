import asyncHandler from "express-async-handler";
import {
  createStockService,
  getStockService,
  getInventoryStocksService,
  updateStockService,
  deleteStockService,
  stockInService,
  stockOutService,
} from "../services/stockService.js";

export const createStock = asyncHandler(async (req, res) => {
  const data = await createStockService(req.params.inventoryId, req.body);

  res.status(201).json({
    message: "Stock added successfully",
    data,
  });
});

export const getStock = asyncHandler(async (req, res) => {
  const data = await getStockService(req.params.stockId);

  res.status(200).json({
    message: "Stock retrieved successfully",
    data,
  });
});

export const getInventoryStocks = asyncHandler(async (req, res) => {
  const response = await getInventoryStocksService(req.params.inventoryId, req);

  res.status(200).json({
    message: "Inventory stocks fetched successfully",
    ...response,
  });
});

export const updateStock = asyncHandler(async (req, res) => {
  const data = await updateStockService(req.params.stockId, req.body);

  res.status(200).json({
    message: "Stock updated successfully",
    data,
  });
});

export const deleteStock = asyncHandler(async (req, res) => {
  await deleteStockService(req.params.stockId);

  res.status(204).json({
    message: "Stock deleted successfully",
  });
});

export const stockIn = asyncHandler(async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { products } = req.body;

  const data = await stockInService(purchaseOrderId, products);

  res.status(200).json({
    message: "Stock in completed successfully",
    data,
  });
});

export const stockOut = asyncHandler(async (req, res) => {
  const { saleOrderId } = req.params;

  const data = await stockOutService(saleOrderId);

  res.status(200).json({
    message: "Stock out completed successfully",
    data,
  });
});
