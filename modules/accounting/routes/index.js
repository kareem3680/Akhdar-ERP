import accountRoute from "./accountRoute.js";
import journalEntryRoute from "./journalEntryRoute.js";
import journalRoute from "./journalRoute.js";
import payrollRoute from "./payrollRoute.js";
import loanRoute from "./loanRoute.js";
import loanInstallmentRoute from "./loanInstallmentRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/accounts", accountRoute);
  app.use("/api/v1/journal-entries", journalEntryRoute);
  app.use("/api/v1/journals", journalRoute);
  app.use("/api/v1/payrolls", payrollRoute);
  app.use("/api/v1/loans", loanRoute);
  app.use("/api/v1/loan-installments", loanInstallmentRoute);
};

export default mountRoutes;
