import saleInvoiceRoute from "./saleInvoiceRoute.js";
import saleOrderRoute from "./saleOrderRoute.js";
import saleOrderInTripRoute from "./saleOrderInTripRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/sale-invoices", saleInvoiceRoute);
  app.use("/api/v1/sale-orders", saleOrderRoute);
  app.use("/api/v1/sale-orders-in-trip", saleOrderInTripRoute);
};

export default mountRoutes;
