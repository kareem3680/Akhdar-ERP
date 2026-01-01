import accountRoute from "./accountRoute.js";
import journalEntryRoute from "./journalEntryRoute.js";
import journalRoute from "./journalRoute.js";
import payrollRoute from "./payrollRoute.js";
import loanRoute from "./loanRoute.js";
import loanInstallmentRoute from "./loanInstallmentRoute.js";
import tripRoute from "./tripRoute.js";
import tripInvoiceRoute from "./tripInvoiceRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/accounts", accountRoute);
  app.use("/api/v1/journal-entries", journalEntryRoute);
  app.use("/api/v1/journals", journalRoute);
  app.use("/api/v1/payrolls", payrollRoute);
  app.use("/api/v1/loans", loanRoute);
  app.use("/api/v1/loan-installments", loanInstallmentRoute);
  app.use("/api/v1/trips", tripRoute);
  app.use("/api/v1/trip-invoices", tripInvoiceRoute);
};

export default mountRoutes;
