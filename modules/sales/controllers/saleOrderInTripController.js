import asyncHandler from "express-async-handler";
import {
  createSaleOrderInTripService,
  getSaleOrdersInTripService,
  getSaleOrderInTripService,
} from "../services/saleOrderInTripService.js";

export const createSaleOrderInTrip = asyncHandler(async (req, res) => {
  const data = await createSaleOrderInTripService(req.params.tripId, req.body);
  res.status(201).json({
    message: "Sale order added to trip successfully",
    data,
  });
});

export const getSaleOrdersInTrip = asyncHandler(async (req, res) => {
  const response = await getSaleOrdersInTripService(req);
  res.status(200).json({
    message: "Sale orders in trips fetched successfully",
    ...response,
  });
});

export const getSaleOrderInTrip = asyncHandler(async (req, res) => {
  const data = await getSaleOrderInTripService(req.params.id);
  res.status(200).json({
    message: "Sale order in trip retrieved successfully",
    data,
  });
});
