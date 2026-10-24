import fs from "fs";
import path from "path";
import { 
  EmergencyIncident, 
  EmergencyStaffAvailability, 
  EmergencyMessage,
  EmergencyType
} from "./emergencyTypes";
import { broadcastEmergencyEvent } from "./emergencyEvents";

interface EmergencyDatabase {
  incidents: EmergencyIncident[];
  staff: EmergencyStaffAvailability[];
  messages: EmergencyMessage[];
}

const DB_PATH = path.join(process.cwd(), "data", "emergencies-db.json");

const DEFAULT_STAFF: EmergencyStaffAvailability[] = [
  {
    staffId: "CC-STAFF-001",
    userId: "usr_demo_staff",
    name: "Rajesh Kumar",
    phoneNumber: "+91 98201 23456",
    department: "Facilities",
    emergencyRole: "Facilities Emergency Responder",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
    notificationEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    staffId: "CC-STAFF-002",
    userId: "usr_staff_medical",
    name: "Dr. Priya Sharma",
    phoneNumber: "+91 98202 34567",
    department: "Health & Medical",
    emergencyRole: "Medical Response",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
    notificationEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    staffId: "CC-STAFF-003",
    userId: "usr_staff_security",
    name: "Amit Verma",
    phoneNumber: "+91 98203 45678",
    department: "Campus Security",
    emergencyRole: "Security Response",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
    notificationEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    staffId: "CC-STAFF-004",
    userId: "usr_staff_electrical",
    name: "Ananya Sharma",
    phoneNumber: "+91 98204 56789",
    department: "Campus Electrical & Power Operations",
    emergencyRole: "Electrical Maintenance Responder",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
    notificationEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    staffId: "CC-STAFF-005",
    userId: "usr_staff_fire",
    name: "Vikram Rao",
    phoneNumber: "+91 98205 67890",
    department: "Fire Safety",
    emergencyRole: "Fire Safety Responder",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
    notificationEnabled: true,
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryDb: EmergencyDatabase | null = null;

function loadDb(): EmergencyDatabase {
  if (inMemoryDb) return inMemoryDb;

  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(DB_PATH)) {
      const initial: EmergencyDatabase = {
        incidents: [],
        staff: DEFAULT_STAFF,
        messages: [],
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      inMemoryDb = initial;
      return initial;
    }

    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    inMemoryDb = {
      incidents: parsed.incidents || [],
      staff: parsed.staff && parsed.staff.length > 0 ? parsed.staff : DEFAULT_STAFF,
      messages: parsed.messages || [],
    };
    return inMemoryDb;
  } catch (err) {
    console.error("Failed to read emergency DB, using defaults:", err);
    inMemoryDb = { incidents: [], staff: DEFAULT_STAFF, messages: [] };
    return inMemoryDb;
  }
}

function persistDb(): void {
  if (!inMemoryDb) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(inMemoryDb, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write emergency DB:", err);
  }
}

// ─── Staff Availability ─────────────────────────────────────────────────────────

export function getEmergencyStaffList(): EmergencyStaffAvailability[] {
  const db = loadDb();
  return [...db.staff];
}

export function getEmergencyStaffById(staffId: string): EmergencyStaffAvailability | undefined {
  const db = loadDb();
  return db.staff.find((s) => s.staffId === staffId || s.userId === staffId);
}

export function updateStaffAvailability(
  staffId: string,
  updates: Partial<EmergencyStaffAvailability>
): EmergencyStaffAvailability | null {
  const db = loadDb();
  const staff = db.staff.find((s) => s.staffId === staffId || s.userId === staffId);
  if (!staff) return null;

  Object.assign(staff, updates, { updatedAt: new Date().toISOString() });
  persistDb();

  broadcastEmergencyEvent({
    type: "availability:updated",
    payload: { staff: staff, staffList: db.staff },
    timestamp: new Date().toISOString(),
  });

  return staff;
}

export function recalculateStaffLoads(): void {
  const db = loadDb();
  const activeCounts: Record<string, number> = {};

  for (const inc of db.incidents) {
    if (
      inc.assignedStaffId &&
      ["STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(inc.status)
    ) {
      activeCounts[inc.assignedStaffId] = (activeCounts[inc.assignedStaffId] || 0) + 1;
    }
  }

  for (const s of db.staff) {
    s.activeEmergencyCount = activeCounts[s.staffId] || 0;
  }
  persistDb();
}

// ─── Incidents ──────────────────────────────────────────────────────────────────

export function getAllEmergencies(): EmergencyIncident[] {
  const db = loadDb();
  return [...db.incidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEmergencyById(id: string): EmergencyIncident | null {
  const db = loadDb();
  const found = db.incidents.find((i) => i.id === id);
  return found ? { ...found } : null;
}

export function saveEmergency(incident: EmergencyIncident): void {
  const db = loadDb();
  const index = db.incidents.findIndex((i) => i.id === incident.id);
  if (index >= 0) {
    db.incidents[index] = incident;
  } else {
    db.incidents.unshift(incident);
  }
  recalculateStaffLoads();
  persistDb();
}

export function generateIncidentId(): string {
  const db = loadDb();
  const count = db.incidents.length + 1;
  const pad = String(count).padStart(4, "0");
  return `EMG-2026-${pad}`;
}

// ─── Messages ───────────────────────────────────────────────────────────────────

export function getEmergencyMessages(emergencyId: string): EmergencyMessage[] {
  const db = loadDb();
  return db.messages
    .filter((m) => m.emergencyId === emergencyId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addEmergencyMessage(
  msg: Omit<EmergencyMessage, "id" | "createdAt">
): EmergencyMessage {
  const db = loadDb();
  const newMsg: EmergencyMessage = {
    ...msg,
    id: `emg_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  db.messages.push(newMsg);
  persistDb();

  broadcastEmergencyEvent({
    type: "message:created",
    payload: { emergencyId: msg.emergencyId, message: newMsg },
    timestamp: newMsg.createdAt,
  });

  return newMsg;
}

export function rateEmergency(
  emergencyId: string,
  rating: number,
  ratingFeedback?: string
): EmergencyIncident | undefined {
  const db = loadDb();
  const idx = db.incidents.findIndex((i) => i.id === emergencyId);
  if (idx === -1) return undefined;

  const now = new Date().toISOString();
  db.incidents[idx] = {
    ...db.incidents[idx],
    rating,
    ratingFeedback,
    ratedAt: now,
  };

  persistDb();

  addEmergencyMessage({
    emergencyId,
    senderId: "system",
    senderName: "CampusConnect Feedback",
    senderRole: "SYSTEM",
    message: `Student rated emergency response: ${rating}/5 stars.${ratingFeedback ? ` Feedback: "${ratingFeedback}"` : ""}`,
  });

  return db.incidents[idx];
}
