import mongoose from "mongoose";

const tripInvoiceSchema = new mongoose.Schema({
  saleOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SaleOrderInTrip",
  },
});

const tripInvoiceModel = mongoose.model("TripInvoice", tripInvoiceSchema);
export default tripInvoiceModel;
