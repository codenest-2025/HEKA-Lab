const Booking = require("../models/Booking");
const Patient = require("../models/Patient");
const Test = require("../models/Test");
const User = require("../models/User");
const Lab = require("../models/Lab");

// @desc    Register a new patient
// @route   POST /api/bookings/patients
// @access  Private (Staff/Admin)
const createPatient = async (req, res) => {
  const { name, age, gender, phone } = req.body;
  try {
    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      createdBy: req.user._id
    });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all patients
// @route   GET /api/bookings/patients
// @access  Private (Staff/Admin)
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new booking & update balances
// @route   POST /api/bookings
// @access  Private (Staff/Admin)
const createBooking = async (req, res) => {
  const { patientId, testIds, paymentMode } = req.body;

  try {
    // 1. Fetch Patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // 2. Fetch Staff center
    const staffUser = await User.findById(req.user._id);
    if (!staffUser.center && staffUser.role !== "admin") {
      return res.status(400).json({ message: "Staff user must be assigned to a center" });
    }
    const centerId = staffUser.center || req.body.centerId;
    if (!centerId) {
      return res.status(400).json({ message: "Center ID is required" });
    }

    // 3. Fetch all Agents connected to this center
    const centerAgents = await User.find({ role: "agent", center: centerId });

    // 4. Fetch Tests and calculate
    const dbTests = await Test.find({ _id: { $in: testIds } }).populate("lab");
    if (dbTests.length === 0) {
      return res.status(400).json({ message: "No valid tests selected" });
    }

    let totalPrice = 0;
    let totalLabShare = 0;
    const testSnapshots = [];
    const labUpdates = {};

    for (const test of dbTests) {
      const price = test.price;
      const labPercentage = test.lab.labPercentage;
      const labShare = (price * labPercentage) / 100;

      totalPrice += price;
      totalLabShare += labShare;

      testSnapshots.push({
        test: test._id,
        name: test.name,
        price,
        labPercentage
      });

      // Track lab balance updates
      const labIdStr = test.lab._id.toString();
      labUpdates[labIdStr] = (labUpdates[labIdStr] || 0) + labShare;
    }

    // 5. Calculate and split commissions for all clinic agents automatically
    const agentSnapshots = [];
    let totalAgentCommission = 0;

    for (const agent of centerAgents) {
      const agentPercent = agent.agentPercentage || 0;
      const commission = (totalPrice * agentPercent) / 100;
      totalAgentCommission += commission;

      agentSnapshots.push({
        agent: agent._id,
        name: agent.name,
        commission,
        agentPercentage: agentPercent
      });

      // Debit the agent's balance: Agent owes Admin (Total - Commission)
      agent.balance -= (totalPrice - commission);
      await agent.save();
    }

    // Update Lab balances (Admin owes lab)
    for (const [labId, share] of Object.entries(labUpdates)) {
      await Lab.findByIdAndUpdate(labId, { $inc: { balance: share } });
    }

    // 6. Create booking
    const booking = await Booking.create({
      patient: patientId,
      center: centerId,
      staff: req.user._id,
      agents: agentSnapshots,
      tests: testSnapshots,
      totalPrice,
      totalAgentCommission,
      labShare: totalLabShare,
      paymentMode,
      paymentCollectedBy: "Staff"
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Staff/Admin)
const getBookings = async (req, res) => {
  try {
    let query = {};
    // Filter by role
    if (req.user.role === "staff") {
      query.center = req.user.center;
    } else if (req.user.role === "agent") {
      query["agents.agent"] = req.user._id;
    }
    const bookings = await Booking.find(query)
      .populate("patient")
      .populate("center")
      .populate("staff", "name")
      .populate("agents.agent", "name")
      .populate("adminSettledBy", "name")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPatient, getPatients, createBooking, getBookings };
