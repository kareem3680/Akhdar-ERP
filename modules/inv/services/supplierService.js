import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("supplier");

import { sanitizeSupplier } from "../../../utils/sanitizeData.js";
import Supplier from "../models/supplierModel.js";
import {
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";

export const createSupplierService = asyncHandler(async (body, userId) => {
  await logger.info("Creating new supplier", {
    name: body.name,
    createdBy: userId,
  });

  // Check if supplier with same email or phone exists
  if (body.email) {
    const existingEmail = await Supplier.findOne({
      email: body.email,
      isDeleted: false,
    });
    if (existingEmail) {
      await logger.error("Email already exists", { email: body.email });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  if (body.phone) {
    const existingPhone = await Supplier.findOne({
      phone: body.phone,
      isDeleted: false,
    });
    if (existingPhone) {
      await logger.error("Phone number already exists", { phone: body.phone });
      throw new ApiError("🛑 Phone number already exists", 400);
    }
  }

  const supplier = await Supplier.create({
    ...body,
    createdBy: userId,
  });

  await logger.info("Supplier created successfully", {
    supplierId: supplier._id,
    name: supplier.name,
    createdBy: userId,
  });

  return sanitizeSupplier(supplier);
});

export const getSuppliersService = asyncHandler(async (req) => {
  const filter = { isDeleted: false };

  // Add organization filter if provided
  if (req.params.organizationId) {
    filter.organizationId = { $in: [req.params.organizationId] };
  }

  const result = await getAllService(Supplier, req.query, "supplier", filter, {
    populate: [
      { path: "organizationId", select: "tradeName" },
      { path: "createdBy", select: "name email" },
    ],
  });

  await logger.info("Fetched suppliers", {
    count: result.results,
    organization: req.params.organizationId || "all",
  });

  return {
    data: result.data.map(sanitizeSupplier),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSupplierService = asyncHandler(async (id) => {
  const supplier = await getSpecificService(Supplier, id, {
    populate: [
      { path: "organizationId", select: "tradeName" },
      { path: "createdBy", select: "name email" },
    ],
    filter: { isDeleted: false },
  });

  await logger.info("Fetched specific supplier", { id });

  return sanitizeSupplier(supplier);
});

export const updateSupplierService = asyncHandler(async (id, body, userId) => {
  const supplier = await Supplier.findOne({ _id: id, isDeleted: false });

  if (!supplier) {
    await logger.error("Supplier to update not found", { id });
    throw new ApiError(`🛑 No supplier found with ID: ${id}`, 404);
  }

  // Check for duplicate email
  if (body.email && body.email !== supplier.email) {
    const existingEmail = await Supplier.findOne({
      email: body.email,
      isDeleted: false,
      _id: { $ne: id },
    });
    if (existingEmail) {
      await logger.error("Email already exists", { email: body.email });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  // Check for duplicate phone
  if (body.phone && body.phone !== supplier.phone) {
    const existingPhone = await Supplier.findOne({
      phone: body.phone,
      isDeleted: false,
      _id: { $ne: id },
    });
    if (existingPhone) {
      await logger.error("Phone number already exists", { phone: body.phone });
      throw new ApiError("🛑 Phone number already exists", 400);
    }
  }

  Object.assign(supplier, {
    ...body,
    updatedBy: userId,
  });
  await supplier.save();

  await logger.info("Supplier updated", {
    id,
    updatedBy: userId,
    updatedFields: Object.keys(body),
  });

  return sanitizeSupplier(supplier);
});

export const deleteSupplierService = asyncHandler(async (id, userId) => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      updatedBy: userId,
      deletedBy: userId,
    }
  );

  if (!supplier) {
    await logger.error("Supplier to delete not found", { id });
    throw new ApiError(`🛑 No supplier found with ID: ${id}`, 404);
  }

  await supplier.deleteOne();

  await logger.info("Supplier hard deleted", {
    id,
    deletedBy: userId,
  });
});

export const softDeleteSupplierService = asyncHandler(async (id, userId) => {
  const supplier = await Supplier.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      isDeleted: true,
      updatedBy: userId,
      deletedBy: userId,
    },
    { new: true }
  );

  if (!supplier) {
    await logger.error("Supplier to soft delete not found", { id });
    throw new ApiError(`🛑 No supplier found with ID: ${id}`, 404);
  }

  await logger.info("Supplier soft deleted", {
    id,
    deletedBy: userId,
  });

  return sanitizeSupplier(supplier);
});

export const addOrganizationService = asyncHandler(
  async (supplierId, organizationId, userId) => {
    const supplier = await Supplier.findOne({
      _id: supplierId,
      isDeleted: false,
    });

    if (!supplier) {
      await logger.error("Supplier not found", { supplierId });
      throw new ApiError(`🛑 No supplier found with ID: ${supplierId}`, 404);
    }

    // Check if organization already exists
    if (supplier.organizationId.includes(organizationId)) {
      await logger.error("Organization already exists for supplier", {
        supplierId,
        organizationId,
      });
      throw new ApiError(
        "🛑 Organization already exists for this supplier",
        400
      );
    }

    supplier.organizationId.push(organizationId);
    supplier.updatedBy = userId;
    await supplier.save();

    await logger.info("Organization added to supplier", {
      supplierId,
      organizationId,
      updatedBy: userId,
    });

    return sanitizeSupplier(supplier);
  }
);
