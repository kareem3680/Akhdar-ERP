import asyncHandler from "express-async-handler";
import employeeModel from "../../organization/models/employeeModel.js";
import payrollModel from "../../accounting/models/payrollModel.js";
import { sanitizeEmployee } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../../middlewares/uploadMiddleware.js";

const logger = new Logger("employee");

// ========================
// Helper Functions (Logic)
// ========================

// Logic: Calculate years of experience
const calculateExperienceYearsHelper = (employmentDate) => {
  if (!employmentDate) return 0;
  const startDate = new Date(employmentDate);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
};

// Logic: Calculate age from birth date
const calculateAgeHelper = (birthDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const diffTime = Math.abs(now - birth);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
};

// Logic: Validate employee age (18-80 years)
const validateAgeHelper = (birthDate) => {
  const age = calculateAgeHelper(birthDate);
  if (age === null) return true; // No birth date provided
  return age >= 18 && age <= 80;
};

// Logic: Check if employment date is not in future
const validateEmploymentDateHelper = (employmentDate) => {
  const date = new Date(employmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

// Logic: Check if employee is not their own manager
const validateSelfManagerHelper = (employeeId, managerId) => {
  if (!employeeId || !managerId) return true;
  return employeeId.toString() !== managerId.toString();
};

// Logic: Update related payrolls when salary changes
const updateRelatedPayrollsHelper = async (employeeId, newSalary) => {
  try {
    const result = await payrollModel.updateMany(
      { employee: employeeId, status: { $ne: "paid" } },
      { salary: newSalary }
    );

    await logger.info("Updated payrolls for employee salary change", {
      employeeId,
      newSalary,
      modifiedCount: result.modifiedCount,
    });

    return result.modifiedCount;
  } catch (error) {
    await logger.error("Failed to update payrolls", {
      employeeId,
      error: error.message,
    });
    return 0;
  }
};

// Logic: Validate Egyptian national ID (14 digits, starts with 2 or 3)
const validateEgyptianNationalIdHelper = (nationalId) => {
  if (!nationalId || nationalId.length !== 14) return false;

  // Check if all characters are digits
  if (!/^\d+$/.test(nationalId)) return false;

  // Check if starts with valid century code (2 for 1900s, 3 for 2000s)
  const centuryCode = parseInt(nationalId.charAt(0));
  if (![2, 3].includes(centuryCode)) return false;

  return true;
};

// Logic: Calculate employee bonus based on level of experience
const calculateBonusByExperienceHelper = (levelOfExperience, baseSalary) => {
  const bonusPercentages = {
    junior: 0.05, // 5%
    mid: 0.1, // 10%
    senior: 0.15, // 15%
    expert: 0.2, // 20%
  };

  const percentage = bonusPercentages[levelOfExperience] || 0;
  return baseSalary * percentage;
};

// Logic: Validate role is one of allowed values
const validateRoleHelper = (role) => {
  const allowedRoles = [
    "admin",
    "employee",
    "manager",
    "HR",
    "CEO",
    "accountant",
    "supervisor",
  ];
  return allowedRoles.includes(role);
};

// Logic: Get allowed roles for specific user
const getAllowedRolesForUserHelper = (userRole) => {
  // Define hierarchy of who can assign which roles
  const roleHierarchy = {
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

  return roleHierarchy[userRole] || ["employee"];
};

// ========================
// Main Services
// ========================

export const createEmployeeService = asyncHandler(
  async (body, userRole = "admin") => {
    const { ...rest } = body;

    // Logic: Validate national ID
    if (!validateEgyptianNationalIdHelper(rest.nationalId)) {
      await logger.error("Invalid Egyptian national ID", {
        nationalId: rest.nationalId,
      });
      throw new ApiError("🛑 Invalid Egyptian national ID format", 400);
    }

    // Logic: Validate role
    if (rest.role && !validateRoleHelper(rest.role)) {
      await logger.error("Invalid role assigned", {
        role: rest.role,
        userRole,
      });
      throw new ApiError("🛑 Invalid role", 400);
    }

    // Logic: Check if user has permission to assign this role
    const allowedRoles = getAllowedRolesForUserHelper(userRole);
    if (rest.role && !allowedRoles.includes(rest.role)) {
      await logger.error("User not authorized to assign this role", {
        userRole,
        attemptedRole: rest.role,
        allowedRoles,
      });
      throw new ApiError("🛑 You are not authorized to assign this role", 403);
    }

    // Check if email already exists
    const existingEmployee = await employeeModel.findOne({ email: rest.email });
    if (existingEmployee) {
      await logger.error("Employee creation failed - email already exists", {
        email: rest.email,
      });
      throw new ApiError("🛑 Email already exists", 400);
    }

    // Check if national ID already exists
    const existingNationalId = await employeeModel.findOne({
      nationalId: rest.nationalId,
    });
    if (existingNationalId) {
      await logger.error(
        "Employee creation failed - national ID already exists",
        {
          nationalId: rest.nationalId,
        }
      );
      throw new ApiError("🛑 National ID already exists", 400);
    }

    // Logic: Validate age
    if (rest.birthDate && !validateAgeHelper(rest.birthDate)) {
      await logger.error("Employee age validation failed", {
        birthDate: rest.birthDate,
      });
      throw new ApiError(
        "🛑 Employee must be between 18 and 80 years old",
        400
      );
    }

    // Logic: Validate employment date
    if (!validateEmploymentDateHelper(rest.employmentDate)) {
      await logger.error("Employment date cannot be in the future", {
        employmentDate: rest.employmentDate,
      });
      throw new ApiError("🛑 Employment date cannot be in the future", 400);
    }

    // Logic: Validate self-manager
    if (!validateSelfManagerHelper(rest._id, rest.manager)) {
      await logger.error("Employee cannot be their own manager");
      throw new ApiError("🛑 Employee cannot be their own manager", 400);
    }

    // Logic: Calculate bonus based on experience level if not provided
    if (!rest.bonus && rest.levelOfExperience && rest.salary) {
      rest.bonus = calculateBonusByExperienceHelper(
        rest.levelOfExperience,
        rest.salary
      );
    }

    // Default role if not provided
    if (!rest.role) {
      rest.role = "employee";
    }

    const newEmployee = await createService(employeeModel, rest);

    // Create payroll entry
    await payrollModel.create({
      employee: newEmployee._id,
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 30),
      salary: newEmployee.salary,
      status: "pending",
    });

    await logger.info("Employee created", {
      employeeId: newEmployee._id,
      email: newEmployee.email,
      jobTitle: newEmployee.jobTitle,
      role: newEmployee.role,
      employeeId: newEmployee.employeeId,
    });

    return sanitizeEmployee(newEmployee);
  }
);

export const getEmployeesService = asyncHandler(async (req) => {
  const result = await getAllService(
    employeeModel,
    req.query,
    "employee",
    {},
    {
      populate: [
        { path: "department", select: "name code" },
        { path: "manager", select: "name email phone employeeId" },
      ],
    }
  );

  // Logic: Add calculated fields to each employee
  const employeesWithCalculations = result.data.map((employee) => {
    const employeeObj = employee.toObject ? employee.toObject() : employee;

    // Calculate experience years
    employeeObj.experienceYears = calculateExperienceYearsHelper(
      employee.employmentDate
    );

    // Calculate age
    employeeObj.age = calculateAgeHelper(employee.birthDate);

    return employeeObj;
  });

  await logger.info("Fetched all employees", {
    count: result.results,
    page: req.query.page || 1,
  });

  return {
    data: employeesWithCalculations.map(sanitizeEmployee),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSpecificEmployeeService = asyncHandler(async (id) => {
  const employee = await getSpecificService(employeeModel, id, {
    populate: [
      { path: "department", select: "name code description" },
      { path: "manager", select: "name email phone employeeId jobTitle" },
    ],
  });

  // Logic: Add calculated fields
  const employeeObj = employee.toObject ? employee.toObject() : employee;
  employeeObj.experienceYears = calculateExperienceYearsHelper(
    employee.employmentDate
  );
  employeeObj.age = calculateAgeHelper(employee.birthDate);

  await logger.info("Fetched employee", {
    id,
    name: employee.name,
    employeeId: employee.employeeId,
    role: employee.role,
  });

  return sanitizeEmployee(employeeObj);
});

export const updateEmployeeService = asyncHandler(
  async (id, body, userRole = "admin") => {
    // Check if employee exists
    const employee = await employeeModel.findById(id);
    if (!employee) {
      await logger.error("Employee to update not found", { id });
      throw new ApiError(
        `🛑 Cannot update. No employee found with ID: ${id}`,
        404
      );
    }

    // Check if email is being updated and if it already exists
    if (body.email && body.email !== employee.email) {
      const existingEmail = await employeeModel.findOne({ email: body.email });
      if (existingEmail) {
        await logger.error("Email already in use", { email: body.email });
        throw new ApiError("🛑 E-Mail already exists", 400);
      }
    }

    // Check if national ID is being updated and if it already exists
    if (body.nationalId && body.nationalId !== employee.nationalId) {
      const existingNationalId = await employeeModel.findOne({
        nationalId: body.nationalId,
      });
      if (existingNationalId) {
        await logger.error("National ID already in use", {
          nationalId: body.nationalId,
        });
        throw new ApiError("🛑 National ID already exists", 400);
      }
    }

    // Logic: Validate national ID if being updated
    if (body.nationalId && !validateEgyptianNationalIdHelper(body.nationalId)) {
      await logger.error("Invalid Egyptian national ID during update", {
        nationalId: body.nationalId,
      });
      throw new ApiError("🛑 Invalid Egyptian national ID format", 400);
    }

    // Logic: Validate age if birth date is being updated
    if (body.birthDate && !validateAgeHelper(body.birthDate)) {
      await logger.error("Age validation failed during update", {
        birthDate: body.birthDate,
      });
      throw new ApiError(
        "🛑 Employee must be between 18 and 80 years old",
        400
      );
    }

    // Logic: Validate self-manager if manager is being updated
    if (body.manager && !validateSelfManagerHelper(id, body.manager)) {
      await logger.error("Employee cannot be their own manager during update");
      throw new ApiError("🛑 Employee cannot be their own manager", 400);
    }

    // Logic: Validate role if being updated
    if (body.role && body.role !== employee.role) {
      if (!validateRoleHelper(body.role)) {
        await logger.error("Invalid role assigned during update", {
          role: body.role,
          userRole,
        });
        throw new ApiError("🛑 Invalid role", 400);
      }

      // Logic: Check if user has permission to assign this role
      const allowedRoles = getAllowedRolesForUserHelper(userRole);
      if (!allowedRoles.includes(body.role)) {
        await logger.error(
          "User not authorized to assign this role during update",
          {
            userRole,
            attemptedRole: body.role,
            allowedRoles,
          }
        );
        throw new ApiError(
          "🛑 You are not authorized to assign this role",
          403
        );
      }

      // Logic: Prevent demoting someone with equal or higher authority
      const roleHierarchy = {
        admin: 7,
        CEO: 6,
        HR: 5,
        manager: 4,
        accountant: 3,
        supervisor: 2,
        employee: 1,
      };

      const currentRoleLevel = roleHierarchy[employee.role] || 0;
      const newRoleLevel = roleHierarchy[body.role] || 0;
      const userRoleLevel = roleHierarchy[userRole] || 0;

      // User can only assign roles at or below their own level
      if (newRoleLevel > userRoleLevel) {
        await logger.error("User trying to assign role above their own level", {
          userRole,
          userRoleLevel,
          newRole: body.role,
          newRoleLevel,
        });
        throw new ApiError(
          "🛑 You cannot assign a role higher than your own",
          403
        );
      }
    }

    // Handle avatar update - delete old Cloudinary image
    if (body.avatar && employee.avatar && body.avatar !== employee.avatar) {
      const publicId = extractPublicIdFromUrl(employee.avatar);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          await logger.info("Deleted old employee avatar from Cloudinary", {
            employeeId: id,
            publicId,
          });
        } catch (error) {
          await logger.error("Failed to delete old avatar from Cloudinary", {
            employeeId: id,
            error: error.message,
          });
        }
      }
    }

    // Update salary in payroll if salary is being updated
    if (body.salary && body.salary !== employee.salary) {
      const updatedCount = await updateRelatedPayrollsHelper(id, body.salary);

      await logger.info("Updated payroll salary", {
        employeeId: id,
        oldSalary: employee.salary,
        newSalary: body.salary,
        updatedPayrolls: updatedCount,
      });
    }

    // Logic: Recalculate bonus if level of experience changes
    if (body.levelOfExperience && !body.bonus) {
      const baseSalary = body.salary || employee.salary;
      body.bonus = calculateBonusByExperienceHelper(
        body.levelOfExperience,
        baseSalary
      );
    }

    const updatedEmployee = await updateService(employeeModel, id, body);

    // Logic: Add calculated fields to response
    const employeeObj = updatedEmployee.toObject
      ? updatedEmployee.toObject()
      : updatedEmployee;
    employeeObj.experienceYears = calculateExperienceYearsHelper(
      updatedEmployee.employmentDate
    );
    employeeObj.age = calculateAgeHelper(updatedEmployee.birthDate);

    await logger.info("Employee updated successfully", {
      id,
      updatedFields: Object.keys(body),
      roleUpdated: body.role ? true : false,
    });

    return sanitizeEmployee(employeeObj);
  }
);

export const deleteEmployeeService = asyncHandler(
  async (id, userRole = "admin") => {
    // Check if employee exists
    const employee = await employeeModel.findById(id);
    if (!employee) {
      await logger.error("Employee to delete not found", { id });
      throw new ApiError(
        `🛑 Cannot delete. No employee found with ID: ${id}`,
        404
      );
    }

    // Logic: Check if user has permission to delete employee based on roles
    const roleHierarchy = {
      admin: 7,
      CEO: 6,
      HR: 5,
      manager: 4,
      accountant: 3,
      supervisor: 2,
      employee: 1,
    };

    const employeeRoleLevel = roleHierarchy[employee.role] || 0;
    const userRoleLevel = roleHierarchy[userRole] || 0;

    // Only admin can delete other admins, CEOs, or HR
    if (employeeRoleLevel >= 5 && userRole !== "admin") {
      // admin, CEO, HR
      await logger.error("User not authorized to delete high-level employee", {
        userRole,
        employeeRole: employee.role,
        employeeId: id,
      });
      throw new ApiError(
        "🛑 You are not authorized to delete this employee",
        403
      );
    }

    // Users can only delete employees with lower or equal role level
    if (employeeRoleLevel > userRoleLevel) {
      await logger.error(
        "User trying to delete employee with higher role level",
        {
          userRole,
          userRoleLevel,
          employeeRole: employee.role,
          employeeRoleLevel,
        }
      );
      throw new ApiError(
        "🛑 You cannot delete an employee with a higher role level",
        403
      );
    }

    // Delete avatar from Cloudinary if exists
    if (employee.avatar) {
      const publicId = extractPublicIdFromUrl(employee.avatar);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          await logger.info("Deleted employee avatar from Cloudinary", {
            employeeId: id,
            publicId,
          });
        } catch (error) {
          await logger.error("Failed to delete avatar from Cloudinary", {
            employeeId: id,
            error: error.message,
          });
        }
      }
    }

    // Soft delete: mark as inactive instead of hard delete
    employee.active = false;
    employee.deletedAt = new Date();
    await employee.save();

    // Mark associated payroll records as cancelled
    await payrollModel.updateMany(
      { employee: id, status: { $ne: "paid" } },
      { status: "cancelled", cancelledAt: new Date() }
    );

    await logger.info("Employee soft-deleted", {
      id,
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      role: employee.role,
      deletedBy: userRole,
    });

    return null;
  }
);

export const activateEmployeeService = asyncHandler(
  async (id, userRole = "admin") => {
    const employee = await employeeModel.findByIdAndUpdate(
      id,
      { active: true, deletedAt: null },
      { new: true }
    );

    if (!employee) {
      await logger.error("Employee to activate not found", { id });
      throw new ApiError(
        `🛑 Cannot activate. No employee found with ID: ${id}`,
        404
      );
    }

    // Logic: Check if user has permission to activate employee based on roles
    const roleHierarchy = {
      admin: 7,
      CEO: 6,
      HR: 5,
      manager: 4,
      accountant: 3,
      supervisor: 2,
      employee: 1,
    };

    const employeeRoleLevel = roleHierarchy[employee.role] || 0;
    const userRoleLevel = roleHierarchy[userRole] || 0;

    // Only admin can activate other admins, CEOs, or HR
    if (employeeRoleLevel >= 5 && userRole !== "admin") {
      // admin, CEO, HR
      await logger.error(
        "User not authorized to activate high-level employee",
        {
          userRole,
          employeeRole: employee.role,
          employeeId: id,
        }
      );
      throw new ApiError(
        "🛑 You are not authorized to activate this employee",
        403
      );
    }

    // Users can only activate employees with lower or equal role level
    if (employeeRoleLevel > userRoleLevel) {
      await logger.error(
        "User trying to activate employee with higher role level",
        {
          userRole,
          userRoleLevel,
          employeeRole: employee.role,
          employeeRoleLevel,
        }
      );
      throw new ApiError(
        "🛑 You cannot activate an employee with a higher role level",
        403
      );
    }

    // Reactivate associated payroll records
    await payrollModel.updateMany(
      { employee: id, status: "cancelled" },
      { status: "pending", cancelledAt: null }
    );

    // Logic: Add calculated fields to response
    const employeeObj = employee.toObject ? employee.toObject() : employee;
    employeeObj.experienceYears = calculateExperienceYearsHelper(
      employee.employmentDate
    );
    employeeObj.age = calculateAgeHelper(employee.birthDate);

    await logger.info("Employee activated", {
      id,
      name: employee.name,
      employeeId: employee.employeeId,
      role: employee.role,
      activatedBy: userRole,
    });

    return sanitizeEmployee(employeeObj);
  }
);
