import asyncHandler from "express-async-handler";
import {
  createCategoryService,
  getCategoriesService,
  getSpecificCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/categoryService.js";

export const createCategory = asyncHandler(async (req, res) => {
  const data = await createCategoryService(req.body);
  res.status(201).json({
    message: "Category created successfully",
    data,
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const response = await getCategoriesService(req);
  res.status(200).json({
    message: "Categories fetched successfully",
    ...response,
  });
});

export const getCategory = asyncHandler(async (req, res) => {
  const data = await getSpecificCategoryService(req.params.id);
  res.status(200).json({
    message: "Category retrieved successfully",
    data,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await updateCategoryService(req.params.id, req.body);
  res.status(200).json({
    message: "Category updated successfully",
    data,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await deleteCategoryService(req.params.id);
  res.status(204).json({
    message: "Category deleted successfully",
  });
});
