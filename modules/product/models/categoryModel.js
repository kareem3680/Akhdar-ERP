import mongoose, { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    category: {
      type: String,
      required: [true, "category name is required"],
      trim: true,
      unique: [true, "category exists before"],
    },
  },
  { timestamps: true }
);

const Category = model("Category", categorySchema);
export default Category;
