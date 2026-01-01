import { Router } from "express";
const router = Router();

import {
  createSaleOrderInTrip,
  getSaleOrdersInTrip,
  getSaleOrderInTrip,
} from "../controllers/saleOrderInTripController.js";

import {
  createSaleOrderInTripValidator,
  getSaleOrderInTripValidator,
} from "../validators/saleOrderInTripValidator.js";

import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";

router.route("/").get(protect, allowedTo("admin", "CEO"), getSaleOrdersInTrip);

router
  .route("/:tripId")
  .post(
    protect,
    allowedTo("admin", "CEO"),
    createSaleOrderInTripValidator,
    createSaleOrderInTrip
  );

router
  .route("/sale/:id")
  .get(
    protect,
    allowedTo("admin", "CEO"),
    getSaleOrderInTripValidator,
    getSaleOrderInTrip
  );

export default router;
