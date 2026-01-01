import asyncHandler from "express-async-handler";
import {
  createRepresentativeService,
  getRepresentativesService,
  getRepresentativeService,
  updateRepresentativeService,
  deleteRepresentativeService,
  getRepresentativeStatsService,
} from "../services/representativeService.js";

export const createRepresentative = asyncHandler(async (req, res) => {
  const data = await createRepresentativeService(req.body);
  res.status(201).json({
    message: "Representative created successfully",
    data,
  });
});

export const getRepresentatives = asyncHandler(async (req, res) => {
  const response = await getRepresentativesService(req);
  res.status(200).json({
    message: "Representatives fetched successfully",
    ...response,
  });
});

export const getRepresentative = asyncHandler(async (req, res) => {
  const data = await getRepresentativeService(req.params.id);
  res.status(200).json({
    message: "Representative retrieved successfully",
    data,
  });
});

export const updateRepresentative = asyncHandler(async (req, res) => {
  const data = await updateRepresentativeService(req.params.id, req.body);
  res.status(200).json({
    message: "Representative updated successfully",
    data,
  });
});

export const deleteRepresentative = asyncHandler(async (req, res) => {
  await deleteRepresentativeService(req.params.id);
  res.status(204).json({
    message: "Representative deleted successfully",
  });
});

export const getRepresentativeStats = asyncHandler(async (req, res) => {
  const data = await getRepresentativeStatsService();
  res.status(200).json({
    message: "Representative statistics fetched successfully",
    data,
  });
});
