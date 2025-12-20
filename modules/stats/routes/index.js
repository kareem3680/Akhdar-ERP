import statsRouter from "./statsRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/stats", statsRouter);
};

export default mountRoutes;
