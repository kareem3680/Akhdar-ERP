import { Router } from "express";
const router = Router();

import {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  completeTrip,
} from "../controllers/tripController.js";

import {
  createTripValidator,
  getTripValidator,
  updateTripValidator,
  deleteTripValidator,
  completeTripValidator,
} from "../validators/tripValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router
  .route("/")
  .post(protect, allowedTo("admin", "CEO"), createTripValidator, createTrip)
  .get(protect, allowedTo("admin", "CEO"), getTrips);

router
  .route("/:id")
  .get(protect, allowedTo("admin", "CEO"), getTripValidator, getTrip)
  .patch(protect, allowedTo("admin", "CEO"), updateTripValidator, updateTrip)
  .delete(protect, allowedTo("admin", "CEO"), deleteTripValidator, deleteTrip);

router
  .route("/complete/:id")
  .patch(
    protect,
    allowedTo("admin", "CEO"),
    completeTripValidator,
    completeTrip
  );

export default router;
