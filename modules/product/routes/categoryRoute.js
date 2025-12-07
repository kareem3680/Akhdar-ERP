import { Router } from "express";
const router = Router();

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
  getCategoryValidator,
  deleteCategoryValidator,
} from "../validators/categoryValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

// Public routes
router.route("/").get(protect, getCategories);

// Protected routes (admin only)
router
  .route("/")
  .post(protect, allowedTo("admin"), createCategoryValidator, createCategory);

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .patch(protect, allowedTo("admin"), updateCategoryValidator, updateCategory)
  .delete(protect, allowedTo("admin"), deleteCategoryValidator, deleteCategory);

export default router;
