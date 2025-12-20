import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Journal name is required"],
      trim: true,
    },
    journalType: {
      type: String,
      required: [true, "Journal type is required"],
    },
    code: {
      type: String,
      required: [true, "Journal code is required"],
      unique: true,
    },
  },
  { timestamps: true }
);

const Journal = mongoose.model("Journal", journalSchema);

export default Journal;
