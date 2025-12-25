import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("stock");

import {
  sanitizeStock,
  sanitizePurchaseOrder,
  sanitizeSaleOrder,
} from "../../../utils/sanitizeData.js";
import Stock from "../models/stockModel.js";
import Inventory from "../models/inventoryModel.js";
import PurchaseOrder from "../../purchase/models/purchaseOrderModel.js";
import SaleOrder from "../../sales/models/saleOrderModel.js";
import Journal from "../../accounting/models/journalModel.js";
import Account from "../../accounting/models/accountingModel.js";
import JournalEntry from "../../accounting/models/journalEntryModel.js";
import {
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";

export const createStockService = asyncHandler(async (inventoryId, body) => {
  await logger.info("Creating stock", {
    inventoryId,
    productId: body.productId,
  });

  // Check if inventory exists
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    await logger.error("Inventory not found", { inventoryId });
    throw new ApiError(`🛑 No inventory found with ID: ${inventoryId}`, 404);
  }

  // Check if stock already exists
  const existingStock = await Stock.findOne({
    inventoryId,
    productId: body.productId,
  });

  if (existingStock) {
    await logger.error("Stock already exists for this product in inventory", {
      inventoryId,
      productId: body.productId,
    });
    throw new ApiError(
      "🛑 Stock already exists for this product in inventory",
      400
    );
  }

  // Check capacity
  if (body.quantity > inventory.capacity) {
    await logger.error("Insufficient capacity", {
      inventoryId,
      quantity: body.quantity,
      capacity: inventory.capacity,
    });
    throw new ApiError(
      `🛑 Insufficient capacity. Available: ${inventory.capacity}`,
      400
    );
  }

  // Update inventory capacity
  inventory.capacity -= body.quantity;
  await inventory.save({ validateBeforeSave: false });

  const stock = await Stock.create({
    inventoryId,
    ...body,
  });

  await logger.info("Stock created successfully", {
    stockId: stock._id,
    productId: body.productId,
    quantity: body.quantity,
  });

  return sanitizeStock(stock);
});

export const getStockService = asyncHandler(async (stockId) => {
  const stock = await getSpecificService(Stock, stockId, {
    populate: [
      { path: "productId", select: "name code price" },
      { path: "inventoryId", select: "name location" },
      { path: "lastUpdatedBy", select: "name email" },
    ],
  });

  await logger.info("Fetched specific stock", { stockId });

  return sanitizeStock(stock);
});

export const getInventoryStocksService = asyncHandler(
  async (inventoryId, req) => {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      throw new ApiError(`🛑 No inventory found with ID: ${inventoryId}`, 404);
    }

    const result = await getAllService(Stock, req.query, "stock", {
      inventoryId,
    });

    await logger.info("Fetched stocks for inventory", {
      inventoryId,
      count: result.results,
    });

    return {
      data: result.data.map(sanitizeStock),
      results: result.results,
      paginationResult: result.paginationResult,
    };
  }
);

export const updateStockService = asyncHandler(async (stockId, body) => {
  const stock = await Stock.findById(stockId);

  if (!stock) {
    await logger.error("Stock to update not found", { stockId });
    throw new ApiError(`🛑 No stock found with ID: ${stockId}`, 404);
  }

  // If updating quantity, check capacity
  if (body.quantity !== undefined) {
    const inventory = await Inventory.findById(stock.inventoryId);
    const quantityDifference = body.quantity - stock.quantity;

    if (quantityDifference > inventory.capacity) {
      await logger.error("Insufficient capacity for quantity update", {
        stockId,
        quantityDifference,
        capacity: inventory.capacity,
      });
      throw new ApiError(
        `🛑 Insufficient capacity. Available: ${inventory.capacity}`,
        400
      );
    }

    // Update inventory capacity
    inventory.capacity -= quantityDifference;
    await inventory.save({ validateBeforeSave: false });
  }

  Object.assign(stock, body);
  await stock.save();

  await logger.info("Stock updated", {
    stockId,
    updatedFields: Object.keys(body),
  });

  return sanitizeStock(stock);
});

export const deleteStockService = asyncHandler(async (stockId) => {
  const stock = await Stock.findById(stockId);

  if (!stock) {
    await logger.error("Stock to delete not found", { stockId });
    throw new ApiError(`🛑 No stock found with ID: ${stockId}`, 404);
  }

  // Return capacity to inventory
  const inventory = await Inventory.findById(stock.inventoryId);
  inventory.capacity += stock.quantity;
  await inventory.save({ validateBeforeSave: false });

  await stock.deleteOne();

  await logger.info("Stock deleted", { stockId });
});

export const stockInService = asyncHandler(
  async (purchaseOrderId, products) => {
    await logger.info("Processing stock in", { purchaseOrderId });

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      await logger.error("Purchase order not found", { purchaseOrderId });
      throw new ApiError(
        `🛑 No purchase order found with ID: ${purchaseOrderId}`,
        404
      );
    }

    if (purchaseOrder.status === "delivered") {
      await logger.error("Purchase order already delivered", {
        purchaseOrderId,
      });
      throw new ApiError("🛑 Purchase order is already delivered", 400);
    }

    let stocks = [];
    const inventoryUpdates = [];

    // Process each product
    for (let product of products) {
      const { inventoryId, productId, deliveredQuantity } = product;

      // Find or create stock
      let stock = await Stock.findOne({ productId, inventoryId });

      if (stock) {
        stock.quantity += deliveredQuantity;
      } else {
        stock = new Stock({
          productId,
          inventoryId,
          quantity: deliveredQuantity,
        });
      }

      await stock.save({ validateBeforeSave: false });
      stocks.push(stock);

      // Update inventory capacity
      const inventory = await Inventory.findById(inventoryId);
      inventory.capacity -= deliveredQuantity;
      inventoryUpdates.push(inventory.save({ validateBeforeSave: false }));
    }

    // Update all inventories
    await Promise.all(inventoryUpdates);

    // Update purchase order
    const totalRemaining = purchaseOrder.products.reduce(
      (acc, cur) => acc + (cur.remainingQuantity || cur.quantity),
      0
    );

    if (totalRemaining === 0) {
      purchaseOrder.status = "delivered";
      await purchaseOrder.save({ validateBeforeSave: false });
    }

    // Create journal entry
    await createPurchaseJournalEntry(purchaseOrder);

    await logger.info("Stock in completed successfully", {
      purchaseOrderId,
      productCount: products.length,
      totalRemaining,
    });

    return {
      purchaseOrder: sanitizePurchaseOrder(purchaseOrder),
      stocks: stocks.map(sanitizeStock),
    };
  }
);

const createPurchaseJournalEntry = asyncHandler(async (purchaseOrder) => {
  try {
    const journal = await Journal.findOne({ journalType: "purchases" });
    const accountPurchase = await Account.findOne({
      name: "purchases-expense",
    });
    const accountBank = await Account.findOne({ name: "supplier (AP)" });

    if (!journal || !accountPurchase || !accountBank) {
      await logger.warn(
        "Accounting accounts or journal not found, skipping journal entry"
      );
      return;
    }

    await JournalEntry.create({
      journalId: journal._id,
      lines: [
        {
          accountId: accountPurchase._id,
          description: `Records purchases made ${purchaseOrder.totalAmount} for stocking inventory`,
          debit: purchaseOrder.totalAmount,
          credit: 0,
        },
        {
          accountId: accountBank._id,
          description: `Tracks cash paid ${purchaseOrder.totalAmount} for purchasing inventory stock`,
          debit: 0,
          credit: purchaseOrder.totalAmount,
        },
      ],
    });

    await logger.info("Purchase journal entry created", {
      amount: purchaseOrder.totalAmount,
    });
  } catch (error) {
    await logger.error("Failed to create purchase journal entry", {
      error: error.message,
    });
  }
});

export const stockOutService = asyncHandler(async (saleOrderId) => {
  await logger.info("Processing stock out", { saleOrderId });

  const saleOrder = await SaleOrder.findById(saleOrderId);

  if (!saleOrder) {
    await logger.error("Sale order not found", { saleOrderId });
    throw new ApiError(`🛑 No sale order found with ID: ${saleOrderId}`, 404);
  }

  if (saleOrder.status === "delivered") {
    await logger.error("Sale order already delivered", { saleOrderId });
    throw new ApiError("🛑 Sale order has already been delivered", 400);
  }

  const stockUpdates = [];
  const inventoryUpdates = [];

  // Process each product
  for (let product of saleOrder.products) {
    const stock = await Stock.findOne({
      productId: product.productId,
      inventoryId: product.inventoryId,
    });

    if (!stock) {
      await logger.error("Stock not found for product", {
        productId: product.productId,
        inventoryId: product.inventoryId,
      });
      throw new ApiError(
        `🛑 Stock not found for product: ${product.productId}`,
        404
      );
    }

    if (!stock.isSufficient(product.quantity)) {
      await logger.error("Insufficient stock", {
        productId: product.productId,
        available: stock.quantity,
        required: product.quantity,
      });
      throw new ApiError(
        `🛑 Insufficient stock for product: ${product.productId}`,
        400
      );
    }

    // Update stock
    stock.quantity -= product.quantity;
    stockUpdates.push(stock.save({ validateBeforeSave: false }));

    // Update inventory capacity
    const inventory = await Inventory.findById(product.inventoryId);
    inventory.capacity += product.quantity;
    inventoryUpdates.push(inventory.save({ validateBeforeSave: false }));
  }

  // Save all updates
  await Promise.all([...stockUpdates, ...inventoryUpdates]);

  // Update sale order status
  saleOrder.status = "delivered";
  await saleOrder.save({ validateBeforeSave: false });

  // Create journal entry
  await createSaleJournalEntry(saleOrder);

  await logger.info("Stock out completed successfully", {
    saleOrderId,
    productCount: saleOrder.products.length,
  });

  return sanitizeSaleOrder(saleOrder);
});

const createSaleJournalEntry = asyncHandler(async (saleOrder) => {
  try {
    const journal = await Journal.findOne({ journalType: "sales" });
    const accountRevenue = await Account.findOne({ name: "sales-revenue" });
    const accountReceivable = await Account.findOne({ name: "cash/bank" });

    if (!journal || !accountRevenue || !accountReceivable) {
      await logger.warn(
        "Accounting accounts or journal not found, skipping journal entry"
      );
      return;
    }

    await JournalEntry.create({
      journalId: journal._id,
      lines: [
        {
          accountId: accountRevenue._id,
          description: `Records income earned ${saleOrder.totalAmount} from selling goods`,
          debit: 0,
          credit: saleOrder.totalAmount,
        },
        {
          accountId: accountReceivable._id,
          description: `Tracks money ${saleOrder.totalAmount} owed by customers for credit sales`,
          debit: saleOrder.totalAmount,
          credit: 0,
        },
      ],
    });

    await logger.info("Sale journal entry created", {
      amount: saleOrder.totalAmount,
    });
  } catch (error) {
    await logger.error("Failed to create sale journal entry", {
      error: error.message,
    });
  }
});
