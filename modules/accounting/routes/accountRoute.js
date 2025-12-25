import { Router } from "express";
const router = Router();

import {
  createAccount,
  getAccounts,
  deleteAccount,
  getAccountJournalEntries,
  getAccountBalance,
} from "../controllers/accountController.js";
import {
  createAccountValidator,
  getAccountValidator,
} from "../validators/accountValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createAccountValidator,
  createAccount
);

router.get("/", protect, allowedTo("admin", "CEO"), getAccounts);

router.delete(
  "/:accountId",
  protect,
  allowedTo("admin", "CEO"),
  getAccountValidator,
  deleteAccount
);

router.get(
  "/journal-entries/:accountId",
  protect,
  allowedTo("admin", "CEO"),
  getAccountValidator,
  getAccountJournalEntries
);

router.get(
  "/balance/:accountId",
  protect,
  allowedTo("admin", "CEO"),
  getAccountValidator,
  getAccountBalance
);

export default router;
