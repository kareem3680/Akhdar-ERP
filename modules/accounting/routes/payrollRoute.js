import { Router } from "express";
const router = Router();

import {
  getPayrolls,
  updatePayroll,
  payPayroll,
  getEmployeePayrollHistory,
} from "../controllers/payrollController.js";
import {
  getPayrollValidator,
  payPayrollValidator,
} from "../validators/payrollValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.get("/", protect, allowedTo("admin", "CEO"), getPayrolls);

router.patch(
  "/:payrollId",
  protect,
  allowedTo("admin", "CEO"),
  getPayrollValidator,
  updatePayroll
);

router.post(
  "/pay/:payrollId",
  protect,
  allowedTo("admin", "CEO"),
  payPayrollValidator,
  payPayroll
);

router.get(
  "/employee/:employeeId",
  protect,
  allowedTo("admin", "CEO"),
  getEmployeePayrollHistory
);

export default router;
