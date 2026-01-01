import { Router } from "express";
const router = Router();

import {
  createRepresentative,
  getRepresentatives,
  getRepresentative,
  updateRepresentative,
  deleteRepresentative,
  getRepresentativeStats,
} from "../controllers/representativeController.js";

import {
  createRepresentativeValidator,
  updateRepresentativeValidator,
  getRepresentativeValidator,
  deleteRepresentativeValidator,
} from "../validators/representativeValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .post(
    protect,
    allowedTo("admin", "CEO"),
    createRepresentativeValidator,
    createRepresentative
  )
  .get(protect, allowedTo("admin", "CEO"), getRepresentatives);

router
  .route("/stats")
  .get(protect, allowedTo("admin", "CEO"), getRepresentativeStats);

router
  .route("/:id")
  .get(
    protect,
    allowedTo("admin", "CEO"),
    getRepresentativeValidator,
    getRepresentative
  )
  .patch(
    protect,
    allowedTo("admin", "CEO"),
    updateRepresentativeValidator,
    updateRepresentative
  )
  .delete(
    protect,
    allowedTo("admin", "CEO"),
    deleteRepresentativeValidator,
    deleteRepresentative
  );

export default router;
