import productRoute from "./productRoute.js";
import categoryRoute from "./categoryRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/products", productRoute);
  app.use("/api/v1/categories", categoryRoute);
};

export default mountRoutes;
