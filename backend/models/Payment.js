const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["AgentToAdmin", "AdminToAgent", "AdminToLab"],
      required: true
    },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ["Cash", "Bank"], required: true },
    notes: { type: String },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
