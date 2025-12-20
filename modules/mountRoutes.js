import mountRoutesIdentity from "./identity/routes/index.js";
import mountRoutesProduct from "./product/routes/index.js";
import mountRoutesCustomer from "./customer/routes/index.js";
import mountRoutesOrganization from "./organization/routes/index.js";
import mountRoutesSales from "./sales/routes/index.js";
import mountRoutesPurchase from "./purchase/routes/index.js";
import mountRoutesStats from "./stats/routes/index.js";

export default function mountRoutes(app) {
  mountRoutesIdentity(app);
  mountRoutesProduct(app);
  mountRoutesCustomer(app);
  mountRoutesOrganization(app);
  mountRoutesSales(app);
  mountRoutesPurchase(app);
  mountRoutesStats(app);
}
