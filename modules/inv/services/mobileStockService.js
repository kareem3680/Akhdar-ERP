import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import mobileStockModel from "../models/mobileStockModel.js";
import stockModel from "../models/stockModel.js";
import accountModel from "../../accounting/models/accountModel.js";
import journalModel from "../../accounting/models/journalModel.js";
import journalEntryModel from "../../accounting/models/journalEntryModel.js";
import {
  getAllService,
  getSpecificService,
  createService,
} from "../../../utils/servicesHandler.js";
import { sanitizeMobileStock } from "../../../utils/sanitizeData.js";

const logger = new Logger("mobile-stock");

export const createMobileStockService = asyncHandler(async (body) => {
  const { representative, goods, capacity, name } = body;

  let totalCapacity = 0;

  // Check stock availability
  for (let product of goods) {
    const stock = await stockModel
      .findById(product.stock)
      .populate("inventoryId");
    if (!stock) {
      await logger.error("Stock not found", { stockId: product.stock });
      throw new ApiError("🛑 Stock not found", 404);
    }

    if (product.quantity > stock.quantity) {
      await logger.error("Insufficient inventory stock", {
        stockId: product.stock,
        requested: product.quantity,
        available: stock.quantity,
        inventory: stock.inventoryId.name,
      });
      throw new ApiError(
        `🛑 Inventory stock (${stock.inventoryId.name}) is not enough for your mobile stock`,
        400
      );
    }
    totalCapacity += product.quantity;
  }

  // Check capacity
  if (totalCapacity > capacity) {
    await logger.error("Mobile stock capacity exceeded", {
      totalCapacity,
      capacity,
    });
    throw new ApiError(
      "🛑 Mobile stock capacity is not enough for your transfer",
      400
    );
  }

  // Create mobile stock
  const mobileStock = await createService(mobileStockModel, {
    representative,
    goods,
    capacity,
    name,
  });

  // Create journal entry for accounting
  try {
    const accountMobile = await accountModel.findOne({ name: "mobile-stock" });
    const accountInventory = await accountModel.findOne({
      name: "inventory-stock",
    });
    const journalMobileStock = await journalModel.findOne({
      journalType: "mobile-stock-transfer",
    });

    if (accountMobile && accountInventory && journalMobileStock) {
      await journalEntryModel.create({
        journalId: journalMobileStock._id,
        lines: [
          {
            accountId: accountMobile._id,
            description: `Inventory transferred to mobile stock (${mobileStock.name})`,
            debit: 0,
            credit: 0,
          },
          {
            accountId: accountInventory._id,
            description: `Inventory transferred from inventory to mobile stock (${mobileStock.name})`,
            debit: 0,
            credit: 0,
          },
        ],
      });
    }
  } catch (error) {
    await logger.error("Failed to create journal entry", {
      error: error.message,
    });
    // Don't throw error - mobile stock is already created
  }

  await logger.info("Mobile stock created successfully", {
    mobileStockId: mobileStock._id,
    name: mobileStock.name,
    capacity: mobileStock.capacity,
  });

  return sanitizeMobileStock(mobileStock);
});

export const getMobileStocksService = asyncHandler(async (req) => {
  const result = await getAllService(
    mobileStockModel,
    req.query,
    "mobile-stock",
    {},
    {
      populate: [
        {
          path: "representative",
          select: "name email phone region",
          populate: {
            path: "organizations.organization_id",
            select: "name code",
          },
        },
        {
          path: "goods.stock",
          select: "name quantity code",
          populate: {
            path: "inventoryId",
            select: "name capacity location",
          },
        },
      ],
    }
  );

  await logger.info("Fetched all mobile stocks", {
    count: result.results,
    page: result.paginationResult?.currentPage || 1,
  });

  return {
    data: result.data.map(sanitizeMobileStock),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getMobileStockService = asyncHandler(async (id) => {
  const mobileStock = await getSpecificService(mobileStockModel, id, {
    populate: [
      {
        path: "representative",
        select: "name email phone region position",
        populate: {
          path: "organizations.organization_id",
          select: "name code address",
        },
      },
      {
        path: "goods.stock",
        select: "name quantity code unitPrice",
        populate: [
          {
            path: "inventoryId",
            select: "name capacity location manager",
          },
          {
            path: "productId",
            select: "name code category",
          },
        ],
      },
    ],
  });

  await logger.info("Fetched mobile stock details", { id });
  return sanitizeMobileStock(mobileStock);
});

export const updateMobileStockService = asyncHandler(async (id, body) => {
  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    await logger.error("Mobile stock not found for update", { id });
    throw new ApiError(`🛑 Mobile stock not found with ID: ${id}`, 404);
  }

  // Handle capacity updates carefully
  if (body.capacity !== undefined && body.capacity < mobileStock.capacity) {
    await logger.error("Cannot reduce capacity below current usage", {
      id,
      currentCapacity: mobileStock.capacity,
      newCapacity: body.capacity,
    });
    throw new ApiError("🛑 Cannot reduce capacity below current usage", 400);
  }

  Object.assign(mobileStock, body);
  await mobileStock.save();

  await logger.info("Mobile stock updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizeMobileStock(mobileStock);
});

export const deleteMobileStockService = asyncHandler(async (id) => {
  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    await logger.error("Mobile stock not found for deletion", { id });
    throw new ApiError(`🛑 Mobile stock not found with ID: ${id}`, 404);
  }

  // Check if mobile stock is used in active trips
  const activeTrips = await mongoose.model("Trip").find({
    car: id,
    status: "inprogress",
  });

  if (activeTrips.length > 0) {
    await logger.error("Cannot delete mobile stock used in active trips", {
      id,
      activeTrips: activeTrips.length,
    });
    throw new ApiError(
      "🛑 Cannot delete mobile stock used in active trips",
      400
    );
  }

  await mobileStockModel.findByIdAndDelete(id);

  await logger.info("Mobile stock deleted", {
    id,
    name: mobileStock.name,
  });

  return sanitizeMobileStock(mobileStock);
});
