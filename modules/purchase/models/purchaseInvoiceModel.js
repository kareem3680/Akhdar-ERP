import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: [true, "Purchase order is required"],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        code: {
          type: String,
          required: [true, "Product code is required"],
        },
        deliveredQuantity: {
          type: Number,
          default: 0,
          min: [0, "Delivered quantity must not be negative"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
        price: {
          type: Number,
          required: [true, "Product price is required"],
          min: [0, "Price must not be negative"],
        },
        total: {
          type: Number,
          default: function () {
            return this.quantity * this.price;
          },
        },
        tax: {
          type: Number,
          default: 0,
          min: [0, "Tax must not be negative"],
        },
        inventory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "partial"],
      default: "unpaid",
    },
    notes: String,
    totalPayment: {
      type: Number,
      default: 0,
      min: [0, "Total payment must not be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Calculate totalPayment before save
invoiceSchema.pre("save", function (next) {
  if (this.products && this.products.length > 0) {
    this.totalPayment = this.products.reduce((sum, product) => {
      return sum + (product.total || 0);
    }, 0);
  }
  next();
});

const PurchaseInvoice = mongoose.model("PurchaseInvoice", invoiceSchema);

export default PurchaseInvoice;
