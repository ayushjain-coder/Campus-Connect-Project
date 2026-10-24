import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runStudentRatingTests() {
  console.log("======================================================================");
  console.log("   CampusConnect Student Rating System Test Suite");
  console.log("======================================================================");

  // 1. Authenticate Demo Student
  console.log("\n--> 1. Authenticating Demo Student...");
  const authRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const authData = await authRes.json();
  assert.strictEqual(authData.success, true, "Student authenticated successfully");
  const studentToken = authData.token;
  console.log("  ✓ Demo Student authenticated successfully");

  // 2. Fetch Tickets to find a resolved ticket or use existing CC-2026-1005 (or CC-2026-1001)
  console.log("\n--> 2. Fetching student tickets...");
  const ticketsRes = await fetch(`${BASE_URL}/api/tickets`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const ticketsData = await ticketsRes.json();
  assert.strictEqual(ticketsData.success, true);
  
  // Pick ticket CC-2026-1005 (which is pre-resolved in seed) or the first resolved ticket
  let resolvedTicket = ticketsData.tickets.find((t) => t.status === "RESOLVED") || ticketsData.tickets[0];
  const targetId = resolvedTicket.ticketId;
  console.log(`  ✓ Targeting ticket #${targetId} for student rating tests`);

  // 3. Test Invalid Rating Validation (0 and 6)
  console.log("\n--> 3. Testing Rating Validation (Bounds: 1 to 5)...");
  const invalidRes0 = await fetch(`${BASE_URL}/api/tickets/${targetId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ rating: 0, feedback: "Too low" }),
  });
  assert.strictEqual(invalidRes0.status, 400, "Rejected rating 0 (HTTP 400)");
  console.log("  ✓ Correctly rejected rating 0 (HTTP 400 Bad Request)");

  const invalidRes6 = await fetch(`${BASE_URL}/api/tickets/${targetId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ rating: 6, feedback: "Too high" }),
  });
  assert.strictEqual(invalidRes6.status, 400, "Rejected rating 6 (HTTP 400)");
  console.log("  ✓ Correctly rejected rating 6 (HTTP 400 Bad Request)");

  // 4. Submit 5-Star Rating with Feedback Tags
  console.log("\n--> 4. Submitting 5-Star Rating with Student Feedback...");
  const rateRes5 = await fetch(`${BASE_URL}/api/tickets/${targetId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      rating: 5,
      feedback: "Fast response, polite technician, issue fully resolved and clean work area.",
    }),
  });
  const rateData5 = await rateRes5.json();
  assert.strictEqual(rateRes5.status, 200, "Rating submitted successfully (HTTP 200)");
  assert.strictEqual(rateData5.success, true);
  assert.strictEqual(rateData5.ticket.rating, 5, "Ticket recorded 5-star rating");
  assert.strictEqual(
    rateData5.ticket.ratingFeedback,
    "Fast response, polite technician, issue fully resolved and clean work area."
  );
  assert.ok(rateData5.ticket.ratedAt, "ratedAt timestamp present");
  console.log("  ✓ 5-Star Rating successfully stored on ticket");
  console.log("  ✓ Feedback comment successfully attached");

  // Verify ticket timeline has rating update
  const hasRatingUpdate = rateData5.updates.some((u) =>
    u.note.includes("Student rated resolution: 5/5 stars")
  );
  assert.strictEqual(hasRatingUpdate, true, "Ticket timeline recorded student rating event");
  console.log("  ✓ Ticket progress history timeline contains student rating audit entry");

  // 5. Test Update Existing Rating to 4-Star
  console.log("\n--> 5. Testing Student Rating Update (5 Stars -> 4 Stars)...");
  const updateRateRes = await fetch(`${BASE_URL}/api/tickets/${targetId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      rating: 4,
      feedback: "Updated: Great service overall, took slightly longer than expected.",
    }),
  });
  const updateRateData = await updateRateRes.json();
  assert.strictEqual(updateRateRes.status, 200);
  assert.strictEqual(updateRateData.ticket.rating, 4, "Updated rating to 4 stars");
  console.log("  ✓ Rating successfully updated to 4 stars");

  // 6. Test Rating Query via GET /api/tickets/[id]
  console.log("\n--> 6. Verifying Rating Persistence on GET /api/tickets/[id]...");
  const getTicketRes = await fetch(`${BASE_URL}/api/tickets/${targetId}`);
  const getTicketData = await getTicketRes.json();
  assert.strictEqual(getTicketData.ticket.rating, 4);
  assert.strictEqual(
    getTicketData.ticket.ratingFeedback,
    "Updated: Great service overall, took slightly longer than expected."
  );
  console.log("  ✓ GET /api/tickets/[id] returns persisted rating and feedback");

  console.log("\n======================================================================");
  console.log("   ALL STUDENT RATING TESTS PASSED! (100% SUCCESS)");
  console.log("======================================================================");
}

runStudentRatingTests();
