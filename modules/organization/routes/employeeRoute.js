import { Router } from "express";
const router = Router();

import { singleUpload } from "../../../middlewares/uploadMiddleware.js";
import { uploadPDFs } from "../../../middlewares/uploadDocMiddleware.js";
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  activateEmployee,
  addEmployeeDocuments,
  deleteEmployeeDocument,
} from "../controllers/employeeController.js";
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  getEmployeeValidator,
  deleteEmployeeValidator,
  activateEmployeeValidator,
  addEmployeeDocumentsValidator,
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
    createEmployee,
  );

router.post(
  "/documents/:employeeId",
  protect,
  allowedTo("CEO", "admin"),
  uploadPDFs,
  addEmployeeDocumentsValidator,
  addEmployeeDocuments,
);

router.delete(
  "/documents/:employeeId/:fileId",
  protect,
  allowedTo("CEO", "admin"),
  deleteEmployeeDocument,
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
    updateEmployee,
  )
  .delete(
    protect,
    allowedTo("CEO", "admin"),
    deleteEmployeeValidator,
    deleteEmployee,
  );

router
  .route("/activate/:employeeId")
  .patch(
    protect,
    allowedTo("CEO", "admin"),
    activateEmployeeValidator,
    activateEmployee,
  );

export default router;
