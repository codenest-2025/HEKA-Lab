const mongoose = require("mongoose");

const testSnapshotSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  labPercentage: { type: Number, required: true }
});

const agentSnapshotSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  commission: { type: Number, required: true },
  agentPercentage: { type: Number, required: true }
});

const bookingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agents: [agentSnapshotSchema], // automatic splits for all agents of the clinic
    tests: [testSnapshotSchema],
    totalPrice: { type: Number, required: true },
    totalAgentCommission: { type: Number, default: 0 },
    labShare: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ["Cash", "Bank"], required: true },
    paymentCollectedBy: { type: String, enum: ["Staff", "Agent"], default: "Staff" },
    adminSettlementStatus: { type: String, enum: ["Pending", "Settled"], default: "Pending" },
    adminSettlementPaidAmount: { type: Number, default: 0 },
    adminSettlementPaidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminSettledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminSettledAt: { type: Date },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    status: { type: String, enum: ["Pending", "Completed"], default: "Completed" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
