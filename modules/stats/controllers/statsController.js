import asyncHandler from "express-async-handler";
import {
  getStatsService,
  getStatsHistoryService,
} from "../services/statsService.js";

export const getStats = asyncHandler(async (req, res) => {
  const data = await getStatsService(req);

  res.status(200).json({
    message: "Statistics retrieved successfully",
    data,
  });
});

export const getStatsHistory = asyncHandler(async (req, res) => {
  const response = await getStatsHistoryService(req);

  res.status(200).json({
    message: "Statistics history retrieved successfully",
    ...response,
  });
});
