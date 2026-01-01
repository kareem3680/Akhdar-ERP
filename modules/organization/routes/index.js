import organizationRoute from "./organizationRoute.js";
import attendanceRoute from "./attendanceRoute.js";
import employeeRoute from "./employeeRoute.js";
import departmentRoute from "./departmentRoute.js";
import representativeRoute from "./representativeRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/organizations", organizationRoute);
  app.use("/api/v1/attendances", attendanceRoute);
  app.use("/api/v1/employees", employeeRoute);
  app.use("/api/v1/departments", departmentRoute);
  app.use("/api/v1/representatives", representativeRoute);
};

export default mountRoutes;
