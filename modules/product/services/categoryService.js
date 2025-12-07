import asyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";
import { sanitizeCategory } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("category");

export const createCategoryService = asyncHandler(async (body) => {
  const { category } = body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ category });
  if (existingCategory) {
    await logger.error("Category creation failed - category already exists", {
      category,
    });
    throw new ApiError("🛑 Category already exists", 400);
  }

  const newCategory = await createService(Category, { category });

  await logger.info("Category created", { categoryId: newCategory._id });
  return sanitizeCategory(newCategory);
});

export const getCategoriesService = asyncHandler(async (req) => {
  const result = await getAllService(Category, req.query, "category");

  await logger.info("Fetched all categories", {
    count: result.results,
  });

  return {
    results: result.results,
    data: result.data.map(sanitizeCategory),
    paginationResult: result.paginationResult,
  };
});

export const getSpecificCategoryService = asyncHandler(async (id) => {
  const category = await getSpecificService(Category, id);
  await logger.info("Fetched category", { id });
  return sanitizeCategory(category);
});

export const updateCategoryService = asyncHandler(async (id, body) => {
  const { category } = body;

  // Check if new category name already exists (excluding current category)
  if (category) {
    const existingCategory = await Category.findOne({
      category,
      _id: { $ne: id },
    });
    if (existingCategory) {
      await logger.error("Category update failed - category already exists", {
        category,
        id,
      });
      throw new ApiError("🛑 Category already exists", 400);
    }
  }

  const updatedCategory = await updateService(Category, id, body);

  await logger.info("Category updated", { id });
  return sanitizeCategory(updatedCategory);
});

export const deleteCategoryService = asyncHandler(async (id) => {
  await deleteService(Category, id);

  await logger.info("Category deleted", { id });
  return;
});
