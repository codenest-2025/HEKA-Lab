const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Lab = require("./models/Lab");
const Test = require("./models/Test");
const Center = require("./models/Center");
const Patient = require("./models/Patient");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected. Clearing test collections...");

    await User.deleteMany({});
    await Lab.deleteMany({});
    await Test.deleteMany({});
    await Center.deleteMany({});
    await Patient.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});

    console.log("Creating Seed Data...");
    // 1. Create Admin
    const admin = await User.create({
      name: "System Admin",
      username: "admin",
      password: "password123",
      role: "admin"
    });

    // 2. Create Center
    const center = await Center.create({
      name: "Main Diagnostics Center",
      location: "Building A, Downtown"
    });

    // 3. Create Staff
    const staff = await User.create({
      name: "Jane Staff",
      username: "staff",
      password: "password123",
      role: "staff",
      center: center._id
    });

    // 4. Create Lab
    const lab = await Lab.create({
      name: "Alfa Pathology Lab",
      labPercentage: 60 // Lab gets 60% of test price
    });

    // 5. Create Test
    const test = await Test.create({
      name: "Blood Sugar Test",
      price: 1000,
      lab: lab._id
    });

    // 6. Create Agent
    const agent = await User.create({
      name: "John Agent",
      username: "agent",
      password: "password123",
      role: "agent",
      agentPercentage: 10 // Agent gets 10% commission
    });

    // 7. Register Patient
    const patient = await Patient.create({
      name: "Robert Smith",
      age: 45,
      gender: "Male",
      phone: "1234567890",
      createdBy: staff._id
    });

    console.log("\n--- SIMULATING BOOKING 1: Patient pays Staff ---");
    // Booking 1 details:
    // Total price = 1000. Lab share = 60% of 1000 = 600. Agent commission = 10% of 1000 = 100.
    // Collected by Staff, so Admin has the cash. Admin owes Agent 100 (balance increases by 100).
    // Admin owes Lab 600 (lab balance increases by 600).
    const booking1 = await simulateCreateBooking({
      patientId: patient._id,
      testIds: [test._id],
      agentId: agent._id,
      paymentMode: "Cash",
      paymentCollectedBy: "Staff",
      staffId: staff._id,
      centerId: center._id
    });

    console.log("Booking 1 created successfully.");
    let updatedAgent = await User.findById(agent._id);
    let updatedLab = await Lab.findById(lab._id);
    console.log(`Agent Balance (Expected +100): ${updatedAgent.balance}`);
    console.log(`Lab Balance (Expected +600): ${updatedLab.balance}`);

    if (updatedAgent.balance !== 100 || updatedLab.balance !== 600) {
      throw new Error("Financial calculations failed for Booking 1");
    }

    console.log("\n--- SIMULATING BOOKING 2: Patient pays Agent ---");
    // Booking 2 details:
    // Total price = 1000. Lab share = 60% of 1000 = 600. Agent commission = 10% of 1000 = 100.
    // Collected by Agent, so Agent has the cash. Agent owes Admin (Total - Commission) = (1000 - 100) = 900.
    // Agent balance decreases by 900. Previous balance was 100. New balance = 100 - 900 = -800.
    // Admin owes Lab 600. Previous balance was 600. New balance = 600 + 600 = 1200.
    const booking2 = await simulateCreateBooking({
      patientId: patient._id,
      testIds: [test._id],
      agentId: agent._id,
      paymentMode: "Bank",
      paymentCollectedBy: "Agent",
      staffId: staff._id,
      centerId: center._id
    });

    console.log("Booking 2 created successfully.");
    updatedAgent = await User.findById(agent._id);
    updatedLab = await Lab.findById(lab._id);
    console.log(`Agent Balance (Expected -800): ${updatedAgent.balance}`);
    console.log(`Lab Balance (Expected +1200): ${updatedLab.balance}`);

    if (updatedAgent.balance !== -800 || updatedLab.balance !== 1200) {
      throw new Error("Financial calculations failed for Booking 2");
    }

    console.log("\n--- SIMULATING AGENT SETTLEMENT: Agent pays Admin to clear due ---");
    // Agent owes Admin 800 (balance is -800). Agent pays Admin 800. Agent balance increases by 800, bringing it to 0.
    await recordPayment({
      type: "AgentToAdmin",
      agentId: agent._id,
      amount: 800,
      paymentMode: "Bank",
      notes: "Agent cleared his dues"
    });

    updatedAgent = await User.findById(agent._id);
    console.log(`Agent Balance after paying due (Expected 0): ${updatedAgent.balance}`);
    if (updatedAgent.balance !== 0) {
      throw new Error("Agent settlement failed");
    }

    console.log("\n--- SIMULATING ADMIN PAYING LAB ---");
    // Admin owes Lab 1200. Admin pays Lab 1200. Lab balance decreases by 1200, bringing it to 0.
    await recordPayment({
      type: "AdminToLab",
      labId: lab._id,
      amount: 1200,
      paymentMode: "Cash",
      notes: "Settle lab dues for Alfa Lab"
    });

    updatedLab = await Lab.findById(lab._id);
    console.log(`Lab Balance after Admin payment (Expected 0): ${updatedLab.balance}`);
    if (updatedLab.balance !== 0) {
      throw new Error("Lab settlement failed");
    }

    console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! FINANCIAL LEDGER LOGIC IS CORRECT. <<<");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

// Simulation helpers matching controllers exactly
const simulateCreateBooking = async ({ patientId, testIds, agentId, paymentMode, paymentCollectedBy, staffId, centerId }) => {
  let agent = null;
  let agentPercent = 0;
  if (agentId) {
    agent = await User.findById(agentId);
    agentPercent = agent.agentPercentage || 0;
  }

  const dbTests = await Test.find({ _id: { $in: testIds } }).populate("lab");
  let totalPrice = 0;
  let totalAgentCommission = 0;
  let totalLabShare = 0;
  const testSnapshots = [];
  const labUpdates = {};

  for (const test of dbTests) {
    const price = test.price;
    const labPercentage = test.lab.labPercentage;
    const labShare = (price * labPercentage) / 100;
    const agentCommission = agent ? (price * agentPercent) / 100 : 0;

    totalPrice += price;
    totalAgentCommission += agentCommission;
    totalLabShare += labShare;

    testSnapshots.push({
      test: test._id,
      name: test.name,
      price,
      labPercentage,
      agentPercentage: agentPercent
    });

    const labIdStr = test.lab._id.toString();
    labUpdates[labIdStr] = (labUpdates[labIdStr] || 0) + labShare;
  }

  if (agent) {
    if (paymentCollectedBy === "Staff") {
      agent.balance += totalAgentCommission;
    } else if (paymentCollectedBy === "Agent") {
      agent.balance -= (totalPrice - totalAgentCommission);
    }
    await agent.save();
  }

  for (const [labId, share] of Object.entries(labUpdates)) {
    await Lab.findByIdAndUpdate(labId, { $inc: { balance: share } });
  }

  return await Booking.create({
    patient: patientId,
    center: centerId,
    staff: staffId,
    agent: agentId || undefined,
    tests: testSnapshots,
    totalPrice,
    agentCommission: totalAgentCommission,
    labShare: totalLabShare,
    paymentMode,
    paymentCollectedBy
  });
};

const recordPayment = async ({ type, agentId, labId, amount, paymentMode, notes }) => {
  let paymentData = { type, amount, paymentMode, notes };

  if (type === "AgentToAdmin") {
    const agent = await User.findById(agentId);
    agent.balance += amount;
    await agent.save();
    paymentData.agent = agentId;
  } else if (type === "AdminToLab") {
    const lab = await Lab.findById(labId);
    lab.balance -= amount;
    await lab.save();
    paymentData.lab = labId;
  }

  await Payment.create(paymentData);
};

runTest();
