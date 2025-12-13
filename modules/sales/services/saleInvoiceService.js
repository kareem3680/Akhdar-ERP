import asyncHandler from "express-async-handler";
import SaleInvoice from "../models/saleInvoiceModel.js";
import SaleOrder from "../models/saleOrderModel.js";
import Product from "../../product/models/productModel.js";
import { sanitizeSaleInvoice } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("saleInvoice");

// ========================
// Create Sale Invoice from Sale Order
// ========================
export const createSaleInvoiceService = asyncHandler(
  async (saleOrderId, body, userId) => {
    // Check if sale order exists
    const saleOrder = await SaleOrder.findById(saleOrderId)
      .populate("products.productId")
      .populate("customerId")
      .populate("organizationId");

    if (!saleOrder) {
      await logger.error("Sale order not found", { saleOrderId });
      throw new ApiError("Sale order not found", 404);
    }

    // Check if invoice already exists for this sale order
    const existingInvoice = await SaleInvoice.findOne({ saleOrderId });
    if (existingInvoice) {
      await logger.error("Invoice already exists for sale order", {
        saleOrderId,
      });
      throw new ApiError("Invoice already exists for this sale order", 400);
    }

    // Prepare products data for invoice
    const products = await Promise.all(
      saleOrder.products.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new ApiError(`Product ${item.productId} not found`, 404);
        }

        const itemTotal =
          item.quantity * item.price * (1 - (item.discount || 0) / 100);

        return {
          product: item.productId,
          code: product.code,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: itemTotal,
          inventory: item.inventoryId || null,
        };
      })
    );

    // Calculate total payment
    const totalPayment = products.reduce((sum, item) => sum + item.total, 0);

    // Create invoice data
    const invoiceData = {
      invoiceNumber: saleOrder.invoiceNumber || undefined, // Will be auto-generated if not provided
      saleOrderId: saleOrder._id,
      customer: saleOrder.customerId._id,
      organization: saleOrder.organizationId._id,
      products,
      notes: body.notes || "",
      totalPayment,
      amountPaid: 0,
      amountDue: totalPayment,
      paymentStatus: "unpaid",
      createdBy: userId,
      dueDate: body.dueDate || undefined,
    };

    // Create invoice
    const newInvoice = await createService(SaleInvoice, invoiceData);

    // Update sale order status to "invoiced"
    await SaleOrder.findByIdAndUpdate(saleOrderId, { status: "invoiced" });

    await logger.info("Sale invoice created", {
      invoiceId: newInvoice._id,
      saleOrderId,
      invoiceNumber: newInvoice.invoiceNumber,
      totalPayment: newInvoice.totalPayment,
    });

    return sanitizeSaleInvoice(newInvoice);
  }
);

// ========================
// Get All Sale Invoices
// ========================
export const getSaleInvoicesService = asyncHandler(async (req) => {
  const filter = { isActive: true };

  // Filter by organization if user is not admin
  if (req.user && req.user.role !== "admin") {
    filter.organization = req.user.organizations?.[0]?.organization_id;
  }

  // Filter by payment status if provided
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  // Filter by customer if provided
  if (req.query.customer) {
    filter.customer = req.query.customer;
  }

  const result = await getAllService(
    SaleInvoice,
    req.query,
    "sale-invoice",
    filter,
    {
      populate: [
        { path: "customer", select: "name email phone" },
        { path: "organization", select: "tradeName email" },
        { path: "saleOrderId", select: "orderNumber status" },
        { path: "products.product", select: "name code" },
        { path: "createdBy", select: "name email" },
      ],
    }
  );

  await logger.info("Fetched all sale invoices", {
    count: result.results,
    userId: req.user?._id,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeSaleInvoice),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Sale Invoice
// ========================
export const getSpecificSaleInvoiceService = asyncHandler(async (id, req) => {
  const invoice = await getSpecificService(SaleInvoice, id, {
    populate: [
      { path: "customer", select: "name email phone address currency" },
      { path: "organization", select: "tradeName email phone address" },
      { path: "saleOrderId", select: "orderNumber status createdAt" },
      {
        path: "products.product",
        select: "name code description price tax unit img",
      },
      { path: "createdBy", select: "name email role" },
    ],
  });

  if (!invoice) {
    throw new ApiError("Sale invoice not found", 404);
  }

  // Check authorization (non-admin users can only access their organization's invoices)
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(invoice.organization._id.toString())) {
      await logger.error("Unauthorized access to invoice", {
        userId: req.user._id,
        invoiceId: id,
      });
      throw new ApiError("Unauthorized to access this invoice", 403);
    }
  }

  await logger.info("Fetched sale invoice", {
    id,
    invoiceNumber: invoice.invoiceNumber,
  });

  return sanitizeSaleInvoice(invoice);
});

// ========================
// Update Sale Invoice
// ========================
export const updateSaleInvoiceService = asyncHandler(async (id, body, req) => {
  // Get current invoice
  const currentInvoice = await SaleInvoice.findById(id);
  if (!currentInvoice) {
    throw new ApiError("Sale invoice not found", 404);
  }

  // Check authorization
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(currentInvoice.organization.toString())) {
      await logger.error("Unauthorized update attempt", {
        userId: req.user._id,
        invoiceId: id,
      });
      throw new ApiError("Unauthorized to update this invoice", 403);
    }
  }

  // Validate amount paid
  if (body.amountPaid !== undefined) {
    if (body.amountPaid < 0) {
      throw new ApiError("Amount paid cannot be negative", 400);
    }

    if (body.amountPaid > currentInvoice.totalPayment) {
      throw new ApiError("Amount paid cannot exceed total payment", 400);
    }
  }

  // Update invoice
  const updatedInvoice = await updateService(SaleInvoice, id, body);

  await logger.info("Sale invoice updated", {
    id,
    invoiceNumber: updatedInvoice.invoiceNumber,
    paymentStatus: updatedInvoice.paymentStatus,
    amountPaid: updatedInvoice.amountPaid,
  });

  return sanitizeSaleInvoice(updatedInvoice);
});

// ========================
// Delete Sale Invoice (Soft Delete)
// ========================
export const deleteSaleInvoiceService = asyncHandler(async (id, req) => {
  // Get invoice
  const invoice = await SaleInvoice.findById(id);
  if (!invoice) {
    throw new ApiError("Sale invoice not found", 404);
  }

  // Check authorization
  if (req.user && req.user.role !== "admin") {
    const userOrganizationIds =
      req.user.organizations?.map((org) => org.organization_id.toString()) ||
      [];

    if (!userOrganizationIds.includes(invoice.organization.toString())) {
      await logger.error("Unauthorized delete attempt", {
        userId: req.user._id,
        invoiceId: id,
      });
      throw new ApiError("Unauthorized to delete this invoice", 403);
    }
  }

  // Check if invoice is paid
  if (invoice.paymentStatus === "paid" && invoice.amountPaid > 0) {
    throw new ApiError("Cannot delete paid invoice", 400);
  }

  // Soft delete (mark as inactive)
  invoice.isActive = false;
  await invoice.save();

  // Update sale order status back to "pending"
  await SaleOrder.findByIdAndUpdate(invoice.saleOrderId, { status: "pending" });

  await logger.info("Sale invoice soft deleted", {
    id,
    invoiceNumber: invoice.invoiceNumber,
  });

  return;
});

// ========================
// Record Payment for Invoice
// ========================
export const recordPaymentService = asyncHandler(
  async (id, paymentData, req) => {
    const { amount, paymentMethod, notes } = paymentData;

    // Get invoice
    const invoice = await SaleInvoice.findById(id);
    if (!invoice) {
      throw new ApiError("Sale invoice not found", 404);
    }

    // Check authorization
    if (req.user && req.user.role !== "admin") {
      const userOrganizationIds =
        req.user.organizations?.map((org) => org.organization_id.toString()) ||
        [];

      if (!userOrganizationIds.includes(invoice.organization.toString())) {
        await logger.error("Unauthorized payment attempt", {
          userId: req.user._id,
          invoiceId: id,
        });
        throw new ApiError(
          "Unauthorized to record payment for this invoice",
          403
        );
      }
    }

    // Validate payment amount
    if (amount <= 0) {
      throw new ApiError("Payment amount must be positive", 400);
    }

    if (amount > invoice.amountDue) {
      throw new ApiError("Payment amount exceeds amount due", 400);
    }

    // Update invoice with payment
    const newAmountPaid = invoice.amountPaid + amount;
    const updatedInvoice = await SaleInvoice.findByIdAndUpdate(
      id,
      {
        amountPaid: newAmountPaid,
        paymentStatus:
          newAmountPaid >= invoice.totalPayment ? "paid" : "partial",
        $push: {
          paymentHistory: {
            amount,
            paymentMethod,
            notes,
            recordedBy: req.user._id,
            recordedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    await logger.info("Payment recorded for invoice", {
      id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentMethod,
      newAmountPaid: updatedInvoice.amountPaid,
      newAmountDue: updatedInvoice.amountDue,
    });

    return sanitizeSaleInvoice(updatedInvoice);
  }
);
