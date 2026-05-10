import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import mongoose from "mongoose";
import Logger from "../../../utils/loggerService.js";
import tripModel from "../models/tripModel.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import { sanitizeTrip } from "../../../utils/sanitizeData.js";

const logger = new Logger("trip");

const getTransferredProductsForCar = async (carId) => {
  try {
    const stocks = await mongoose.model("Stock").aggregate([
      {
        $match: {
          mobileStockId: new mongoose.Types.ObjectId(carId),
          quantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "products",
          let: { productId: "$productId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$productId"] },
              },
            },
            {
              $project: {
                name: 1,
                code: 1,
                category: 1,
                brand: 1,
                description: 1,
                wholesalePrice: 1,
                retailPrice: 1,
                costPrice: 1,
                barcode: 1,
                unit: 1,
                taxRate: 1,
                weight: 1,
              },
            },
          ],
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "stocktransactions",
          let: { stockId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$stockId", "$$stockId"] },
                referenceType: "transfer",
              },
            },
            {
              $sort: { date: -1 },
            },
            {
              $limit: 5,
            },
          ],
          as: "transferTransactions",
        },
      },
      {
        $project: {
          _id: 1,
          quantity: 1,
          status: 1,
          minQuantity: 1,
          maxQuantity: 1,
          updatedAt: 1,
          createdAt: 1,
          product: {
            $cond: {
              if: { $ne: ["$productDetails", null] },
              then: {
                id: "$productDetails._id",
                name: "$productDetails.name",
                code: "$productDetails.code",
                category: "$productDetails.category",
                brand: "$productDetails.brand",
                description: "$productDetails.description",
                wholesalePrice: "$productDetails.wholesalePrice",
                retailPrice: "$productDetails.retailPrice",
                costPrice: "$productDetails.costPrice",
                barcode: "$productDetails.barcode",
                unit: "$productDetails.unit",
                taxRate: "$productDetails.taxRate",
                weight: "$productDetails.weight",
              },
              else: null,
            },
          },
          transferHistory: "$transferTransactions",
        },
      },
      {
        $match: {
          product: { $ne: null },
        },
      },
      {
        $sort: { "product.name": 1 },
      },
    ]);

    return stocks.map((item) => ({
      stockId: item._id,
      product: item.product,
      quantity: item.quantity,
      status: item.status,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      lastUpdated: item.updatedAt,
      addedAt: item.createdAt,
      transferHistory: item.transferHistory || [],
    }));
  } catch (error) {
    console.error("Error fetching transferred products:", error);
    return [];
  }
};

const calculateInventoryStats = (products) => {
  if (!products || products.length === 0) {
    return {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      totalRetailValue: 0,
      totalCostValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inStockCount: 0,
      overstockCount: 0,
    };
  }

  const stats = {
    totalItems: products.length,
    totalQuantity: products.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    ),
    totalValue: products.reduce((sum, item) => {
      const price = item.product?.wholesalePrice || 0;
      return sum + (item.quantity || 0) * price;
    }, 0),
    totalRetailValue: products.reduce((sum, item) => {
      const price = item.product?.retailPrice || 0;
      return sum + (item.quantity || 0) * price;
    }, 0),
    totalCostValue: products.reduce((sum, item) => {
      const price = item.product?.costPrice || 0;
      return sum + (item.quantity || 0) * price;
    }, 0),
    lowStockCount: products.filter((item) => item.status === "low-stock")
      .length,
    outOfStockCount: products.filter((item) => item.status === "out-of-stock")
      .length,
    inStockCount: products.filter((item) => item.status === "in-stock").length,
    overstockCount: products.filter((item) => item.status === "overstock")
      .length,
  };

  return stats;
};

export const createTripService = asyncHandler(async (body) => {
  if (body.products && body.products.length > 0) {
    body.loadedAt = new Date();

    body.products = body.products.map((product) => ({
      ...product,
      status: product.status || "pending",
      returnedQuantity: product.returnedQuantity || 0,
      total: (product.quantity || 0) * (product.price || 0),
    }));

    body.totalProductsValue = body.products.reduce((total, product) => {
      return total + (product.total || 0);
    }, 0);
  }

  const trip = await createService(tripModel, body);

  await logger.info("Trip created successfully", {
    tripId: trip._id,
    tripNumber: trip.tripNumber,
    representative: trip.representative,
    driver: trip.driver,
    location: trip.location,
    productsCount: trip.products?.length || 0,
    totalProductsValue: trip.totalProductsValue || 0,
  });

  return sanitizeTrip(trip);
});

export const getTripsService = asyncHandler(async (req) => {
  const result = await getAllService(
    tripModel,
    req.query,
    "trip",
    {},
    {
      populate: [
        {
          path: "representative",
          select: "name region phone email",
          populate: {
            path: "organizations.organization_id",
            select: "name code",
          },
        },
        {
          path: "car",
          select: "name capacity brand year",
          populate: [
            {
              path: "representative",
              select: "name phone",
            },
          ],
        },
        {
          path: "products.product",
          select: "name code category brand",
        },
      ],
    },
  );

  let tripsArray = [];

  if (Array.isArray(result.data)) {
    tripsArray = result.data;
  } else if (result.data) {
    tripsArray = [result.data];
  } else if (result.docs) {
    tripsArray = result.docs;
  } else if (result) {
    tripsArray = [result];
  }

  const tripsWithCarInventory = await Promise.all(
    tripsArray.map(async (trip) => {
      try {
        let tripData;
        if (typeof trip === "object" && trip !== null) {
          if (trip.toObject && typeof trip.toObject === "function") {
            tripData = trip.toObject();
          } else {
            tripData = trip;
          }
        } else {
          return trip;
        }

        if (tripData.products && tripData.products.length > 0) {
          tripData.productsStats = {
            totalItems: tripData.products.length,
            totalQuantity: tripData.products.reduce(
              (sum, p) => sum + (p.quantity || 0),
              0,
            ),
            totalValue: tripData.products.reduce(
              (sum, p) => sum + (p.total || 0),
              0,
            ),
            soldItems: tripData.products.filter((p) => p.status === "sold")
              .length,
            returnedItems: tripData.products.filter(
              (p) => p.status === "returned",
            ).length,
            pendingItems: tripData.products.filter(
              (p) => p.status === "pending",
            ).length,
            loadedItems: tripData.products.filter((p) => p.status === "loaded")
              .length,
          };
        }

        if (tripData.car && tripData.car._id) {
          const transferredProducts = await getTransferredProductsForCar(
            tripData.car._id,
          );

          const stats = calculateInventoryStats(transferredProducts);

          const usedQuantity = stats.totalQuantity || 0;
          const availableCapacity = tripData.car.capacity - usedQuantity;
          const percentage =
            tripData.car.capacity > 0
              ? Math.round((usedQuantity / tripData.car.capacity) * 100)
              : 0;

          tripData.car = {
            ...tripData.car,
            inventorySummary: {
              totalItems: stats.totalItems,
              totalQuantity: stats.totalQuantity,
              totalValue: stats.totalValue,
              totalRetailValue: stats.totalRetailValue,
              lowStockCount: stats.lowStockCount,
              outOfStockCount: stats.outOfStockCount,
              inStockCount: stats.inStockCount,
              overstockCount: stats.overstockCount,
            },
            inventory: {
              transferredProducts: transferredProducts,
              statistics: stats,
            },
            capacityUsage: {
              total: tripData.car.capacity,
              used: usedQuantity,
              available: Math.max(0, availableCapacity),
              percentage: Math.min(100, Math.max(0, percentage)),
            },
          };
        }

        return tripData;
      } catch (error) {
        await logger.error(`Error processing trip car inventory`, {
          error: error.message,
          tripId: trip?._id || trip?.id,
          stack: error.stack,
        });

        return trip;
      }
    }),
  );

  await logger.info("Fetched all trips with car inventory", {
    count: tripsWithCarInventory.length,
    statusFilter: req.query.status,
  });

  return {
    data: tripsWithCarInventory.map(sanitizeTrip),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getTripService = asyncHandler(async (id) => {
  const trip = await getSpecificService(tripModel, id, {
    populate: [
      {
        path: "representative",
        select: "name region phone email position",
        populate: {
          path: "organizations.organization_id",
          select: "name code address",
        },
      },
      {
        path: "car",
        select: "name capacity brand year",
        populate: {
          path: "representative",
          select: "name phone email",
        },
      },
      {
        path: "products.product",
        select:
          "name code category brand description wholesalePrice retailPrice costPrice barcode unit taxRate weight images",
      },
    ],
  });

  if (trip.products && trip.products.length > 0) {
    trip.productsStats = {
      totalItems: trip.products.length,
      totalQuantity: trip.products.reduce(
        (sum, p) => sum + (p.quantity || 0),
        0,
      ),
      totalValue: trip.products.reduce((sum, p) => sum + (p.total || 0), 0),
      soldItems: trip.products.filter((p) => p.status === "sold").length,
      returnedItems: trip.products.filter((p) => p.status === "returned")
        .length,
      pendingItems: trip.products.filter((p) => p.status === "pending").length,
      loadedItems: trip.products.filter((p) => p.status === "loaded").length,
    };
  }

  if (trip.car && trip.car._id) {
    try {
      const transferredProducts = await getTransferredProductsForCar(
        trip.car._id,
      );

      const stats = calculateInventoryStats(transferredProducts);

      const itemsByStatus = {
        inStock: transferredProducts.filter(
          (item) => item.status === "in-stock",
        ),
        lowStock: transferredProducts.filter(
          (item) => item.status === "low-stock",
        ),
        outOfStock: transferredProducts.filter(
          (item) => item.status === "out-of-stock",
        ),
        overstock: transferredProducts.filter(
          (item) => item.status === "overstock",
        ),
      };

      const categoryStats = {};
      transferredProducts.forEach((item) => {
        const category = item.product?.category || "Uncategorized";
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            totalQuantity: 0,
            totalValue: 0,
          };
        }
        categoryStats[category].count++;
        categoryStats[category].totalQuantity += item.quantity;
        categoryStats[category].totalValue +=
          item.quantity * (item.product?.wholesalePrice || 0);
      });

      const usedQuantity = stats.totalQuantity || 0;
      const availableCapacity = Math.max(0, trip.car.capacity - usedQuantity);
      const capacityPercentage =
        trip.car.capacity > 0
          ? Math.min(
              100,
              Math.max(0, Math.round((usedQuantity / trip.car.capacity) * 100)),
            )
          : 0;

      trip.car = trip.car.toObject ? trip.car.toObject() : trip.car;

      trip.car.inventory = {
        transferredProducts: transferredProducts,
        itemsByStatus: itemsByStatus,
        categoryStats: categoryStats,
        statistics: stats,
      };

      trip.car.capacityInfo = {
        total: trip.car.capacity,
        used: usedQuantity,
        available: availableCapacity,
        percentage: capacityPercentage,
      };
    } catch (error) {
      await logger.warn("Error adding car inventory data to trip", {
        id,
        carId: trip.car._id,
        error: error.message,
        stack: error.stack,
      });

      trip.car = trip.car.toObject ? trip.car.toObject() : trip.car;

      trip.car.inventory = {
        transferredProducts: [],
        itemsByStatus: {},
        categoryStats: {},
        statistics: {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          totalRetailValue: 0,
          totalCostValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          inStockCount: 0,
          overstockCount: 0,
        },
      };

      trip.car.capacityInfo = {
        total: trip.car.capacity,
        used: 0,
        available: trip.car.capacity,
        percentage: 0,
      };
    }
  }

  await logger.info("Fetched trip details with car inventory", {
    id,
    tripNumber: trip.tripNumber,
    status: trip.status,
    hasCarInventory: trip.car?.inventory ? true : false,
    tripProductsCount: trip.products?.length || 0,
    transferredProductsCount:
      trip.car?.inventory?.transferredProducts?.length || 0,
  });

  return sanitizeTrip(trip);
});

export const updateTripService = asyncHandler(async (id, body) => {
  if (body.products && Array.isArray(body.products)) {
    body.products = body.products.map((product) => ({
      ...product,
      total: (product.quantity || 0) * (product.price || 0),
    }));

    body.totalProductsValue = body.products.reduce((total, product) => {
      return total + (product.total || 0);
    }, 0);
  }

  const trip = await updateService(tripModel, id, body);

  await logger.info("Trip updated", {
    id,
    updatedFields: Object.keys(body),
    productsUpdated: body.products ? body.products.length : 0,
  });

  return sanitizeTrip(trip);
});

export const deleteTripService = asyncHandler(async (id) => {
  const trip = await tripModel.findById(id);
  if (!trip) {
    await logger.error("Trip not found for deletion", { id });
    throw new ApiError(`🛑 No trip found with ID: ${id}`, 404);
  }

  // Check if trip has sales orders
  const salesOrders = await mongoose.model("SaleOrderInTrip").find({
    trip: id,
  });

  if (salesOrders.length > 0) {
    await logger.error("Cannot delete trip with associated sales orders", {
      id,
      salesOrdersCount: salesOrders.length,
    });
    throw new ApiError(
      "🛑 Cannot delete trip with associated sales orders",
      400,
    );
  }

  await tripModel.findByIdAndDelete(id);

  await logger.info("Trip deleted", {
    id,
    tripNumber: trip.tripNumber,
    productsCount: trip.products?.length || 0,
  });

  return sanitizeTrip(trip);
});

export const completeTripService = asyncHandler(async (id, expenseses) => {
  const trip = await tripModel.findById(id);
  if (!trip) {
    await logger.error("Trip not found for completion", { id });
    throw new ApiError(`🛑 No trip found with ID: ${id}`, 404);
  }

  if (trip.status === "completed") {
    await logger.error("Trip already completed", { id });
    throw new ApiError("🛑 Trip is already completed", 400);
  }

  trip.status = "completed";
  trip.completedAt = new Date();

  if (expenseses !== undefined) {
    trip.expenseses = expenseses;
  }

  if (trip.products && trip.products.length > 0) {
    trip.products = trip.products.map((product) => {
      if (product.status === "pending" || product.status === "loaded") {
        return {
          ...product,
          status: "sold",
        };
      }
      return product;
    });
  }

  await trip.save({ validateBeforeSave: false });

  await logger.info("Trip completed", {
    id,
    tripNumber: trip.tripNumber,
    status: trip.status,
    expenseses: trip.expenseses,
    sales: trip.sales,
    productsCount: trip.products?.length || 0,
    totalProductsValue: trip.totalProductsValue || 0,
  });

  return sanitizeTrip(trip);
});
