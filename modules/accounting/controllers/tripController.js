import asyncHandler from "express-async-handler";
import {
  createTripService,
  getTripsService,
  getTripService,
  updateTripService,
  deleteTripService,
  completeTripService,
} from "../services/tripService.js";

export const createTrip = asyncHandler(async (req, res) => {
  const data = await createTripService(req.body);
  res.status(201).json({
    message: "Trip created successfully",
    data,
  });
});

export const getTrips = asyncHandler(async (req, res) => {
  const response = await getTripsService(req);
  res.status(200).json({
    message: "Trips fetched successfully",
    ...response,
  });
});

export const getTrip = asyncHandler(async (req, res) => {
  const data = await getTripService(req.params.id);
  res.status(200).json({
    message: "Trip retrieved successfully",
    data,
  });
});

export const updateTrip = asyncHandler(async (req, res) => {
  const data = await updateTripService(req.params.id, req.body);
  res.status(200).json({
    message: "Trip updated successfully",
    data,
  });
});

export const deleteTrip = asyncHandler(async (req, res) => {
  await deleteTripService(req.params.id);
  res.status(204).json({
    message: "Trip deleted successfully",
  });
});

export const completeTrip = asyncHandler(async (req, res) => {
  const data = await completeTripService(req.params.id, req.body.expenseses);
  res.status(200).json({
    message: "Trip completed successfully",
    data,
  });
});
