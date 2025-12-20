import asyncHandler from "express-async-handler";

import {
  createDepartmentService,
  getDepartmentsService,
  getSpecificDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
  getDepartmentStatsService,
} from "../services/departmentService.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const data = await createDepartmentService(req.body);
  res.status(201).json({
    message: "Department created successfully",
    data,
  });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const response = await getDepartmentsService(req);
  res.status(200).json({
    message: "Departments fetched successfully",
    ...response,
  });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const data = await getSpecificDepartmentService(req.params.departmentId);
  res.status(200).json({
    message: "Department retrieved successfully",
    data,
  });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const data = await updateDepartmentService(req.params.departmentId, req.body);
  res.status(200).json({
    message: "Department updated successfully",
    data,
  });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await deleteDepartmentService(req.params.departmentId);
  res.status(204).json({
    message: "Department deleted successfully",
  });
});

export const getDepartmentStats = asyncHandler(async (req, res) => {
  const response = await getDepartmentStatsService();
  res.status(200).json({
    message: "Department statistics fetched successfully",
    ...response,
  });
});
