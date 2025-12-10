import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Organization from "../models/organizationModel.js";
import Customer from "../../customer/models/customerModel.js";
import { sanitizeOrganization } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("organization");

// ========================
// Create New Organization
// ========================
export const createOrganizationService = asyncHandler(async (body) => {
  const { email, userId } = body;

  // Check if email already exists
  const existingOrganization = await Organization.findOne({ email });
  if (existingOrganization) {
    await logger.error("Organization creation failed - email already exists", {
      email,
    });
    throw new ApiError("Email already exists", 400);
  }

  // Check if user exists
  const user = await mongoose.model("User").findById(userId);
  if (!user) {
    await logger.error("Organization creation failed - user not found", {
      userId,
    });
    throw new ApiError("User not found", 404);
  }

  // Create organization
  const newOrganization = await createService(Organization, body);

  await logger.info("Organization created", {
    organizationId: newOrganization._id,
    tradeName: newOrganization.tradeName,
    userId,
  });

  return sanitizeOrganization(newOrganization);
});

// ========================
// Get All Organizations
// ========================
export const getOrganizationsService = asyncHandler(async (req) => {
  // Filter by user if provided
  const filter = {};
  if (req.user && req.user.role !== "admin") {
    // Non-admin users can only see their organizations
    filter.userId = req.user._id;
  }

  const result = await getAllService(
    Organization,
    req.query,
    "organization",
    filter,
    {
      populate: [
        { path: "userId", select: "name email role" },
        { path: "activeCustomers", select: "name email phone status" },
      ],
    }
  );

  await logger.info("Fetched all organizations", {
    count: result.results,
    userId: req.user?._id,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeOrganization),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Organization
// ========================
export const getSpecificOrganizationService = asyncHandler(async (id, req) => {
  const organization = await getSpecificService(Organization, id, {
    populate: [
      { path: "userId", select: "name email role" },
      {
        path: "customers",
        select: "name email phone currency status isDeleted",
        match: { isDeleted: false },
      },
    ],
  });

  if (!organization) {
    throw new ApiError("Organization not found", 404);
  }

  // Check authorization (non-admin users can only access their organizations)
  if (
    req.user &&
    req.user.role !== "admin" &&
    organization.userId._id.toString() !== req.user._id.toString()
  ) {
    await logger.error("Unauthorized access to organization", {
      userId: req.user._id,
      organizationId: id,
    });
    throw new ApiError("Unauthorized to access this organization", 403);
  }

  // Filter out deleted customers manually (as a backup)
  const activeCustomers = organization.customers.filter(
    (customer) => !customer.isDeleted
  );

  const sanitizedOrganization = sanitizeOrganization(organization);
  sanitizedOrganization.customers = activeCustomers;

  await logger.info("Fetched organization", {
    id,
    customerCount: activeCustomers.length,
  });

  return sanitizedOrganization;
});

// ========================
// Update Organization
// ========================
export const updateOrganizationService = asyncHandler(async (id, body, req) => {
  const { email } = body;

  // Check if new email already exists
  if (email) {
    const existingOrganization = await Organization.findOne({
      email,
      _id: { $ne: id },
    });
    if (existingOrganization) {
      await logger.error("Organization update failed - email already exists", {
        email,
        id,
      });
      throw new ApiError("Email already exists", 400);
    }
  }

  // Get current organization to check authorization
  const currentOrganization = await Organization.findById(id);
  if (!currentOrganization) {
    throw new ApiError("Organization not found", 404);
  }

  // Check authorization (non-admin users can only update their organizations)
  if (
    req.user &&
    req.user.role !== "admin" &&
    currentOrganization.userId.toString() !== req.user._id.toString()
  ) {
    await logger.error("Unauthorized update attempt", {
      userId: req.user._id,
      organizationId: id,
    });
    throw new ApiError("Unauthorized to update this organization", 403);
  }

  // Update organization
  const updatedOrganization = await updateService(Organization, id, body);

  await logger.info("Organization updated", {
    id,
    tradeName: updatedOrganization.tradeName,
  });

  return sanitizeOrganization(updatedOrganization);
});

// ========================
// Delete Organization
// ========================
export const deleteOrganizationService = asyncHandler(async (id, req) => {
  // Get organization to check authorization and delete customers
  const organization = await Organization.findById(id);

  if (!organization) {
    throw new ApiError("Organization not found", 404);
  }

  // Check authorization (non-admin users can only delete their organizations)
  if (
    req.user &&
    req.user.role !== "admin" &&
    organization.userId.toString() !== req.user._id.toString()
  ) {
    await logger.error("Unauthorized delete attempt", {
      userId: req.user._id,
      organizationId: id,
    });
    throw new ApiError("Unauthorized to delete this organization", 403);
  }

  // Soft delete all associated customers first
  await Customer.updateMany(
    { organizationId: id },
    { isDeleted: true, status: "inactive" }
  );

  await logger.info("Soft deleted customers for organization", {
    organizationId: id,
  });

  // Delete organization
  await organization.deleteOne();

  await logger.info("Organization permanently deleted", {
    id,
    tradeName: organization.tradeName,
  });

  return;
});
