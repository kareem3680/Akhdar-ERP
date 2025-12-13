import purchaseOrderRoute from "./purchaseOrderRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/purchase-orders", purchaseOrderRoute);
};

export default mountRoutes;
