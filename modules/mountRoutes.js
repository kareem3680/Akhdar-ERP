import mountRoutesIdentity from "./identity/routes/index.js";
import mountRoutesProduct from "./product/routes/index.js";
import mountRoutesCustomer from "./customer/routes/index.js";
import mountRoutesOrganization from "./organization/routes/index.js";

export default function mountRoutes(app) {
  mountRoutesIdentity(app);
  mountRoutesProduct(app);
  mountRoutesCustomer(app);
  mountRoutesOrganization(app);
}
