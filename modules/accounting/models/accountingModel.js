import mongoose from "mongoose";

const accountingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Account code is required"],
      unique: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
      required: [true, "Account type is required"],
    },
    subtype: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    parentAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    currency: {
      type: String,
      default: "EGP",
      enum: ["EGP", "USD", "EUR"],
    },
  },
  { timestamps: true }
);

// Index for faster queries
accountingSchema.index({ type: 1 });
accountingSchema.index({ isActive: 1 });

const Account = mongoose.model("Account", accountingSchema);

export default Account;
