import mongoose, { Schema, model } from "mongoose";

const saleOrderInvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
    },
    saleOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleOrder",
      required: [true, "Sale order ID is required"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
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
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
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
        tax: {
          type: Number,
          default: 0,
          min: [0, "Tax cannot be negative"],
        },
        total: {
          type: Number,
          required: [true, "Total amount is required"],
          min: [0, "Total must be positive"],
        },
        inventory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: {
        values: ["paid", "unpaid", "partial"],
        message: "Payment status must be paid, unpaid, or partial",
      },
      default: "unpaid",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
    totalPayment: {
      type: Number,
      required: [true, "Total payment is required"],
      min: [0, "Total payment must be positive"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    amountDue: {
      type: Number,
      default: function () {
        return this.totalPayment - this.amountPaid;
      },
      min: [0, "Amount due cannot be negative"],
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > new Date();
        },
        message: "Due date must be in the future",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for invoice status
saleOrderInvoiceSchema.virtual("status").get(function () {
  if (this.paymentStatus === "paid") return "completed";
  if (this.paymentStatus === "partial") return "in-progress";
  return "pending";
});

// Calculate amount due before save
saleOrderInvoiceSchema.pre("save", function (next) {
  if (this.isModified("amountPaid") || this.isModified("totalPayment")) {
    this.amountDue = this.totalPayment - this.amountPaid;

    // Update payment status based on amounts
    if (this.amountPaid === 0) {
      this.paymentStatus = "unpaid";
    } else if (this.amountPaid >= this.totalPayment) {
      this.paymentStatus = "paid";
    } else {
      this.paymentStatus = "partial";
    }
  }
  next();
});

// Pre-save middleware to generate invoice number if not provided
saleOrderInvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const prefix = "INV";
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });
    this.invoiceNumber = `${prefix}-${year}-${(count + 1)
      .toString()
      .padStart(5, "0")}`;
  }
  next();
});

const SaleInvoice = model("SaleInvoice", saleOrderInvoiceSchema);
export default SaleInvoice;
