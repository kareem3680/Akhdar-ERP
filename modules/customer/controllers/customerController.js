import asyncHandler from "express-async-handler";
import {
  createCustomerService,
  getCustomersService,
  getSpecificCustomerService,
  updateCustomerService,
  softDeleteCustomerService,
  deleteCustomerService,
  addOrganizationService,
  removeOrganizationService,
} from "../services/customerService.js";

export const createCustomer = asyncHandler(async (req, res) => {
  const data = await createCustomerService(req.body, req.params.organizationId);
  res.status(201).json({
    message: "Customer created successfully",
    data,
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const response = await getCustomersService(req);
  res.status(200).json({
    message: "Customers fetched successfully",
    ...response,
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const data = await getSpecificCustomerService(req.params.id);
  res.status(200).json({
    message: "Customer retrieved successfully",
    data,
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const data = await updateCustomerService(req.params.id, req.body);
  res.status(200).json({
    message: "Customer updated successfully",
    data,
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await deleteCustomerService(req.params.id);
  res.status(204).json({
    message: "Customer permanently deleted successfully",
  });
});

export const softDelete = asyncHandler(async (req, res) => {
  const data = await softDeleteCustomerService(req.params.id);
  res.status(200).json({
    message: "Customer soft deleted successfully",
    data,
  });
});

export const addOrganization = asyncHandler(async (req, res) => {
  const data = await addOrganizationService(
    req.params.customerId,
    req.params.organizationId
  );
  res.status(200).json({
    message: "Organization added to customer successfully",
    data,
  });
});

// New function: Remove organization from customer
export const removeOrganization = asyncHandler(async (req, res) => {
  const data = await removeOrganizationService(
    req.params.customerId,
    req.params.organizationId
  );
  res.status(200).json({
    message: "Organization removed from customer successfully",
    data,
  });
});
