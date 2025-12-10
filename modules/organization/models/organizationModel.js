import mongoose, { Schema, model } from "mongoose";

const organizationSchema = new Schema(
  {
    tradeName: {
      type: String,
      required: [true, "Enter trade name"],
      trim: true,
      minlength: [2, "Trade name must be at least 2 characters"],
      maxlength: [200, "Trade name must be at most 200 characters"],
    },
    address: {
      type: String,
      required: [true, "Enter address"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [500, "Address must be at most 500 characters"],
    },
    locations: [
      {
        type: String,
        trim: true,
      },
    ],
    country: {
      type: String,
      required: [true, "Enter organization's country"],
      trim: true,
      maxlength: [100, "Country must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Enter email"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    logo: {
      type: String,
      default: "",
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, "Tax ID must be at most 50 characters"],
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [100, "Industry must be at most 100 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for customers
organizationSchema.virtual("customers", {
  ref: "Customer",
  localField: "_id",
  foreignField: "organizationId",
});

// Virtual for employees count
organizationSchema.virtual("employeeCount", {
  ref: "User",
  localField: "_id",
  foreignField: "organizations.organization_id",
  count: true,
});

// Virtual for active customers (non-deleted)
organizationSchema.virtual("activeCustomers", {
  ref: "Customer",
  localField: "_id",
  foreignField: "organizationId",
  match: { isDeleted: false },
});

// Pre-save middleware to update user's organizations
organizationSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const user = await mongoose.model("User").findById(this.userId);
      if (user) {
        user.organizations.push({ organization_id: this._id });
        await user.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(error);
    }
  }

  // Update updatedAt timestamp
  this.updated_at = Date.now();
  next();
});

// Pre-remove middleware to remove organization from user
organizationSchema.pre("remove", async function (next) {
  try {
    const user = await mongoose.model("User").findById(this.userId);
    if (user) {
      user.organizations = user.organizations.filter(
        (org) => org.organization_id.toString() !== this._id.toString()
      );
      await user.save({ validateBeforeSave: false });
    }
  } catch (error) {
    return next(error);
  }
  next();
});

const Organization = model("Organization", organizationSchema);
export default Organization;
