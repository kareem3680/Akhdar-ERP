import { Router } from "express";
const router = Router();

import {
  createJournal,
  getJournals,
  deleteJournal,
  getJournalEntries,
} from "../controllers/journalController.js";
import {
  createJournalValidator,
  getJournalValidator,
} from "../validators/journalValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createJournalValidator,
  createJournal
);

router.get("/", protect, allowedTo("admin", "CEO"), getJournals);

router.delete(
  "/:journalId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalValidator,
  deleteJournal
);

router.get(
  "/entries/:journalId",
  protect,
  allowedTo("admin", "CEO"),
  getJournalValidator,
  getJournalEntries
);

export default router;
