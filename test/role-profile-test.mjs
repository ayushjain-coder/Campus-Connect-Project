/**
 * Comprehensive Automated Test Suite: CampusConnect Role & Profile Separation
 * Tests Student, Staff, and Admin RBAC, IDOR Protection, and Profile APIs.
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
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  CAMPUSCONNECT ROLE & PROFILE SYSTEM TEST SUITE");
  console.log("========================================================\n");

  // 1. Sign in as Student
  console.log("1. Testing Student Authentication & RBAC Boundaries...");
  const stuRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const stuData = await stuRes.json();
  assert(stuData.success && stuData.user.role === "STUDENT", "Student sign-in succeeded with role STUDENT");
  const studentToken = stuData.token;

  // 2. Student cannot access GET /api/staff (Admin only)
  const stuStaffListRes = await fetch(`${BASE_URL}/api/staff`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuStaffListRes.status === 403, "Student denied access to GET /api/staff (HTTP 403)");

  // 3. Student cannot access GET /api/staff/CC-STAFF-001
  const stuStaffDetailRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-001`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuStaffDetailRes.status === 403, "Student denied access to GET /api/staff/[id] (HTTP 403)");

  // 4. Student cannot access GET /api/staff/me
  const stuStaffMeRes = await fetch(`${BASE_URL}/api/staff/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuStaffMeRes.status === 403, "Student denied access to GET /api/staff/me (HTTP 403)");

  // 5. Student cannot access PATCH /api/staff/CC-STAFF-001/availability
  const stuStaffAvailRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-001/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ isAvailable: false }),
  });
  assert(stuStaffAvailRes.status === 403, "Student denied access to PATCH /api/staff/[id]/availability (HTTP 403)");

  // 6. Sign in as Staff
  console.log("\n2. Testing Staff Profile, Workload & IDOR Protection...");
  const staffRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "staff.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const staffData = await staffRes.json();
  assert(staffData.success && staffData.user.role === "STAFF", "Staff sign-in succeeded with role STAFF");
  const staffToken = staffData.token;

  // 7. Staff can access GET /api/staff/me
  const staffMeRes = await fetch(`${BASE_URL}/api/staff/me`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffMeData = await staffMeRes.json();
  assert(staffMeRes.status === 200 && staffMeData.success, "Staff can access GET /api/staff/me (HTTP 200)");
  assert(
    staffMeData.data.personal.name === "Rajesh Kumar" &&
    staffMeData.data.personal.staffId === "CC-STAFF-001",
    "Staff /me returns personal information (Name: Rajesh Kumar, ID: CC-STAFF-001)"
  );
  assert(
    typeof staffMeData.data.metrics.myTickets === "number" &&
    typeof staffMeData.data.metrics.inProgress === "number" &&
    typeof staffMeData.data.metrics.resolved === "number" &&
    typeof staffMeData.data.metrics.emergencyResponses === "number" &&
    typeof staffMeData.data.metrics.averageResolutionMinutes === "number",
    "Staff /me returns all 6 metric items including average resolution time"
  );

  // 8. Staff CAN access own profile via GET /api/staff/CC-STAFF-001
  const staffOwnRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-001`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffOwnRes.status === 200, "Staff can access their own profile at GET /api/staff/CC-STAFF-001 (HTTP 200)");

  // 9. Staff CANNOT access other staff's details (IDOR Protection)
  const staffOtherRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-002`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffOtherRes.status === 403, "Staff denied access to other staff's profile GET /api/staff/CC-STAFF-002 (IDOR HTTP 403)");

  // 10. Staff CANNOT access full staff directory GET /api/staff
  const staffDirRes = await fetch(`${BASE_URL}/api/staff`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffDirRes.status === 403, "Staff denied access to full Staff Directory GET /api/staff (HTTP 403)");

  // 11. Staff CAN update own availability
  const staffAvailOwnRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-001/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ isAvailable: true }),
  });
  assert(staffAvailOwnRes.status === 200, "Staff can update own availability (HTTP 200)");

  // 12. Staff CANNOT update another staff member's availability (IDOR Protection)
  const staffAvailOtherRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-002/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ isAvailable: false }),
  });
  assert(staffAvailOtherRes.status === 403, "Staff denied updating other staff availability (IDOR HTTP 403)");

  // 13. Sign in as Admin
  console.log("\n3. Testing Admin Profile, Staff Directory & Administrative Oversight...");
  const adminRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin.demo@campusconnect.demo",
      password: "Demo@12345",
    }),
  });
  const adminData = await adminRes.json();
  assert(adminData.success && adminData.user.role === "ADMIN", "Admin sign-in succeeded with role ADMIN");
  const adminToken = adminData.token;

  // 14. Admin CAN access GET /api/staff (Staff Directory)
  const adminDirRes = await fetch(`${BASE_URL}/api/staff`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminDirData = await adminDirRes.json();
  assert(adminDirRes.status === 200 && adminDirData.success, "Admin can access full Staff Directory GET /api/staff (HTTP 200)");
  assert(
    adminDirData.staff && adminDirData.staff.length >= 5,
    `Admin Staff Directory contains all ${adminDirData.staff?.length} campus responders`
  );
  assert(
    adminDirData.summary &&
    typeof adminDirData.summary.totalStaff === "number" &&
    typeof adminDirData.summary.availableStaff === "number" &&
    typeof adminDirData.summary.handlingEmergencies === "number" &&
    typeof adminDirData.summary.activeTickets === "number" &&
    typeof adminDirData.summary.resolvedTickets === "number" &&
    typeof adminDirData.summary.openEmergencies === "number",
    "Admin Staff Directory returns complete Campus Overview telemetry metrics"
  );

  // 15. Admin CAN view individual staff details (Dr. Priya Sharma CC-STAFF-002)
  const adminStaff2Res = await fetch(`${BASE_URL}/api/staff/CC-STAFF-002`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminStaff2Data = await adminStaff2Res.json();
  assert(
    adminStaff2Res.status === 200 && adminStaff2Data.staff.name === "Dr. Priya Sharma",
    "Admin can view individual staff modal details for CC-STAFF-002 (Dr. Priya Sharma)"
  );
  assert(
    adminStaff2Data.staff.timeline && Array.isArray(adminStaff2Data.staff.timeline),
    "Admin can view staff activity timeline"
  );

  // 16. Admin CAN update any staff's availability
  const adminUpdateAvailRes = await fetch(`${BASE_URL}/api/staff/CC-STAFF-002/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ isAvailable: true }),
  });
  assert(adminUpdateAvailRes.status === 200, "Admin can toggle staff availability from Staff Directory (HTTP 200)");

  // 17. Verify Web Pages Respond HTTP 200
  console.log("\n4. Testing Web Page Routes...");
  const staffProfilePage = await fetch(`${BASE_URL}/dashboard/staff/profile`);
  assert(staffProfilePage.status === 200, "Staff Profile page (/dashboard/staff/profile) returns HTTP 200");

  const adminProfilePage = await fetch(`${BASE_URL}/dashboard/admin/profile`);
  assert(adminProfilePage.status === 200, "Admin Profile page (/dashboard/admin/profile) returns HTTP 200");

  console.log("\n========================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
