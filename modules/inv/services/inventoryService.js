import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("inventory");

import { sanitizeInventory } from "../../../utils/sanitizeData.js";
import Inventory from "../models/inventoryModel.js";
import {
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";

export const createInventoryService = asyncHandler(async (body, file) => {
  await logger.info("Creating new inventory", { name: body.name });

  if (file) {
    body.avatar = file.path;
  }

  const inventory = await Inventory.create(body);

  await logger.info("Inventory created successfully", {
    inventoryId: inventory._id,
    name: inventory.name,
  });

  return sanitizeInventory(inventory);
});

export const getInventoriesService = asyncHandler(async (req) => {
  const result = await getAllService(Inventory, req.query, "inventory");

  await logger.info("Fetched all inventories", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeInventory),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getInventoryService = asyncHandler(async (id) => {
  const inventory = await getSpecificService(Inventory, id, {
    populate: [
      { path: "organizationId", select: "tradeName" },
      { path: "managerId", select: "name email" },
    ],
  });

  await logger.info("Fetched specific inventory", { id });

  return sanitizeInventory(inventory);
});

export const updateInventoryService = asyncHandler(async (id, body) => {
  const inventory = await Inventory.findById(id);

  if (!inventory) {
    await logger.error("Inventory to update not found", { id });
    throw new ApiError(`🛑 No inventory found with ID: ${id}`, 404);
  }

  Object.assign(inventory, body);
  await inventory.save();

  await logger.info("Inventory updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizeInventory(inventory);
});

export const deleteInventoryService = asyncHandler(async (id) => {
  await deleteService(Inventory, id);

  await logger.info("Inventory deleted", { id });
});
