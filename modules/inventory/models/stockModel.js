import mongoose, { Schema, model } from "mongoose";

const stockSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Inventory ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    minQuantity: {
      type: Number,
      min: [0, "Minimum quantity cannot be negative"],
      default: 10,
    },
    maxQuantity: {
      type: Number,
      min: [0, "Maximum quantity cannot be negative"],
      default: 1000,
    },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock", "overstock"],
      default: "in-stock",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["purchase", "sale", "adjustment", "transfer", "return"],
        },
        quantity: Number,
        referenceId: mongoose.Schema.Types.ObjectId,
        referenceType: String,
        notes: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique product-inventory combination
stockSchema.index({ productId: 1, inventoryId: 1 }, { unique: true });

// Pre-save middleware to update status based on quantity
stockSchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.status = "out-of-stock";
  } else if (this.quantity <= this.minQuantity) {
    this.status = "low-stock";
  } else if (this.quantity >= this.maxQuantity) {
    this.status = "overstock";
  } else {
    this.status = "in-stock";
  }
  next();
});

// Method to check if stock is sufficient for sale
stockSchema.methods.isSufficient = function (requiredQuantity) {
  return this.quantity >= requiredQuantity;
};

// Method to get available quantity (considering min quantity)
stockSchema.methods.getAvailableQuantity = function () {
  return Math.max(0, this.quantity - this.minQuantity);
};

// Static method to find stock by product and inventory
stockSchema.statics.findByProductAndInventory = function (
  productId,
  inventoryId
) {
  return this.findOne({ productId, inventoryId, isActive: true });
};

const Stock = model("Stock", stockSchema);
export default Stock;
