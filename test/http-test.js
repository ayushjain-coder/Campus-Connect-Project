async function test() {
  console.log("=== CampusConnect Comprehensive Hardening & Integration Test ===");

  // Obtain staff token for authenticated operations
  const authRes = await fetch("http://localhost:3000/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "staff.demo@campusconnect.demo", password: "Demo@12345" }),
  });
  const authData = await authRes.json();
  const staffToken = authData.token;

  // 1. Reset data and verify initial state
  console.log("\n--> Testing Step 0 & Item 4: POST /api/seed (Reset Demo Data)...");
  let res = await fetch("http://localhost:3000/api/seed", { method: "POST" });
  if (!res.ok) throw new Error(`POST /api/seed failed: ${res.status}`);
  let seedResult = await res.json();
  console.log(`Seed reset message: "${seedResult.message}", total tickets: ${seedResult.tickets?.length}`);

  if (seedResult.tickets?.length !== 5) {
    throw new Error(`Expected exactly 5 initial seed tickets, got ${seedResult.tickets?.length}`);
  }

  // Verify all 4 categories are represented in seed data
  const categories = new Set(seedResult.tickets.map((t) => t.category));
  ["Plumbing", "Electricity", "Cleanliness", "Internet Connectivity"].forEach((cat) => {
    if (!categories.has(cat)) throw new Error(`Missing category in seed tickets: ${cat}`);
  });
  console.log("✓ Verified: Exactly 5 seed tickets returned with all 4 categories represented.");

  // 2. Fetch stats
  console.log("\n--> Fetching GET /api/stats...");
  res = await fetch("http://localhost:3000/api/stats");
  let stats = await res.json();
  console.log("Stats response:", stats.stats);
  if (stats.stats?.total !== 5) throw new Error("Stats total mismatch!");

  // 3. Step 1 & 2: Incomplete complaint with sample base64 image (Multimodal Image analysis test)
  console.log("\n--> Testing Step 1 & 2 (with Real Image Data): /api/analyze-complaint...");
  // 1x1 transparent PNG base64 for image handling test
  const samplePngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  res = await fetch("http://localhost:3000/api/analyze-complaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      complaintText: "water leaking in library",
      location: "Library",
      photo: samplePngBase64
    })
  });
  if (!res.ok) throw new Error(`Analyze complaint failed: ${res.status}`);
  let step1 = await res.json();
  console.log("Step 1 analysis result:", {
    category: step1.analysis?.category,
    severity: step1.analysis?.severity,
    severityReason: step1.analysis?.severityReason,
    provider: step1.analysis?.provider,
    isMissingInfo: step1.analysis?.isMissingInfo,
    missingInfoQuestions: step1.analysis?.missingInfoQuestions
  });

  if (!step1.analysis?.isMissingInfo) {
    throw new Error("Missing info flag not detected for vague complaint!");
  }
  if (!step1.analysis?.severityReason) {
    throw new Error("Expected severityReason to be present!");
  }
  if (!["gemini", "fallback"].includes(step1.analysis?.provider)) {
    throw new Error(`Invalid provider: ${step1.analysis?.provider}`);
  }
  console.log(`✓ Step 1 & 2 passed: Provider detected as [${step1.analysis.provider}], missing info flagged, severityReason generated.`);

  // 4. Step 3, 4 & 5: Clarification, Refinement & Duplicate Detection
  console.log("\n--> Testing Step 3, 4 & 5: Clarification refinement & duplicate detection...");
  res = await fetch("http://localhost:3000/api/analyze-complaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      complaintText: "water leaking in library",
      location: "Library, 2nd floor",
      photo: samplePngBase64,
      followUpResponses: {
        "Which floor or restroom number is the leak located in?": "2nd Floor Restroom",
        "Is the water actively flooding onto the floor or is it a slow drip?": "Continuous steady drip into basin"
      }
    })
  });
  let step3 = await res.json();
  console.log("Refined analysis & duplicate detection:", {
    summary: step3.analysis?.summary,
    category: step3.analysis?.category,
    severity: step3.analysis?.severity,
    severityReason: step3.analysis?.severityReason,
    provider: step3.analysis?.provider,
    possibleDuplicates: step3.analysis?.possibleDuplicates
  });

  if (!step3.analysis?.possibleDuplicates || step3.analysis.possibleDuplicates.length === 0) {
    throw new Error("Expected duplicate matches against active Library ticket!");
  }
  console.log(`✓ Step 3, 4 & 5 passed: Matched existing ticket #${step3.analysis.possibleDuplicates[0].matchedTicketId} (${step3.analysis.possibleDuplicates[0].reason})`);

  // 5. Step 6: Create Ticket
  console.log("\n--> Testing Step 6: Create Ticket /api/tickets...");
  res = await fetch("http://localhost:3000/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      complaintText: "water leaking in library",
      summary: step3.analysis.summary,
      category: step3.analysis.category,
      department: step3.analysis.suggestedDepartment,
      location: "Library, 2nd floor",
      severity: step3.analysis.severity,
      severityReason: step3.analysis.severityReason,
      photo: samplePngBase64,
      submittedBy: "Arjun Mehta (Student)",
      extractedDetails: step3.analysis.extractedDetails,
      aiReasoning: step3.analysis.aiReasoning,
      aiProvider: step3.analysis.provider,
      duplicateMatches: step3.analysis.possibleDuplicates
    })
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Step 6 error status ${res.status}:`, text);
    throw new Error(`Step 6 failed with status ${res.status}`);
  }
  let created = await res.json();
  const ticketId = created.ticket?.ticketId;
  console.log(`Ticket created: #${ticketId}, status: ${created.ticket?.status}, severityReason: "${created.ticket?.severityReason}"`);

  // 6. Step 7: Staff assigns ticket
  console.log("\n--> Testing Step 7: Staff assigns ticket...");
  res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      status: "ASSIGNED",
      assignedTo: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
      note: "Dispatched technician Rajesh Kumar to 2nd floor library.",
      updatedBy: "Operations Desk"
    })
  });
  let assigned = await res.json();
  console.log(`Ticket assigned to: ${assigned.ticket?.assignedTo}, status: ${assigned.ticket?.status}`);

  // 7. Step 8: Staff updates to IN_PROGRESS
  console.log("\n--> Testing Step 8: Staff updates to IN_PROGRESS...");
  res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      status: "IN_PROGRESS",
      note: "Arrived at 2nd floor restroom. Shutting main shutoff valve.",
      updatedBy: "Rajesh Kumar (Facilities)"
    })
  });
  let inProgress = await res.json();
  console.log(`Ticket updated to: ${inProgress.ticket?.status}`);

  // 8. Step 9: Staff resolves ticket
  console.log("\n--> Testing Step 9: Staff resolves ticket...");
  res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      status: "RESOLVED",
      resolutionNotes: "Replaced degraded washer and P-trap coupling. Water line tested at 45 PSI with zero leakage. Carpet vacuumed.",
      note: "Resolved: Replaced degraded washer and P-trap coupling.",
      updatedBy: "Rajesh Kumar (Facilities)"
    })
  });
  let resolved = await res.json();
  console.log(`Ticket resolved: status: ${resolved.ticket?.status}, resolutionNotes: ${resolved.ticket?.resolutionNotes}`);

  // 9. Step 10: Fetch full ticket details & timeline
  console.log("\n--> Testing Step 10: Fetch full ticket details & timeline...");
  res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`);
  let full = await res.json();
  console.log(`Ticket #${ticketId} Timeline Updates count: ${full.updates?.length}`);
  full.updates?.forEach((u, i) => {
    console.log(`  Update ${i + 1} [${u.status}]: ${u.note} (${u.updatedBy})`);
  });
  console.log(`Duplicate matches count: ${full.duplicateMatches?.length}`);
  if (full.updates?.length < 4) throw new Error("Expected at least 4 updates in timeline!");

  // 10. Verify Reset Data cleanup (Item 4)
  console.log("\n--> Verifying Reset Data cleanup (Item 4)...");
  res = await fetch("http://localhost:3000/api/seed", { method: "POST" });
  let postReset = await res.json();
  const resetIds = postReset.tickets.map(t => t.ticketId);
  if (resetIds.includes(ticketId)) {
    throw new Error(`Newly created ticket ${ticketId} should have disappeared after reset!`);
  }
  if (postReset.tickets.length !== 5) {
    throw new Error(`Expected exactly 5 tickets after reset, got ${postReset.tickets.length}`);
  }
  console.log(`✓ Verified: Newly created ticket #${ticketId} was wiped clean, exactly 5 initial demo tickets restored.`);

  console.log("\n========================================================");
  console.log("ALL 10 DEMO SCENARIO STEPS & HARDENING CHECKS PASSED!");
  console.log("========================================================");
}

test().catch(err => {
  console.error("HTTP test failed:", err);
  process.exit(1);
});
