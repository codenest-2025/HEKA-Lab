const mongoose = require("mongoose");

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    labPercentage: { type: Number, required: true, default: 0 }, // percentage lab gets of test price
    balance: { type: Number, default: 0 } // Amount admin owes to this lab
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lab", labSchema);
