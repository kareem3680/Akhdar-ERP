import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import saleOrderInTripModel from "../models/saleOrderInTripModel.js";
import tripModel from "../../accounting/models/tripModel.js";
import {
  getAllService,
  getSpecificService,
  createService,
} from "../../../utils/servicesHandler.js";
import { sanitizeSaleOrderInTrip } from "../../../utils/sanitizeData.js";

const logger = new Logger("sale-order-trip");

export const createSaleOrderInTripService = asyncHandler(
  async (tripId, body) => {
    const { customer, orderDate, goods } = body;

    // Check if trip exists and is completed
    const trip = await tripModel.findOne({
      _id: tripId,
      status: "completed",
    });

    if (!trip) {
      await logger.error("Trip not found or not completed", { tripId });
      throw new ApiError("🛑 No completed trip found", 404);
    }

    // Validate each product
    for (let product of goods) {
      if (!product.product || !product.unit || !product.wholesalePrice) {
        await logger.error("Invalid product data", { product });
        throw new ApiError("🛑 Product data is incomplete", 400);
      }
    }

    // Calculate product totals
    const products = goods.map((product) => {
      const discountAmount = product.discount
        ? (product.discount / 100) * (product.wholesalePrice * product.unit)
        : 0;
      const total = product.wholesalePrice * product.unit - discountAmount;

      return {
        product: product.product,
        code: product.code || `PROD-${Date.now()}`,
        unit: product.unit,
        wholesalePrice: product.wholesalePrice,
        discount: product.discount || 0,
        total,
      };
    });

    // Calculate total sales
    const totalSales = products.reduce((acc, cur) => acc + cur.total, 0);

    // Update trip sales
    trip.sales = (trip.sales || 0) + totalSales;
    await trip.save({ validateBeforeSave: false });

    // Create sale order
    const saleOrderInTrip = await createService(saleOrderInTripModel, {
      customer,
      orderDate: orderDate || new Date(),
      goods: products,
      total: totalSales,
    });

    await logger.info("Sale order added to trip", {
      saleOrderId: saleOrderInTrip._id,
      tripId,
      totalSales,
      customer,
      productsCount: goods.length,
    });

    return sanitizeSaleOrderInTrip(saleOrderInTrip);
  }
);

export const getSaleOrdersInTripService = asyncHandler(async (req) => {
  const result = await getAllService(
    saleOrderInTripModel,
    req.query,
    "sale-order-trip",
    {},
    {
      populate: [
        {
          path: "customer",
          select: "name email phone address",
          populate: {
            path: "organization",
            select: "name code",
          },
        },
        {
          path: "goods.product",
          select: "name code wholesalePrice description category",
          populate: {
            path: "supplier",
            select: "name contact",
          },
        },
      ],
    }
  );

  await logger.info("Fetched all sale orders in trips", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeSaleOrderInTrip),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSaleOrderInTripService = asyncHandler(async (id) => {
  const saleOrder = await getSpecificService(saleOrderInTripModel, id, {
    populate: [
      {
        path: "customer",
        select: "name email phone address taxNumber",
        populate: {
          path: "organization",
          select: "name code address phone",
        },
      },
      {
        path: "goods.product",
        select: "name code wholesalePrice description category unit",
        populate: [
          {
            path: "supplier",
            select: "name contact address",
          },
          {
            path: "brand",
            select: "name logo",
          },
        ],
      },
    ],
  });

  await logger.info("Fetched sale order details", {
    id,
    orderNumber: saleOrder.orderNumber,
  });

  return sanitizeSaleOrderInTrip(saleOrder);
});
