// mock data representing MongoDB collections
const users = [
  { _id: "agent_a", name: "Agent A", role: "agent", agentPercentage: 10, balance: 0, center: "center_1" },
  { _id: "agent_b", name: "Agent B", role: "agent", agentPercentage: 15, balance: 0, center: "center_1" },
  { _id: "staff_1", name: "Jane Staff", role: "staff", center: "center_1" }
];

const labs = [
  { _id: "lab_1", name: "Alfa Lab", labPercentage: 60, balance: 0 }
];

const tests = [
  { _id: "test_1", name: "Blood Sugar", price: 1000, lab: "lab_1" }
];

const bookings = [];
const payments = [];

// Helper functions that mimic the updated controller logic
function createBooking({ patientName, testIds, centerId }) {
  const staff = users.find(u => u._id === "staff_1");
  
  // Find all agents of the clinic/center
  const clinicAgents = users.filter(u => u.role === "agent" && u.center === centerId);

  const selectedTests = tests.filter(t => testIds.includes(t._id));
  
  let totalPrice = 0;
  let totalAgentCommission = 0;
  let totalLabShare = 0;
  const testSnapshots = [];
  const labUpdates = {};

  for (const test of selectedTests) {
    const price = test.price;
    const labItem = labs.find(l => l._id === test.lab);
    const labPercentage = labItem.labPercentage;
    const labShare = (price * labPercentage) / 100;

    totalPrice += price;
    totalLabShare += labShare;

    testSnapshots.push({
      test: test._id,
      name: test.name,
      price,
      labPercentage
    });

    labUpdates[test.lab] = (labUpdates[test.lab] || 0) + labShare;
  }

  const agentSnapshots = [];
  for (const agent of clinicAgents) {
    const commission = (totalPrice * agent.agentPercentage) / 100;
    totalAgentCommission += commission;
    agentSnapshots.push({
      agent: agent._id,
      name: agent.name,
      commission,
      agentPercentage: agent.agentPercentage
    });

    // Debit the agent's balance: Agent owes Admin (Total - Commission)
    agent.balance -= (totalPrice - commission);
  }

  // Lab share update
  for (const [labId, share] of Object.entries(labUpdates)) {
    const labItem = labs.find(l => l._id === labId);
    labItem.balance += share;
  }

  const booking = {
    _id: `booking_${bookings.length + 1}`,
    patientName,
    center: centerId,
    staff: staff._id,
    agents: agentSnapshots,
    tests: testSnapshots,
    totalPrice,
    totalAgentCommission,
    labShare: totalLabShare,
    paymentMode: "Cash",
    paymentCollectedBy: "Staff",
    adminSettlementStatus: "Pending",
    adminSettlementPaidAmount: 0,
    adminSettlementPaidBy: null,
    adminSettledBy: null,
    adminSettledAt: null
  };
  bookings.push(booking);
  return booking;
}

function recordPayment({ type, agentId, bookingId, amount }) {
  const agent = users.find(u => u._id === agentId);
  agent.balance += amount;

  if (bookingId) {
    // Settle specific booking
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) throw new Error("Booking not found");

    const payerSnapshot = booking.agents.find(a => a.agent === agentId);
    const payerDue = booking.totalPrice - payerSnapshot.commission;

    booking.adminSettlementPaidAmount += amount;
    booking.adminSettlementPaidBy = agentId;

    if (booking.adminSettlementPaidAmount >= payerDue) {
      // Settle other agents
      for (const snapshot of booking.agents) {
        if (snapshot.agent === agentId) continue;
        const otherAgent = users.find(u => u._id === snapshot.agent);
        otherAgent.balance += booking.totalPrice;
      }
      booking.adminSettlementStatus = "Settled";
      booking.adminSettledBy = agentId;
      booking.adminSettledAt = new Date();
    }
  }

  payments.push({ type, agentId, bookingId, amount });
}

// RUN TESTS
console.log("Starting mock logic verification for multi-agent system...");

// Step 1: Create a booking.
const booking = createBooking({
  patientName: "Robert Smith",
  testIds: ["test_1"],
  centerId: "center_1"
});

console.log("Booking created with totalPrice = 1000.");
console.log("Clinic Agents:", booking.agents);

const agentA = users.find(u => u._id === "agent_a");
const agentB = users.find(u => u._id === "agent_b");
const lab1 = labs.find(l => l._id === "lab_1");

console.log(`Agent A Balance (Expected: -900): ${agentA.balance}`);
console.log(`Agent B Balance (Expected: -850): ${agentB.balance}`);
console.log(`Lab 1 Balance (Expected: 600): ${lab1.balance}`);

if (agentA.balance !== -900 || agentB.balance !== -850 || lab1.balance !== 600) {
  console.error("FAIL: Booking creation balances incorrect!");
  process.exit(1);
}

// Step 2: Agent A settles the booking by paying ₹900.
console.log("\n--- Agent A settles booking_1 by paying ₹900 ---");
recordPayment({
  type: "AgentToAdmin",
  agentId: "agent_a",
  bookingId: "booking_1",
  amount: 900
});

console.log(`Agent A Balance after settling (Expected: 0): ${agentA.balance}`);
console.log(`Agent B Balance after Agent A settles (Expected: +150): ${agentB.balance}`);
console.log(`Booking Status (Expected: Settled): ${booking.adminSettlementStatus}`);
console.log(`Booking Settled By (Expected: agent_a): ${booking.adminSettledBy}`);

if (agentA.balance !== 0 || agentB.balance !== 150 || booking.adminSettlementStatus !== "Settled") {
  console.error("FAIL: Settlement calculations incorrect!");
  process.exit(1);
}

console.log("\n>>> ALL MULTI-AGENT SPECIFIC BOOKING SETTLEMENT TESTS PASSED! <<<");
process.exit(0);
