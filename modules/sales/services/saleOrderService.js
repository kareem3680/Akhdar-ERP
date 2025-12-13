import asyncHandler from "express-async-handler";
import SaleOrder from "../models/saleOrderModel.js";
import { sanitizeSaleOrder } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import {
  checkStockAvailability,
  calculateOrderTotals,
  generateInvoiceNumber,
  validateStatusTransition,
  updateStockOnStatusChange,
} from "../../../middlewares/saleOrderMiddlewares.js";

const logger = new Logger("saleOrder");

// ========================
// Create Sale Order
// ========================
export const createSaleOrderService = asyncHandler(async (body, userId) => {
  // 1. Check stock availability
  await checkStockAvailability(body);

  // 2. Calculate order totals
  const { products, totalAmount } = await calculateOrderTotals(body);

  // 3. Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(body);

  // 4. Prepare order data
  const orderData = {
    ...body,
    products,
    totalAmount,
    invoiceNumber,
    createdBy: userId,
  };

  // 5. Create order
  const newOrder = await createService(SaleOrder, orderData);

  await logger.info("Sale order created", {
    orderId: newOrder._id,
    invoiceNumber: newOrder.invoiceNumber,
    customerId: newOrder.customerId,
    totalAmount: newOrder.totalAmount,
    createdBy: userId,
  });

  return sanitizeSaleOrder(newOrder);
});

// ========================
// Get All Sale Orders
// ========================
export const getSaleOrdersService = asyncHandler(async (req) => {
  const filter = { isActive: true };

  // Filter by organization if user is not admin
  if (req.user && req.user.role !== "admin") {
    filter.organizationId = req.user.organizations?.[0]?.organization_id;
  }

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by customer if provided
  if (req.query.customerId) {
    filter.customerId = req.query.customerId;
  }

  const result = await getAllService(
    SaleOrder,
    req.query,
    "sale-order",
    filter,
    {
      populate: [
        { path: "customerId", select: "name email phone" },
        { path: "organizationId", select: "tradeName email" },
        { path: "products.productId", select: "name code price" },
        { path: "createdBy", select: "name email" },
      ],
    }
  );

  await logger.info("Fetched all sale orders", {
    count: result.results,
    status: req.query.status || "all",
    userId: req.user?._id,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeSaleOrder),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Sale Order
// ========================
export const getSpecificSaleOrderService = asyncHandler(async (id, req) => {
  const order = await getSpecificService(SaleOrder, id, {
    populate: [
      { path: "customerId", select: "name email phone address currency" },
      { path: "organizationId", select: "tradeName email phone address" },
      {
        path: "products.productId",
        select: "name code description price tax unit img",
      },
      { path: "products.inventoryId", select: "name location" },
      { path: "createdBy", select: "name email role" },
    ],
  });

  if (!order) {
    throw new ApiError("Sale order not found", 404);
  }

  // Check authorization (non-admin users can only access their organization's orders)
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(order.organizationId._id.toString())) {
      await logger.error("Unauthorized access to sale order", {
        userId: req.user._id,
        orderId: id,
      });
      throw new ApiError("Unauthorized to access this sale order", 403);
    }
  }

  await logger.info("Fetched sale order", {
    id,
    invoiceNumber: order.invoiceNumber,
    status: order.status,
  });

  return sanitizeSaleOrder(order);
});

// ========================
// Update Sale Order
// ========================
export const updateSaleOrderService = asyncHandler(async (id, body, req) => {
  // Get current order
  const currentOrder = await SaleOrder.findById(id);
  if (!currentOrder) {
    throw new ApiError("Sale order not found", 404);
  }

  // Check authorization
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(currentOrder.organizationId.toString())) {
      await logger.error("Unauthorized update attempt", {
        userId: req.user._id,
        orderId: id,
      });
      throw new ApiError("Unauthorized to update this sale order", 403);
    }
  }

  // Check if order can be updated (only draft orders can be updated)
  if (currentOrder.status !== "draft") {
    throw new ApiError(
      `Cannot update order with status: ${currentOrder.status}`,
      400
    );
  }

  // If products are being updated, check stock again
  if (body.products) {
    await checkStockAvailability(body);
    const { products, totalAmount } = await calculateOrderTotals(body);
    body.products = products;
    body.totalAmount = totalAmount;
  }

  // Update order
  const updatedOrder = await updateService(SaleOrder, id, body);

  await logger.info("Sale order updated", {
    id,
    invoiceNumber: updatedOrder.invoiceNumber,
  });

  return sanitizeSaleOrder(updatedOrder);
});

// ========================
// Delete Sale Order (Soft Delete)
// ========================
export const deleteSaleOrderService = asyncHandler(async (id, req) => {
  // Get order
  const order = await SaleOrder.findById(id);
  if (!order) {
    throw new ApiError("Sale order not found", 404);
  }

  // Check authorization
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(order.organizationId.toString())) {
      await logger.error("Unauthorized delete attempt", {
        userId: req.user._id,
        orderId: id,
      });
      throw new ApiError("Unauthorized to delete this sale order", 403);
    }
  }

  // Check if order can be deleted (only draft orders can be deleted)
  if (order.status !== "draft") {
    throw new ApiError(`Cannot delete order with status: ${order.status}`, 400);
  }

  // Soft delete (mark as inactive)
  order.isActive = false;
  await order.save();

  await logger.info("Sale order soft deleted", {
    id,
    invoiceNumber: order.invoiceNumber,
    status: order.status,
  });

  return;
});

// ========================
// Update Sale Order Status
// ========================
export const updateSaleOrderStatusService = asyncHandler(
  async (id, newStatus, req) => {
    // Get current order
    const order = await SaleOrder.findById(id);
    if (!order) {
      throw new ApiError("Sale order not found", 404);
    }

    // Check authorization
    if (req.user && req.user.role !== "admin") {
      const userOrganizationIds =
        req.user.organizations?.map((org) => org.organization_id.toString()) ||
        [];

      if (!userOrganizationIds.includes(order.organizationId.toString())) {
        await logger.error("Unauthorized status update attempt", {
          userId: req.user._id,
          orderId: id,
        });
        throw new ApiError(
          "Unauthorized to update this sale order status",
          403
        );
      }
    }

    // Validate status transition
    validateStatusTransition(order.status, newStatus, req.user._id);

    // Update stock if needed
    await updateStockOnStatusChange(order, newStatus, req.user._id);

    // Update order status
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    await logger.info("Sale order status updated", {
      id,
      invoiceNumber: order.invoiceNumber,
      from: order.status,
      to: newStatus,
      updatedBy: req.user._id,
    });

    return sanitizeSaleOrder(updatedOrder);
  }
);

// ========================
// Get Orders by Status
// ========================
export const getSaleOrdersByStatusService = asyncHandler(
  async (status, req) => {
    const filter = {
      isActive: true,
      status: status,
    };

    // Filter by organization if user is not admin
    if (req.user && req.user.role !== "admin") {
      filter.organizationId = req.user.organizations?.[0]?.organization_id;
    }

    const result = await getAllService(
      SaleOrder,
      req.query,
      "sale-order",
      filter,
      {
        populate: [
          { path: "customerId", select: "name email phone" },
          { path: "organizationId", select: "tradeName email" },
        ],
      }
    );

    await logger.info(`Fetched ${status} sale orders`, {
      count: result.results,
      status,
      userId: req.user?._id,
    });

    return {
      results: result.results,
      data: result.data.map(sanitizeSaleOrder),
      paginationResult: result.paginationResult,
    };
  }
);
