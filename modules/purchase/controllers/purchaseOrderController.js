import asyncHandler from "express-async-handler";
import {
  createPurchaseOrderService,
  getPurchaseOrdersService,
  getSpecificPurchaseOrderService,
  updatePurchaseOrderService,
  deletePurchaseOrderService,
  updatePurchaseOrderStatusService,
  getPurchaseOrdersByStatusService,
  deliverPurchaseOrderService,
} from "../services/purchaseOrderService.js";

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const data = await createPurchaseOrderService(req.body, req.user._id);
  res.status(201).json({
    message: "Purchase order created successfully",
    data,
  });
});

export const getAllPurchases = asyncHandler(async (req, res) => {
  const response = await getPurchaseOrdersService(req);
  res.status(200).json({
    message: "Purchase orders fetched successfully",
    ...response,
  });
});

export const getPurchase = asyncHandler(async (req, res) => {
  const data = await getSpecificPurchaseOrderService(req.params.id, req);
  res.status(200).json({
    message: "Purchase order retrieved successfully",
    data,
  });
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const data = await updatePurchaseOrderService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Purchase order updated successfully",
    data,
  });
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  await deletePurchaseOrderService(req.params.id, req);
  res.status(204).json({
    message: "Purchase order deleted successfully",
  });
});

export const getAllDraft = asyncHandler(async (req, res) => {
  const response = await getPurchaseOrdersByStatusService("draft", req);
  res.status(200).json({
    message: "Draft purchase orders fetched successfully",
    ...response,
  });
});

export const getAllApproved = asyncHandler(async (req, res) => {
  const response = await getPurchaseOrdersByStatusService("approved", req);
  res.status(200).json({
    message: "Approved purchase orders fetched successfully",
    ...response,
  });
});

export const getAllDelivered = asyncHandler(async (req, res) => {
  const response = await getPurchaseOrdersByStatusService("delivered", req);
  res.status(200).json({
    message: "Delivered purchase orders fetched successfully",
    ...response,
  });
});

export const markAsApproved = asyncHandler(async (req, res) => {
  const data = await updatePurchaseOrderStatusService(
    req.params.id,
    "approved",
    req
  );
  res.status(200).json({
    message: "Purchase order approved successfully",
    data,
  });
});

export const markAsShipped = asyncHandler(async (req, res) => {
  const data = await updatePurchaseOrderStatusService(
    req.params.id,
    "shipped",
    req
  );
  res.status(200).json({
    message: "Purchase order marked as shipped successfully",
    data,
  });
});

export const markAsDelivered = asyncHandler(async (req, res) => {
  const data = await deliverPurchaseOrderService(req.params.id, req.body, req);
  res.status(200).json({
    message: "Purchase order delivery recorded successfully",
    data,
  });
});

export const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const data = await updatePurchaseOrderStatusService(
    req.params.id,
    "canceled",
    req
  );
  res.status(200).json({
    message: "Purchase order canceled successfully",
    data,
  });
});
