import asyncHandler from "express-async-handler";
import {
  getPayrollsService,
  updatePayrollService,
  payPayrollService,
  getEmployeePayrollHistoryService,
} from "../services/payrollService.js";

export const getPayrolls = asyncHandler(async (req, res) => {
  const response = await getPayrollsService(req);

  res.status(200).json({
    message: "Payrolls fetched successfully",
    ...response,
  });
});

export const updatePayroll = asyncHandler(async (req, res) => {
  const data = await updatePayrollService(req.params.payrollId, req.body);

  res.status(200).json({
    message: "Payroll updated successfully",
    data,
  });
});

export const payPayroll = asyncHandler(async (req, res) => {
  const data = await payPayrollService(req.params.payrollId, req.body);

  res.status(200).json({
    message: "Payroll paid successfully",
    data,
  });
});

export const getEmployeePayrollHistory = asyncHandler(async (req, res) => {
  const data = await getEmployeePayrollHistoryService(req.params.employeeId);

  res.status(200).json({
    message: "Employee payroll history fetched successfully",
    ...data,
  });
});
