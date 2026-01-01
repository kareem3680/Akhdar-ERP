import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
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

export const createTripService = asyncHandler(async (body) => {
  const trip = await createService(tripModel, body);

  await logger.info("Trip created successfully", {
    tripId: trip._id,
    tripNumber: trip.tripNumber,
    representative: trip.representative,
    driver: trip.driver,
    location: trip.location,
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
          select: "name capacity",
          populate: {
            path: "representative",
            select: "name phone",
          },
        },
      ],
    }
  );

  await logger.info("Fetched all trips", {
    count: result.results,
    statusFilter: req.query.status,
  });

  return {
    data: result.data.map(sanitizeTrip),
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
        select: "name capacity goods",
        populate: [
          {
            path: "representative",
            select: "name phone email",
          },
          {
            path: "goods.stock",
            select: "name quantity code",
            populate: {
              path: "productId",
              select: "name code",
            },
          },
        ],
      },
    ],
  });

  await logger.info("Fetched trip details", {
    id,
    tripNumber: trip.tripNumber,
    status: trip.status,
  });

  return sanitizeTrip(trip);
});

export const updateTripService = asyncHandler(async (id, body) => {
  const trip = await updateService(tripModel, id, body);

  await logger.info("Trip updated", {
    id,
    updatedFields: Object.keys(body),
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
      400
    );
  }

  await tripModel.findByIdAndDelete(id);

  await logger.info("Trip deleted", {
    id,
    tripNumber: trip.tripNumber,
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
  if (expenseses !== undefined) {
    trip.expenseses = expenseses;
  }

  await trip.save({ validateBeforeSave: false });

  await logger.info("Trip completed", {
    id,
    tripNumber: trip.tripNumber,
    status: trip.status,
    expenseses: trip.expenseses,
    sales: trip.sales,
  });

  return sanitizeTrip(trip);
});
