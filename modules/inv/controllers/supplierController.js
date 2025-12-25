import asyncHandler from "express-async-handler";
import {
  createSupplierService,
  getSuppliersService,
  getSupplierService,
  updateSupplierService,
  deleteSupplierService,
  softDeleteSupplierService,
  addOrganizationService,
} from "../services/supplierService.js";

export const createSupplier = asyncHandler(async (req, res) => {
  const data = await createSupplierService(req.body, req.user.id);

  res.status(201).json({
    message: "Supplier created successfully",
    data,
  });
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const response = await getSuppliersService(req);

  res.status(200).json({
    message: "Suppliers fetched successfully",
    ...response,
  });
});

export const getSupplier = asyncHandler(async (req, res) => {
  const data = await getSupplierService(req.params.supplierId);

  res.status(200).json({
    message: "Supplier retrieved successfully",
    data,
  });
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const data = await updateSupplierService(
    req.params.supplierId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    message: "Supplier updated successfully",
    data,
  });
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await deleteSupplierService(req.params.supplierId, req.user.id);

  res.status(204).json({
    message: "Supplier deleted successfully",
  });
});

export const softDeleteSupplier = asyncHandler(async (req, res) => {
  const data = await softDeleteSupplierService(
    req.params.supplierId,
    req.user.id
  );

  res.status(200).json({
    message: "Supplier soft deleted successfully",
    data,
  });
});

export const getOrganizationSuppliers = asyncHandler(async (req, res) => {
  const response = await getSuppliersService(req);

  res.status(200).json({
    message: "Organization suppliers fetched successfully",
    ...response,
  });
});

export const addOrganization = asyncHandler(async (req, res) => {
  const data = await addOrganizationService(
    req.params.supplierId,
    req.params.organizationId,
    req.user.id
  );

  res.status(200).json({
    message: "Organization added to supplier successfully",
    data,
  });
});
