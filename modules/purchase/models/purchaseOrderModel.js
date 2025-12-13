import mongoose, { Schema, model } from "mongoose";

const purchaseOrderSchema = new Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Purchase order must be associated with a supplier"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Purchase order must belong to an organization"],
      ref: "Organization",
    },
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        name: {
          type: String,
          required: [true, "Name is required"],
          trim: true,
          minlength: [2, "Product name must be at least 2 characters"],
          maxlength: [200, "Product name must be at most 200 characters"],
        },
        quantity: {
          type: Number,
          required: [true, "Product quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        deliveredQuantity: {
          type: Number,
          default: 0,
          min: [0, "Delivered quantity cannot be negative"],
        },
        remainingQuantity: {
          type: Number,
          default: function () {
            return this.quantity;
          },
          min: [0, "Remaining quantity cannot be negative"],
        },
        price: {
          type: Number,
          required: [true, "Product price is required"],
          min: [0, "Price must be positive"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
          max: [100, "Discount cannot exceed 100%"],
        },
        total: {
          type: Number,
          min: [0, "Total must be positive"],
        },
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
      },
    ],
    expectedDeliveryDate: {
      type: Date,
      required: [true, "Expected delivery date is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Expected delivery date must be in the future",
      },
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      enum: ["EGP", "SAR", "AED", "QAR", "EUR", "USD"],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "approved",
        "shipped",
        "delivered",
        "canceled",
        "invoiced",
      ],
      default: "draft",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Purchase order must have a creator"],
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount must be positive"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PurchaseOrder = model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
