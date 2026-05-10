import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("stock-transfer");

import { sanitizeStockTransfer } from "../../../utils/sanitizeData.js";
import StockTransfer from "../models/stockTransferModel.js";
import Stock from "../models/stockModel.js";
import MobileStock from "../models/mobileStockModel.js";
import Inventory from "../models/inventoryModel.js";
import Journal from "../../accounting/models/journalModel.js";
import Account from "../../accounting/models/accountModel.js";
import JournalEntry from "../../accounting/models/journalEntryModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";

export const createStockTransferService = asyncHandler(async (body, userId) => {
  await logger.info("Creating stock transfer", {
    from: body.from,
    to: body.to,
    toMobileStock: body.toMobileStock,
  });

  // Determine destination type
  const toIsInventory = body.to && !body.toMobileStock;
  const toIsMobileStock = !body.to && body.toMobileStock;

  // Validate destination
  if (!toIsInventory && !toIsMobileStock) {
    await logger.error(
      "Destination must be either inventory or mobile stock",
      body,
    );
    throw new ApiError(
      "🛑 Destination must be either inventory or mobile stock",
      400,
    );
  }

  if (toIsInventory && toIsMobileStock) {
    await logger.error(
      "Cannot have both inventory and mobile stock destination",
      body,
    );
    throw new ApiError(
      "🛑 Cannot have both inventory and mobile stock destination",
      400,
    );
  }

  // Validate source and destination are different
  const destinationId = toIsInventory ? body.to : body.toMobileStock;
  if (body.from.toString() === destinationId.toString()) {
    await logger.error("Source and destination cannot be the same", {
      from: body.from,
      destinationId,
      destinationType: toIsInventory ? "inventory" : "mobile-stock",
    });
    throw new ApiError("🛑 Source and destination cannot be the same", 400);
  }

  // Get source inventory
  const sourceInventory = await Inventory.findById(body.from);

  // Get destination
  let destinationInventory = null;
  let destinationMobileStock = null;

  if (toIsInventory) {
    destinationInventory = await Inventory.findById(body.to);
    if (!destinationInventory) {
      await logger.error("Destination inventory not found", { to: body.to });
      throw new ApiError("🛑 Destination inventory not found", 404);
    }
  } else {
    destinationMobileStock = await MobileStock.findById(body.toMobileStock);
    if (!destinationMobileStock) {
      await logger.error("Destination mobile stock not found", {
        toMobileStock: body.toMobileStock,
      });
      throw new ApiError("🛑 Destination mobile stock not found", 404);
    }
  }

  if (!sourceInventory) {
    await logger.error("Source inventory not found", { from: body.from });
    throw new ApiError("🛑 Source inventory not found", 404);
  }

  // Process products
  const stockOperations = [];
  const inventoryUpdates = [];

  // 🔴 references stocks
  const stockReferences = {
    sourceStocks: [],
    destinationStocks: [],
  };

  for (const product of body.products) {
    // Check if product exists in source inventory
    const sourceStock = await Stock.findOne({
      productId: product.productId,
      inventoryId: body.from,
    });

    if (!sourceStock) {
      await logger.error("Product not found in source inventory", {
        productId: product.productId,
        inventoryId: body.from,
      });
      throw new ApiError(
        `🛑 Product not found in source inventory: ${product.productId}`,
        404,
      );
    }

    // Check sufficient stock in source
    if (!sourceStock.isSufficient(product.unit)) {
      await logger.error("Insufficient stock in source inventory", {
        productId: product.productId,
        available: sourceStock.quantity,
        required: product.unit,
      });
      throw new ApiError(
        `🛑 Insufficient stock for product: ${product.productId}`,
        400,
      );
    }

    // Check destination inventory capacity (only for inventory destinations)
    if (toIsInventory && destinationInventory.capacity < product.unit) {
      await logger.error("Insufficient capacity in destination inventory", {
        inventoryId: body.to,
        capacity: destinationInventory.capacity,
        required: product.unit,
      });
      throw new ApiError(
        `🛑 Insufficient capacity in destination inventory`,
        400,
      );
    }

    // 🔴reference source stock
    stockReferences.sourceStocks.push({
      stock: sourceStock,
      quantity: -product.unit,
      productId: product.productId,
    });

    // Deduct from source
    sourceStock.quantity -= product.unit;

    // Add transaction record
    sourceStock.transactions.push({
      type: "transfer",
      quantity: -product.unit,
      referenceId: null, // Will be updated after transfer creation
      referenceType: "StockTransfer",
      notes: `Transfer to ${toIsInventory ? destinationInventory.name : destinationMobileStock.name}`,
      performedBy: userId,
    });

    stockOperations.push(sourceStock.save({ validateBeforeSave: false }));

    // Update source inventory capacity
    sourceInventory.capacity += product.unit;

    // Find or create destination stock
    let destinationStock;
    let destinationQuery;

    if (toIsInventory) {
      destinationQuery = {
        productId: product.productId,
        inventoryId: body.to,
      };
      destinationStock = await Stock.findOne(destinationQuery);
    } else {
      destinationQuery = {
        productId: product.productId,
        mobileStockId: body.toMobileStock,
      };
      destinationStock = await Stock.findOne(destinationQuery);
    }

    if (destinationStock) {
      destinationStock.quantity += product.unit;
    } else {
      destinationStock = new Stock({
        productId: product.productId,
        ...(toIsInventory
          ? { inventoryId: body.to }
          : { mobileStockId: body.toMobileStock }),
        quantity: product.unit,
        lastUpdatedBy: userId,
      });
    }

    // 🔴reference destination stock
    stockReferences.destinationStocks.push({
      stock: destinationStock,
      quantity: product.unit,
      productId: product.productId,
    });

    // Add transaction record to destination
    destinationStock.transactions.push({
      type: "transfer",
      quantity: product.unit,
      referenceId: null, // Will be updated after transfer creation
      referenceType: "StockTransfer",
      notes: `Transfer from ${sourceInventory.name}`,
      performedBy: userId,
    });

    stockOperations.push(destinationStock.save({ validateBeforeSave: false }));

    // Update destination inventory capacity (only for inventory destinations)
    if (toIsInventory) {
      destinationInventory.capacity -= product.unit;
    }
  }

  // 🔴 Save all changes and get the saved documents
  const savedStocks = await Promise.all(stockOperations);

  // Save inventory updates
  inventoryUpdates.push(sourceInventory.save({ validateBeforeSave: false }));
  if (toIsInventory) {
    inventoryUpdates.push(
      destinationInventory.save({ validateBeforeSave: false }),
    );
  }

  await Promise.all(inventoryUpdates);

  // Create transfer record
  const transferData = {
    ...body,
    createdBy: userId,
    status: "delivered",
    completedAt: new Date(),
    // Ensure only one destination field is set
    to: toIsInventory ? body.to : undefined,
    toMobileStock: toIsMobileStock ? body.toMobileStock : undefined,
  };

  const stockTransfer = await StockTransfer.create(transferData);

  // 🔴 FIX: Update referenceId in ALL saved stocks
  const updatePromises = savedStocks.map(async (savedStock) => {
    if (
      savedStock &&
      savedStock.transactions &&
      savedStock.transactions.length > 0
    ) {
      // Find the last transfer transaction
      const lastTransaction =
        savedStock.transactions[savedStock.transactions.length - 1];
      if (
        lastTransaction &&
        lastTransaction.type === "transfer" &&
        lastTransaction.referenceId === null
      ) {
        lastTransaction.referenceId = stockTransfer._id;
        await savedStock.save({ validateBeforeSave: false });

        await logger.debug("Updated transaction reference", {
          stockId: savedStock._id,
          productId: savedStock.productId,
          transactionId: lastTransaction._id,
          transferId: stockTransfer._id,
        });
      }
    }
  });

  await Promise.all(updatePromises);

  // 🔴 FIX: Verification step
  await verifyTransferCompletion(stockTransfer, userId, body.products);

  // Create journal entry for shipping cost if exists
  if (body.shippingCost && body.shippingCost > 0) {
    await createShippingJournalEntry(stockTransfer, body.shippingCost, userId);
  }

  await logger.info("Stock transfer completed successfully", {
    transferId: stockTransfer._id,
    reference: stockTransfer.reference,
    destinationType: toIsInventory ? "inventory" : "mobile-stock",
    productsCount: body.products.length,
  });

  // 🔴 FIX: Return verification data
  return {
    transfer: sanitizeStockTransfer(stockTransfer),
    verification: {
      status: "completed",
      stocksUpdated: savedStocks.length,
      destinationId: destinationId,
      timestamp: new Date(),
    },
  };
});

// 🔴 NEW: Verification function
const verifyTransferCompletion = asyncHandler(
  async (transfer, userId, products) => {
    const verificationResults = [];
    const errors = [];

    for (const product of products) {
      try {
        // Check if stock exists in destination
        let destinationStock;

        if (transfer.toMobileStock) {
          destinationStock = await Stock.findOne({
            productId: product.productId,
            mobileStockId: transfer.toMobileStock,
          });
        } else {
          destinationStock = await Stock.findOne({
            productId: product.productId,
            inventoryId: transfer.to,
          });
        }

        if (!destinationStock) {
          errors.push({
            productId: product.productId,
            error: "Stock not found in destination after transfer",
          });
          continue;
        }

        // Check if transaction has correct referenceId
        const hasTransferTransaction = destinationStock.transactions?.some(
          (t) =>
            t.type === "transfer" &&
            t.referenceId &&
            t.referenceId.toString() === transfer._id.toString(),
        );

        if (!hasTransferTransaction) {
          errors.push({
            productId: product.productId,
            error: "Transfer transaction not found or missing referenceId",
          });
        }

        verificationResults.push({
          productId: product.productId,
          transferredQuantity: product.unit,
          foundInDestination: !!destinationStock,
          currentQuantity: destinationStock?.quantity || 0,
          hasCorrectTransaction: hasTransferTransaction,
          destinationStockId: destinationStock?._id,
        });
      } catch (error) {
        errors.push({
          productId: product.productId,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      await logger.error("Transfer verification failed", {
        transferId: transfer._id,
        errors,
        verificationResults,
      });

      // Try to auto-fix
      await attemptAutoFix(transfer, errors, userId);
    } else {
      await logger.info("Transfer verification successful", {
        transferId: transfer._id,
        verificationResults,
      });
    }

    return { verificationResults, errors };
  },
);

// 🔴 NEW: Auto-fix function
const attemptAutoFix = asyncHandler(async (transfer, errors, userId) => {
  await logger.warn("Attempting auto-fix for transfer", {
    transferId: transfer._id,
    errorCount: errors.length,
  });

  for (const error of errors) {
    try {
      if (error.error.includes("missing referenceId")) {
        // Find the stock and update its transaction
        let stock;

        if (transfer.toMobileStock) {
          stock = await Stock.findOne({
            productId: error.productId,
            mobileStockId: transfer.toMobileStock,
          });
        } else {
          stock = await Stock.findOne({
            productId: error.productId,
            inventoryId: transfer.to,
          });
        }

        if (stock && stock.transactions) {
          // Find the transfer transaction
          const transferTransaction = stock.transactions.find(
            (t) => t.type === "transfer" && !t.referenceId,
          );

          if (transferTransaction) {
            transferTransaction.referenceId = transfer._id;
            await stock.save({ validateBeforeSave: false });

            await logger.info("Auto-fixed missing referenceId", {
              stockId: stock._id,
              transferId: transfer._id,
            });
          }
        }
      }
    } catch (fixError) {
      await logger.error("Auto-fix failed", {
        productId: error.productId,
        error: fixError.message,
      });
    }
  }
});

export const getStockTransfersService = asyncHandler(async (req) => {
  const filter = {};

  // Optional filter by destination type
  if (req.query.destinationType === "inventory") {
    filter.to = { $exists: true, $ne: null };
  } else if (req.query.destinationType === "mobile-stock") {
    filter.toMobileStock = { $exists: true, $ne: null };
  }

  // Optional filter by source inventory
  if (req.query.from) {
    filter.from = req.query.from;
  }

  // Optional filter by destination (inventory)
  if (req.query.to) {
    filter.to = req.query.to;
  }

  // Optional filter by destination (mobile stock)
  if (req.query.toMobileStock) {
    filter.toMobileStock = req.query.toMobileStock;
  }

  // Optional filter by status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Optional filter by date range
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Optional filter by reference
  if (req.query.reference) {
    filter.reference = { $regex: req.query.reference, $options: "i" };
  }

  const result = await getAllService(
    StockTransfer,
    req.query,
    "stock-transfer",
    filter,
    {
      sort: { createdAt: -1 },
      populate: [
        { path: "from", select: "name location" },
        { path: "to", select: "name location" },
        { path: "toMobileStock", select: "name mobileNumber status" },
        { path: "createdBy", select: "name email" },
        { path: "products.productId", select: "name code" },
      ],
    },
  );

  await logger.info("Fetched stock transfers", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeStockTransfer),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getTransferDocumentService = asyncHandler(async (transferId) => {
  const transfer = await StockTransfer.findById(transferId).populate([
    { path: "from", select: "name location" },
    { path: "to", select: "name location" },
    { path: "toMobileStock", select: "name mobileNumber status" },
    { path: "createdBy", select: "name email" },
    {
      path: "products.productId",
      select: "name code wholesalePrice retailPrice",
    },
  ]);

  if (!transfer) {
    await logger.error("Transfer not found", { transferId });
    throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
  }

  await logger.info("Transfer document fetched", { transferId });

  return sanitizeStockTransfer(transfer);
});

export const updateTransferStatusService = asyncHandler(
  async (transferId, status, userId) => {
    const transfer = await StockTransfer.findById(transferId);

    if (!transfer) {
      await logger.error("Transfer not found for status update", {
        transferId,
      });
      throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
    }

    // Validate status transition
    const validTransitions = {
      draft: ["shipping", "cancelled"],
      shipping: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[transfer.status].includes(status)) {
      await logger.error("Invalid status transition", {
        transferId,
        currentStatus: transfer.status,
        newStatus: status,
      });
      throw new ApiError(
        `🛑 Cannot change status from ${transfer.status} to ${status}`,
        400,
      );
    }

    const oldStatus = transfer.status;
    transfer.status = status;

    if (status === "delivered") {
      transfer.completedAt = new Date();
    }

    if (status === "cancelled") {
      transfer.cancelledBy = userId;
      transfer.cancelledAt = new Date();
    }

    await transfer.save();

    await logger.info("Transfer status updated", {
      transferId,
      oldStatus,
      newStatus: status,
      updatedBy: userId,
    });

    return sanitizeStockTransfer(transfer);
  },
);

export const cancelTransferService = asyncHandler(
  async (transferId, userId, reason) => {
    const transfer = await StockTransfer.findById(transferId);

    if (!transfer) {
      await logger.error("Transfer not found for cancellation", { transferId });
      throw new ApiError(`🛑 No transfer found with ID: ${transferId}`, 404);
    }

    if (transfer.status === "delivered") {
      await logger.error("Cannot cancel delivered transfer", {
        transferId,
        status: transfer.status,
      });
      throw new ApiError("🛑 Cannot cancel a delivered transfer", 400);
    }

    // Reverse the stock movements
    const stockOperations = [];
    const inventoryUpdates = [];

    // Determine destination type
    const toIsInventory = transfer.to && !transfer.toMobileStock;

    // Get inventories
    const sourceInventory = await Inventory.findById(transfer.from);
    let destinationInventory = null;

    if (toIsInventory) {
      destinationInventory = await Inventory.findById(transfer.to);
    }

    for (const product of transfer.products) {
      // Add back to source
      const sourceStock = await Stock.findOne({
        productId: product.productId,
        inventoryId: transfer.from,
      });

      if (sourceStock) {
        sourceStock.quantity += product.unit;

        // Add transaction record for cancellation
        sourceStock.transactions.push({
          type: "transfer",
          quantity: product.unit,
          referenceId: transfer._id,
          referenceType: "StockTransfer",
          notes: `Transfer cancelled - returned from ${toIsInventory ? "inventory" : "mobile stock"}`,
          performedBy: userId,
        });

        stockOperations.push(sourceStock.save({ validateBeforeSave: false }));

        // Update source inventory capacity
        sourceInventory.capacity -= product.unit;
      }

      // Deduct from destination
      let destinationStock;

      if (toIsInventory) {
        destinationStock = await Stock.findOne({
          productId: product.productId,
          inventoryId: transfer.to,
        });
      } else {
        destinationStock = await Stock.findOne({
          productId: product.productId,
          mobileStockId: transfer.toMobileStock,
        });
      }

      if (destinationStock) {
        destinationStock.quantity -= product.unit;

        // Add transaction record for cancellation
        destinationStock.transactions.push({
          type: "transfer",
          quantity: -product.unit,
          referenceId: transfer._id,
          referenceType: "StockTransfer",
          notes: "Transfer cancelled - returned to source",
          performedBy: userId,
        });

        stockOperations.push(
          destinationStock.save({ validateBeforeSave: false }),
        );

        // Update destination inventory capacity (if applicable)
        if (toIsInventory && destinationInventory) {
          destinationInventory.capacity += product.unit;
        }
      }
    }

    // Save all changes
    await Promise.all(stockOperations);

    inventoryUpdates.push(sourceInventory.save({ validateBeforeSave: false }));
    if (toIsInventory && destinationInventory) {
      inventoryUpdates.push(
        destinationInventory.save({ validateBeforeSave: false }),
      );
    }

    await Promise.all(inventoryUpdates);

    // Update transfer status
    transfer.status = "cancelled";
    transfer.cancelledBy = userId;
    transfer.cancelledAt = new Date();
    transfer.cancellationReason = reason;
    await transfer.save();

    await logger.info("Transfer cancelled successfully", {
      transferId: transfer._id,
      reference: transfer.reference,
      cancelledBy: userId,
      productsCount: transfer.products.length,
    });

    return sanitizeStockTransfer(transfer);
  },
);

// Helper function for accounting entries
const createShippingJournalEntry = asyncHandler(
  async (transfer, shippingCost, userId) => {
    try {
      const journal = await Journal.findOne({ journalType: "expenses" });
      const accountExpense = await Account.findOne({ name: "shipping" });
      const accountBank = await Account.findOne({ name: "cash/bank" });

      if (!journal || !accountExpense || !accountBank) {
        await logger.info(
          "Accounting accounts or journal not found, skipping journal entry",
        );
        return;
      }

      await JournalEntry.create({
        journalId: journal._id,
        description: `Shipping cost for stock transfer ${transfer.reference}`,
        createdBy: userId,
        lines: [
          {
            accountId: accountExpense._id,
            description: `Shipping cost for transfer ${transfer.reference}`,
            debit: shippingCost,
            credit: 0,
          },
          {
            accountId: accountBank._id,
            description: `Payment for shipping transfer ${transfer.reference}`,
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
  },
);
