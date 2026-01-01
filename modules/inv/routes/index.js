import inventoryRoute from "./inventoryRoute.js";
import stockRoute from "./stockRoute.js";
import supplierRoute from "./supplierRoute.js";
import stockTransferRoute from "./stockTransferRoute.js";
import mobileStockRoute from "./mobileStockRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/inventories", inventoryRoute);
  app.use("/api/v1/stocks", stockRoute);
  app.use("/api/v1/suppliers", supplierRoute);
  app.use("/api/v1/stock-transfers", stockTransferRoute);
  app.use("/api/v1/mobile-stocks", mobileStockRoute);
};

export default mountRoutes;
