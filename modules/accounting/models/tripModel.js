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
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        total: {
          type: Number,
          default: 0,
        },
        notes: String,
        status: {
          type: String,
          enum: ["pending", "loaded", "sold", "returned"],
          default: "pending",
        },
        returnedQuantity: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalProductsValue: {
      type: Number,
      default: 0,
    },
    loadedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

tripSchema.pre("save", function (next) {
  if (this.isNew) {
    this.tripNumber = Math.floor(Math.random() * 99999);
  }

  if (this.products && this.products.length > 0) {
    this.products.forEach((product) => {
      product.total = product.quantity * product.price;
    });

    this.totalProductsValue = this.products.reduce((total, product) => {
      return total + (product.total || 0);
    }, 0);
  }

  next();
});

const tripModel = mongoose.model("Trip", tripSchema);
export default tripModel;
