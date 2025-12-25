import { Router } from "express";
const router = Router();

import {
  createLoan,
  getLoans,
  getLoan,
  updateLoan,
  deleteLoan,
  approveLoan,
  getLoanSummary,
} from "../controllers/loanController.js";
import {
  createLoanValidator,
  getLoanValidator,
  updateLoanValidator,
  approveLoanValidator,
} from "../validators/loanValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createLoanValidator,
  createLoan
);

router.get("/", protect, allowedTo("admin", "CEO"), getLoans);

router.get(
  "/:loanId",
  protect,
  allowedTo("admin", "CEO"),
  getLoanValidator,
  getLoan
);

router.patch(
  "/:loanId",
  protect,
  allowedTo("admin", "CEO"),
  updateLoanValidator,
  updateLoan
);

router.delete(
  "/:loanId",
  protect,
  allowedTo("admin", "CEO"),
  getLoanValidator,
  deleteLoan
);

router.post(
  "/approve/:loanId",
  protect,
  allowedTo("admin", "CEO"),
  approveLoanValidator,
  approveLoan
);

router.get(
  "/summary/:loanId",
  protect,
  allowedTo("admin", "CEO"),
  getLoanValidator,
  getLoanSummary
);

export default router;
