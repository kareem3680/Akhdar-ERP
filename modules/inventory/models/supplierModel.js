import mongoose, { Schema, model } from "mongoose";
import validator from "validator";

const supplierSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide address"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [500, "Address must be at most 500 characters"],
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
      trim: true,
      validate: {
        validator: function (v) {
          return validator.isMobilePhone(v, "any");
        },
        message: "Please provide a valid phone number",
      },
    },
    organizationId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Supplier must belong to an organization"],
      },
    ],
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, "Tax ID must be at most 50 characters"],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || validator.isURL(v);
        },
        message: "Please provide a valid website URL",
      },
    },
    contactPerson: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Contact person name must be at most 100 characters"],
      },
      position: {
        type: String,
        trim: true,
        maxlength: [100, "Position must be at most 100 characters"],
      },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || validator.isMobilePhone(v, "any");
          },
          message: "Please provide a valid contact phone number",
        },
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v) {
            return !v || validator.isEmail(v);
          },
          message: "Please provide a valid contact email",
        },
      },
    },
    paymentTerms: {
      type: String,
      enum: ["net-30", "net-60", "net-90", "prepaid", "cod"],
      default: "net-30",
    },
    currency: {
      type: String,
      enum: ["EGP", "SAR", "AED", "QAR", "EUR", "USD"],
      default: "EGP",
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
      default: 3,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supplier must have a creator"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for supplier's full contact info
supplierSchema.virtual("contactInfo").get(function () {
  return {
    name: this.name,
    email: this.email,
    phone: this.phone,
    address: this.address,
    contactPerson: this.contactPerson,
  };
});

// Virtual for supplier's organizations count
supplierSchema.virtual("organizationsCount").get(function () {
  return this.organizationId?.length || 0;
});

// Virtual for purchase orders (to be populated)
supplierSchema.virtual("purchaseOrders", {
  ref: "PurchaseOrder",
  localField: "_id",
  foreignField: "supplierId",
});

// Middleware to exclude deleted suppliers from queries
supplierSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Index for better query performance
supplierSchema.index({ name: 1, organizationId: 1 });
supplierSchema.index({ email: 1 }, { unique: true, sparse: true });
supplierSchema.index({ phone: 1 }, { unique: true, sparse: true });

const Supplier = model("Supplier", supplierSchema);
export default Supplier;
