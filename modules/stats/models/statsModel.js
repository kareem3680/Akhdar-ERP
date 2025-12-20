import mongoose, { Schema } from "mongoose";

const statsSchema = new Schema(
  {
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    totalBank: {
      type: Number,
      default: 0,
    },
    totalReceivable: {
      type: Number,
      default: 0,
    },
    totalPayable: {
      type: Number,
      default: 0,
    },
    totalGrossProfit: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const statsModel = mongoose.model("Stats", statsSchema);

export default statsModel;
