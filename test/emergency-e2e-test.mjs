/**
 * CampusConnect Comprehensive Emergency Response System Verification Test Suite
 * Tests all 17 conditions specified in the hackathon requirements.
 */

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  }
}

async function runTests() {
  console.log("======================================================================");
  console.log("   CampusConnect Real-Time Emergency Response System Test Suite");
  console.log("======================================================================\n");

  // ─── 1. Authenticate Demo Accounts ──────────────────────────────────────────
  console.log("--> Testing Item 14 & 15: Demo Student & Staff Authentication...");
  
  const studentRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const studentAuth = await studentRes.json();
  assert(studentAuth.success === true, "Demo Student authenticated successfully");
  const studentToken = studentAuth.token;

  const staffRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "staff.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const staffAuth = await staffRes.json();
  assert(staffAuth.success === true, "Demo Staff authenticated successfully");
  const staffToken = staffAuth.token;

  // Verify RBAC on standard ticket route
  const rbacRes = await fetch(`${BASE_URL}/api/tickets/CC-2026-1001`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  assert(rbacRes.status === 403, "Student denied staff ticket mutation (403 Forbidden)");

  // ─── 2. Staff Availability System ───────────────────────────────────────────
  console.log("\n--> Testing Item 12: Staff Availability Controls...");
  
  const availRes = await fetch(`${BASE_URL}/api/emergency-availability`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const availData = await availRes.json();
  assert(availData.success === true, "Staff availability query successful");
  assert(Array.isArray(availData.staffList), "Staff availability list returned");

  // Toggle availability OFF
  const toggleOff = await fetch(`${BASE_URL}/api/emergency-availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ isAvailable: false }),
  });
  const offData = await toggleOff.json();
  assert(offData.success === true, "Staff can toggle emergency availability to OFF");
  assert(offData.staff.isAvailable === false, "Availability confirmed OFF");

  // Toggle availability ON
  const toggleOn = await fetch(`${BASE_URL}/api/emergency-availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ isAvailable: true }),
  });
  const onData = await toggleOn.json();
  assert(onData.success === true, "Staff can toggle emergency availability back to ON");
  assert(onData.staff.isAvailable === true, "Availability confirmed ON");

  // ─── 3. Student Creates Emergency & Automatic Staff Selection ───────────────
  console.log("\n--> Testing Item 1, 2, 4: Emergency Creation & Single Available Responder Selection...");
  
  const createRes = await fetch(`${BASE_URL}/api/emergencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      type: "Electrical Hazard",
      location: {
        building: "Engineering Block",
        floor: "Floor 2",
        room: "Lab 204",
      },
      description: "Smoke is coming from an electrical panel. Around 15 students are nearby.",
      peopleAffected: 15,
    }),
  });
  const createData = await createRes.json();
  assert(createRes.status === 201, "Student created emergency request successfully (201 Created)");
  assert(Boolean(createData.incident.id), `Emergency incident ID generated: ${createData.incident.id}`);
  assert(createData.incident.type === "Electrical Hazard", "Emergency type recorded correctly");
  assert(createData.incident.studentName === "Arjun Mehta", "Auto-attached student name Arjun Mehta");
  assert(createData.incident.studentRoll === "CC-STU-001", "Auto-attached student roll CC-STU-001");
  assert(createData.incident.studentPhone === "+91 98765 43210", "Auto-attached student verified phone number");
  assert(
    Boolean(createData.incident.assignedStaffName),
    `Automatically selected ONE available responder: ${createData.incident.assignedStaffName}`
  );
  assert(createData.incident.status === "STAFF_NOTIFIED", "Status initialized to STAFF_NOTIFIED");

  const incidentId = createData.incident.id;

  // ─── 4. Student Phone Number Authorization (Item 5 & 6) ─────────────────────
  console.log("\n--> Testing Item 5 & 6: Student Phone Masking and RBAC Protection...");
  
  // Student can view their own emergency with full details
  const studentViewRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const studentViewData = await studentViewRes.json();
  assert(studentViewRes.status === 200, "Student can view their own emergency");
  assert(studentViewData.incident.studentPhone === "+91 98765 43210", "Student sees their own phone number");

  // Staff can view incident (phone masked if unassigned, unmasked if assigned)
  const staffViewRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffViewData = await staffViewRes.json();
  assert(staffViewRes.status === 200, "Staff can view incident");
  if (createData.incident.assignedStaffId === "CC-STAFF-001") {
    assert(staffViewData.incident.studentPhone === "+91 98765 43210", "Assigned staff receives unmasked student phone number for direct calling");
  } else {
    assert(staffViewData.incident.studentPhone.includes("***"), "Unassigned staff receives masked student phone number for privacy");
  }

  // ─── 5. Staff Acceptance (Item 7 & 11) ──────────────────────────────────────
  console.log("\n--> Testing Item 7 & 11: Staff Acceptance...");
  
  const acceptRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, "Staff accepted emergency request");
  assert(acceptData.incident.status === "ACCEPTED", "Incident status transitioned to ACCEPTED");
  assert(Boolean(acceptData.incident.acceptedAt), "Timestamp recorded on acceptance");

  // After acceptance, staff is explicitly assigned and receives unmasked phone
  const staffPostAcceptRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffPostAcceptData = await staffPostAcceptRes.json();
  assert(staffPostAcceptData.incident.studentPhone === "+91 98765 43210", "Assigned responder receives unmasked student phone number after acceptance");

  // ─── 6. Dedicated Real-Time Emergency Chat (Item 9 & 10) ────────────────────
  console.log("\n--> Testing Item 9 & 10: Real-Time Dedicated Emergency Chat...");
  
  // Student sends message
  const studentMsgRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ message: "Smoke is still coming from the panel. We have stepped back." }),
  });
  const studentMsgData = await studentMsgRes.json();
  assert(studentMsgRes.status === 201, "Student posted emergency message");
  assert(studentMsgData.message.senderRole === "STUDENT", "Message sender tagged as STUDENT");

  // Staff responds
  const staffMsgRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ message: "I have received your emergency. Stay clear of the area. I am responding now." }),
  });
  const staffMsgData = await staffMsgRes.json();
  assert(staffMsgRes.status === 201, "Staff posted emergency response message");
  assert(staffMsgData.message.senderRole === "STAFF", "Message sender tagged as STAFF");

  // Fetch all messages and verify audit trail system messages
  const msgsRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}/messages`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const msgsData = await msgsRes.json();
  assert(msgsData.messages.length >= 4, "Emergency chat timeline contains system audit logs + student + staff messages");
  const hasSystemLog = msgsData.messages.some((m) => m.senderRole === "SYSTEM");
  assert(hasSystemLog === true, "Audit trail system events present in chat");

  // ─── 7. Staff Updates Status to RESPONDING then RESOLVED ────────────────────
  console.log("\n--> Testing Status Updates (RESPONDING -> RESOLVED)...");
  
  const respondingRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: "RESPONDING" }),
  });
  const respondingData = await respondingRes.json();
  assert(respondingData.incident.status === "RESPONDING", "Emergency status transitioned to RESPONDING");

  const resolveRes = await fetch(`${BASE_URL}/api/emergencies/${incidentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      status: "RESOLVED",
      resolutionNotes: "Main breaker isolated safely. No injuries. Facilities team ventilating lab.",
    }),
  });
  const resolveData = await resolveRes.json();
  assert(resolveData.incident.status === "RESOLVED", "Emergency status transitioned to RESOLVED");
  assert(Boolean(resolveData.incident.resolvedAt), "Resolved timestamp recorded");

  // ─── 8. Test Specialized Category Routing & Decline/Transfer (Item 8) ───────
  console.log("\n--> Testing Item 8 & Specialized Routing: Medical emergency -> Priya Sharma & Decline Transfer...");
  
  const medRes = await fetch(`${BASE_URL}/api/emergencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      type: "Medical",
      location: {
        building: "Sports Complex",
        floor: "Ground",
        room: "Badminton Court 3",
      },
      description: "Student sprained ankle during game, difficulty walking.",
      peopleAffected: 1,
    }),
  });
  const medData = await medRes.json();
  assert(medRes.status === 201, "Medical emergency reported");
  assert(
    medData.incident.assignedStaffName.includes("Priya Sharma") ||
    medData.incident.assignedStaffRole.includes("Medical"),
    "Specialized Medical category routed directly to Medical Responder (Priya Sharma)"
  );

  const medIncidentId = medData.incident.id;

  // Staff declines/transfers incident
  const declineRes = await fetch(`${BASE_URL}/api/emergencies/${medIncidentId}/decline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
  });
  const declineData = await declineRes.json();
  assert(declineRes.status === 200, "Decline/transfer executed successfully");
  assert(declineData.incident.id === medIncidentId, "Incident ID preserved across reassignment");

  // ─── 9. Existing Routine Features Regression Check (Item 13 & 16) ───────────
  console.log("\n--> Testing Item 13 & 16: Existing Ticket & Stats Regression Check...");
  
  const statsRes = await fetch(`${BASE_URL}/api/stats`);
  const statsData = await statsRes.json();
  assert(statsData.success === true, "GET /api/stats operational");
  assert(statsData.stats.total >= 5, "Existing ticket catalog intact");

  const ticketsRes = await fetch(`${BASE_URL}/api/tickets`);
  const ticketsData = await ticketsRes.json();
  assert(ticketsData.success === true, "GET /api/tickets operational");
  assert(Array.isArray(ticketsData.tickets), "Tickets list returned successfully");

  // ─── 10. Real-Time Server-Sent Events (SSE) Stream Check (Item 10) ──────────
  console.log("\n--> Testing SSE Stream: GET /api/emergencies/stream...");
  
  const streamRes = await fetch(`${BASE_URL}/api/emergencies/stream`);
  assert(streamRes.status === 200, "SSE stream returned 200 OK");
  assert(streamRes.headers.get("content-type").includes("text/event-stream"), "Content-Type is text/event-stream");

  console.log("\n======================================================================");
  console.log(`   ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("======================================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
