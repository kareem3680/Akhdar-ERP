import mongoose, { Schema, model } from "mongoose";

const saleOrderSchema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "select customer you want to sell to"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "select organization"],
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
          required: [true, "select product"],
        },
        name: {
          type: String,
          required: [true, "enter the name of product"],
          trim: true,
        },
        code: {
          type: String,
          required: [true, "product code is required"],
        },
        quantity: {
          type: Number,
          required: [true, "enter quantity"],
          min: [1, "Quantity must be at least 1"],
        },
        wholesalePrice: {
          type: Number,
          required: [true, "Product wholesalePrice is required"],
          min: [0, "wholesalePrice must be positive"],
        },
        retailPrice: {
          type: Number,
          required: [true, "Product retailPrice is required"],
          min: [0, "retailPrice must be positive"],
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
          max: [100, "Discount cannot exceed 100%"],
        },
        tax: {
          type: Number,
          default: 0,
          min: [0, "Tax cannot be negative"],
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
      required: [true, "sale order must have a creator"],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, "Shipping cost cannot be negative"],
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount must be positive"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
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

const SaleOrder = model("SaleOrder", saleOrderSchema);
export default SaleOrder;
