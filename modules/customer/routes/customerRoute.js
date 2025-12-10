import { Router } from "express";
const router = Router({ mergeParams: true });

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  softDelete,
  addOrganization,
  removeOrganization,
} from "../controllers/customerController.js";
import {
  createCustomerValidator,
  updateCustomerValidator,
  getCustomerValidator,
  deleteCustomerValidator,
  softDeleteCustomerValidator,
  addOrganizationValidator,
} from "../validators/customerValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Public routes (if needed)
// router.route("/").get(getCustomers);

// Protected routes
router
  .route("/")
  .get(protect, getCustomers)
  .post(
    protect,
    allowedTo("admin", "employee"),
    createCustomerValidator,
    createCustomer
  );

router
  .route("/:id")
  .get(protect, getCustomerValidator, getCustomer)
  .patch(
    protect,
    allowedTo("admin", "employee"),
    updateCustomerValidator,
    updateCustomer
  )
  .delete(protect, allowedTo("admin"), deleteCustomerValidator, deleteCustomer);

// Soft delete route
router
  .route("/soft-delete/:id")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    softDeleteCustomerValidator,
    softDelete
  );

// Organization management routes
router
  .route("/:customerId/organizations/:organizationId")
  .patch(
    protect,
    allowedTo("admin", "employee"),
    addOrganizationValidator,
    addOrganization
  )
  .delete(
    protect,
    allowedTo("admin", "employee"),
    addOrganizationValidator,
    removeOrganization
  );

export default router;
