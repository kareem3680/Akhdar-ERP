import saleInvoiceRoute from "./saleInvoiceRoute.js";
import saleOrderRoute from "./saleOrderRoutes.js";

const mountRoutes = (app) => {
  app.use("/api/v1/sale-invoices", saleInvoiceRoute);
  app.use("/api/v1/sale-orders", saleOrderRoute);
};

export default mountRoutes;
