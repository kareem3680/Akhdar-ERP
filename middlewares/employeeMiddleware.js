import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import employeeModel from "../modules/organization/models/employeeModel.js";

// Middleware to check if employee is not their own manager
export const checkSelfManager = asyncHandler(async (req, res, next) => {
  const { manager } = req.body;
  const employeeId = req.params.employeeId || req.body._id;

  if (manager && employeeId && manager === employeeId) {
    return next(new ApiError("Employee cannot be their own manager", 400));
  }

  next();
});

// Middleware to check if employee age is between 18-80 years
export const checkAgeRange = asyncHandler(async (req, res, next) => {
  const { birthDate } = req.body;

  if (birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();

    // Adjust age if birthday hasn't occurred this year
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      return next(new ApiError("Employee must be at least 18 years old", 400));
    }

    if (age > 80) {
      return next(new ApiError("Employee cannot be older than 80 years", 400));
    }
  }

  next();
});

// Middleware to check if employment date is not in the future
export const checkEmploymentDate = asyncHandler(async (req, res, next) => {
  const { employmentDate } = req.body;

  if (employmentDate) {
    const empDate = new Date(employmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (empDate > today) {
      return next(new ApiError("Employment date cannot be in the future", 400));
    }
  }

  next();
});

// Middleware to validate salary based on job title
export const validateSalaryByJobTitle = asyncHandler(async (req, res, next) => {
  const { salary, jobTitle } = req.body;

  if (salary && jobTitle) {
    const title = jobTitle.toLowerCase();

    // Define minimum salaries based on job titles
    const minSalaries = {
      manager: 3000,
      director: 5000,
      vp: 8000,
      ceo: 15000,
    };

    // Check if job title contains any of the keywords
    for (const [keyword, minSalary] of Object.entries(minSalaries)) {
      if (title.includes(keyword) && salary < minSalary) {
        return next(
          new ApiError(
            `${
              keyword.charAt(0).toUpperCase() + keyword.slice(1)
            } salary should be at least ${minSalary}`,
            400
          )
        );
      }
    }
  }

  next();
});

// Middleware to check if manager exists and is active
export const validateManager = asyncHandler(async (req, res, next) => {
  const { manager } = req.body;

  if (manager) {
    const managerEmployee = await employeeModel.findById(manager);

    if (!managerEmployee) {
      return next(new ApiError("Manager not found", 404));
    }

    if (!managerEmployee.active) {
      return next(new ApiError("Manager is not active", 400));
    }
  }

  next();
});

// Middleware to prevent circular management hierarchy
export const preventCircularManagement = asyncHandler(
  async (req, res, next) => {
    const employeeId = req.params.employeeId;
    const { manager } = req.body;

    if (employeeId && manager) {
      // Check if the new manager is under the employee in the hierarchy
      let currentManager = manager;
      const visited = new Set();

      while (currentManager) {
        if (visited.has(currentManager.toString())) {
          break; // Circular reference detected
        }

        visited.add(currentManager.toString());

        if (currentManager.toString() === employeeId) {
          return next(
            new ApiError("Cannot create circular management hierarchy", 400)
          );
        }

        const managerEmployee = await employeeModel
          .findById(currentManager)
          .select("manager");

        if (!managerEmployee || !managerEmployee.manager) {
          break;
        }

        currentManager = managerEmployee.manager;
      }
    }

    next();
  }
);

// Middleware to validate role based on user's permissions
export const validateRoleAssignment = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const userRole = req.user?.role || "employee";

  if (role) {
    // Define allowed roles hierarchy
    const allowedRoles = {
      admin: [
        "admin",
        "employee",
        "manager",
        "HR",
        "CEO",
        "accountant",
        "supervisor",
      ],
      CEO: ["employee", "manager", "HR", "accountant", "supervisor"],
      HR: ["employee", "manager", "supervisor"],
      manager: ["employee"],
      employee: [], // Employees cannot assign roles
    };

    const userAllowedRoles = allowedRoles[userRole] || [];

    if (!userAllowedRoles.includes(role)) {
      return next(
        new ApiError(`You are not authorized to assign the '${role}' role`, 403)
      );
    }
  }

  next();
});
