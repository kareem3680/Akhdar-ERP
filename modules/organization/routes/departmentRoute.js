import { Router } from "express";
const router = Router();

import {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
} from "../controllers/departmentController.js";
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  getDepartmentValidator,
  deleteDepartmentValidator,
  validateDepartmentCode,
} from "../validators/departmentValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import {
  checkNoActiveEmployees,
  checkUniqueName,
} from "../../../middlewares/departmentMiddleware.js";

router
  .route("/")
  .get(protect, allowedTo("CEO", "admin"), getDepartments)
  .post(
    protect,
    allowedTo("CEO", "admin"),
    createDepartmentValidator,
    validateDepartmentCode,
    checkUniqueName,
    createDepartment
  );

router
  .route("/:departmentId")
  .get(
    protect,
    allowedTo("CEO", "admin"),
    getDepartmentValidator,
    getDepartment
  )
  .patch(
    protect,
    allowedTo("CEO", "admin"),
    updateDepartmentValidator,
    validateDepartmentCode,
    checkUniqueName,
    updateDepartment
  )
  .delete(
    protect,
    allowedTo("CEO", "admin"),
    deleteDepartmentValidator,
    checkNoActiveEmployees,
    deleteDepartment
  );

router
  .route("/stats/overview")
  .get(protect, allowedTo("CEO", "admin"), getDepartmentStats);

export default router;
