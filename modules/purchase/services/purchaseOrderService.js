import asyncHandler from "express-async-handler";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import { sanitizePurchaseOrder } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import {
  checkInventoryCapacity,
  calculatePurchaseTotals,
  generatePurchaseInvoiceNumber,
  validatePurchaseStatusTransition,
  updateInventoryOnDelivery,
  checkDeliveredQuantity,
} from "../../../middlewares/purchaseOrderMiddlewares.js";

const logger = new Logger("purchaseOrder");

// ========================
// Create Purchase Order
// ========================
export const createPurchaseOrderService = asyncHandler(async (body, userId) => {
  // 1. Check inventory capacity
  await checkInventoryCapacity(body);

  // 2. Calculate purchase totals
  const { products, totalAmount } = await calculatePurchaseTotals(body);

  // 3. Generate invoice number
  const invoiceNumber = await generatePurchaseInvoiceNumber(body);

  // 4. Prepare order data
  const orderData = {
    ...body,
    products,
    totalAmount,
    invoiceNumber,
    createdBy: userId,
  };

  // 5. Create order
  const newOrder = await createService(PurchaseOrder, orderData);

  await logger.info("Purchase order created", {
    orderId: newOrder._id,
    invoiceNumber: newOrder.invoiceNumber,
    supplierId: newOrder.supplierId,
    totalAmount: newOrder.totalAmount,
    createdBy: userId,
  });

  return sanitizePurchaseOrder(newOrder);
});

// ========================
// Get All Purchase Orders
// ========================
export const getPurchaseOrdersService = asyncHandler(async (req) => {
  const filter = { isActive: true };

  // Filter by organization if user is not admin
  if (req.user && req.user.role !== "admin") {
    filter.organizationId = req.user.organizations?.[0]?.organization_id;
  }

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by supplier if provided
  if (req.query.supplierId) {
    filter.supplierId = req.query.supplierId;
  }

  const result = await getAllService(
    PurchaseOrder,
    req.query,
    "purchase-order",
    filter,
    {
      populate: [
        { path: "supplierId", select: "name email phone" },
        { path: "organizationId", select: "tradeName email" },
        { path: "products.productId", select: "name code" },
        { path: "createdBy", select: "name email" },
      ],
    }
  );

  await logger.info("Fetched all purchase orders", {
    count: result.results,
    status: req.query.status || "all",
    userId: req.user?._id,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizePurchaseOrder),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Purchase Order
// ========================
export const getSpecificPurchaseOrderService = asyncHandler(async (id, req) => {
  const order = await getSpecificService(PurchaseOrder, id, {
    populate: [
      { path: "supplierId", select: "name email phone address" },
      { path: "organizationId", select: "tradeName email phone address" },
      {
        path: "products.productId",
        select: "name code description price",
      },
      { path: "products.inventoryId", select: "name location capacity" },
      { path: "createdBy", select: "name email role" },
    ],
  });

  if (!order) {
    throw new ApiError("Purchase order not found", 404);
  }

  // Check authorization (non-admin users can only access their organization's orders)
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(order.organizationId._id.toString())) {
      await logger.error("Unauthorized access to purchase order", {
        userId: req.user._id,
        orderId: id,
      });
      throw new ApiError("Unauthorized to access this purchase order", 403);
    }
  }

  await logger.info("Fetched purchase order", {
    id,
    invoiceNumber: order.invoiceNumber,
    status: order.status,
  });

  return sanitizePurchaseOrder(order);
});

// ========================
// Update Purchase Order
// ========================
export const updatePurchaseOrderService = asyncHandler(
  async (id, body, req) => {
    // Get current order
    const currentOrder = await PurchaseOrder.findById(id);
    if (!currentOrder) {
      throw new ApiError("Purchase order not found", 404);
    }

    // Check authorization
    if (req.user && req.user.role !== "admin") {
      const userOrganizationIds =
        req.user.organizations?.map((org) => org.organization_id.toString()) ||
        [];

      if (
        !userOrganizationIds.includes(currentOrder.organizationId.toString())
      ) {
        await logger.error("Unauthorized update attempt", {
          userId: req.user._id,
          orderId: id,
        });
        throw new ApiError("Unauthorized to update this purchase order", 403);
      }
    }

    // Check if order can be updated (only draft orders can be updated)
    if (currentOrder.status !== "draft") {
      throw new ApiError(
        `Cannot update order with status: ${currentOrder.status}`,
        400
      );
    }

    // If products are being updated, check inventory capacity again
    if (body.products) {
      await checkInventoryCapacity(body);
      const { products, totalAmount } = await calculatePurchaseTotals(body);
      body.products = products;
      body.totalAmount = totalAmount;
    }

    // Update order
    const updatedOrder = await updateService(PurchaseOrder, id, body);

    await logger.info("Purchase order updated", {
      id,
      invoiceNumber: updatedOrder.invoiceNumber,
    });

    return sanitizePurchaseOrder(updatedOrder);
  }
);

// ========================
// Delete Purchase Order (Soft Delete)
// ========================
export const deletePurchaseOrderService = asyncHandler(async (id, req) => {
  // Get order
  const order = await PurchaseOrder.findById(id);
  if (!order) {
    throw new ApiError("Purchase order not found", 404);
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
      throw new ApiError("Unauthorized to delete this purchase order", 403);
    }
  }

  // Check if order can be deleted (only draft orders can be deleted)
  if (order.status !== "draft") {
    throw new ApiError(`Cannot delete order with status: ${order.status}`, 400);
  }

  // Soft delete (mark as inactive)
  order.isActive = false;
  await order.save();

  await logger.info("Purchase order soft deleted", {
    id,
    invoiceNumber: order.invoiceNumber,
    status: order.status,
  });

  return;
});

// ========================
// Update Purchase Order Status
// ========================
export const updatePurchaseOrderStatusService = asyncHandler(
  async (id, newStatus, req) => {
    // Get current order
    const order = await PurchaseOrder.findById(id);
    if (!order) {
      throw new ApiError("Purchase order not found", 404);
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
          "Unauthorized to update this purchase order status",
          403
        );
      }
    }

    // Validate status transition
    validatePurchaseStatusTransition(order.status, newStatus, req.user._id);

    // Update order status
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    await logger.info("Purchase order status updated", {
      id,
      invoiceNumber: order.invoiceNumber,
      from: order.status,
      to: newStatus,
      updatedBy: req.user._id,
    });

    return sanitizePurchaseOrder(updatedOrder);
  }
);

// ========================
// Deliver Purchase Order (Partial/Final Delivery)
// ========================
export const deliverPurchaseOrderService = asyncHandler(
  async (id, deliveryData, req) => {
    const { deliveredQuantities } = deliveryData;

    // Get current order
    const order = await PurchaseOrder.findById(id);
    if (!order) {
      throw new ApiError("Purchase order not found", 404);
    }

    // Check authorization
    if (req.user && req.user.role !== "admin") {
      const userOrganizationIds =
        req.user.organizations?.map((org) => org.organization_id.toString()) ||
        [];

      if (!userOrganizationIds.includes(order.organizationId.toString())) {
        await logger.error("Unauthorized delivery attempt", {
          userId: req.user._id,
          orderId: id,
        });
        throw new ApiError("Unauthorized to deliver this purchase order", 403);
      }
    }

    // Validate status (must be approved or shipped)
    if (!["approved", "shipped"].includes(order.status)) {
      throw new ApiError(
        `Cannot deliver order with status: ${order.status}`,
        400
      );
    }

    // Check delivered quantities
    const quantityChecks = await checkDeliveredQuantity(id, deliveryData);

    // Update products with delivered quantities
    const updatedProducts = order.products.map((product, index) => {
      const deliveredQty = deliveredQuantities[index] || 0;

      return {
        ...product.toObject(),
        deliveredQuantity: product.deliveredQuantity + deliveredQty,
        remainingQuantity: product.remainingQuantity - deliveredQty,
      };
    });

    // Check if all products are fully delivered
    const allDelivered = updatedProducts.every(
      (product) => product.remainingQuantity === 0
    );

    // Update order
    const updateData = {
      products: updatedProducts,
      status: allDelivered ? "delivered" : "shipped",
    };

    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Update inventory stock if quantities were delivered
    if (deliveredQuantities.some((qty) => qty > 0)) {
      await updateInventoryOnDelivery(updatedOrder, req.user._id);
    }

    await logger.info("Purchase order delivery recorded", {
      id,
      invoiceNumber: order.invoiceNumber,
      deliveredQuantities,
      newStatus: updateData.status,
      allDelivered,
    });

    return sanitizePurchaseOrder(updatedOrder);
  }
);

// ========================
// Get Orders by Status
// ========================
export const getPurchaseOrdersByStatusService = asyncHandler(
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
      PurchaseOrder,
      req.query,
      "purchase-order",
      filter,
      {
        populate: [
          { path: "supplierId", select: "name email phone" },
          { path: "organizationId", select: "tradeName email" },
        ],
      }
    );

    await logger.info(`Fetched ${status} purchase orders`, {
      count: result.results,
      status,
      userId: req.user?._id,
    });

    return {
      results: result.results,
      data: result.data.map(sanitizePurchaseOrder),
      paginationResult: result.paginationResult,
    };
  }
);
