import { Router } from "express";
const router = Router();

import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  postJournalEntry,
} from "../controllers/journalEntryController.js";
import {
  createJournalEntryValidator,
  getJournalEntryValidator,
} from "../validators/journalEntryValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createJournalEntryValidator,
  createJournalEntry
);

router.get("/", protect, allowedTo("admin", "CEO"), getJournalEntries);

router.get(
  "/:journalEntryId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalEntryValidator,
  getJournalEntry
);

router.patch(
  "/:journalEntryId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalEntryValidator,
  updateJournalEntry
);

router.delete(
  "/:journalEntryId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalEntryValidator,
  deleteJournalEntry
);

router.post(
  "/post/:journalEntryId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalEntryValidator,
  postJournalEntry
);

export default router;
