import { Router } from "express";
const router = Router();

import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  softDeleteSupplier,
  getOrganizationSuppliers,
  addOrganization,
} from "../controllers/supplierController.js";
import {
  createSupplierValidator,
  getSupplierValidator,
  updateSupplierValidator,
  addOrganizationValidator,
} from "../validators/supplierValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Supplier routes
router.post(
  "/",
  protect,
  allowedTo("admin", "CEO"),
  createSupplierValidator,
  createSupplier
);

router.get("/", protect, allowedTo("admin", "CEO"), getSuppliers);

router.get(
  "/:supplierId",
  protect,
  allowedTo("admin", "CEO"),
  getSupplierValidator,
  getSupplier
);

router.patch(
  "/:supplierId",
  protect,
  allowedTo("admin", "CEO"),
  updateSupplierValidator,
  updateSupplier
);

router.delete(
  "/:supplierId",
  protect,
  allowedTo("admin", "CEO"),
  getSupplierValidator,
  deleteSupplier
);

router.patch(
  "/soft-delete/:supplierId",
  protect,
  allowedTo("admin", "CEO"),
  getSupplierValidator,
  softDeleteSupplier
);

// Organization-specific routes
router.get(
  "/organizations/:organizationId",
  protect,
  allowedTo("admin", "CEO"),
  getOrganizationSuppliers
);

router.patch(
  "/:supplierId/organizations/:organizationId",
  protect,
  allowedTo("admin", "CEO"),
  addOrganizationValidator,
  addOrganization
);

export default router;
