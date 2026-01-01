import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import tripInvoiceModel from "../models/tripInvoiceModel.js";
import saleOrderInTripModel from "../../sales/models/saleOrderInTripModel.js";
import journalModel from "../models/journalModel.js";
import journalEntryModel from "../models/journalEntryModel.js";
import accountModel from "../models/accountModel.js";
import {
  getAllService,
  createService,
} from "../../../utils/servicesHandler.js";
import { sanitizeTripInvoice } from "../../../utils/sanitizeData.js";

const logger = new Logger("trip-invoice");

export const createTripInvoiceService = asyncHandler(async (saleOrderId) => {
  // Check if sale order exists
  const saleOrder = await saleOrderInTripModel.findById(saleOrderId);
  if (!saleOrder) {
    await logger.error("Sale order not found", { saleOrderId });
    throw new ApiError("🛑 Sale order not found", 404);
  }

  // Check if invoice already exists for this sale order
  const existingInvoice = await tripInvoiceModel.findOne({ saleOrderId });
  if (existingInvoice) {
    await logger.error("Invoice already exists for sale order", {
      saleOrderId,
      invoiceId: existingInvoice._id,
    });
    throw new ApiError("🛑 Invoice already exists for this sale order", 400);
  }

  // Create trip invoice
  const tripInvoice = await createService(tripInvoiceModel, { saleOrderId });

  // Fetch populated trip invoice for accounting
  const populatedInvoice = await tripInvoiceModel
    .findById(tripInvoice._id)
    .populate({
      path: "saleOrderId",
      populate: [
        {
          path: "customer",
          select: "name email phone taxNumber",
        },
        {
          path: "goods.product",
          select: "name code",
        },
      ],
    });

  // Create journal entry for accounting
  try {
    const total = populatedInvoice.saleOrderId.total;
    const journal = await journalModel.findOne({ journalType: "sales" });
    const accountRevenue = await accountModel.findOne({
      name: "sales-revenue",
    });
    const accountCustomerReceivable = await accountModel.findOne({
      name: "cash/bank",
    });

    if (journal && accountRevenue && accountCustomerReceivable) {
      await journalEntryModel.create({
        journalId: journal._id,
        lines: [
          {
            accountId: accountRevenue._id,
            description: `Income from sale order #${populatedInvoice.saleOrderId.orderNumber}`,
            debit: 0,
            credit: total,
          },
          {
            accountId: accountCustomerReceivable._id,
            description: `Receivable from customer for order #${populatedInvoice.saleOrderId.orderNumber}`,
            debit: total,
            credit: 0,
          },
        ],
      });

      await logger.info("Journal entry created for trip invoice", {
        invoiceId: tripInvoice._id,
        saleOrderNumber: populatedInvoice.saleOrderId.orderNumber,
        amount: total,
      });
    }
  } catch (error) {
    await logger.error("Failed to create journal entry", {
      error: error.message,
      invoiceId: tripInvoice._id,
    });
    // Don't throw error - invoice is already created
  }

  await logger.info("Trip invoice created successfully", {
    invoiceId: tripInvoice._id,
    saleOrderId,
    saleOrderNumber: saleOrder.orderNumber,
  });

  return sanitizeTripInvoice(tripInvoice);
});

export const getTripInvoicesService = asyncHandler(async (req) => {
  const result = await getAllService(
    tripInvoiceModel,
    req.query,
    "trip-invoice",
    {},
    {
      populate: [
        {
          path: "saleOrderId",
          select: "orderNumber total orderDate",
          populate: [
            {
              path: "customer",
              select: "name email phone",
              populate: {
                path: "organization",
                select: "name code",
              },
            },
            {
              path: "goods.product",
              select: "name code price",
            },
          ],
        },
      ],
    }
  );

  await logger.info("Fetched all trip invoices", {
    count: result.results,
    page: result.paginationResult?.currentPage || 1,
  });

  return {
    data: result.data.map(sanitizeTripInvoice),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getTripInvoiceService = asyncHandler(async (id) => {
  const tripInvoice = await tripInvoiceModel.findById(id).populate({
    path: "saleOrderId",
    populate: [
      {
        path: "customer",
        select: "name email phone address taxNumber",
        populate: {
          path: "organization",
          select: "name code address",
        },
      },
      {
        path: "goods.product",
        select: "name code price description category",
        populate: {
          path: "supplier",
          select: "name contact",
        },
      },
    ],
  });

  if (!tripInvoice) {
    await logger.error("Trip invoice not found", { id });
    throw new ApiError(`🛑 Trip invoice not found with ID: ${id}`, 404);
  }

  await logger.info("Fetched trip invoice details", {
    id,
    saleOrderNumber: tripInvoice.saleOrderId?.orderNumber,
  });

  return sanitizeTripInvoice(tripInvoice);
});
