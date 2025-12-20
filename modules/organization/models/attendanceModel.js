import mongoose, { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, "Total hours cannot be negative"],
    },
    overtime: {
      type: Number,
      default: 0,
      min: [0, "Overtime cannot be negative"],
    },
    deduction: {
      type: Number,
      default: 0,
      min: [0, "Deduction cannot be negative"],
    },
    status: {
      type: String,
      enum: ["absent", "present", "checked-out", "late", "leave", "holiday"],
      default: "absent",
      required: [true, "Status is required"],
    },
    notes: {
      type: String,
      maxlength: [500, "Notes must be at most 500 characters"],
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
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ employee: 1, status: 1 });
attendanceSchema.index({ createdAt: -1 });

const Attendance = model("Attendance", attendanceSchema);
export default Attendance;
