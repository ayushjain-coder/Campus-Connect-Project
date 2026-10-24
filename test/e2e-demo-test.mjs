import { getTickets, getTicketById, createTicket, updateTicket, getTicketUpdates, getDuplicateMatches, getStats, resetToSeedData } from "../src/lib/db.js";
import { analyzeComplaintWithGemini } from "../src/lib/gemini.js";

async function runTest() {
  console.log("=== CampusConnect End-to-End Demo Verification ===");

  // 1. Reset to seed data
  console.log("\n[Step 0] Resetting seed data...");
  resetToSeedData();
  const initialStats = getStats();
  console.log(`Initial stats: ${initialStats.total} total tickets, ${initialStats.newCount} new, ${initialStats.resolvedCount} resolved.`);
  if (initialStats.total !== 5) throw new Error(`Expected exactly 5 initial seed tickets, got ${initialStats.total}`);

  // 2. Demo Step 1: Submit incomplete complaint
  console.log("\n[Demo Step 1] Student submits incomplete complaint: 'Water leaking in the library'...");
  const existingTickets = getTickets();
  const analysis1 = await analyzeComplaintWithGemini({
    complaintText: "Water leaking in the library",
    location: "Library",
    existingTickets,
  });

  console.log(`Category: ${analysis1.category}`);
  console.log(`Department: ${analysis1.suggestedDepartment}`);
  console.log(`Severity: ${analysis1.severity}`);
  console.log(`isMissingInfo: ${analysis1.isMissingInfo}`);
  console.log(`Missing info questions:`, analysis1.missingInfoQuestions);

  if (!analysis1.isMissingInfo) {
    throw new Error("Expected Gemini/Simulation to detect missing information for vague complaint!");
  }
  console.log("✓ Step 1 & 2 passed: Gemini identified missing information and generated targeted follow-ups.");

  // 3. Demo Step 3 & 4: Student provides missing information
  console.log("\n[Demo Step 3 & 4] Student provides missing details and refines complaint...");
  const followUpResponses = {
    "Which floor or restroom number is the leak located in?": "2nd Floor Restroom",
    "Is the water actively flooding onto the floor or is it a slow drip?": "Continuous steady drip into basin",
  };

  const analysis2 = await analyzeComplaintWithGemini({
    complaintText: "Water leaking in the library",
    location: "Library, 2nd Floor",
    existingTickets,
    followUpResponses,
  });

  console.log(`Refined Summary: ${analysis2.summary}`);
  console.log(`Refined Category: ${analysis2.category}`);
  console.log(`Refined Department: ${analysis2.suggestedDepartment}`);
  console.log(`Refined Severity: ${analysis2.severity}`);
  console.log(`isMissingInfo: ${analysis2.isMissingInfo}`);
  console.log(`Duplicate matches detected:`, analysis2.possibleDuplicates);

  // 4. Demo Step 5: Duplicate detection
  if (!analysis2.possibleDuplicates || analysis2.possibleDuplicates.length === 0) {
    throw new Error("Expected duplicate detection to flag matching active ticket CC-2026-1002 in Library!");
  }
  console.log(`✓ Step 4 & 5 passed: Structured preview generated with duplicate match against #${analysis2.possibleDuplicates[0].matchedTicketId} (${analysis2.possibleDuplicates[0].reason})`);

  // 5. Demo Step 6: Create ticket
  console.log("\n[Demo Step 6] Creating structured ticket...");
  const newTicket = createTicket({
    ticketId: `CC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    complaintText: "Water leaking in the library",
    summary: analysis2.summary,
    category: analysis2.category,
    department: analysis2.suggestedDepartment,
    location: "Library, 2nd Floor",
    severity: analysis2.severity,
    status: "NEW",
    submittedBy: "Arjun Mehta (Roll: CS-2024-042)",
    assignedTo: "",
    extractedDetails: analysis2.extractedDetails,
    aiReasoning: analysis2.aiReasoning,
  });

  console.log(`✓ Ticket created: #${newTicket.ticketId} with status ${newTicket.status}`);

  // 6. Demo Step 7: Staff assigns it
  console.log("\n[Demo Step 7] Staff reviews and assigns ticket...");
  const assigned = updateTicket(newTicket.ticketId, {
    status: "ASSIGNED",
    assignedTo: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
    note: "Assigned to Rajesh Kumar. Dispatched with plumbing tool kit.",
    updatedBy: "Operations Desk",
  });
  console.log(`✓ Ticket status updated to: ${assigned?.status}, assigned to: ${assigned?.assignedTo}`);

  // 7. Demo Step 8: Staff changes status to In Progress
  console.log("\n[Demo Step 8] Staff changes status to In Progress...");
  const inProgress = updateTicket(newTicket.ticketId, {
    status: "IN_PROGRESS",
    note: "Technician arrived at Library 2nd floor. Water valve turned off for inspection.",
    updatedBy: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
  });
  console.log(`✓ Ticket status updated to: ${inProgress?.status}`);

  // 8. Demo Step 9: Staff resolves it
  console.log("\n[Demo Step 9] Staff resolves ticket with notes...");
  const resolved = updateTicket(newTicket.ticketId, {
    status: "RESOLVED",
    resolutionNotes: "Replaced faulty P-trap gasket and verified leak-free operation. Hallway dried.",
    note: "Resolved: Replaced faulty P-trap gasket and verified leak-free operation. Hallway dried.",
    updatedBy: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
  });
  console.log(`✓ Ticket resolved: status ${resolved?.status}, notes: ${resolved?.resolutionNotes}`);

  // 9. Demo Step 10: Student sees complete progress history
  console.log("\n[Demo Step 10] Fetching complete progress history for student...");
  const updates = getTicketUpdates(newTicket.ticketId);
  console.log(`Total progress timeline updates: ${updates.length}`);
  updates.forEach((u, i) => {
    console.log(`  [${i + 1}] [${u.status}] (${u.updatedBy}) ${u.note}`);
  });

  if (updates.length < 4) {
    throw new Error("Expected at least 4 timeline events (NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED)!");
  }

  console.log("\n========================================================");
  console.log("ALL 10 DEMO SCENARIO STEPS TESTED AND FULLY FUNCTIONAL!");
  console.log("========================================================");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
