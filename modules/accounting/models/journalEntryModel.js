import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journal",
      required: [true, "Journal is required"],
    },
    lines: [
      {
        accountId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Account",
          required: [true, "Account is required"],
        },
        description: {
          type: String,
          trim: true,
        },
        debit: {
          type: Number,
          min: [0, "Debit must not be negative"],
          default: 0,
        },
        credit: {
          type: Number,
          min: [0, "Credit must not be negative"],
          default: 0,
        },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    reference: String,
    notes: String,
    status: {
      type: String,
      enum: ["draft", "posted", "void"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Validate that total debits equal total credits
journalEntrySchema.pre("save", function (next) {
  const totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);

  if (totalDebit !== totalCredit) {
    return next(new Error("Total debits must equal total credits"));
  }

  next();
});

const journalEntry = mongoose.model("journalEntry", journalEntrySchema);

export default journalEntry;
