import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    borrowerType: {
      type: String,
      enum: ["Organization", "User"],
      required: [true, "Select the type of borrower"],
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "borrowerType",
      required: [true, "Select the borrower"],
    },
    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [0, "Loan amount cannot be negative"],
    },
    installmentNumber: {
      type: Number,
      required: [true, "Number of installments is required"],
      min: [1, "At least 1 installment is required"],
    },
    installmentAmount: Number,
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"],
    },
    totalPayable: Number,
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "active",
        "rejected",
        "completed",
        "defaulted",
      ],
      default: "pending",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    remainingBalance: {
      type: Number,
      default: function () {
        return this.totalPayable || 0;
      },
    },
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for installments
loanSchema.virtual("installments", {
  ref: "LoanInstallment",
  localField: "_id",
  foreignField: "loanId",
});

// Virtual for paid installments count
loanSchema.virtual("paidInstallmentsCount", {
  ref: "LoanInstallment",
  localField: "_id",
  foreignField: "loanId",
  match: { status: "paid" },
  count: true,
});

// Pre-save hook to calculate values
loanSchema.pre("save", function (next) {
  this.totalPayable =
    this.loanAmount + (this.interestRate * this.loanAmount) / 100;
  this.installmentAmount = this.totalPayable / this.installmentNumber;

  if (!this.remainingBalance) {
    this.remainingBalance = this.totalPayable;
  }

  next();
});

// Method to check if loan can be approved
loanSchema.methods.canApprove = function () {
  return this.status === "pending";
};

// Method to calculate next due date
loanSchema.methods.getNextDueDate = function () {
  const lastInstallment = this.installments?.sort(
    (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
  )[0];

  if (lastInstallment) {
    const lastDate = new Date(lastInstallment.dueDate);
    lastDate.setMonth(lastDate.getMonth() + 1);
    return lastDate;
  }

  return this.startDate;
};

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
