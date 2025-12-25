import asyncHandler from "express-async-handler";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("stats");

import journalEntry from "../../accounting/models/journalEntryModel.js";
import Account from "../../accounting/models/accountModel.js";
import SaleInvoice from "../../sales/models/saleInvoiceModel.js";
import PurchaseInvoice from "../../purchase/models/purchaseInvoiceModel.js";
import InvoicePayment from "../../purchase/models/purchaseInvoicePaymentModel.js";
import Payroll from "../../accounting/models/payrollModel.js";
import SaleOrder from "../../sales/models/saleOrderModel.js";
import Product from "../../product/models/productModel.js";
import statsModel from "../models/statsModel.js";

export const getStatsService = asyncHandler(async (req) => {
  await logger.info("Fetching system statistics");

  const journalEntries = await journalEntry.find();

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;
  let totalBank = 0;
  let totalReceivable = 0;
  let totalPayable = 0;
  let totalGrossProfit = 0;
  let netProfit = 0;

  // Calculate revenue and expenses from journal entries
  for (let journal of journalEntries) {
    const { lines } = journal;
    for (let account of lines) {
      // Sales revenue account
      if (account.accountId == "68f7aa37ca9c11d20f73e216") {
        totalRevenue += account.credit;
      }

      // Purchase expenses account
      if (account.accountId == "68f7c1cab88c0da2d5579bea") {
        totalExpenses += account.debit;
      }

      // Shipping expenses account
      if (account.accountId == "6919e94083bdffcbad65cacc") {
        totalExpenses += account.debit;
      }

      // Employee salaries account
      if (account.accountId == "691dd0dad78aa8ff882ce606") {
        totalExpenses += account.debit;
      }
    }
  }

  totalProfit = totalRevenue - totalExpenses;

  // Calculate bank balance
  try {
    const bank = await Account.findById("68efb30d10ece820d2f077dc");
    totalBank = bank ? bank.amount + totalProfit : totalProfit;
  } catch (error) {
    await logger.error("Bank account not found", { error: error.message });
    totalBank = totalProfit;
  }

  // Calculate accounts receivable
  const expectedReceivable = await SaleInvoice.find({
    paymentStatus: "unpaid",
  });
  totalReceivable = expectedReceivable.reduce(
    (acc, cur) => acc + cur.totalPayment,
    0
  );

  // Calculate accounts payable
  const invoices = await PurchaseInvoice.find();
  for (let invoice of invoices) {
    const payments = await InvoicePayment.find({ invoice: invoice._id });
    if (payments.length > 0) {
      const lastPayment = payments[payments.length - 1];
      totalPayable += lastPayment.remainingAmount;
    }
  }

  // Calculate unpaid payroll
  const payrolls = await Payroll.find({ status: "unpaid" });
  totalPayable += payrolls.reduce((acc, cur) => acc + cur.total, 0);

  // Calculate total sales
  let totalSaleAmount = 0;
  const salesOrders = await SaleOrder.find();
  for (let saleOrder of salesOrders) {
    const { products } = saleOrder;
    for (let product of products) {
      totalSaleAmount += product.total;
    }
  }

  // Calculate total product cost
  const products = await Product.find();
  let totalProductsAmount = products.reduce((acc, cur) => acc + cur.price, 0);
  totalGrossProfit = totalSaleAmount - totalProductsAmount;

  // Net profit
  netProfit = totalProfit;

  // Save statistics to database
  const statsData = {
    totalRevenue,
    totalExpenses,
    totalProfit,
    totalBank,
    totalReceivable,
    totalPayable,
    totalGrossProfit,
    netProfit,
  };

  await statsModel.create(statsData);

  await logger.info("Statistics fetched successfully", {
    revenue: totalRevenue,
    profit: totalProfit,
  });

  return statsData;
});

export const getStatsHistoryService = asyncHandler(async (req) => {
  const { from, to } = req.query;

  let filter = {};

  if (from && to) {
    filter.calculatedAt = {
      $gte: new Date(from),
      $lte: new Date(to),
    };
  }

  await logger.info("Fetching statistics history", { filter });

  const statsHistory = await statsModel.find(filter).sort({ calculatedAt: -1 });

  return {
    results: statsHistory.length,
    data: statsHistory,
  };
});
