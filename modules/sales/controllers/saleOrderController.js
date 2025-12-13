import asyncHandler from "express-async-handler";
import {
  createSaleOrderService,
  getSaleOrdersService,
  getSpecificSaleOrderService,
  updateSaleOrderService,
  deleteSaleOrderService,
  updateSaleOrderStatusService,
  getSaleOrdersByStatusService,
} from "../services/saleOrderService.js";

export const createSaleOrder = asyncHandler(async (req, res) => {
  const data = await createSaleOrderService(req.body, req.user._id);
  res.status(201).json({
    message: "Sale order created successfully",
    data,
  });
});

export const getAllSaleOrders = asyncHandler(async (req, res) => {
  const response = await getSaleOrdersService(req);
  res.status(200).json({
    message: "Sale orders fetched successfully",
    ...response,
  });
});

export const getSaleOrder = asyncHandler(async (req, res) => {
  const data = await getSpecificSaleOrderService(req.params.id, req);
  res.status(200).json({
    message: "Sale order retrieved successfully",
    data,
  });
});

export const updateSaleOrder = asyncHandler(async (req, res) => {
  const data = await updateSaleOrderService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Sale order updated successfully",
    data,
  });
});

export const deleteSaleOrder = asyncHandler(async (req, res) => {
  await deleteSaleOrderService(req.params.id, req);
  res.status(204).json({
    message: "Sale order deleted successfully",
  });
});

export const getAllDraftedSaleOrders = asyncHandler(async (req, res) => {
  const response = await getSaleOrdersByStatusService("draft", req);
  res.status(200).json({
    message: "Draft sale orders fetched successfully",
    ...response,
  });
});

export const getAllApprovedSaleOrders = asyncHandler(async (req, res) => {
  const response = await getSaleOrdersByStatusService("approved", req);
  res.status(200).json({
    message: "Approved sale orders fetched successfully",
    ...response,
  });
});

export const getAllDeliveredSaleOrders = asyncHandler(async (req, res) => {
  const response = await getSaleOrdersByStatusService("delivered", req);
  res.status(200).json({
    message: "Delivered sale orders fetched successfully",
    ...response,
  });
});

export const updatedSaleOrderIntoApproved = asyncHandler(async (req, res) => {
  const data = await updateSaleOrderStatusService(
    req.params.id,
    "approved",
    req
  );
  res.status(200).json({
    message: "Sale order approved successfully",
    data,
  });
});

export const updateToShipped = asyncHandler(async (req, res) => {
  const data = await updateSaleOrderStatusService(
    req.params.id,
    "shipped",
    req
  );
  res.status(200).json({
    message: "Sale order marked as shipped successfully",
    data,
  });
});

export const updateToDelivered = asyncHandler(async (req, res) => {
  const data = await updateSaleOrderStatusService(
    req.params.id,
    "delivered",
    req
  );
  res.status(200).json({
    message: "Sale order marked as delivered successfully",
    data,
  });
});

export const cancelSaleOrder = asyncHandler(async (req, res) => {
  const data = await updateSaleOrderStatusService(
    req.params.id,
    "canceled",
    req
  );
  res.status(200).json({
    message: "Sale order canceled successfully",
    data,
  });
});
