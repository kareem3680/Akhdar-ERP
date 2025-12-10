import asyncHandler from "express-async-handler";
import Customer from "../models/customerModel.js";
import { sanitizeCustomer } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("customer");

// ========================
// Create New Customer
// ========================
export const createCustomerService = asyncHandler(
  async (body, organizationId) => {
    const { email, phone } = body;

    // Check if email already exists
    if (email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        await logger.error("Customer creation failed - email already exists", {
          email,
        });
        throw new ApiError("Email already exists", 400);
      }
    }

    // Check if phone already exists
    if (phone) {
      const existingCustomer = await Customer.findOne({ phone });
      if (existingCustomer) {
        await logger.error("Customer creation failed - phone already exists", {
          phone,
        });
        throw new ApiError("Phone number already exists", 400);
      }
    }

    // Add organizationId if provided
    const customerData = { ...body };
    if (organizationId) {
      customerData.organizationId = [organizationId];
    }

    // Create customer
    const newCustomer = await createService(Customer, customerData);

    await logger.info("Customer created", {
      customerId: newCustomer._id,
      name: newCustomer.name,
    });

    return sanitizeCustomer(newCustomer);
  }
);

// ========================
// Get All Customers
// ========================
export const getCustomersService = asyncHandler(async (req) => {
  // Create filter for non-deleted customers
  const filter = { isDeleted: false };

  // Add organization filter if provided
  if (req.params.organizationId) {
    filter.organizationId = req.params.organizationId;
  }

  const result = await getAllService(Customer, req.query, "customer", filter, {
    populate: "organizationId",
  });

  await logger.info("Fetched all customers", {
    count: result.results,
    organizationId: req.params.organizationId || "all",
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeCustomer),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Customer
// ========================
export const getSpecificCustomerService = asyncHandler(async (id) => {
  const customer = await getSpecificService(Customer, id, {
    populate: "organizationId",
  });

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  // Check if customer is soft deleted
  if (customer.isDeleted) {
    throw new ApiError("Customer has been deleted", 410); // 410 Gone
  }

  await logger.info("Fetched customer", { id });

  return sanitizeCustomer(customer);
});

// ========================
// Update Customer
// ========================
export const updateCustomerService = asyncHandler(async (id, body) => {
  const { email, phone } = body;

  // Check if new email already exists
  if (email) {
    const existingCustomer = await Customer.findOne({
      email,
      _id: { $ne: id },
    });
    if (existingCustomer) {
      await logger.error("Customer update failed - email already exists", {
        email,
        id,
      });
      throw new ApiError("Email already exists", 400);
    }
  }

  // Check if new phone already exists
  if (phone) {
    const existingCustomer = await Customer.findOne({
      phone,
      _id: { $ne: id },
    });
    if (existingCustomer) {
      await logger.error("Customer update failed - phone already exists", {
        phone,
        id,
      });
      throw new ApiError("Phone number already exists", 400);
    }
  }

  // Update customer
  const updatedCustomer = await updateService(Customer, id, body);

  await logger.info("Customer updated", { id });

  return sanitizeCustomer(updatedCustomer);
});

// ========================
// Soft Delete Customer
// ========================
export const softDeleteCustomerService = asyncHandler(async (id) => {
  // Get customer first
  const customer = await Customer.findById(id);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  // Check if already soft deleted
  if (customer.isDeleted) {
    await logger.info("Customer already soft deleted", { id });
    throw new ApiError("Customer already deleted", 400);
  }

  // Soft delete (mark as deleted)
  customer.isDeleted = true;
  customer.status = "inactive";
  await customer.save();

  await logger.info("Customer soft deleted", {
    id,
    name: customer.name,
  });

  return sanitizeCustomer(customer);
});

// ========================
// Hard Delete Customer
// ========================
export const deleteCustomerService = asyncHandler(async (id) => {
  // Get customer first
  const customer = await Customer.findById(id);

  if (!customer) {
    throw new ApiError("Customer not found", 404);
  }

  // Hard delete from database
  await Customer.findByIdAndDelete(id);

  await logger.info("Customer permanently deleted", {
    id,
    name: customer.name,
  });

  return;
});

// ========================
// Add Organization to Customer
// ========================
export const addOrganizationService = asyncHandler(
  async (customerId, organizationId) => {
    // Get customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError("Customer not found", 404);
    }

    // Check if organization already exists in customer's organizations
    if (customer.organizationId.includes(organizationId)) {
      await logger.info("Organization already exists for customer", {
        customerId,
        organizationId,
      });
      throw new ApiError("Organization already exists for this customer", 400);
    }

    // Add organization to customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $addToSet: { organizationId: organizationId },
      },
      { new: true, runValidators: true }
    ).populate("organizationId");

    await logger.info("Organization added to customer", {
      customerId,
      organizationId,
      totalOrganizations: updatedCustomer.organizationId.length,
    });

    return sanitizeCustomer(updatedCustomer);
  }
);

// ========================
// Remove Organization from Customer
// ========================
export const removeOrganizationService = asyncHandler(
  async (customerId, organizationId) => {
    // Get customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError("Customer not found", 404);
    }

    // Check if organization exists in customer's organizations
    if (!customer.organizationId.includes(organizationId)) {
      await logger.info("Organization not found for customer", {
        customerId,
        organizationId,
      });
      throw new ApiError("Organization not found for this customer", 404);
    }

    // Remove organization from customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $pull: { organizationId: organizationId },
      },
      { new: true, runValidators: true }
    ).populate("organizationId");

    await logger.info("Organization removed from customer", {
      customerId,
      organizationId,
      remainingOrganizations: updatedCustomer.organizationId.length,
    });

    return sanitizeCustomer(updatedCustomer);
  }
);
