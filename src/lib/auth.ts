/**
 * CampusConnect Authentication Library
 * Handles user auth, session management, password hashing (SHA-256 + salt),
 * and role-based authorization. Works with the existing JSON file database.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "STUDENT" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId?: string;   // for STUDENT
  year?: string;        // for STUDENT (e.g. "3rd Year / 5th Semester")
  staffId?: string;     // for STAFF
  phone?: string;       // phone number for emergency contact
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserRecord extends AuthUser {
  passwordHash: string; // sha256(salt + password)
  salt: string;
}

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: string; // ISO string
}

interface AuthDatabase {
  users: AuthUserRecord[];
  sessions: Session[];
  passwordResets: PasswordResetRecord[];
}

export interface PasswordResetRecord {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  used: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_DB_PATH = path.join(process.cwd(), "data", "auth-db.json");
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Staff verification code — NEVER sent to the frontend. Read from env or fallback.
const STAFF_VERIFICATION_CODE =
  process.env.STAFF_VERIFICATION_CODE || "CAMPUS_STAFF_2026";

// ─── Database helpers ─────────────────────────────────────────────────────────

export function ensureDemoAccounts(db: AuthDatabase): boolean {
  let changed = false;
  const demoStudentEmail = "student.demo@campusconnect.demo";
  const demoStaffEmail = "staff.demo@campusconnect.demo";
  const demoPassword = "Demo@12345";

  if (!db.users.some((u) => u.email.toLowerCase() === demoStudentEmail)) {
    const salt = generateSalt();
    const passwordHash = hashPassword(salt, demoPassword);
    const now = new Date().toISOString();
    db.users.push({
      id: "usr_demo_student",
      name: "Arjun Mehta",
      email: demoStudentEmail,
      role: "STUDENT",
      department: "Computer Science",
      studentId: "CC-STU-001",
      year: "6th Semester",
      phone: "+91 98765 43210",
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    });
    changed = true;
  }

  if (!db.users.some((u) => u.email.toLowerCase() === demoStaffEmail)) {
    const salt = generateSalt();
    const passwordHash = hashPassword(salt, demoPassword);
    const now = new Date().toISOString();
    db.users.push({
      id: "usr_demo_staff",
      name: "Rajesh Kumar",
      email: demoStaffEmail,
      role: "STAFF",
      department: "Facilities",
      staffId: "CC-STAFF-001",
      phone: "+91 98201 23456",
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    });
    changed = true;
  }

  const demoAdminEmail = "admin.demo@campusconnect.demo";
  if (!db.users.some((u) => u.email.toLowerCase() === demoAdminEmail)) {
    const salt = generateSalt();
    const passwordHash = hashPassword(salt, demoPassword);
    const now = new Date().toISOString();
    db.users.push({
      id: "usr_demo_admin",
      name: "Dr. Anita Roy",
      email: demoAdminEmail,
      role: "ADMIN",
      department: "Campus Administration & Operations",
      staffId: "CC-ADM-001",
      phone: "+91 98200 11223",
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    });
    changed = true;
  }

  return changed;
}

function ensureAuthDb(): AuthDatabase {
  try {
    const dir = path.dirname(AUTH_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(AUTH_DB_PATH)) {
      const initial: AuthDatabase = { users: [], sessions: [], passwordResets: [] };
      ensureDemoAccounts(initial);
      fs.writeFileSync(AUTH_DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(AUTH_DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as AuthDatabase;
    const db: AuthDatabase = {
      users: parsed.users || [],
      sessions: parsed.sessions || [],
      passwordResets: parsed.passwordResets || [],
    };
    if (ensureDemoAccounts(db)) {
      writeAuthDb(db);
    }
    return db;
  } catch {
    const fallback: AuthDatabase = { users: [], sessions: [], passwordResets: [] };
    ensureDemoAccounts(fallback);
    return fallback;
  }
}

function writeAuthDb(data: AuthDatabase): void {
  try {
    const dir = path.dirname(AUTH_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUTH_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write auth DB:", err);
  }
}

// ─── Password helpers ─────────────────────────────────────────────────────────

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(salt: string, password: string): string {
  return crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
}

function verifyPassword(salt: string, hash: string, password: string): boolean {
  const candidate = hashPassword(salt, password);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export function validateStaffCode(code: string): boolean {
  return code.trim() === STAFF_VERIFICATION_CODE;
}

export function signUp(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  studentId?: string;
  year?: string;
  staffId?: string;
  staffCode?: string;
}): { success: true; user: AuthUser } | { success: false; error: string } {
  const db = ensureAuthDb();

  // Normalize email
  const email = payload.email.trim().toLowerCase();

  // Check duplicate email
  const existing = db.users.find((u) => u.email === email);
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Validate staff verification code server-side
  if (payload.role === "STAFF") {
    if (!payload.staffCode || !validateStaffCode(payload.staffCode)) {
      return { success: false, error: "Invalid staff verification code. Please contact your campus administrator." };
    }
    if (!payload.staffId?.trim()) {
      return { success: false, error: "Employee/Staff ID is required." };
    }
  }

  if (payload.role === "STUDENT") {
    if (!payload.studentId?.trim()) {
      return { success: false, error: "Student/Roll Number is required." };
    }
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(salt, payload.password);
  const now = new Date().toISOString();
  const id = `usr_${payload.role.toLowerCase()}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const newUser: AuthUserRecord = {
    id,
    name: payload.name.trim(),
    email,
    role: payload.role,
    department: payload.department.trim(),
    passwordHash,
    salt,
    studentId: payload.studentId?.trim(),
    year: payload.year?.trim(),
    staffId: payload.staffId?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(newUser);
  writeAuthDb(db);

  // Return safe user (no password fields)
  const { passwordHash: _h, salt: _s, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

export function signIn(
  email: string,
  password: string
): { success: true; user: AuthUser; token: string } | { success: false; error: string } {
  const db = ensureAuthDb();
  const normalized = email.trim().toLowerCase();
  const record = db.users.find((u) => u.email === normalized);

  if (!record) {
    // Generic message to prevent user enumeration
    return { success: false, error: "Invalid email or password." };
  }

  let valid = false;
  try {
    valid = verifyPassword(record.salt, record.passwordHash, password);
  } catch {
    return { success: false, error: "Invalid email or password." };
  }

  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const session: Session = { token, userId: record.id, role: record.role, expiresAt };

  // Prune expired sessions for this user
  db.sessions = db.sessions.filter(
    (s) => s.userId !== record.id || new Date(s.expiresAt) > new Date()
  );
  db.sessions.push(session);
  writeAuthDb(db);

  const { passwordHash: _h, salt: _s, ...safeUser } = record;
  return { success: true, user: safeUser, token };
}

export function validateSession(
  token: string
): { valid: true; user: AuthUser } | { valid: false; error: string } {
  if (!token) return { valid: false, error: "No session token." };

  const db = ensureAuthDb();
  const session = db.sessions.find((s) => s.token === token);

  if (!session) return { valid: false, error: "Session not found." };
  if (new Date(session.expiresAt) < new Date()) {
    // Clean up expired session
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeAuthDb(db);
    return { valid: false, error: "Session expired. Please sign in again." };
  }

  const record = db.users.find((u) => u.id === session.userId);
  if (!record) return { valid: false, error: "User not found." };

  const { passwordHash: _h, salt: _s, ...safeUser } = record;
  return { valid: true, user: safeUser };
}

export function signOut(token: string): void {
  const db = ensureAuthDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  writeAuthDb(db);
}

export function getUserById(id: string): AuthUser | undefined {
  const db = ensureAuthDb();
  const record = db.users.find((u) => u.id === id);
  if (!record) return undefined;
  const { passwordHash: _h, salt: _s, ...safeUser } = record;
  return safeUser;
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export function requestPasswordReset(
  email: string
): { success: true; token: string; name: string } | { success: false; error: string } {
  const db = ensureAuthDb();
  const normalized = email.trim().toLowerCase();
  const record = db.users.find((u) => u.email === normalized);

  if (!record) {
    // Don't reveal whether account exists — return generic success
    return { success: false, error: "NO_ACCOUNT" };
  }

  // Invalidate old tokens for this user
  db.passwordResets = db.passwordResets.filter((r) => r.userId !== record.id);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS).toISOString();

  db.passwordResets.push({
    token,
    userId: record.id,
    email: normalized,
    expiresAt,
    used: false,
  });
  writeAuthDb(db);

  return { success: true, token, name: record.name };
}

export function resetPassword(
  token: string,
  newPassword: string
): { success: true } | { success: false; error: string } {
  const db = ensureAuthDb();
  const resetRecord = db.passwordResets.find((r) => r.token === token && !r.used);

  if (!resetRecord) return { success: false, error: "Invalid or expired reset link." };
  if (new Date(resetRecord.expiresAt) < new Date()) {
    return { success: false, error: "Reset link has expired. Please request a new one." };
  }

  const userIdx = db.users.findIndex((u) => u.id === resetRecord.userId);
  if (userIdx === -1) return { success: false, error: "User not found." };

  const salt = generateSalt();
  const passwordHash = hashPassword(salt, newPassword);

  db.users[userIdx] = {
    ...db.users[userIdx],
    salt,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  // Mark token as used
  const resetIdx = db.passwordResets.findIndex((r) => r.token === token);
  if (resetIdx !== -1) db.passwordResets[resetIdx].used = true;

  // Invalidate all active sessions for this user (security)
  db.sessions = db.sessions.filter((s) => s.userId !== resetRecord.userId);

  writeAuthDb(db);
  return { success: true };
}

export function validateResetToken(
  token: string
): { valid: true; email: string } | { valid: false; error: string } {
  const db = ensureAuthDb();
  const record = db.passwordResets.find((r) => r.token === token && !r.used);
  if (!record) return { valid: false, error: "Invalid or expired reset link." };
  if (new Date(record.expiresAt) < new Date()) {
    return { valid: false, error: "This reset link has expired." };
  }
  return { valid: true, email: record.email };
}

// ─── Validation helpers (shared with API) ─────────────────────────────────────

export function validatePassword(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Password must contain at least one uppercase letter." };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Password must contain at least one number." };
  return { ok: true };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
