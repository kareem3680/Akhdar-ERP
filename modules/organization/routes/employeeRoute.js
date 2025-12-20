import { Router } from "express";
const router = Router();

import { singleUpload } from "../../../middlewares/uploadMiddleware.js";
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  activateEmployee,
} from "../controllers/employeeController.js";
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  getEmployeeValidator,
  deleteEmployeeValidator,
  activateEmployeeValidator,
} from "../validators/employeeValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import {
  checkSelfManager,
  checkAgeRange,
  checkEmploymentDate,
} from "../../../middlewares/employeeMiddleware.js";

router
  .route("/")
  .get(protect, allowedTo("CEO", "admin"), getEmployees)
  .post(
    protect,
    allowedTo("CEO", "admin"),
    singleUpload("avatar"),
    createEmployeeValidator,
    checkSelfManager,
    checkAgeRange,
    checkEmploymentDate,
    createEmployee
  );

router
  .route("/:employeeId")
  .get(protect, allowedTo("CEO", "admin"), getEmployeeValidator, getEmployee)
  .patch(
    protect,
    allowedTo("CEO", "admin"),
    singleUpload("avatar"),
    updateEmployeeValidator,
    checkSelfManager,
    checkAgeRange,
    checkEmploymentDate,
    updateEmployee
  )
  .delete(
    protect,
    allowedTo("CEO", "admin"),
    deleteEmployeeValidator,
    deleteEmployee
  );

router
  .route("/activate/:employeeId")
  .patch(
    protect,
    allowedTo("CEO", "admin"),
    activateEmployeeValidator,
    activateEmployee
  );

export default router;
