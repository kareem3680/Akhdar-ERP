import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("invoice-payment");

import InvoicePayment from "../models/purchaseInvoicePaymentModel.js";
import PurchaseInvoice from "../models/purchaseInvoiceModel.js";
import Account from "../../accounting/models/accountingModel.js";
import journalEntry from "../../accounting/models/journalEntryModel.js";
import Journal from "../../accounting/models/journalModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";

export const createPaymentService = asyncHandler(async (invoiceId, body) => {
  await logger.info("Creating invoice payment", {
    invoiceId,
    amount: body.amount,
  });

  // Validate invoice exists
  const invoice = await PurchaseInvoice.findById(invoiceId);

  if (!invoice) {
    await logger.error("Invoice not found", { invoiceId });
    throw new ApiError(`🛑 No invoice found with ID: ${invoiceId}`, 404);
  }

  // Get last payment for this invoice
  const allInvoicePayments = await InvoicePayment.find({
    supplier: invoice.supplier,
    invoice: invoice._id,
  }).sort({ createdAt: -1 });

  const lastPayment = allInvoicePayments[0];
  let remainingAmount;

  if (lastPayment) {
    remainingAmount = lastPayment.remainingAmount - body.amount;
  } else {
    remainingAmount = invoice.totalPayment - body.amount;
  }

  // Validate payment amount
  if (body.amount <= 0) {
    throw new ApiError("🛑 Payment amount must be positive", 400);
  }

  if (remainingAmount < 0) {
    await logger.error("Payment amount exceeds remaining balance", {
      invoiceId,
      amount: body.amount,
      remaining: lastPayment
        ? lastPayment.remainingAmount
        : invoice.totalPayment,
    });
    throw new ApiError("🛑 Payment amount exceeds remaining balance", 400);
  }

  // Create payment record
  const paymentData = {
    supplier: invoice.supplier,
    invoice: invoice._id,
    amount: body.amount,
    remainingAmount: remainingAmount,
    paymentMethod: body.paymentMethod || "cash",
    notes: body.notes || "",
  };

  const payment = await InvoicePayment.create(paymentData);

  // Update invoice payment status
  if (Math.floor(remainingAmount) === 0) {
    invoice.paymentStatus = "paid";
    await logger.info("Invoice fully paid", { invoiceId });
  } else {
    invoice.paymentStatus = "partial";
    await logger.info("Partial payment recorded", {
      invoiceId,
      remaining: remainingAmount,
    });
  }

  await invoice.save({ validateBeforeSave: false });

  // Create journal entry for accounting
  await createJournalEntry(invoice, body.amount);

  await logger.info("Payment created successfully", {
    paymentId: payment._id,
    amount: body.amount,
    remaining: remainingAmount,
  });

  return payment;
});

const createJournalEntry = asyncHandler(async (invoice, amount) => {
  try {
    const debitAccount = await Account.findOne({ name: "supplier (AP)" });
    const creditAccount = await Account.findOne({ name: "cash/bank" });
    const journal = await Journal.findOne({ journalType: "invoice/payment" });

    if (!debitAccount || !creditAccount || !journal) {
      await logger.warn(
        "Accounting accounts or journal not found, skipping journal entry"
      );
      return;
    }

    await journalEntry.create({
      journalId: journal._id,
      lines: [
        {
          accountId: debitAccount._id,
          description: `Paying ${amount} of purchase invoice to supplier`,
          debit: amount,
          credit: 0,
        },
        {
          accountId: creditAccount._id,
          description: `Cash/Bank paid ${amount} for purchase invoice`,
          debit: 0,
          credit: amount,
        },
      ],
    });

    await logger.info("Journal entry created for payment", { amount });
  } catch (error) {
    await logger.error("Failed to create journal entry", {
      error: error.message,
    });
    // Don't throw error, just log it
  }
});

export const getPaymentsService = asyncHandler(async (invoiceId, req) => {
  await logger.info("Fetching payments for invoice", { invoiceId });

  // Verify invoice exists
  const invoice = await PurchaseInvoice.findById(invoiceId);
  if (!invoice) {
    throw new ApiError(`🛑 No invoice found with ID: ${invoiceId}`, 404);
  }

  // Get payments with filtering and pagination
  const result = await getAllService(
    InvoicePayment,
    req.query,
    "invoice-payment",
    { invoice: invoiceId }
  );

  // Populate related data
  const populatedData = await InvoicePayment.populate(result.data, [
    { path: "supplier", select: "name email phone" },
    {
      path: "invoice",
      select: "invoiceNumber totalPayment paymentStatus",
      populate: {
        path: "supplier",
        select: "name",
      },
    },
  ]);

  await logger.info("Payments fetched", {
    invoiceId,
    count: result.results,
  });

  return {
    data: populatedData,
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getPaymentStatsService = asyncHandler(async (invoiceId) => {
  const invoice = await PurchaseInvoice.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(`🛑 No invoice found with ID: ${invoiceId}`, 404);
  }

  const payments = await InvoicePayment.find({ invoice: invoiceId });

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = invoice.totalPayment - totalPaid;
  const paymentCount = payments.length;

  const lastPayment = payments[paymentCount - 1];

  return {
    totalAmount: invoice.totalPayment,
    totalPaid,
    remainingBalance,
    paymentCount,
    paymentStatus: invoice.paymentStatus,
    lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
    lastPaymentAmount: lastPayment ? lastPayment.amount : null,
  };
});
