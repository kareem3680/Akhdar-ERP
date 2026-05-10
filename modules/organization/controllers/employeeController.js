import asyncHandler from "express-async-handler";

import {
  createEmployeeService,
  getEmployeesService,
  getSpecificEmployeeService,
  updateEmployeeService,
  deleteEmployeeService,
  activateEmployeeService,
  addEmployeeDocumentsService,
  deleteEmployeeDocumentService,
} from "../services/employeeService.js";

export const createEmployee = asyncHandler(async (req, res) => {
  const data = await createEmployeeService(
    req.body,
    req.user?.role || "employee",
  );
  res.status(201).json({
    message: "Employee created successfully",
    data,
  });
});

export const addEmployeeDocuments = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  const result = await addEmployeeDocumentsService({
    employeeId,
    userId,
    userRole,
    files: req.files?.documents || [],
  });

  res.status(200).json({
    message: "Employee documents uploaded successfully",
    ...result,
  });
});

export const deleteEmployeeDocument = asyncHandler(async (req, res) => {
  const { employeeId, fileId } = req.params;

  await deleteEmployeeDocumentService({
    employeeId,
    fileId,
    userId: req.user._id,
    userRole: req.user.role,
  });

  res.status(200).json({
    message: "Document deleted successfully",
  });
});

export const getEmployees = asyncHandler(async (req, res) => {
  const response = await getEmployeesService(req);
  res.status(200).json({
    message: "Employees fetched successfully",
    ...response,
  });
});

export const getEmployee = asyncHandler(async (req, res) => {
  const data = await getSpecificEmployeeService(req.params.employeeId);
  res.status(200).json({
    message: "Employee retrieved successfully",
    data,
  });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const data = await updateEmployeeService(
    req.params.employeeId,
    req.body,
    req.user?.role || "employee",
  );
  res.status(200).json({
    message: "Employee updated successfully",
    data,
  });
});

export const activateEmployee = asyncHandler(async (req, res) => {
  const data = await activateEmployeeService(
    req.params.employeeId,
    req.user?.role || "employee",
  );

  res.status(200).json({
    message: "Employee activated successfully",
    data,
  });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  await deleteEmployeeService(
    req.params.employeeId,
    req.user?.role || "employee",
  );
  res.status(204).json({
    message: "Employee deleted successfully",
  });
});
