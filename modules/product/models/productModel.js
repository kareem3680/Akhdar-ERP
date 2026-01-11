import mongoose, { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "enter product name"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "enter product code"],
      unique: true,
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
    tax: {
      type: Number,
      required: [true, "enter tax for product"],
      min: [0, "Tax must be positive"],
    },
    description: {
      type: String,
      maxlength: [500, "Description must be at most 500 characters"],
      minlength: [5, "Description must be at least 5 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "select category for your product"],
    },
    unit: {
      type: Number,
      default: 0,
      min: [0, "Unit must be positive"],
    },
    img: [String],
    total: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate total
productSchema.pre("save", function (next) {
  this.total = this.unit * this.wholesalePrice;
  next();
});

// Pre-update middleware for findOneAndUpdate
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.unit !== undefined || update.wholesalePrice !== undefined) {
    const wholesalePrice = update.wholesalePrice || this._update.wholesalePrice;
    const unit = update.unit || this._update.unit;
    this.set({ total: (wholesalePrice || 0) * (unit || 0) });
  }
  next();
});

const Product = model("Product", productSchema);
export default Product;
