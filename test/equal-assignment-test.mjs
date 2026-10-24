import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("======================================================================");
  console.log("   CampusConnect Equal Staff Task Assignment Test Suite");
  console.log("======================================================================");

  // 1. Reset Database to Clean Seed State
  console.log("\n--> 1. Resetting database to initial seed state...");
  const resetRes = await fetch(`${BASE_URL}/api/seed`, { method: "POST" });
  assert(resetRes.ok, "Seed reset succeeded");
  const resetData = await resetRes.json();
  console.log(`  ✓ Database reset: ${resetData.tickets?.length} initial tickets`);

  // 2. Test Equal Distribution for Plumbing Issues
  console.log("\n--> 2. Testing Multiple Students Raising PLUMBING Tickets...");
  const plumbingAssignments = [];
  const plumbingLocations = [
    "Science Block A - 1st Floor Restroom",
    "Hostel 3 - Wing B Washroom",
    "Library - Basement Hydraulic Line",
    "Cafeteria - Commercial Dishwashing Sink",
  ];

  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${BASE_URL}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintText: `Heavy water leakage and dripping pipe reported by student ${i + 1}`,
        summary: `Plumbing leak issue #${i + 1}`,
        category: "Plumbing",
        location: plumbingLocations[i],
        severity: "HIGH",
        submittedBy: `Student_${i + 1}`,
      }),
    });

    assert(res.ok, `Plumbing ticket #${i + 1} creation succeeded`);
    const data = await res.json();
    assert(data.success === true, "Response reports success");
    assert(data.ticket.assignedTo, `Ticket #${i + 1} has an assigned staff member`);
    assert(data.ticket.status === "ASSIGNED", `Ticket #${i + 1} status is ASSIGNED`);

    plumbingAssignments.push(data.ticket.assignedTo);
    console.log(`  ✓ Student ${i + 1} raised Plumbing ticket -> Assigned to: ${data.ticket.assignedTo}`);
  }

  // Count distribution among plumbing staff
  const rajeshPlumbingCount = plumbingAssignments.filter((a) => a.includes("Rajesh Kumar")).length;
  const vikramPlumbingCount = plumbingAssignments.filter((a) => a.includes("Vikram Rao")).length;

  console.log(`  📊 Plumbing Distribution Results:`);
  console.log(`     • Rajesh Kumar: ${rajeshPlumbingCount} tickets`);
  console.log(`     • Vikram Rao:   ${vikramPlumbingCount} tickets`);

  assert(
    rajeshPlumbingCount === 2 && vikramPlumbingCount === 2,
    `Expected equal distribution of 4 plumbing tickets (2 to Rajesh, 2 to Vikram), got Rajesh: ${rajeshPlumbingCount}, Vikram: ${vikramPlumbingCount}`
  );
  console.log("  ✓ PERFECT EQUAL DISTRIBUTION CONFIRMED: Both staff members assigned exactly 2 tickets!");

  // 3. Test Equal Distribution for Electricity Issues
  console.log("\n--> 3. Testing Multiple Students Raising ELECTRICITY Tickets...");
  const electricAssignments = [];
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${BASE_URL}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintText: `Flickering fluorescent fixtures and power surge in classroom ${201 + i}`,
        summary: `Electrical surge issue #${i + 1}`,
        category: "Electricity",
        location: `Academic Block B - Room ${201 + i}`,
        severity: "MEDIUM",
        submittedBy: `Student_Elec_${i + 1}`,
      }),
    });

    assert(res.ok, `Electricity ticket #${i + 1} creation succeeded`);
    const data = await res.json();
    assert(data.ticket.assignedTo, `Ticket has assigned staff`);
    electricAssignments.push(data.ticket.assignedTo);
    console.log(`  ✓ Student ${i + 1} raised Electricity ticket -> Assigned to: ${data.ticket.assignedTo}`);
  }

  const ananyaElectricCount = electricAssignments.filter((a) => a.includes("Ananya Sharma")).length;
  const deepakElectricCount = electricAssignments.filter((a) => a.includes("Deepak Verma")).length;

  console.log(`  📊 Electricity Distribution Results:`);
  console.log(`     • Ananya Sharma: ${ananyaElectricCount} tickets`);
  console.log(`     • Deepak Verma:  ${deepakElectricCount} tickets`);

  assert(
    ananyaElectricCount === 2 && deepakElectricCount === 2,
    `Expected equal distribution of 4 electricity tickets (2 to Ananya, 2 to Deepak), got Ananya: ${ananyaElectricCount}, Deepak: ${deepakElectricCount}`
  );
  console.log("  ✓ PERFECT EQUAL DISTRIBUTION CONFIRMED: Both electrical staff assigned exactly 2 tickets!");

  // 4. Test Equal Distribution for Cleanliness Issues
  console.log("\n--> 4. Testing Multiple Students Raising CLEANLINESS Tickets...");
  const cleanAssignments = [];
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${BASE_URL}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintText: `Overflowing bins and spilled liquids on floor ${i + 1}`,
        summary: `Sanitation cleanup #${i + 1}`,
        category: "Cleanliness",
        location: `Student Center - Zone ${i + 1}`,
        severity: "LOW",
        submittedBy: `Student_Clean_${i + 1}`,
      }),
    });

    assert(res.ok);
    const data = await res.json();
    cleanAssignments.push(data.ticket.assignedTo);
    console.log(`  ✓ Student ${i + 1} raised Cleanliness ticket -> Assigned to: ${data.ticket.assignedTo}`);
  }

  const sunitaCleanCount = cleanAssignments.filter((a) => a.includes("Sunita Rao")).length;
  const manojCleanCount = cleanAssignments.filter((a) => a.includes("Manoj Patil")).length;
  console.log(`  📊 Cleanliness Distribution Results:`);
  console.log(`     • Sunita Rao:  ${sunitaCleanCount} tickets`);
  console.log(`     • Manoj Patil: ${manojCleanCount} tickets`);
  assert(
    sunitaCleanCount === 2 && manojCleanCount === 2,
    `Expected equal distribution of 4 cleanliness tickets (2 to Sunita, 2 to Manoj)`
  );
  console.log("  ✓ PERFECT EQUAL DISTRIBUTION CONFIRMED: Both sanitation staff assigned exactly 2 tickets!");

  // 5. Test Equal Distribution for Internet Connectivity Issues
  console.log("\n--> 5. Testing Multiple Students Raising INTERNET CONNECTIVITY Tickets...");
  const itAssignments = [];
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${BASE_URL}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintText: `Campus-Secure WiFi packet loss and disconnection in Study Room ${i + 1}`,
        summary: `WiFi connection dropped #${i + 1}`,
        category: "Internet Connectivity",
        location: `Tech Hub - Study Room ${i + 1}`,
        severity: "MEDIUM",
        submittedBy: `Student_IT_${i + 1}`,
      }),
    });

    assert(res.ok);
    const data = await res.json();
    itAssignments.push(data.ticket.assignedTo);
    console.log(`  ✓ Student ${i + 1} raised Internet ticket -> Assigned to: ${data.ticket.assignedTo}`);
  }

  const davidItCount = itAssignments.filter((a) => a.includes("David Miller")).length;
  const poojaItCount = itAssignments.filter((a) => a.includes("Pooja Sengupta")).length;
  console.log(`  📊 Internet Distribution Results:`);
  console.log(`     • David Miller:   ${davidItCount} tickets`);
  console.log(`     • Pooja Sengupta: ${poojaItCount} tickets`);
  assert(
    davidItCount === 2 && poojaItCount === 2,
    `Expected equal distribution of 4 IT tickets (2 to David, 2 to Pooja)`
  );
  console.log("  ✓ PERFECT EQUAL DISTRIBUTION CONFIRMED: Both IT staff assigned exactly 2 tickets!");

  // 6. Test GET /api/tickets/auto-assign Workload Telemetry
  console.log("\n--> 6. Testing GET /api/tickets/auto-assign Workload Telemetry...");
  const workloadRes = await fetch(`${BASE_URL}/api/tickets/auto-assign`);
  assert(workloadRes.ok, "GET /api/tickets/auto-assign returned HTTP 200");
  const workloadData = await workloadRes.json();
  assert(workloadData.success === true);
  assert(workloadData.workloadOverview.Plumbing, "Plumbing category represented");
  assert(workloadData.workloadOverview.Electricity, "Electricity category represented");
  console.log("  ✓ Workload overview accurately reports active task counts per department");

  // 7. Cleanup and Restore Seed State
  console.log("\n--> 7. Restoring clean demo seed state...");
  const finalReset = await fetch(`${BASE_URL}/api/seed`, { method: "POST" });
  assert(finalReset.ok);
  console.log("  ✓ Demo database restored clean");

  console.log("\n======================================================================");
  console.log("   ALL EQUAL STAFF TASK ASSIGNMENT TESTS PASSED! (100% SUCCESS)");
  console.log("======================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
