const Payment = require("../models/Payment");
const User = require("../models/User");
const Lab = require("../models/Lab");
const Booking = require("../models/Booking");

const settleCoveredBookingsForAgent = async (agentId, amount) => {
  let remainingAmount = amount;
  let settledCount = 0;

  const bookings = await Booking.find({
    "agents.agent": agentId,
    $or: [
      { adminSettlementStatus: "Pending" },
      { adminSettlementStatus: { $exists: false } }
    ]
  }).sort({ createdAt: 1 });

  for (const booking of bookings) {
    if (remainingAmount <= 0) break;

    const payerSnapshot = booking.agents.find(
      item => item.agent.toString() === agentId.toString()
    );
    if (!payerSnapshot) continue;

    const payerDue = Math.max(booking.totalPrice - payerSnapshot.commission, 0);
    const paidByDifferentAgent = booking.adminSettlementPaidBy
      && booking.adminSettlementPaidBy.toString() !== agentId.toString()
      && (booking.adminSettlementPaidAmount || 0) > 0;

    if (paidByDifferentAgent) continue;

    const paidSoFar = booking.adminSettlementPaidAmount || 0;
    const dueRemaining = Math.max(payerDue - paidSoFar, 0);
    const appliedAmount = Math.min(remainingAmount, dueRemaining);

    if (appliedAmount <= 0) continue;

    booking.adminSettlementPaidAmount = paidSoFar + appliedAmount;
    booking.adminSettlementPaidBy = agentId;
    remainingAmount -= appliedAmount;

    if (booking.adminSettlementPaidAmount + 0.001 >= payerDue) {
      for (const snapshot of booking.agents) {
        if (snapshot.agent.toString() === agentId.toString()) continue;

        await User.findByIdAndUpdate(snapshot.agent, {
          $inc: { balance: booking.totalPrice }
        });
      }

      booking.adminSettlementStatus = "Settled";
      booking.adminSettledBy = agentId;
      booking.adminSettledAt = new Date();
      settledCount += 1;
    }

    await booking.save();
  }

  return { settledCount, unappliedAmount: remainingAmount };
};

const settleSpecificBookingForAgent = async (bookingId, agentId, amount) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.adminSettlementStatus === "Settled") {
    throw new Error("Booking already settled");
  }

  const payerSnapshot = booking.agents.find(
    item => item.agent.toString() === agentId.toString()
  );
  if (!payerSnapshot) {
    throw new Error("Agent not associated with this booking");
  }

  const payerDue = Math.max(booking.totalPrice - payerSnapshot.commission, 0);
  const paidSoFar = booking.adminSettlementPaidAmount || 0;
  const dueRemaining = Math.max(payerDue - paidSoFar, 0);

  const appliedAmount = Math.min(amount, dueRemaining);
  if (appliedAmount <= 0) {
    throw new Error("No remaining due to settle on this booking");
  }

  booking.adminSettlementPaidAmount = paidSoFar + appliedAmount;
  booking.adminSettlementPaidBy = agentId;

  if (booking.adminSettlementPaidAmount + 0.001 >= payerDue) {
    for (const snapshot of booking.agents) {
      if (snapshot.agent.toString() === agentId.toString()) continue;

      await User.findByIdAndUpdate(snapshot.agent, {
        $inc: { balance: booking.totalPrice }
      });
    }

    booking.adminSettlementStatus = "Settled";
    booking.adminSettledBy = agentId;
    booking.adminSettledAt = new Date();
  }

  await booking.save();
  return { settledCount: booking.adminSettlementStatus === "Settled" ? 1 : 0, unappliedAmount: amount - appliedAmount };
};

// @desc    Record a new payment / settlement
// @route   POST /api/payments
// @access  Private Admin & Agent
const recordPayment = async (req, res) => {
  const { type, agentId, labId, bookingId, amount, paymentMode, notes } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Role-based security checks
    if (req.user.role === "agent") {
      if (type !== "AgentToAdmin") {
        return res.status(403).json({ message: "Agents can only record payments of type AgentToAdmin" });
      }
    }

    let paymentData = {
      type,
      amount,
      paymentMode,
      notes
    };

    if (type === "AgentToAdmin") {
      const targetAgentId = req.user.role === "agent" ? req.user._id : agentId;
      if (!targetAgentId) return res.status(400).json({ message: "Agent ID is required" });
      
      const agent = await User.findById(targetAgentId);
      if (!agent || agent.role !== "agent") return res.status(400).json({ message: "Invalid Agent" });

      // Agent pays Admin: Increases agent's balance (brings negative balance closer to 0 or positive)
      agent.balance += amount;
      await agent.save();

      let settlementResult;
      if (bookingId) {
        settlementResult = await settleSpecificBookingForAgent(bookingId, targetAgentId, amount);
        paymentData.booking = bookingId;
      } else {
        settlementResult = await settleCoveredBookingsForAgent(targetAgentId, amount);
      }

      paymentData.agent = targetAgentId;
      paymentData.notes = [
        notes,
        settlementResult.settledCount > 0
          ? `${settlementResult.settledCount} booking collection settled`
          : null
      ].filter(Boolean).join(" | ");
    } else if (type === "AdminToAgent") {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can record AdminToAgent payments" });
      }
      if (!agentId) return res.status(400).json({ message: "Agent ID is required" });
      const agent = await User.findById(agentId);
      if (!agent || agent.role !== "agent") return res.status(400).json({ message: "Invalid Agent" });

      // Admin pays Agent: Decreases agent's balance (reduces what Admin owes Agent)
      agent.balance -= amount;
      await agent.save();
      paymentData.agent = agentId;
    } else if (type === "AdminToLab") {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can record AdminToLab payments" });
      }
      if (!labId) return res.status(400).json({ message: "Lab ID is required" });
      const lab = await Lab.findById(labId);
      if (!lab) return res.status(400).json({ message: "Invalid Lab" });

      // Admin pays Lab: Decreases lab's balance (reduces what Admin owes Lab)
      lab.balance -= amount;
      await lab.save();
      paymentData.lab = labId;
    } else {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const payment = await Payment.create(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ledger balances & financial summary
// @route   GET /api/payments/summary
// @access  Private Admin
const getFinancialSummary = async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("name balance agentPercentage");
    const labs = await Lab.find({}).select("name balance labPercentage");

    let totalOwedByAgents = 0; // Negative agent balances (agent owes admin)
    let totalOwedToAgents = 0; // Positive agent balances (admin owes agent)
    let totalOwedToLabs = 0;   // Positive lab balances

    agents.forEach(agent => {
      if (agent.balance < 0) {
        totalOwedByAgents += Math.abs(agent.balance);
      } else {
        totalOwedToAgents += agent.balance;
      }
    });

    labs.forEach(lab => {
      if (lab.balance > 0) {
        totalOwedToLabs += lab.balance;
      }
    });

    res.json({
      summary: {
        totalOwedByAgents,
        totalOwedToAgents,
        totalOwedToLabs
      },
      agents,
      labs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payment records
// @route   GET /api/payments
// @access  Private Admin & Agent
const getPayments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "agent") {
      filter = { agent: req.user._id };
    }
    const payments = await Payment.find(filter)
      .populate("agent", "name role")
      .populate("lab", "name")
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { recordPayment, getFinancialSummary, getPayments };
