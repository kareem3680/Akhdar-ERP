import mongoose from "mongoose";

const representativeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    region: {
      type: String,
      required: [true, "Region is required"],
    },
    territory: {
      type: String,
      required: [true, "Territory is required"],
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    targetSales: {
      type: Number,
      default: 0,
    },
    currentSales: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const representativeModel = mongoose.model(
  "Representative",
  representativeSchema
);
export default representativeModel;
