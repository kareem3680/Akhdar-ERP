import { Router } from "express";
const router = Router();

import {
  getInstallments,
  getInstallment,
  deleteInstallment,
  payInstallment,
  getOverdueInstallments,
} from "../controllers/loanInstallmentController.js";
import {
  getInstallmentValidator,
  payInstallmentValidator,
} from "../validators/loanInstallmentValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.get("/", protect, allowedTo("admin", "CEO"), getInstallments);

router.get(
  "/overdue",
  protect,
  allowedTo("admin", "CEO"),
  getOverdueInstallments
);

router.get(
  "/:installmentId",
  protect,
  allowedTo("admin", "CEO"),
  getInstallmentValidator,
  getInstallment
);

router.delete(
  "/:installmentId",
  protect,
  allowedTo("admin", "CEO"),
  getInstallmentValidator,
  deleteInstallment
);

router.post(
  "/pay/:installmentId",
  protect,
  allowedTo("admin", "CEO"),
  payInstallmentValidator,
  payInstallment
);

export default router;
