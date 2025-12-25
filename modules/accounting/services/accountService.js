import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("account");

import { sanitizeAccount } from "../../../utils/sanitizeData.js";
import Account from "../models/accountModel.js";
import JournalEntry from "../models/journalEntryModel.js";
import {
  getAllService,
  deleteService,
} from "../../../utils/servicesHandler.js";

export const createAccountService = asyncHandler(async (body) => {
  await logger.info("Creating new account", {
    name: body.name,
    code: body.code,
  });

  // Check if account code already exists
  const existingAccount = await Account.findOne({
    code: body.code.toUpperCase(),
  });
  if (existingAccount) {
    await logger.error("Account code already exists", { code: body.code });
    throw new ApiError("🛑 Account code already exists", 400);
  }

  // Ensure code is uppercase
  body.code = body.code.toUpperCase();

  const account = await Account.create(body);

  await logger.info("Account created successfully", {
    accountId: account._id,
    name: account.name,
    code: account.code,
  });

  return sanitizeAccount(account);
});

export const getAccountsService = asyncHandler(async (req) => {
  const result = await getAllService(
    Account,
    req.query,
    "account",
    { isActive: true },
    {
      populate: [{ path: "parentAccount", select: "name code" }],
    }
  );

  await logger.info("Fetched accounts", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeAccount),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const deleteAccountService = asyncHandler(async (id) => {
  const account = await Account.findById(id);

  if (!account) {
    await logger.error("Account to delete not found", { id });
    throw new ApiError(`🛑 No account found with ID: ${id}`, 404);
  }

  // Check if account has journal entries
  const journalEntries = await JournalEntry.find({
    "lines.accountId": id,
  });

  if (journalEntries.length > 0) {
    await logger.error("Cannot delete account with journal entries", {
      id,
      entryCount: journalEntries.length,
    });
    throw new ApiError(
      "🛑 Cannot delete account with existing journal entries",
      400
    );
  }

  await deleteService(Account, id);

  await logger.info("Account deleted", { id });
});

export const getAccountJournalEntriesService = asyncHandler(
  async (accountId) => {
    const account = await Account.findById(accountId);

    if (!account) {
      await logger.error("Account not found", { accountId });
      throw new ApiError(`🛑 No account found with ID: ${accountId}`, 404);
    }

    const journalEntries = await JournalEntry.find({
      "lines.accountId": accountId,
    }).populate([
      { path: "journalId", select: "name journalType" },
      { path: "lines.accountId", select: "name code" },
    ]);

    let totalDebit = 0;
    let totalCredit = 0;
    const entries = [];

    // Calculate totals
    journalEntries.forEach((journalEntry) => {
      journalEntry.lines.forEach((line) => {
        if (line.accountId._id.toString() === accountId) {
          totalDebit += line.debit;
          totalCredit += line.credit;
          entries.push({
            journalEntryId: journalEntry._id,
            date: journalEntry.date,
            reference: journalEntry.reference,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            journalName: journalEntry.journalId?.name,
          });
        }
      });
    });

    await logger.info("Fetched account journal entries", {
      accountId,
      entryCount: entries.length,
      totalDebit,
      totalCredit,
    });

    return {
      account: sanitizeAccount(account),
      entries,
      totalDebit,
      totalCredit,
      balance: totalDebit - totalCredit,
    };
  }
);

export const getAccountBalanceService = asyncHandler(async (accountId) => {
  const result = await getAccountJournalEntriesService(accountId);

  return {
    account: result.account,
    balance: result.balance,
    lastUpdated: new Date(),
  };
});
