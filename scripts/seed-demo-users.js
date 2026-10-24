/**
 * CampusConnect Demo Account Seeder
 * Safely creates or verifies the two hackathon demo accounts in data/auth-db.json.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUTH_DB_PATH = path.join(process.cwd(), "data", "auth-db.json");

function generateSalt() {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(salt, password) {
  return crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
}

function seed() {
  const dir = path.dirname(AUTH_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let db = { users: [], sessions: [], passwordResets: [] };
  if (fs.existsSync(AUTH_DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(AUTH_DB_PATH, "utf8"));
      db.users = db.users || [];
      db.sessions = db.sessions || [];
      db.passwordResets = db.passwordResets || [];
    } catch (e) {
      console.warn("Failed to read existing auth DB, creating fresh:", e.message);
    }
  }

  const demoAccounts = [
    {
      id: "usr_demo_student",
      name: "Arjun Mehta",
      email: "student.demo@campusconnect.demo",
      role: "STUDENT",
      department: "Computer Science",
      studentId: "CC-STU-001",
      year: "6th Semester",
      password: "Demo@12345",
    },
    {
      id: "usr_demo_staff",
      name: "Rajesh Kumar",
      email: "staff.demo@campusconnect.demo",
      role: "STAFF",
      department: "Facilities",
      staffId: "CC-STAFF-001",
      password: "Demo@12345",
    },
  ];

  let addedCount = 0;
  const now = new Date().toISOString();

  for (const demo of demoAccounts) {
    const existingIdx = db.users.findIndex(
      (u) => u.email.toLowerCase() === demo.email.toLowerCase()
    );

    const salt = generateSalt();
    const passwordHash = hashPassword(salt, demo.password);

    const userRecord = {
      id: demo.id,
      name: demo.name,
      email: demo.email.toLowerCase(),
      role: demo.role,
      department: demo.department,
      studentId: demo.studentId,
      year: demo.year,
      staffId: demo.staffId,
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    if (existingIdx === -1) {
      db.users.push(userRecord);
      addedCount++;
      console.log(`[SEED] Created demo account: ${demo.email} (${demo.role})`);
    } else {
      // Refresh password in case it was modified
      db.users[existingIdx].passwordHash = passwordHash;
      db.users[existingIdx].salt = salt;
      db.users[existingIdx].name = demo.name;
      db.users[existingIdx].department = demo.department;
      if (demo.studentId) db.users[existingIdx].studentId = demo.studentId;
      if (demo.year) db.users[existingIdx].year = demo.year;
      if (demo.staffId) db.users[existingIdx].staffId = demo.staffId;
      console.log(`[SEED] Verified demo account: ${demo.email} (${demo.role})`);
    }
  }

  fs.writeFileSync(AUTH_DB_PATH, JSON.stringify(db, null, 2), "utf8");
  console.log(`[SEED] Done. Total users in auth-db: ${db.users.length}`);
}

seed();
