import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("purchase-invoice");

import PurchaseInvoice from "../models/purchaseInvoiceModel.js";
import PurchaseOrder from "../models/purchaseOrderModel.js";
import Product from "../../product/models/productModel.js";
import {
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";

export const createInvoiceService = asyncHandler(
  async (purchaseOrderId, body) => {
    await logger.info("Creating invoice from purchase order", {
      purchaseOrderId,
    });

    if (!purchaseOrderId) {
      throw new ApiError("🛑 Purchase order ID is required", 400);
    }

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      await logger.error("Purchase order not found", { purchaseOrderId });
      throw new ApiError(
        `🛑 No purchase order found with ID: ${purchaseOrderId}`,
        404
      );
    }

    if (purchaseOrder.status !== "delivered") {
      await logger.error("Cannot generate invoice for undelivered order", {
        purchaseOrderId,
        status: purchaseOrder.status,
      });
      throw new ApiError(
        "🛑 Cannot generate invoice for undelivered purchase order",
        400
      );
    }

    const products = await Promise.all(
      purchaseOrder.products.map(async (item) => {
        const productDetails = await Product.findById(item.productId);
        if (!productDetails) {
          throw new ApiError("🛑 Product not found", 404);
        }

        const tax = 0.14;
        const baseTotal = item.quantity * item.wholesalePrice;
        const total = baseTotal + baseTotal * tax;

        return {
          product: item.productId,
          code: productDetails.code,

          deliveredQuantity: item.quantity,
          quantity: item.quantity,

          wholesalePrice: item.wholesalePrice,
          retailPrice: productDetails.retailPrice,

          tax,
          total,

          inventory: item.inventoryId || null,
        };
      })
    );

    const totalPayment = products.reduce((acc, cur) => acc + cur.total, 0);

    const invoiceData = {
      invoiceNumber: purchaseOrder.invoiceNumber,
      purchaseOrderId: purchaseOrder._id,
      supplier: purchaseOrder.supplierId,
      organization: purchaseOrder.organizationId,
      products,
      notes: body.notes || "",
      totalPayment,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    const invoice = await PurchaseInvoice.create(invoiceData);

    await logger.info("Invoice created successfully", {
      invoiceId: invoice._id,
      totalPayment,
    });

    return invoice;
  }
);

export const getInvoicesService = asyncHandler(async (req) => {
  const result = await getAllService(
    PurchaseInvoice,
    req.query,
    "purchase-invoice"
  );

  await logger.info("Fetched all invoices", {
    count: result.results,
  });

  return {
    data: result.data,
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSpecificInvoiceService = asyncHandler(async (id) => {
  const invoice = await getSpecificService(PurchaseInvoice, id, {
    populate: [
      { path: "supplier", select: "name email phone" },
      { path: "organization", select: "tradeName" },
      { path: "purchaseOrderId", select: "orderNumber status" },
      { path: "products.product", select: "name code" },
    ],
  });

  await logger.info("Fetched specific invoice", { id });

  return invoice;
});

export const updateInvoiceService = asyncHandler(async (id, body) => {
  const invoice = await PurchaseInvoice.findById(id);

  if (!invoice) {
    await logger.error("Invoice to update not found", { id });
    throw new ApiError(`🛑 No invoice found with ID: ${id}`, 404);
  }

  // Prevent updating if invoice is already paid
  if (
    invoice.paymentStatus === "paid" &&
    body.paymentStatus &&
    body.paymentStatus !== "paid"
  ) {
    await logger.error("Cannot change status of paid invoice", { id });
    throw new ApiError("🛑 Cannot change status of paid invoice", 400);
  }

  // Update invoice
  Object.assign(invoice, body);
  await invoice.save();

  await logger.info("Invoice updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return invoice;
});

export const deleteInvoiceService = asyncHandler(async (id) => {
  const invoice = await PurchaseInvoice.findById(id);

  if (!invoice) {
    await logger.error("Invoice to delete not found", { id });
    throw new ApiError(`🛑 No invoice found with ID: ${id}`, 404);
  }

  // Prevent deleting paid invoices
  if (invoice.paymentStatus === "paid") {
    await logger.error("Cannot delete paid invoice", { id });
    throw new ApiError("🛑 Cannot delete paid invoice", 400);
  }

  await invoice.deleteOne();

  await logger.info("Invoice deleted", { id });
});
