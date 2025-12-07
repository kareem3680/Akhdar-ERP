import mountRoutesIdentity from "./identity/routes/index.js";
import mountRoutesProduct from "./product/routes/index.js";

export default function mountRoutes(app) {
  mountRoutesIdentity(app);
  mountRoutesProduct(app);
}
