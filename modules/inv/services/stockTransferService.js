import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("stock-transfer");

import { sanitizeStockTransfer } from "../../../utils/sanitizeData.js";
import StockTransfer from "../models/stockTransferModel.js";
import Stock from "../models/stockModel.js";
import Inventory from "../models/inventoryModel.js";
import Journal from "../../accounting/models/journalModel.js";
import Account from "../../accounting/models/accountModel.js";
import JournalEntry from "../../accounting/models/journalEntryModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";

export const createStockTransferService = asyncHandler(async (body, userId) => {
  await logger.info("Creating stock transfer", {
    from: body.from,
    to: body.to,
  });

  // Validate source and destination are different
  if (body.from.toString() === body.to.toString()) {
    await logger.error(
      "Source and destination inventories cannot be the same",
      {
        from: body.from,
        to: body.to,
      }
    );
    throw new ApiError(
      "🛑 Source and destination inventories cannot be the same",
      400
    );
  }

  // Check if products exist in source inventory
  for (const product of body.products) {
    const stock = await Stock.findOne({
      productId: product.productId,
      inventoryId: body.from,
    });

    if (!stock) {
      await logger.error("Product not found in source inventory", {
        productId: product.productId,
        inventoryId: body.from,
      });
      throw new ApiError(
        `🛑 Product not found in source inventory: ${product.productId}`,
        404
      );
    }

    if (!stock.isSufficient(product.unit)) {
      await logger.error("Insufficient stock in source inventory", {
        productId: product.productId,
        available: stock.quantity,
        required: product.unit,
      });
      throw new ApiError(
        `🛑 Insufficient stock for product: ${product.productId}`,
        400
      );
    }
  }

  const transferData = {
    ...body,
    createdBy: userId,
  };

  const stockTransfer = await StockTransfer.create(transferData);

  await logger.info("Stock transfer created successfully", {
    transferId: stockTransfer._id,
    reference: stockTransfer.reference,
  });

  return sanitizeStockTransfer(stockTransfer);
});

export const getStockTransfersService = asyncHandler(async (req) => {
  const filter = {};

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const result = await getAllService(
    StockTransfer,
    req.query,
    "stock-transfer",
    filter,
    {
      populate: [
        { path: "from", select: "name location" },
        { path: "to", select: "name location" },
        { path: "createdBy", select: "name email" },
        { path: "products.productId", select: "name code" },
      ],
    }
  );

  await logger.info("Fetched stock transfers", {
    count: result.results,
    status: req.query.status || "all",
  });

  return {
    data: result.data.map(sanitizeStockTransfer),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const updateStockTransferService = asyncHandler(async (id, body) => {
  const stockTransfer = await StockTransfer.findById(id);

  if (!stockTransfer) {
    await logger.error("Stock transfer to update not found", { id });
    throw new ApiError(`🛑 No stock transfer found with ID: ${id}`, 404);
  }

  // Prevent updates if not in draft status
  if (stockTransfer.status !== "draft") {
    await logger.error("Cannot update non-draft transfer", {
      id,
      currentStatus: stockTransfer.status,
    });
    throw new ApiError("🛑 Can only update draft transfers", 400);
  }

  Object.assign(stockTransfer, body);
  await stockTransfer.save();

  await logger.info("Stock transfer updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizeStockTransfer(stockTransfer);
});

export const shipTransferService = asyncHandler(
  async (transferId, shippingCost, userId) => {
    await logger.info("Shipping stock transfer", { transferId });

    const transfer = await StockTransfer.findById(transferId);

    if (!transfer) {
      await logger.error("Transfer not found", { transferId });
      throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
    }

    if (!transfer.canShip()) {
      await logger.error("Transfer cannot be shipped", {
        transferId,
        currentStatus: transfer.status,
      });
      throw new ApiError("🛑 Only draft transfers can be shipped", 400);
    }

    // Deduct stock from source inventory
    const inventoryUpdates = [];

    for (const product of transfer.products) {
      const stock = await Stock.findOne({
        productId: product.productId,
        inventoryId: transfer.from,
      });

      if (!stock) {
        await logger.error("Stock not found for shipping", {
          productId: product.productId,
          inventoryId: transfer.from,
        });
        throw new ApiError(
          `🛑 Stock not found for product: ${product.productId}`,
          404
        );
      }

      if (!stock.isSufficient(product.unit)) {
        await logger.error("Insufficient stock for shipping", {
          productId: product.productId,
          available: stock.quantity,
          required: product.unit,
        });
        throw new ApiError(
          `🛑 Insufficient stock for product: ${product.productId}`,
          400
        );
      }

      // Deduct from source
      stock.quantity -= product.unit;
      await stock.save({ validateBeforeSave: false });

      // Update source inventory capacity
      const sourceInventory = await Inventory.findById(transfer.from);
      sourceInventory.capacity += product.unit;
      inventoryUpdates.push(
        sourceInventory.save({ validateBeforeSave: false })
      );
    }

    // Update all inventories
    await Promise.all(inventoryUpdates);

    // Update transfer status
    transfer.status = "shipping";
    transfer.shippingCost = shippingCost || 0;
    transfer.approvedBy = userId;
    await transfer.save({ validateBeforeSave: false });

    // Create journal entry for shipping cost
    if (shippingCost > 0) {
      await createShippingJournalEntry(transfer, shippingCost);
    }

    await logger.info("Transfer shipped successfully", {
      transferId,
      shippingCost,
    });

    return sanitizeStockTransfer(transfer);
  }
);

export const deliverTransferService = asyncHandler(async (transferId) => {
  await logger.info("Delivering stock transfer", { transferId });

  const transfer = await StockTransfer.findById(transferId);

  if (!transfer) {
    await logger.error("Transfer not found", { transferId });
    throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
  }

  if (!transfer.canDeliver()) {
    await logger.error("Transfer cannot be delivered", {
      transferId,
      currentStatus: transfer.status,
    });
    throw new ApiError("🛑 Only shipping transfers can be delivered", 400);
  }

  // Add stock to destination inventory
  const inventoryUpdates = [];

  for (const product of transfer.products) {
    let stock = await Stock.findOne({
      productId: product.productId,
      inventoryId: transfer.to,
    });

    if (stock) {
      stock.quantity += product.unit;
    } else {
      stock = new Stock({
        productId: product.productId,
        inventoryId: transfer.to,
        quantity: product.unit,
      });
    }

    await stock.save({ validateBeforeSave: false });

    // Update destination inventory capacity
    const destInventory = await Inventory.findById(transfer.to);
    if (destInventory.capacity < product.unit) {
      await logger.error("Insufficient capacity in destination", {
        inventoryId: transfer.to,
        capacity: destInventory.capacity,
        required: product.unit,
      });
      throw new ApiError(
        `🛑 Insufficient capacity in destination inventory`,
        400
      );
    }

    destInventory.capacity -= product.unit;
    inventoryUpdates.push(destInventory.save({ validateBeforeSave: false }));
  }

  // Update all inventories
  await Promise.all(inventoryUpdates);

  // Update transfer status
  transfer.status = "delivered";
  await transfer.save({ validateBeforeSave: false });

  await logger.info("Transfer delivered successfully", {
    transferId,
  });

  return sanitizeStockTransfer(transfer);
});

export const getTransferDocumentService = asyncHandler(async (transferId) => {
  const transfer = await StockTransfer.findById(transferId).populate([
    { path: "from", select: "name location" },
    { path: "to", select: "name location" },
    { path: "createdBy", select: "name email" },
    { path: "approvedBy", select: "name email" },
    { path: "products.productId", select: "name code price" },
  ]);

  if (!transfer) {
    await logger.error("Transfer not found", { transferId });
    throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
  }

  if (transfer.status !== "delivered") {
    await logger.error("Transfer not delivered", {
      transferId,
      status: transfer.status,
    });
    throw new ApiError(
      "🛑 Transfer must be delivered to generate document",
      400
    );
  }

  await logger.info("Transfer document fetched", { transferId });

  return sanitizeStockTransfer(transfer);
});

const createShippingJournalEntry = asyncHandler(
  async (transfer, shippingCost) => {
    try {
      const journal = await Journal.findOne({ journalType: "expenses" });
      const accountExpense = await Account.findOne({ name: "shipping" });
      const accountBank = await Account.findOne({ name: "cash/bank" });

      if (!journal || !accountExpense || !accountBank) {
        await logger.info(
          "Accounting accounts or journal not found, skipping journal entry"
        );
        return;
      }

      await JournalEntry.create({
        journalId: journal._id,
        lines: [
          {
            accountId: accountExpense._id,
            description: `Shipping cost ${shippingCost} for stock transfer ${transfer.reference}`,
            debit: shippingCost,
            credit: 0,
          },
          {
            accountId: accountBank._id,
            description: `Cash paid ${shippingCost} for shipping`,
            debit: 0,
            credit: shippingCost,
          },
        ],
      });

      await logger.info("Shipping journal entry created", {
        transferId: transfer._id,
        amount: shippingCost,
      });
    } catch (error) {
      await logger.error("Failed to create shipping journal entry", {
        error: error.message,
      });
    }
  }
);
