import asyncHandler from "express-async-handler";
import {
  createInventoryService,
  getInventoriesService,
  getInventoryService,
  updateInventoryService,
  deleteInventoryService,
} from "../services/inventoryService.js";

export const createInventory = asyncHandler(async (req, res) => {
  const data = await createInventoryService(req.body, req.file);

  res.status(201).json({
    message: "Inventory created successfully",
    data,
  });
});

export const getInventories = asyncHandler(async (req, res) => {
  const response = await getInventoriesService(req);

  res.status(200).json({
    message: "Inventories fetched successfully",
    ...response,
  });
});

export const getInventory = asyncHandler(async (req, res) => {
  const data = await getInventoryService(req.params.inventoryId);

  res.status(200).json({
    message: "Inventory retrieved successfully",
    data,
  });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const data = await updateInventoryService(req.params.inventoryId, req.body);

  res.status(200).json({
    message: "Inventory updated successfully",
    data,
  });
});

export const deleteInventory = asyncHandler(async (req, res) => {
  await deleteInventoryService(req.params.inventoryId);

  res.status(204).json({
    message: "Inventory deleted successfully",
  });
});
