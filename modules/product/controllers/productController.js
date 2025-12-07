import asyncHandler from "express-async-handler";
import {
  createProductService,
  getProductsService,
  getSpecificProductService,
  updateProductService,
  deleteProductService,
  productsByCategoryService,
} from "../services/productService.js";

export const createProduct = asyncHandler(async (req, res) => {
  const data = await createProductService(req.body, req.files);
  res.status(201).json({
    message: "Product created successfully",
    data,
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const response = await getProductsService(req);
  res.status(200).json({
    message: "Products fetched successfully",
    ...response,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const data = await getSpecificProductService(req.params.id);
  res.status(200).json({
    message: "Product retrieved successfully",
    data,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = await updateProductService(req.params.id, req.body, req.files);
  res.status(200).json({
    message: "Product updated successfully",
    data,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await deleteProductService(req.params.id);
  res.status(204).json({
    message: "Product deleted successfully",
  });
});

export const allProductsForCategory = asyncHandler(async (req, res) => {
  const data = await productsByCategoryService(req.params.categoryId);
  res.status(200).json({
    message: "Products by category fetched successfully",
    results: data.length,
    data,
  });
});
