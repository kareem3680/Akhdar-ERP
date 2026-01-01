import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Representative",
      required: [true, "provide representative"],
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileStock",
      required: [true, "provide mobile stock"],
    },
    driver: String,
    location: String,
    date: Date,
    expenseses: Number,
    sales: Number,
    status: {
      type: String,
      default: "inprogress",
    },
    tripNumber: Number,
  },
  { timestamps: true }
);

tripSchema.pre("save", function (next) {
  if (this.isNew) {
    this.tripNumber = Math.floor(Math.random() * 99999);
  }
  next();
});

const tripModel = mongoose.model("Trip", tripSchema);
export default tripModel;
