import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrement = mongooseSequence(mongoose);

const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Too short name"],
      maxlength: [100, "Too long name"],
    },
    avatar: {
      type: String,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      unique: true,
      minlength: [14, "National ID must be 14 characters"],
      maxlength: [14, "National ID must be 14 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address must be at most 500 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    birthDate: {
      type: Date,
    },
    alternativePhone: {
      type: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    workLocation: {
      type: String,
      required: [true, "Work location is required"],
      trim: true,
    },
    shift: {
      start: {
        type: Date,
      },
      end: {
        type: Date,
      },
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, "Bonus cannot be negative"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["admin", "manager", "HR", "employee", "CEO", "accountant"],
      },
      default: "employee",
    },
    levelOfExperience: {
      type: String,
      required: [true, "Level of experience is required"],
      enum: {
        values: ["junior", "mid", "senior", "expert"],
      },
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: {
        values: [
          "full_time",
          "part_time",
          "contractor",
          "intern",
          "temporary",
          "casual",
          "freelancer",
          "probation",
        ],
      },
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Self-referencing for manager
      required: [true, "Manager is required"],
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [1, "Salary must be greater than 0"],
    },
    employmentDate: {
      type: Date,
      required: [true, "Employment date is required"],
    },
    active: {
      type: Boolean,
      default: true,
    },
    employeeId: {
      type: Number,
      unique: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full work experience
employeeSchema.virtual("experienceInYears").get(function () {
  if (!this.employmentDate) return 0;
  const startDate = new Date(this.employmentDate);
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
});

// Virtual for age
employeeSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;
  const birthDate = new Date(this.birthDate);
  const now = new Date();
  const diffTime = Math.abs(now - birthDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
});

// Auto increment employee ID
employeeSchema.plugin(AutoIncrement, {
  inc_field: "employeeId",
  start_seq: 1000,
});

// Pre-save middleware to validate manager
employeeSchema.pre("save", async function (next) {
  if (this.manager && this.manager.equals(this._id)) {
    const error = new Error("Employee cannot be their own manager");
    return next(error);
  }
  next();
});

// Indexes
employeeSchema.index({ department: 1, active: 1 });
employeeSchema.index({ role: 1 });

const employeeModel = model("Employee", employeeSchema);

export default employeeModel;
