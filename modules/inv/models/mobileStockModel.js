import mongoose from "mongoose";

const mobileStockSchema = new mongoose.Schema(
  {
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Representative",
      required: [true, "provide representative"],
    },
    goods: [
      {
        stock: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
        },
        quantity: Number,
      },
    ],
    capacity: Number,
    name: {
      type: String,
      required: [true, "provide name of mobile stock"],
    },
  },
  { timestamps: true }
);

mobileStockSchema.pre("save", async function (next) {
  const { goods } = this;
  await Promise.all(
    goods.map(async (product) => {
      const stock = await mongoose.model("Stock").findById(product.stock);
      const inventory = await mongoose
        .model("Inventory")
        .findById(stock.inventoryId);
      stock.quantity -= product.quantity;
      inventory.capacity += product.quantity;
      this.capacity -= product.quantity;
      await stock.save({ validateBeforeSave: false });
      await inventory.save({ validateBeforeSave: false });
    })
  );
  next();
});

const mobileStockModel = mongoose.model("MobileStock", mobileStockSchema);
export default mobileStockModel;
