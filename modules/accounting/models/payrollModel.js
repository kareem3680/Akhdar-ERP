import mongoose, { Schema, model } from "mongoose";

const payrollSchema = new Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
    },
    overtime: {
      type: Number,
      default: 0,
      min: [0, "Overtime cannot be negative"],
    },
    deduction: {
      amount: {
        type: Number,
        default: 0,
        min: [0, "Deduction amount cannot be negative"],
      },
      purpose: {
        type: String,
        trim: true,
        maxlength: [200, "Deduction purpose must be at most 200 characters"],
      },
    },
    bonus: {
      amount: {
        type: Number,
        default: 0,
        min: [0, "Bonus amount cannot be negative"],
      },
      purpose: {
        type: String,
        trim: true,
        maxlength: [200, "Bonus purpose must be at most 200 characters"],
      },
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    total: {
      type: Number,
      default: function () {
        return this.salary;
      },
      min: [0, "Total cannot be negative"],
    },
    date: {
      type: Date,
      required: [true, "Payroll date is required"],
    },
    month: {
      type: Number,
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
    },
    year: {
      type: Number,
      min: [2000, "Year must be valid"],
      max: [2100, "Year must be valid"],
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "pending", "paid", "cancelled"],
        message: "Status must be draft, pending, paid, or cancelled",
      },
      default: "draft",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "online"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate total
payrollSchema.pre("save", function (next) {
  // Calculate total
  this.total =
    this.salary + this.bonus.amount + this.overtime - this.deduction.amount;

  // Set month and year from date
  if (this.date) {
    this.month = this.date.getMonth() + 1;
    this.year = this.date.getFullYear();
  }

  next();
});

// Index for better query performance
payrollSchema.index({ employee: 1, date: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ month: 1, year: 1 });

const Payroll = model("Payroll", payrollSchema);
export default Payroll;
