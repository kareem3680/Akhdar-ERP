import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import mobileStockModel from "../models/mobileStockModel.js";
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
  const { representative, capacity, name, year, brand } = body;

  // Create mobile stock
  const mobileStock = await createService(mobileStockModel, {
    representative,
    capacity,
    name,
    year,
    brand,
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
            description: `Mobile stock created (${mobileStock.name})`,
            debit: 0,
            credit: 0,
          },
          {
            accountId: accountInventory._id,
            description: `Mobile stock created (${mobileStock.name})`,
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
  try {
    const result = await getAllService(
      mobileStockModel,
      req.query,
      "mobile-stock",
      {},
      {
        populate: [
          {
            path: "representative",
            select: "name email phone",
          },
        ],
      },
    );

    let dataArray = [];

    if (Array.isArray(result.data)) {
      dataArray = result.data;
    } else if (result.data) {
      dataArray = [result.data];
    } else if (result.docs) {
      dataArray = result.docs;
    } else if (result) {
      dataArray = [result];
    }

    const mobileStocksWithInventory = await Promise.all(
      dataArray.map(async (item) => {
        try {
          let mobileStock;
          if (typeof item === "object" && item !== null) {
            if (item.toObject && typeof item.toObject === "function") {
              mobileStock = item.toObject();
            } else {
              mobileStock = item;
            }
          } else {
            return null;
          }

          if (!mobileStock._id && !mobileStock.id) {
            return null;
          }

          const mobileStockId = mobileStock._id || mobileStock.id;
          const objectId = new mongoose.Types.ObjectId(mobileStockId);

          const stockStats = await mongoose.model("Stock").aggregate([
            {
              $match: {
                mobileStockId: objectId,
                quantity: { $gt: 0 },
              },
            },
            {
              $lookup: {
                from: "products",
                let: { pid: "$productId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$pid"],
                      },
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      code: 1,
                      wholesalePrice: 1,
                    },
                  },
                ],
                as: "product",
              },
            },
            {
              $match: {
                "product.0": { $exists: true },
              },
            },
            {
              $group: {
                _id: "$mobileStockId",
                totalItems: { $sum: 1 },
                totalQuantity: { $sum: "$quantity" },
                totalValue: {
                  $sum: {
                    $multiply: [
                      "$quantity",
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$product.wholesalePrice", 0] },
                          0,
                        ],
                      },
                    ],
                  },
                },
                lowStockCount: {
                  $sum: { $cond: [{ $eq: ["$status", "low-stock"] }, 1, 0] },
                },
                outOfStockCount: {
                  $sum: { $cond: [{ $eq: ["$status", "out-of-stock"] }, 1, 0] },
                },
              },
            },
          ]);

          const topProductsData = await mongoose.model("Stock").aggregate([
            {
              $match: {
                mobileStockId: objectId,
                quantity: { $gt: 0 },
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $unwind: {
                path: "$product",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                quantity: 1,
                status: 1,
                product: {
                  name: 1,
                  code: 1,
                },
              },
            },
            {
              $sort: { quantity: -1 },
            },
            {
              $limit: 3,
            },
          ]);

          const topProducts = topProductsData.map((item) => ({
            product: {
              id: item.product._id,
              name: item.product.name,
              code: item.product.code,
            },
            quantity: item.quantity,
            status: item.status,
          }));

          const stats = stockStats[0] || {
            totalItems: 0,
            totalQuantity: 0,
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
          };

          const usedQuantity = stats.totalQuantity || 0;
          const availableCapacity = mobileStock.capacity - usedQuantity;
          const percentage =
            mobileStock.capacity > 0
              ? Math.round((usedQuantity / mobileStock.capacity) * 100)
              : 0;

          return {
            ...mobileStock,
            inventorySummary: {
              totalItems: stats.totalItems,
              totalQuantity: stats.totalQuantity,
              totalValue: stats.totalValue,
              lowStockCount: stats.lowStockCount,
              outOfStockCount: stats.outOfStockCount,
            },
            topProducts,
            capacityUsage: {
              used: usedQuantity,
              available: Math.max(0, availableCapacity),
              percentage: Math.min(100, Math.max(0, percentage)),
            },
          };
        } catch (error) {
          await logger.error(`Error processing mobile stock`, {
            error: error.message,
            mobileStockId: item?._id || item?.id,
          });

          let mobileStock;
          if (typeof item === "object" && item !== null) {
            if (item.toObject && typeof item.toObject === "function") {
              mobileStock = item.toObject();
            } else {
              mobileStock = item;
            }
          } else {
            return null;
          }

          return {
            ...mobileStock,
            inventorySummary: {
              totalItems: 0,
              totalQuantity: 0,
              totalValue: 0,
              lowStockCount: 0,
              outOfStockCount: 0,
            },
            topProducts: [],
            capacityUsage: {
              used: 0,
              available: mobileStock.capacity || 0,
              percentage: 0,
            },
          };
        }
      }),
    );

    const filteredResults = mobileStocksWithInventory.filter(
      (item) => item !== null && (item._id || item.id),
    );

    await logger.info("Fetched all mobile stocks with inventory", {
      count: filteredResults.length,
      originalCount: result.results || dataArray.length,
      page: result.paginationResult?.currentPage || 1,
    });

    return {
      data: filteredResults.map(sanitizeMobileStock),
      results: filteredResults.length,
      paginationResult: result.paginationResult,
    };
  } catch (error) {
    await logger.error("Error in getMobileStocksService", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

export const getMobileStockService = asyncHandler(async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`🛑 Invalid mobile stock ID: ${id}`, 400);
  }

  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    await logger.error("Mobile stock not found", { id });
    throw new ApiError(`🛑 No mobile stock found with ID: ${id}`, 404);
  }

  try {
    const inventoryAggregate = await mongoose.model("Stock").aggregate([
      {
        $match: {
          mobileStockId: new mongoose.Types.ObjectId(id),
          quantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "products",
          let: { pid: "$productId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$pid"],
                },
              },
            },
            {
              $project: {
                name: 1,
                code: 1,
                category: 1,
                wholesalePrice: 1,
                retailPrice: 1,
                barcode: 1,
                unit: 1,
              },
            },
          ],
          as: "productDetails",
        },
      },
      {
        $addFields: {
          product: {
            $cond: {
              if: { $gt: [{ $size: "$productDetails" }, 0] },
              then: { $arrayElemAt: ["$productDetails", 0] },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          quantity: 1,
          status: 1,
          minQuantity: 1,
          maxQuantity: 1,
          transactions: 1,
          updatedAt: 1,
          product: {
            $cond: {
              if: { $ne: ["$product", null] },
              then: {
                id: "$product._id",
                name: "$product.name",
                code: "$product.code",
                category: "$product.category",
                wholesalePrice: "$product.wholesalePrice",
                retailPrice: "$product.retailPrice",
                barcode: "$product.barcode",
                unit: "$product.unit",
              },
              else: null,
            },
          },
        },
      },
      {
        $sort: { "product.name": 1 },
      },
    ]);

    const itemsWithProduct = inventoryAggregate.filter(
      (item) => item.product !== null,
    );
    const itemsWithoutProduct = inventoryAggregate.filter(
      (item) => item.product === null,
    );

    const formattedItems = itemsWithProduct.map((item) => {
      const recentTransactions = Array.isArray(item.transactions)
        ? item.transactions.slice(-5).map((tx) => ({
            type: tx.type,
            quantity: tx.quantity,
            referenceId: tx.referenceId,
            referenceType: tx.referenceType,
            notes: tx.notes,
            performedBy: tx.performedBy,
            date: tx.date,
          }))
        : [];

      return {
        product: item.product,
        quantity: item.quantity || 0,
        status: item.status || "in-stock",
        minQuantity: item.minQuantity || 10,
        maxQuantity: item.maxQuantity || 1000,
        lastUpdated: item.updatedAt || new Date(),
        transactions: recentTransactions,
      };
    });

    const stats = {
      totalItems: formattedItems.length,
      totalQuantity: formattedItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      ),
      totalValue: formattedItems.reduce((sum, item) => {
        const price = item.product?.wholesalePrice || 0;
        return sum + (item.quantity || 0) * price;
      }, 0),
      lowStockCount: formattedItems.filter(
        (item) => item.status === "low-stock",
      ).length,
      outOfStockCount: formattedItems.filter(
        (item) => item.status === "out-of-stock",
      ).length,
      inStockCount: formattedItems.filter((item) => item.status === "in-stock")
        .length,
      overstockCount: formattedItems.filter(
        (item) => item.status === "overstock",
      ).length,
    };

    const itemsByStatus = {
      inStock: formattedItems.filter((item) => item.status === "in-stock"),
      lowStock: formattedItems.filter((item) => item.status === "low-stock"),
      outOfStock: formattedItems.filter(
        (item) => item.status === "out-of-stock",
      ),
      overstock: formattedItems.filter((item) => item.status === "overstock"),
    };

    const usedQuantity = stats.totalQuantity || 0;
    const availableCapacity = Math.max(0, mobileStock.capacity - usedQuantity);
    const capacityPercentage =
      mobileStock.capacity > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round((usedQuantity / mobileStock.capacity) * 100),
            ),
          )
        : 0;

    const result = {
      id: mobileStock._id,
      representative: mobileStock.representative,
      capacity: mobileStock.capacity,
      name: mobileStock.name,
      year: mobileStock.year,
      brand: mobileStock.brand,
      createdAt: mobileStock.createdAt,
      updatedAt: mobileStock.updatedAt,
      inventory: {
        items: formattedItems,
        statistics: {
          totalItems: stats.totalItems,
          totalQuantity: stats.totalQuantity,
          totalValue: stats.totalValue,
          lowStockCount: stats.lowStockCount,
          outOfStockCount: stats.outOfStockCount,
          inStockCount: stats.inStockCount,
          overstockCount: stats.overstockCount,
        },
        itemsByStatus,
        capacityInfo: {
          total: mobileStock.capacity,
          used: usedQuantity,
          available: availableCapacity,
          percentage: capacityPercentage,
        },
        ...(itemsWithoutProduct.length > 0 && {
          dataQuality: {
            itemsWithProduct: itemsWithProduct.length,
            itemsWithoutProduct: itemsWithoutProduct.length,
            warning: `Found ${itemsWithoutProduct.length} stock items with missing product details`,
          },
        }),
      },
    };

    await logger.info("Fetched mobile stock with inventory", {
      id,
      itemsCount: formattedItems.length,
      totalQuantity: stats.totalQuantity,
      totalValue: stats.totalValue,
    });

    return result;
  } catch (error) {
    await logger.warn("Using fallback method for mobile stock", {
      id,
      error: error.message,
    });

    return getMobileStockServiceFallback(id, mobileStock);
  }
});

// 🔴 Fallback method
const getMobileStockServiceFallback = async (id, mobileStock) => {
  const stocks = await mongoose
    .model("Stock")
    .find({
      mobileStockId: id,
      quantity: { $gt: 0 },
    })
    .lean();

  const productIds = stocks
    .map((s) => s.productId)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const products =
    productIds.length > 0
      ? await mongoose
          .model("Product")
          .find({ _id: { $in: productIds } })
          .lean()
      : [];

  const productMap = {};
  products.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  const formattedItems = stocks
    .filter(
      (stock) => stock.productId && productMap[stock.productId.toString()],
    )
    .map((stock) => {
      const product = productMap[stock.productId.toString()];

      const recentTransactions = Array.isArray(stock.transactions)
        ? stock.transactions.slice(-5).map((tx) => ({
            type: tx.type,
            quantity: tx.quantity,
            referenceId: tx.referenceId,
            referenceType: tx.referenceType,
            notes: tx.notes,
            performedBy: tx.performedBy,
            date: tx.date,
          }))
        : [];

      return {
        product: {
          id: product._id,
          name: product.name,
          code: product.code,
          category: product.category,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          barcode: product.barcode,
          unit: product.unit,
        },
        quantity: stock.quantity || 0,
        status: stock.status || "in-stock",
        minQuantity: stock.minQuantity || 10,
        maxQuantity: stock.maxQuantity || 1000,
        lastUpdated: stock.updatedAt || new Date(),
        transactions: recentTransactions,
      };
    });

  const stats = {
    totalItems: formattedItems.length,
    totalQuantity: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: formattedItems.reduce((sum, item) => {
      const price = item.product?.wholesalePrice || 0;
      return sum + item.quantity * price;
    }, 0),
  };

  const itemsByStatus = {
    inStock: formattedItems.filter((item) => item.status === "in-stock"),
    lowStock: formattedItems.filter((item) => item.status === "low-stock"),
    outOfStock: formattedItems.filter((item) => item.status === "out-of-stock"),
    overstock: formattedItems.filter((item) => item.status === "overstock"),
  };

  const result = {
    id: mobileStock._id,
    representative: mobileStock.representative,
    capacity: mobileStock.capacity,
    name: mobileStock.name,
    year: mobileStock.year,
    brand: mobileStock.brand,
    createdAt: mobileStock.createdAt,
    updatedAt: mobileStock.updatedAt,
    inventory: {
      items: formattedItems,
      statistics: {
        totalItems: stats.totalItems,
        totalQuantity: stats.totalQuantity,
        totalValue: stats.totalValue,
        lowStockCount: itemsByStatus.lowStock.length,
        outOfStockCount: itemsByStatus.outOfStock.length,
        inStockCount: itemsByStatus.inStock.length,
        overstockCount: itemsByStatus.overstock.length,
      },
      itemsByStatus,
      capacityInfo: {
        total: mobileStock.capacity,
        used: stats.totalQuantity,
        available: Math.max(0, mobileStock.capacity - stats.totalQuantity),
        percentage:
          mobileStock.capacity > 0
            ? Math.round((stats.totalQuantity / mobileStock.capacity) * 100)
            : 0,
      },
    },
  };

  return result;
};

export const updateMobileStockService = asyncHandler(async (id, body) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`🛑 Invalid mobile stock ID: ${id}`, 400);
  }

  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    await logger.error("Mobile stock not found for update", { id });
    throw new ApiError(`🛑 Mobile stock not found with ID: ${id}`, 404);
  }

  // Handle capacity updates carefully
  if (body.capacity !== undefined) {
    const currentStock = await mongoose.model("Stock").aggregate([
      {
        $match: {
          mobileStockId: new mongoose.Types.ObjectId(id),
          quantity: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const currentUsage = currentStock[0]?.totalQuantity || 0;

    if (body.capacity < currentUsage) {
      await logger.error("Cannot reduce capacity below current usage", {
        id,
        currentUsage,
        newCapacity: body.capacity,
      });
      throw new ApiError(
        `🛑 Cannot reduce capacity below current usage (${currentUsage} units)`,
        400,
      );
    }
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`🛑 Invalid mobile stock ID: ${id}`, 400);
  }

  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    await logger.error("Mobile stock not found for deletion", { id });
    throw new ApiError(`🛑 Mobile stock not found with ID: ${id}`, 404);
  }

  // Check if mobile stock has any stock items
  const hasStockItems = await mongoose.model("Stock").exists({
    mobileStockId: id,
    quantity: { $gt: 0 },
  });

  if (hasStockItems) {
    await logger.error("Cannot delete mobile stock with existing inventory", {
      id,
      name: mobileStock.name,
    });
    throw new ApiError(
      "🛑 Cannot delete mobile stock that contains inventory. Please transfer or clear stock first.",
      400,
    );
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
      400,
    );
  }

  await mobileStockModel.findByIdAndDelete(id);

  await logger.info("Mobile stock deleted", {
    id,
    name: mobileStock.name,
  });

  return sanitizeMobileStock(mobileStock);
});

export const checkAndRepairMobileStockData = asyncHandler(
  async (mobileStockId) => {
    if (!mongoose.Types.ObjectId.isValid(mobileStockId)) {
      throw new ApiError(`🛑 Invalid mobile stock ID: ${mobileStockId}`, 400);
    }

    const invalidStocks = await mongoose.model("Stock").find({
      mobileStockId: mobileStockId,
      $or: [
        { productId: null },
        { productId: { $exists: false } },
        { productId: { $type: "null" } },
      ],
    });

    if (invalidStocks.length === 0) {
      return {
        status: "ok",
        message: "No invalid stock records found",
        invalidCount: 0,
      };
    }

    const repairResults = {
      fixed: 0,
      deleted: 0,
      failed: 0,
    };

    for (const stock of invalidStocks) {
      try {
        if (stock.quantity === 0) {
          await stock.deleteOne();
          repairResults.deleted++;
          continue;
        }

        const anyProduct = await mongoose.model("Product").findOne({});

        if (anyProduct) {
          stock.productId = anyProduct._id;
          stock.transactions.push({
            type: "adjustment",
            quantity: stock.quantity,
            notes: "Auto-fixed: Assigned product reference",
            performedBy: "system-repair",
            date: new Date(),
          });
          await stock.save({ validateBeforeSave: false });
          repairResults.fixed++;
        } else {
          await stock.deleteOne();
          repairResults.deleted++;
        }
      } catch (error) {
        await logger.error(`Failed to repair stock ${stock._id}`, {
          error: error.message,
        });
        repairResults.failed++;
      }
    }

    await logger.info("Mobile stock data repair completed", {
      mobileStockId,
      ...repairResults,
    });

    return {
      status: "completed",
      message: "Data repair completed",
      ...repairResults,
    };
  },
);

export const fixMobileStockProductReferences = asyncHandler(
  async (mobileStockId) => {
    if (!mongoose.Types.ObjectId.isValid(mobileStockId)) {
      throw new ApiError(`🛑 Invalid mobile stock ID: ${mobileStockId}`, 400);
    }

    const mobileStock = await mobileStockModel.findById(mobileStockId);
    if (!mobileStock) {
      throw new ApiError(
        `🛑 Mobile stock not found with ID: ${mobileStockId}`,
        404,
      );
    }

    const stocks = await mongoose
      .model("Stock")
      .find({ mobileStockId: mobileStockId });

    const results = {
      total: stocks.length,
      fixed: 0,
      deleted: 0,
      failed: 0,
      details: [],
    };

    for (const stock of stocks) {
      try {
        if (
          !stock.productId ||
          !mongoose.Types.ObjectId.isValid(stock.productId)
        ) {
          results.details.push({
            stockId: stock._id,
            productId: stock.productId,
            status: "INVALID_PRODUCT_ID",
            action: "delete",
          });

          if (stock.quantity === 0) {
            await stock.deleteOne();
            results.deleted++;
          }
          continue;
        }

        const product = await mongoose
          .model("Product")
          .findById(stock.productId);

        if (!product) {
          const alternativeProduct = await mongoose.model("Product").findOne({
            isActive: true,
          });

          if (alternativeProduct) {
            const oldProductId = stock.productId;
            stock.productId = alternativeProduct._id;
            stock.transactions.push({
              type: "adjustment",
              quantity: stock.quantity,
              notes: `Product reference changed from ${oldProductId} to ${alternativeProduct._id}`,
              performedBy: "system-fix",
              date: new Date(),
            });

            await stock.save({ validateBeforeSave: false });

            results.details.push({
              stockId: stock._id,
              oldProductId: oldProductId,
              newProductId: alternativeProduct._id,
              productName: alternativeProduct.name,
              status: "FIXED_REPLACED_PRODUCT",
              action: "updated",
            });

            results.fixed++;
          } else {
            results.details.push({
              stockId: stock._id,
              productId: stock.productId,
              status: "NO_ALTERNATIVE_PRODUCT",
              action: "none",
            });
            results.failed++;
          }
        } else {
          results.details.push({
            stockId: stock._id,
            productId: stock.productId,
            productName: product.name,
            status: "PRODUCT_EXISTS",
            action: "none",
          });
        }
      } catch (error) {
        results.details.push({
          stockId: stock._id,
          error: error.message,
          status: "ERROR",
          action: "none",
        });
        results.failed++;
      }
    }

    await logger.info("Fixed mobile stock product references", {
      mobileStockId,
      ...results,
    });

    return {
      status: "completed",
      message: "Product reference fix completed",
      mobileStock: {
        id: mobileStock._id,
        name: mobileStock.name,
      },
      ...results,
    };
  },
);

export const getMobileStockInventoryService = asyncHandler(async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`🛑 Invalid mobile stock ID: ${id}`, 400);
  }

  const mobileStock = await mobileStockModel.findById(id);
  if (!mobileStock) {
    throw new ApiError(`🛑 No mobile stock found with ID: ${id}`, 404);
  }

  const inventoryAggregate = await mongoose.model("Stock").aggregate([
    {
      $match: {
        mobileStockId: new mongoose.Types.ObjectId(id),
        quantity: { $gt: 0 },
      },
    },
    {
      $lookup: {
        from: "products",
        let: { pid: "$productId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$pid"],
              },
            },
          },
          {
            $project: {
              name: 1,
              code: 1,
              category: 1,
              wholesalePrice: 1,
              retailPrice: 1,
              barcode: 1,
              unit: 1,
            },
          },
        ],
        as: "productDetails",
      },
    },
    {
      $addFields: {
        product: {
          $cond: {
            if: { $gt: [{ $size: "$productDetails" }, 0] },
            then: { $arrayElemAt: ["$productDetails", 0] },
            else: null,
          },
        },
      },
    },
    {
      $project: {
        quantity: 1,
        status: 1,
        minQuantity: 1,
        maxQuantity: 1,
        transactions: 1,
        updatedAt: 1,
        product: {
          $cond: {
            if: { $ne: ["$product", null] },
            then: {
              id: "$product._id",
              name: "$product.name",
              code: "$product.code",
              category: "$product.category",
              wholesalePrice: "$product.wholesalePrice",
              retailPrice: "$product.retailPrice",
              barcode: "$product.barcode",
              unit: "$product.unit",
            },
            else: null,
          },
        },
      },
    },
    {
      $sort: { "product.name": 1 },
    },
  ]);

  const itemsWithProduct = inventoryAggregate.filter(
    (item) => item.product !== null,
  );

  const result = {
    mobileStock: {
      id: mobileStock._id,
      name: mobileStock.name,
      capacity: mobileStock.capacity,
      representative: mobileStock.representative,
    },
    inventory: itemsWithProduct.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      status: item.status,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      lastUpdated: item.updatedAt,
      transactions: Array.isArray(item.transactions)
        ? item.transactions.slice(-5)
        : [],
    })),
    summary: {
      totalItems: itemsWithProduct.length,
      totalQuantity: itemsWithProduct.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      totalValue: itemsWithProduct.reduce((sum, item) => {
        return sum + item.quantity * (item.product.wholesalePrice || 0);
      }, 0),
    },
  };

  return result;
});
