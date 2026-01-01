import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import representativeModel from "../models/representativeModel.js";
import userModel from "../../identity/models/userModel.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import { sanitizeRepresentative } from "../../../utils/sanitizeData.js";

const logger = new Logger("representative");

export const createRepresentativeService = asyncHandler(async (body) => {
  const { user, region, territory, supervisor, commissionRate = 0 } = body;

  // Check if user exists
  const userExists = await userModel.findById(user);
  if (!userExists) {
    await logger.error("User not found", { userId: user });
    throw new ApiError("🛑 User not found", 404);
  }

  // Check if user already has representative profile
  const existingRepresentative = await representativeModel.findOne({ user });
  if (existingRepresentative) {
    await logger.error("User already has representative profile", {
      userId: user,
    });
    throw new ApiError("🛑 User already has a representative profile", 400);
  }

  // Check if supervisor exists if provided
  if (supervisor) {
    const supervisorExists = await userModel.findById(supervisor);
    if (!supervisorExists) {
      await logger.error("Supervisor not found", { supervisorId: supervisor });
      throw new ApiError("🛑 Supervisor not found", 404);
    }
  }

  // Create representative
  const representative = await createService(representativeModel, {
    user,
    region,
    territory,
    supervisor,
    commissionRate,
    targetSales: body.targetSales || 0,
    currentSales: body.currentSales || 0,
    active: body.active !== undefined ? body.active : true,
  });

  await logger.info("Representative created successfully", {
    representativeId: representative._id,
    userId: user,
    region,
    territory,
  });

  return sanitizeRepresentative(representative);
});

export const getRepresentativesService = asyncHandler(async (req) => {
  const result = await getAllService(
    representativeModel,
    req.query,
    "representative",
    {},
    {
      populate: [
        {
          path: "user",
          select: "name email phone role position",
        },
        {
          path: "supervisor",
          select: "name email phone",
        },
      ],
    }
  );

  await logger.info("Fetched all representatives", {
    count: result.results,
    page: result.paginationResult?.currentPage || 1,
  });

  return {
    data: result.data.map(sanitizeRepresentative),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getRepresentativeService = asyncHandler(async (id) => {
  const representative = await getSpecificService(representativeModel, id, {
    populate: [
      {
        path: "user",
        select: "name email phone role position jobId hireDate",
      },
      {
        path: "supervisor",
        select: "name email phone position",
      },
    ],
  });

  await logger.info("Fetched representative details", { id });
  return sanitizeRepresentative(representative);
});

export const updateRepresentativeService = asyncHandler(async (id, body) => {
  const representative = await updateService(representativeModel, id, body);

  await logger.info("Representative updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizeRepresentative(representative);
});

export const deleteRepresentativeService = asyncHandler(async (id) => {
  await deleteService(representativeModel, id);

  await logger.info("Representative deleted", { id });
  return;
});

export const getRepresentativeStatsService = asyncHandler(async () => {
  const stats = await representativeModel.aggregate([
    {
      $group: {
        _id: null,
        totalRepresentatives: { $sum: 1 },
        activeRepresentatives: {
          $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] },
        },
        totalTargetSales: { $sum: "$targetSales" },
        totalCurrentSales: { $sum: "$currentSales" },
        avgCommissionRate: { $avg: "$commissionRate" },
      },
    },
  ]);

  await logger.info("Fetched representative statistics");

  return (
    stats[0] || {
      totalRepresentatives: 0,
      activeRepresentatives: 0,
      totalTargetSales: 0,
      totalCurrentSales: 0,
      avgCommissionRate: 0,
    }
  );
});
