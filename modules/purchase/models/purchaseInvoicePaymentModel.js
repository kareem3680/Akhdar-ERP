import mongoose from "mongoose";

const purchaseInvoicePaymentSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseInvoice",
      required: [true, "Invoice is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, "Remaining amount must not be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "credit"],
      default: "cash",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { timestamps: true }
);

const InvoicePayment = mongoose.model(
  "InvoicePayment",
  purchaseInvoicePaymentSchema
);

export default InvoicePayment;
