const Payment = require("../models/Payment");
const User = require("../models/User");
const Lab = require("../models/Lab");
const Booking = require("../models/Booking");
const Center = require("../models/Center");

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
    
    if (req.io) {
      req.io.emit("paymentCreated", payment);
      req.io.emit("bookingUpdated");
    }

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
    const centers = await Center.find({});
    const agents = await User.find({ role: "agent" });
    const labs = await Lab.find({});
    const bookings = await Booking.find({});
    const payments = await Payment.find({});

    const centerData = [];
    let totalFromCenters = 0;

    for (const center of centers) {
      // Find all bookings for this center
      const centerBookings = bookings.filter(
        (b) => b.center && b.center.toString() === center._id.toString()
      );
      const totalBookingsPrice = centerBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalCommissions = centerBookings.reduce((sum, b) => sum + (b.totalAgentCommission || 0), 0);

      // Find all agents assigned to this center
      const centerAgents = agents.filter(
        (a) => a.center && a.center.toString() === center._id.toString()
      );
      const centerAgentIds = centerAgents.map((a) => a._id.toString());

      // Find payments from agents of this center to Admin
      const centerPayments = payments.filter(
        (p) => p.type === "AgentToAdmin" && p.agent && centerAgentIds.includes(p.agent.toString())
      );
      const totalPaid = centerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Center balance = (total - agenta - agentb - ...) - payments
      const centerBalance = Math.max((totalBookingsPrice - totalCommissions) - totalPaid, 0);

      // Filter agents of this center whom the admin needs to pay (agent.balance > 0)
      const agentsToPay = centerAgents
        .filter((a) => a.balance > 0)
        .map((a) => ({
          _id: a._id,
          name: a.name,
          balance: a.balance,
          agentPercentage: a.agentPercentage
        }));

      centerData.push({
        _id: center._id,
        name: center.name,
        balance: centerBalance,
        agentsToPay
      });

      totalFromCenters += centerBalance;
    }

    // Sum up agents that the admin needs to pay
    let totalToAgents = 0;
    agents.forEach((agent) => {
      if (agent.balance > 0) {
        totalToAgents += agent.balance;
      }
    });

    // Sum up labs that the admin needs to pay
    let totalToLabs = 0;
    labs.forEach((lab) => {
      if (lab.balance > 0) {
        totalToLabs += lab.balance;
      }
    });

    // Net balance of 1 month: (totalPrice - agentCommissions - labShares) for bookings created in last 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const oneMonthBookings = bookings.filter(
      (b) => new Date(b.createdAt) >= oneMonthAgo
    );
    const netBalanceOneMonth = oneMonthBookings.reduce((sum, b) => {
      const agentShare = b.totalAgentCommission || 0;
      const labShare = b.labShare || 0;
      return sum + ((b.totalPrice || 0) - agentShare - labShare);
    }, 0);

    res.json({
      summary: {
        totalFromCenters,
        totalToAgents,
        totalToLabs,
        netBalanceOneMonth
      },
      centers: centerData,
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
