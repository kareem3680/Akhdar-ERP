import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import { sanitizeProduct } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import { deleteUploadedFile } from "../../../middlewares/uploadMiddleware.js";

const logger = new Logger("product");

// ========================
// Helper: Process Uploaded Files
// ========================
const processProductFiles = (files) => {
  if (!files) return null;

  if (Array.isArray(files)) {
    return files
      .map((file) => file.processed?.url || null)
      .filter((url) => url);
  }

  if (files.img && Array.isArray(files.img)) {
    return files.img
      .map((file) => file.processed?.url || null)
      .filter((url) => url);
  }

  return null;
};

// ========================
// Helper: Delete Product Images
// ========================
const deleteProductImages = async (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return;
  }

  for (const imageUrl of imageUrls) {
    if (imageUrl) {
      await deleteUploadedFile(imageUrl);
    }
  }
};

// ========================
// Create New Product
// ========================
export const createProductService = asyncHandler(async (body, files) => {
  const { code, category } = body;

  // Check if product code already exists
  const existingProduct = await Product.findOne({ code });
  if (existingProduct) {
    await logger.error("Product creation failed - code already exists", {
      code,
    });
    throw new ApiError("Product code already exists", 400);
  }

  // Check if category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    await logger.error("Product creation failed - category not found", {
      category,
    });
    throw new ApiError("Category not found", 404);
  }

  // Process uploaded images
  const imageUrls = processProductFiles(files);
  if (imageUrls && imageUrls.length > 0) {
    body.img = imageUrls;
    await logger.info("Product images uploaded", { count: imageUrls.length });
  }

  // Create product
  const newProduct = await createService(Product, body);

  await logger.info("Product created", {
    productId: newProduct._id,
    code: newProduct.code,
  });

  return sanitizeProduct(newProduct);
});

// ========================
// Get All Products
// ========================
export const getProductsService = asyncHandler(async (req) => {
  const result = await getAllService(
    Product,
    req.query,
    "product",
    {},
    { populate: "category" }
  );

  await logger.info("Fetched all products", { count: result.results });

  return {
    results: result.results,
    data: result.data.map(sanitizeProduct),
    paginationResult: result.paginationResult,
  };
});

// ========================
// Get Specific Product
// ========================
export const getSpecificProductService = asyncHandler(async (id) => {
  const product = await getSpecificService(Product, id, {
    populate: "category",
  });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  await logger.info("Fetched product", { id });

  return sanitizeProduct(product);
});

// ========================
// Update Product
// ========================
export const updateProductService = asyncHandler(async (id, body, files) => {
  const { code } = body;

  // Check if new product code already exists
  if (code) {
    const existingProduct = await Product.findOne({
      code,
      _id: { $ne: id },
    });
    if (existingProduct) {
      await logger.error("Product update failed - code already exists", {
        code,
        id,
      });
      throw new ApiError("Product code already exists", 400);
    }
  }

  // Get current product
  const currentProduct = await Product.findById(id);
  if (!currentProduct) {
    throw new ApiError("Product not found", 404);
  }

  // Process new uploaded files
  const imageUrls = processProductFiles(files);

  // Handle image updates
  if (imageUrls && imageUrls.length > 0) {
    // Delete old images only if new images are provided
    if (currentProduct.img && currentProduct.img.length > 0) {
      await logger.info("Deleting old product images", {
        productId: id,
        oldImages: currentProduct.img.length,
      });

      await deleteProductImages(currentProduct.img);
    }

    // Add new images
    body.img = imageUrls;
    await logger.info("New product images uploaded", {
      count: imageUrls.length,
    });
  } else {
    // Keep existing images if no new images provided
    delete body.img;
  }

  // Update product
  const updatedProduct = await updateService(Product, id, body);

  await logger.info("Product updated", { id });

  return sanitizeProduct(updatedProduct);
});

// ========================
// Delete Product
// ========================
export const deleteProductService = asyncHandler(async (id) => {
  // Get product to delete associated images
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  // Delete product images
  if (product.img && product.img.length > 0) {
    await logger.info("Deleting product images", {
      productId: id,
      imageCount: product.img.length,
    });

    await deleteProductImages(product.img);
  }

  // Delete product from database
  await deleteService(Product, id);

  await logger.info("Product deleted", { id });

  return;
});

// ========================
// Get Products by Category
// ========================
export const productsByCategoryService = asyncHandler(async (categoryId) => {
  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    await logger.error("Category not found", { categoryId });
    throw new ApiError("Category not found", 404);
  }

  // Get products in category
  const products = await Product.find({ category: categoryId })
    .select("-__v")
    .populate("category");

  await logger.info("Fetched products by category", {
    categoryId,
    count: products.length,
  });

  return products.map(sanitizeProduct);
});
