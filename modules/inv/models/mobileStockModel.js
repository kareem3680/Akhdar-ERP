import mongoose from "mongoose";

const mobileStockSchema = new mongoose.Schema(
  {
    representative: {
      type: String,
      required: [true, "provide representative"],
    },
    capacity: {
      type: Number,
      required: [true, "provide capacity"],
    },
    year: {
      type: Number,
      required: [true, "provide year"],
    },
    name: {
      type: String,
      required: [true, "provide name of mobile stock"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "provide brand of mobile stock"],
    },
  },
  { timestamps: true },
);

const mobileStockModel = mongoose.model("MobileStock", mobileStockSchema);
export default mobileStockModel;
