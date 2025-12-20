import { check } from "express-validator";
import validatorMiddleWare from "../../../middlewares/validatorMiddleware.js";

export const getStatsValidator = [
  check("from")
    .optional()
    .isISO8601()
    .withMessage("Start date must be in valid format"),

  check("to")
    .optional()
    .isISO8601()
    .withMessage("End date must be in valid format"),

  check("type")
    .optional()
    .isIn(["daily", "weekly", "monthly", "yearly", "custom"])
    .withMessage("Invalid report type"),

  validatorMiddleWare,
];
