import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import departmentModel from "../modules/organization/models/departmentModel.js";
import employeeModel from "../modules/organization/models/employeeModel.js";

// Middleware to check if department has no active employees before deletion
export const checkNoActiveEmployees = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;

  if (!departmentId) {
    return next(new ApiError("Department ID is required", 400));
  }

  const employeeCount = await employeeModel.countDocuments({
    department: departmentId,
    active: true,
  });

  if (employeeCount > 0) {
    return next(
      new ApiError(
        `Cannot delete department. It has ${employeeCount} active employee(s).`,
        400
      )
    );
  }

  next();
});

// Middleware to check if department name is unique (case-insensitive)
export const checkUniqueName = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const { departmentId } = req.params;

  if (name) {
    const query = { name: { $regex: new RegExp(`^${name}$`, "i") } };

    if (departmentId) {
      query._id = { $ne: departmentId };
    }

    const existingDepartment = await departmentModel.findOne(query);

    if (existingDepartment) {
      return next(new ApiError("Department name already exists", 400));
    }
  }

  next();
});

// Middleware to validate department budget
export const validateDepartmentBudget = asyncHandler(async (req, res, next) => {
  const { budget } = req.body;
  const { departmentId } = req.params;

  if (budget !== undefined) {
    if (budget < 0) {
      return next(new ApiError("Department budget cannot be negative", 400));
    }

    // Check if budget is sufficient for current employees' salaries
    if (departmentId && budget > 0) {
      const totalSalaries = await employeeModel.aggregate([
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
          },
        },
      ]);

      const currentTotalSalary = totalSalaries[0]?.totalSalary || 0;

      if (budget < currentTotalSalary) {
        return next(
          new ApiError(
            `Department budget (${budget}) is less than total employees' salaries (${currentTotalSalary})`,
            400
          )
        );
      }
    }
  }

  next();
});

// Middleware to validate department manager
export const validateDepartmentManager = asyncHandler(
  async (req, res, next) => {
    const { manager } = req.body;

    if (manager) {
      const managerEmployee = await employeeModel.findById(manager);

      if (!managerEmployee) {
        return next(new ApiError("Manager employee not found", 404));
      }

      if (!managerEmployee.active) {
        return next(new ApiError("Manager employee is not active", 400));
      }

      // Optional: Check if manager has appropriate role/position
      // This could be enhanced based on your business rules
    }

    next();
  }
);

// Middleware to prevent department code duplication
export const checkUniqueCode = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  const { departmentId } = req.params;

  if (code) {
    const query = { code };

    if (departmentId) {
      query._id = { $ne: departmentId };
    }

    const existingDepartment = await departmentModel.findOne(query);

    if (existingDepartment) {
      return next(new ApiError("Department code already exists", 400));
    }
  }

  next();
});
