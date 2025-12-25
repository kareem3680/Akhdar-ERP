import asyncHandler from "express-async-handler";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("journal");

import {
  sanitizeJournal,
  sanitizeJournalEntry,
} from "../../../utils/sanitizeData.js";
import Journal from "../models/journalModel.js";
import JournalEntry from "../models/journalEntryModel.js";
import {
  getAllService,
  deleteService,
} from "../../../utils/servicesHandler.js";

export const createJournalService = asyncHandler(async (body) => {
  await logger.info("Creating new journal", {
    name: body.name,
    journalType: body.journalType,
  });

  // Check if journal code already exists
  const existingJournal = await Journal.findOne({ code: body.code });
  if (existingJournal) {
    await logger.error("Journal code already exists", { code: body.code });
    throw new ApiError("🛑 Journal code already exists", 400);
  }

  const journal = await Journal.create(body);

  await logger.info("Journal created successfully", {
    journalId: journal._id,
    name: journal.name,
    code: journal.code,
  });

  return sanitizeJournal(journal);
});

export const getJournalsService = asyncHandler(async (req) => {
  const result = await getAllService(Journal, req.query, "journal");

  await logger.info("Fetched journals", {
    count: result.results,
  });

  return {
    data: result.data.map(sanitizeJournal),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const deleteJournalService = asyncHandler(async (id) => {
  const journal = await Journal.findById(id);

  if (!journal) {
    await logger.error("Journal to delete not found", { id });
    throw new ApiError(`🛑 No journal found with ID: ${id}`, 404);
  }

  // Check if journal has entries
  const journalEntries = await JournalEntry.find({ journalId: id });

  if (journalEntries.length > 0) {
    await logger.error("Cannot delete journal with entries", {
      id,
      entryCount: journalEntries.length,
    });
    throw new ApiError("🛑 Cannot delete journal with existing entries", 400);
  }

  await deleteService(Journal, id);

  await logger.info("Journal deleted", { id });
});

export const getJournalEntriesService = asyncHandler(async (journalId) => {
  const journal = await Journal.findById(journalId);

  if (!journal) {
    await logger.error("Journal not found", { journalId });
    throw new ApiError(`🛑 No journal found with ID: ${journalId}`, 404);
  }

  const result = await getAllService(
    JournalEntry,
    {},
    "journal-entry",
    {
      journalId,
    },
    {
      populate: [{ path: "lines.accountId", select: "name code" }],
    }
  );

  await logger.info("Fetched journal entries", {
    journalId,
    count: result.results,
  });

  return {
    journal: sanitizeJournal(journal),
    entries: result.data.map(sanitizeJournalEntry),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});
