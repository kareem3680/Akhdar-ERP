import customerRoute from "./customerRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/customers", customerRoute);
};

export default mountRoutes;
