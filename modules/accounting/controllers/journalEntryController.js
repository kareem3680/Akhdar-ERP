import asyncHandler from "express-async-handler";
import {
  createJournalEntryService,
  getJournalEntriesService,
  getJournalEntryService,
  updateJournalEntryService,
  deleteJournalEntryService,
  postJournalEntryService,
} from "../services/journalEntryService.js";

export const createJournalEntry = asyncHandler(async (req, res) => {
  const data = await createJournalEntryService(req.body);

  res.status(201).json({
    message: "Journal entry created successfully",
    data,
  });
});

export const getJournalEntries = asyncHandler(async (req, res) => {
  const response = await getJournalEntriesService(req);

  res.status(200).json({
    message: "Journal entries fetched successfully",
    ...response,
  });
});

export const getJournalEntry = asyncHandler(async (req, res) => {
  const data = await getJournalEntryService(req.params.journalEntryId);

  res.status(200).json({
    message: "Journal entry retrieved successfully",
    data,
  });
});

export const updateJournalEntry = asyncHandler(async (req, res) => {
  const data = await updateJournalEntryService(
    req.params.journalEntryId,
    req.body
  );

  res.status(200).json({
    message: "Journal entry updated successfully",
    data,
  });
});

export const deleteJournalEntry = asyncHandler(async (req, res) => {
  await deleteJournalEntryService(req.params.journalEntryId);

  res.status(204).json({
    message: "Journal entry deleted successfully",
  });
});

export const postJournalEntry = asyncHandler(async (req, res) => {
  const data = await postJournalEntryService(req.params.journalEntryId);

  res.status(200).json({
    message: "Journal entry posted successfully",
    data,
  });
});
