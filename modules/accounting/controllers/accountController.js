import asyncHandler from "express-async-handler";
import {
  createAccountService,
  getAccountsService,
  deleteAccountService,
  getAccountJournalEntriesService,
  getAccountBalanceService,
} from "../services/accountService.js";

export const createAccount = asyncHandler(async (req, res) => {
  const data = await createAccountService(req.body);

  res.status(201).json({
    message: "Account created successfully",
    data,
  });
});

export const getAccounts = asyncHandler(async (req, res) => {
  const response = await getAccountsService(req);

  res.status(200).json({
    message: "Accounts fetched successfully",
    ...response,
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await deleteAccountService(req.params.accountId);

  res.status(204).json({
    message: "Account deleted successfully",
  });
});

export const getAccountJournalEntries = asyncHandler(async (req, res) => {
  const data = await getAccountJournalEntriesService(req.params.accountId);

  res.status(200).json({
    message: "Account journal entries fetched successfully",
    ...data,
  });
});

export const getAccountBalance = asyncHandler(async (req, res) => {
  const data = await getAccountBalanceService(req.params.accountId);

  res.status(200).json({
    message: "Account balance retrieved successfully",
    data,
  });
});
