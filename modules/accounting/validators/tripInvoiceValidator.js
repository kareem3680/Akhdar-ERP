import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const createTripInvoiceValidator = [
  check("saleOrderId").isMongoId().withMessage("Invalid sale order ID format"),
  validatorMiddleWare,
];

export const getTripInvoiceValidator = [
  check("id").isMongoId().withMessage("Invalid trip invoice ID format"),
  validatorMiddleWare,
];
