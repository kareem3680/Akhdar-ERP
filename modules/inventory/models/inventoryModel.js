import mongoose, { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "enter inventory name"],
      trim: true,
      minlength: [2, "Inventory name must be at least 2 characters"],
      maxlength: [100, "Inventory name must be at most 100 characters"],
    },
    avatar: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      required: [true, "enter inventory location"],
      trim: true,
      minlength: [2, "Location must be at least 2 characters"],
      maxlength: [200, "Location must be at most 200 characters"],
    },
    capacity: {
      type: Number,
      required: [true, "Inventory capacity is required"],
      min: [1, "Capacity must be at least 1"],
      default: 1000,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    description: {
      type: String,
      maxlength: [500, "Description must be at most 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[+]?[\d\s\-()]+$/.test(v);
        },
        message: "Please provide a valid phone number",
      },
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

// Index for better query performance
inventorySchema.index({ organizationId: 1 });
inventorySchema.index({ name: 1 });
inventorySchema.index({ status: 1 });

const Inventory = model("Inventory", inventorySchema);
export default Inventory;
