import mongoose from "mongoose";

const installmentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: [true, "Loan reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Installment amount is required"],
      min: [0, "Installment amount cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "online"],
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
installmentSchema.index({ loanId: 1, dueDate: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ dueDate: 1 });

// Pre-save hook to validate due date
installmentSchema.pre("save", function (next) {
  if (this.dueDate < new Date() && this.status === "pending") {
    this.status = "overdue";
  }
  next();
});

// Method to mark as paid
installmentSchema.methods.markAsPaid = function (paymentData = {}) {
  this.status = "paid";
  this.paymentDate = paymentData.paymentDate || new Date();
  this.paymentMethod = paymentData.paymentMethod;
  this.notes = paymentData.notes || this.notes;
};

const LoanInstallment = mongoose.model("LoanInstallment", installmentSchema);
export default LoanInstallment;
