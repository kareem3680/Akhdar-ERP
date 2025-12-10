import organizationRoute from "./organizationRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/organizations", organizationRoute);
};

export default mountRoutes;
