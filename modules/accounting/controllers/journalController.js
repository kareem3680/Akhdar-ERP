import asyncHandler from "express-async-handler";
import {
  createJournalService,
  getJournalsService,
  deleteJournalService,
  getJournalEntriesService,
} from "../services/journalService.js";

export const createJournal = asyncHandler(async (req, res) => {
  const data = await createJournalService(req.body);

  res.status(201).json({
    message: "Journal created successfully",
    data,
  });
});

export const getJournals = asyncHandler(async (req, res) => {
  const response = await getJournalsService(req);

  res.status(200).json({
    message: "Journals fetched successfully",
    ...response,
  });
});

export const deleteJournal = asyncHandler(async (req, res) => {
  await deleteJournalService(req.params.journalId);

  res.status(204).json({
    message: "Journal deleted successfully",
  });
});

export const getJournalEntries = asyncHandler(async (req, res) => {
  const data = await getJournalEntriesService(req.params.journalId);

  res.status(200).json({
    message: "Journal entries fetched successfully",
    ...data,
  });
});
