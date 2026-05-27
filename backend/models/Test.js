const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true, default: 0 },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
