import asyncHandler from "express-async-handler";
import departmentModel from "../models/departmentModel.js";
import employeeModel from "../models/employeeModel.js";
import { sanitizeDepartment } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("department");

// ========================
// Helper Functions (Logic)
// ========================

// Logic: Generate department code from name
const generateDepartmentCodeHelper = (departmentName) => {
  if (!departmentName) return "";
  const namePart = departmentName.substring(0, 3).toUpperCase();
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${namePart}${randomPart}`;
};

// Logic: Check if department can be deleted
const canDeleteDepartmentHelper = async (departmentId) => {
  const employeeCount = await employeeModel.countDocuments({
    department: departmentId,
    active: true,
  });
  return employeeCount === 0;
};

// Logic: Calculate department statistics
const calculateDepartmentStatsHelper = async (departmentId) => {
  const employeeCount = await employeeModel.countDocuments({
    department: departmentId,
    active: true,
  });

  const totalSalary = await employeeModel.aggregate([
    {
      $match: {
        department: departmentId,
        active: true,
      },
    },
    {
      $group: {
        _id: null,
        totalSalary: { $sum: "$salary" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  const stats = totalSalary[0] || {
    totalSalary: 0,
    avgSalary: 0,
    minSalary: 0,
    maxSalary: 0,
  };

  return {
    employeeCount,
    ...stats,
  };
};

// Logic: Check if department name is unique (case-insensitive)
const isDepartmentNameUniqueHelper = async (name, excludeId = null) => {
  const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingDepartment = await departmentModel.findOne(query);
  return !existingDepartment;
};

// ========================
// Main Services
// ========================

export const createDepartmentService = asyncHandler(async (body) => {
  const { name } = body;

  // Logic: Check if department name is unique
  const isUnique = await isDepartmentNameUniqueHelper(name);
  if (!isUnique) {
    await logger.error("Department creation failed - name already exists", {
      name,
    });
    throw new ApiError("🛑 Department name already exists", 400);
  }

  // Logic: Generate department code
  const code = generateDepartmentCodeHelper(name);
  const departmentData = { ...body, code };

  const newDepartment = await createService(departmentModel, departmentData);

  await logger.info("Department created", {
    departmentId: newDepartment._id,
    name: newDepartment.name,
    code: newDepartment.code,
  });

  return sanitizeDepartment(newDepartment);
});

export const getDepartmentsService = asyncHandler(async (req) => {
  const result = await getAllService(departmentModel, req.query, "department");

  // Logic: Get employee count and statistics for each department
  const departmentsWithStats = await Promise.all(
    result.data.map(async (dept) => {
      const stats = await calculateDepartmentStatsHelper(dept._id);
      return {
        ...sanitizeDepartment(dept),
        ...stats,
      };
    })
  );

  await logger.info("Fetched all departments", {
    count: result.results,
    page: req.query.page || 1,
  });

  return {
    data: departmentsWithStats,
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSpecificDepartmentService = asyncHandler(async (id) => {
  const department = await getSpecificService(departmentModel, id);

  // Get department employees
  const employees = await employeeModel
    .find({
      department: id,
      active: true,
    })
    .select("name email employeeId jobTitle")
    .limit(10);

  // Logic: Calculate department statistics
  const stats = await calculateDepartmentStatsHelper(id);

  const departmentData = sanitizeDepartment(department);
  departmentData.employees = employees;
  departmentData.stats = stats;

  await logger.info("Fetched department", {
    id,
    name: department.name,
  });

  return departmentData;
});

export const updateDepartmentService = asyncHandler(async (id, body) => {
  const { name } = body;

  // Check if department exists
  const department = await departmentModel.findById(id);
  if (!department) {
    await logger.error("Department to update not found", { id });
    throw new ApiError(
      `🛑 Cannot update. No department found with ID: ${id}`,
      404
    );
  }

  // Logic: Check if new name is unique (case-insensitive)
  if (name && name.toLowerCase() !== department.name.toLowerCase()) {
    const isUnique = await isDepartmentNameUniqueHelper(name, id);
    if (!isUnique) {
      await logger.error("Department name already exists", { name });
      throw new ApiError("🛑 Department name already exists", 400);
    }
  }

  const updatedDepartment = await updateService(departmentModel, id, body);

  await logger.info("Department updated", {
    id,
    name: updatedDepartment.name,
  });

  return sanitizeDepartment(updatedDepartment);
});

export const deleteDepartmentService = asyncHandler(async (id) => {
  // Check if department exists
  const department = await departmentModel.findById(id);
  if (!department) {
    await logger.error("Department to delete not found", { id });
    throw new ApiError(
      `🛑 Cannot delete. No department found with ID: ${id}`,
      404
    );
  }

  // Logic: Check if department has active employees
  const canDelete = await canDeleteDepartmentHelper(id);

  if (!canDelete) {
    const employeeCount = await employeeModel.countDocuments({
      department: id,
      active: true,
    });

    await logger.error("Cannot delete department with employees", {
      departmentId: id,
      employeeCount,
    });

    throw new ApiError(
      `🛑 Cannot delete department. It has ${employeeCount} active employee(s).`,
      400
    );
  }

  await deleteService(departmentModel, id);

  await logger.info("Department deleted", {
    id,
    name: department.name,
  });

  return null;
});

export const getDepartmentStatsService = asyncHandler(async () => {
  const totalDepartments = await departmentModel.countDocuments({
    active: true,
  });
  const departments = await departmentModel
    .find({ active: true })
    .select("name code");

  const stats = await Promise.all(
    departments.map(async (dept) => {
      const departmentStats = await calculateDepartmentStatsHelper(dept._id);
      return {
        departmentId: dept._id,
        name: dept.name,
        code: dept.code,
        ...departmentStats,
      };
    })
  );

  // Logic: Calculate overall statistics
  const totalEmployees = stats.reduce(
    (sum, dept) => sum + dept.employeeCount,
    0
  );
  const totalSalaries = stats.reduce((sum, dept) => sum + dept.totalSalary, 0);
  const avgSalary = totalEmployees > 0 ? totalSalaries / totalEmployees : 0;

  await logger.info("Fetched department statistics");

  return {
    totalDepartments,
    totalEmployees,
    totalSalaries,
    avgSalary,
    stats,
  };
});
