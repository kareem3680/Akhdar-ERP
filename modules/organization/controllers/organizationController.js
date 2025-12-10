import asyncHandler from "express-async-handler";
import {
  createOrganizationService,
  getOrganizationsService,
  getSpecificOrganizationService,
  updateOrganizationService,
  deleteOrganizationService,
} from "../services/organizationService.js";

export const createOrganization = asyncHandler(async (req, res) => {
  const data = await createOrganizationService(req.body);
  res.status(201).json({
    message: "Organization created successfully",
    data,
  });
});

export const getOrganizations = asyncHandler(async (req, res) => {
  const response = await getOrganizationsService(req);
  res.status(200).json({
    message: "Organizations fetched successfully",
    ...response,
  });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const data = await getSpecificOrganizationService(req.params.id, req);
  res.status(200).json({
    message: "Organization retrieved successfully",
    data,
  });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const data = await updateOrganizationService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Organization updated successfully",
    data,
  });
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  await deleteOrganizationService(req.params.id, req);
  res.status(204).json({
    message: "Organization and associated customers deleted successfully",
  });
});
