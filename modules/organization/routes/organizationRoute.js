import { Router } from "express";
const router = Router();

import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organizationController.js";
import {
  createOrganizationValidator,
  updateOrganizationValidator,
  getOrganizationValidator,
  deleteOrganizationValidator,
} from "../validators/organizationValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import customerRouter from "../../customer/routes/customerRoute.js";

// Protected routes
router
  .route("/")
  .get(protect, getOrganizations)
  .post(
    protect,
    allowedTo("admin", "employee", "CEO"),
    createOrganizationValidator,
    createOrganization
  );

router
  .route("/:id")
  .get(protect, getOrganizationValidator, getOrganization)
  .patch(
    protect,
    allowedTo("admin", "employee", "CEO"),
    updateOrganizationValidator,
    updateOrganization
  )
  .delete(
    protect,
    allowedTo("admin", "CEO"),
    deleteOrganizationValidator,
    deleteOrganization
  );

// Customer routes under organization
router.use("/:organizationId/customers", customerRouter);

export default router;
