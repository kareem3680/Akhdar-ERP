import mongoose, { Schema, model } from "mongoose";

const customerSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "enter your name"],
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name must be at most 150 characters"],
    },
    organizationId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      enum: ["EGP", "SAR", "AED", "QAR", "EUR", "USD"],
      required: [true, "select your currency"],
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
    address: {
      type: String,
      maxlength: [500, "Address must be at most 500 characters"],
    },
    country: {
      type: String,
      maxlength: [100, "Country must be at most 100 characters"],
    },
    city: {
      type: String,
      maxlength: [100, "City must be at most 100 characters"],
    },
    taxNumber: {
      type: String,
      maxlength: [100, "Tax number must be at most 100 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

customerSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

const Customer = model("Customer", customerSchema);
export default Customer;
