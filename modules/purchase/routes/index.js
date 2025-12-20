import purchaseOrderRoute from "./purchaseOrderRoute.js";
import purchaseInvoiceRoute from "./purchaseInvoiceRoute.js";
import purchaseInvoicePaymentRoute from "./purchaseInvoicePaymentRouter.js";

const mountRoutes = (app) => {
  app.use("/api/v1/purchase-orders", purchaseOrderRoute);
  app.use("/api/v1/purchase-invoices", purchaseInvoiceRoute);
  app.use("/api/v1/purchase-invoice-payments", purchaseInvoicePaymentRoute);
};

export default mountRoutes;
