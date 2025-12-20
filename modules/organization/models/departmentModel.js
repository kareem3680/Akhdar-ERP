import mongoose, { Schema, model } from "mongoose";

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      minlength: [2, "Too short department name"],
      maxlength: [50, "Too long department name"],
      unique: true,
      lowercase: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
    },
    active: {
      type: Boolean,
      default: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    location: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#3498db",
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color code"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for employee count
departmentSchema.virtual("employeeCount", {
  ref: "Employee",
  localField: "_id",
  foreignField: "department",
  count: true,
  match: { active: true },
});

// Virtual for department employees
departmentSchema.virtual("employees", {
  ref: "Employee",
  localField: "_id",
  foreignField: "department",
  options: {
    sort: { name: 1 },
    select: "name email employeeId jobTitle phone",
  },
});

// Pre-save middleware to generate code from name
departmentSchema.pre("save", function (next) {
  if (!this.code && this.name) {
    // Generate code: first 3 letters uppercase + random 3 numbers
    const namePart = this.name.substring(0, 3).toUpperCase();
    const randomPart = Math.floor(100 + Math.random() * 900);
    this.code = `${namePart}${randomPart}`;
  }
  next();
});

const departmentModel = model("Department", departmentSchema);

export default departmentModel;
