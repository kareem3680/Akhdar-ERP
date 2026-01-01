import mongoose from "mongoose";

const saleOrderInTripSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "provide customer id"],
  },
  orderDate: Date,
  goods: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "provide product id"],
      },
      code: String,
      unit: Number,
      price: Number,
      discount: Number,
      total: Number,
    },
  ],
  orderNumber: Number,
  total: Number,
});

saleOrderInTripSchema.pre("save", function (next) {
  this.orderNumber = Math.floor(Math.random() * 99999);
  next();
});

const saleOrderInTripModel = mongoose.model(
  "SaleOrderInTrip",
  saleOrderInTripSchema
);
export default saleOrderInTripModel;
