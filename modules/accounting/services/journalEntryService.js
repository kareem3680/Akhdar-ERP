import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("journal-entry");

import { sanitizeJournalEntry } from "../../../utils/sanitizeData.js";
import JournalEntry from "../models/journalEntryModel.js";
import Journal from "../models/journalModel.js";
import Account from "../models/accountModel.js";
import {
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";

export const createJournalEntryService = asyncHandler(async (body) => {
  await logger.info("Creating journal entry", {
    journalId: body.journalId,
    linesCount: body.lines.length,
  });

  // Validate journal exists
  const journal = await Journal.findById(body.journalId);
  if (!journal) {
    await logger.error("Journal not found", { journalId: body.journalId });
    throw new ApiError(`🛑 No journal found with ID: ${body.journalId}`, 404);
  }

  // Validate all accounts exist
  for (const line of body.lines) {
    const account = await Account.findById(line.accountId);
    if (!account) {
      await logger.error("Account not found", { accountId: line.accountId });
      throw new ApiError(`🛑 No account found with ID: ${line.accountId}`, 404);
    }
  }

  // Generate reference if not provided
  if (!body.reference) {
    const count = await JournalEntry.countDocuments();
    body.reference = `JE-${Date.now()}-${count + 1}`;
  }

  const journalEntry = await JournalEntry.create(body);

  await logger.info("Journal entry created successfully", {
    journalEntryId: journalEntry._id,
    reference: journalEntry.reference,
    totalLines: journalEntry.lines.length,
  });

  return sanitizeJournalEntry(journalEntry);
});

export const getJournalEntriesService = asyncHandler(async (req) => {
  const result = await getAllService(
    JournalEntry,
    req.query,
    "journal-entry",
    {},
    {
      populate: [
        { path: "journalId", select: "name journalType" },
        { path: "lines.accountId", select: "name code" },
      ],
    }
  );

  await logger.info("Fetched journal entries", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeJournalEntry),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getJournalEntryService = asyncHandler(async (id) => {
  const journalEntry = await getSpecificService(JournalEntry, id, {
    populate: [
      { path: "journalId", select: "name journalType" },
      { path: "lines.accountId", select: "name code type" },
    ],
  });

  await logger.info("Fetched specific journal entry", { id });

  return sanitizeJournalEntry(journalEntry);
});

export const updateJournalEntryService = asyncHandler(async (id, body) => {
  const journalEntry = await JournalEntry.findById(id);

  if (!journalEntry) {
    await logger.error("Journal entry to update not found", { id });
    throw new ApiError(`🛑 No journal entry found with ID: ${id}`, 404);
  }

  // Prevent updating if already posted
  if (journalEntry.status === "posted") {
    await logger.error("Cannot update posted journal entry", { id });
    throw new ApiError("🛑 Cannot update posted journal entry", 400);
  }

  Object.assign(journalEntry, body);
  await journalEntry.save();

  await logger.info("Journal entry updated", {
    id,
    updatedFields: Object.keys(body),
  });

  return sanitizeJournalEntry(journalEntry);
});

export const deleteJournalEntryService = asyncHandler(async (id) => {
  const journalEntry = await JournalEntry.findById(id);

  if (!journalEntry) {
    await logger.error("Journal entry to delete not found", { id });
    throw new ApiError(`🛑 No journal entry found with ID: ${id}`, 404);
  }

  // Prevent deleting if already posted
  if (journalEntry.status === "posted") {
    await logger.error("Cannot delete posted journal entry", { id });
    throw new ApiError("🛑 Cannot delete posted journal entry", 400);
  }

  await deleteService(JournalEntry, id);

  await logger.info("Journal entry deleted", { id });
});

export const postJournalEntryService = asyncHandler(async (id) => {
  const journalEntry = await JournalEntry.findById(id);

  if (!journalEntry) {
    await logger.error("Journal entry to post not found", { id });
    throw new ApiError(`🛑 No journal entry found with ID: ${id}`, 404);
  }

  if (journalEntry.status === "posted") {
    await logger.error("Journal entry already posted", { id });
    throw new ApiError("🛑 Journal entry already posted", 400);
  }

  journalEntry.status = "posted";
  await journalEntry.save();

  // Update account balances
  for (const line of journalEntry.lines) {
    const account = await Account.findById(line.accountId);
    if (account) {
      if (line.debit > 0) {
        account.amount += line.debit;
      } else if (line.credit > 0) {
        account.amount -= line.credit;
      }
      await account.save({ validateBeforeSave: false });
    }
  }

  await logger.info("Journal entry posted", {
    id,
    accountUpdates: journalEntry.lines.length,
  });

  return sanitizeJournalEntry(journalEntry);
});
