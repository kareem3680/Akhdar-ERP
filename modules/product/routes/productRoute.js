import { Router } from "express";
const router = Router();

import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  allProductsForCategory,
} from "../controllers/productController.js";
import {
  createProductValidator,
  updateProductValidator,
  getProductValidator,
  deleteProductValidator,
  productsByCategoryValidator,
} from "../validators/productValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import {
  arrayUpload,
  processUpload,
} from "../../../middlewares/uploadMiddleware.js";

// Public routes
router.route("/").get(protect, getProducts);
router.get(
  "/:categoryId/products",
  protect,
  productsByCategoryValidator,
  allProductsForCategory
);

// Protected routes (admin only)
router.post(
  "/",
  protect,
  allowedTo("admin"),
  arrayUpload("img", 5), // Maximum 5 images
  processUpload, // Process upload results
  createProductValidator,
  createProduct
);

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .patch(
    protect,
    allowedTo("admin"),
    arrayUpload("img", 5),
    processUpload,
    updateProductValidator,
    updateProduct
  )
  .delete(protect, allowedTo("admin"), deleteProductValidator, deleteProduct);

export default router;
