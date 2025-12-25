import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: [true, "Transfer status is required"],
      enum: ["draft", "shipping", "delivered", "cancelled"],
      default: "draft",
    },
    reference: {
      type: String,
      unique: true,
      required: [true, "Reference number is required"],
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Source inventory is required"],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Destination inventory is required"],
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        unit: {
          type: Number,
          required: true,
          min: [1, "Unit must be at least 1"],
        },
        name: String,
        code: String,
      },
    ],
    shippingCost: {
      type: Number,
      min: [0, "Shipping cost cannot be negative"],
      default: 0,
    },
    notes: String,
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
  }
);

// Pre-save hook to generate reference if not provided
stockTransferSchema.pre("save", async function (next) {
  if (!this.reference) {
    const count = await mongoose.model("StockTransfer").countDocuments();
    this.reference = `TR-${Date.now()}-${count + 1}`;
  }
  next();
});

// Method to check if transfer can be shipped
stockTransferSchema.methods.canShip = function () {
  return this.status === "draft";
};

// Method to check if transfer can be delivered
stockTransferSchema.methods.canDeliver = function () {
  return this.status === "shipping";
};

const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);
export default StockTransfer;
