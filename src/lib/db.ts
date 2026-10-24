import fs from "fs";
import { priorityScore, slaDeadline, ticketSla } from "./operations";
import path from "path";
import { 
  Ticket, 
  TicketUpdate, 
  DuplicateMatch, 
  User, 
  Status, 
  Category, 
  Severity 
} from "./types";

interface DatabaseSchema {
  users: User[];
  tickets: Ticket[];
  ticket_updates: TicketUpdate[];
  duplicate_matches: DuplicateMatch[];
}

const DB_FILE_PATH = path.join(process.cwd(), "data", "campusconnect-db.json");

const INITIAL_USERS: User[] = [
  {
    id: "usr_student_1",
    name: "Arjun Mehta",
    email: "arjun.m@campus.edu",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 234-5678",
  },
  {
    id: "usr_student_2",
    name: "Priya Nair",
    email: "priya.n@campus.edu",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 876-5432",
  },
  {
    id: "usr_staff_plumbing",
    name: "Rajesh Kumar",
    email: "rajesh.facilities@campus.edu",
    role: "staff",
    department: "Facilities & Hydraulic Maintenance",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 301-4421",
  },
  {
    id: "usr_staff_electric",
    name: "Ananya Sharma",
    email: "ananya.electrical@campus.edu",
    role: "staff",
    department: "Campus Electrical & Power Operations",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 301-8842",
  },
  {
    id: "usr_staff_sanitation",
    name: "Sunita Rao",
    email: "sunita.hygiene@campus.edu",
    role: "staff",
    department: "Campus Hygiene & Sanitation Services",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 301-9920",
  },
  {
    id: "usr_staff_it",
    name: "David Miller",
    email: "david.it@campus.edu",
    role: "staff",
    department: "IT & Network Infrastructure",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    phone: "+1 (555) 301-7711",
  },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    ticketId: "CC-2026-1001",
    complaintText: "Exposed wire sparking from wall outlet near workbench 3. Dangerous burning plastic smell.",
    summary: "Exposed sparking wall outlet and burning smell near workbench 3",
    category: "Electricity",
    department: "Campus Electrical & Power Operations",
    location: "Science Block A, Lab 102",
    severity: "CRITICAL",
    severityReason: "Critical severity because active arcing and melting insulation creates an immediate electrical fire hazard in an active laboratory.",
    photo: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80",
    status: "ASSIGNED",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    submittedBy: "Arjun Mehta (Roll: CS-2024-042)",
    assignedTo: "Ananya Sharma (Campus Electrical & Power Operations)",
    aiProvider: "gemini",
    extractedDetails: [
      "Hazard: Electrical arcing and exposed copper leads",
      "Scent: Melting PVC/plastic insulation",
      "Immediate action: Sub-breaker 2A isolated by lab supervisor"
    ],
    aiReasoning: "Classified as Electricity/CRITICAL due to active sparking and fire ignition hazard in an active laboratory."
  },
  {
    ticketId: "CC-2026-1002",
    complaintText: "Water leaking heavily from under the washbasin in the 2nd floor library bathroom. Water starting to puddle onto carpet outside.",
    summary: "Sub-basin pipe rupture and flooding onto hallway carpet",
    category: "Plumbing",
    department: "Facilities & Hydraulic Maintenance",
    location: "Central Library, 2nd Floor, Restroom 204",
    severity: "HIGH",
    severityReason: "High severity because uncontained sub-basin water flow is flooding hallway carpet and encroaching on library book collections.",
    photo: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    status: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    submittedBy: "Priya Nair (Roll: ME-2025-118)",
    assignedTo: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
    aiProvider: "gemini",
    extractedDetails: [
      "Fixture: P-trap drain line below center basin",
      "Water accumulation: Spreading into main library corridor",
      "Urgency: Hydraulic main valve shutoff needed"
    ],
    aiReasoning: "Classified as Plumbing/HIGH due to rapid water escape and impending damage to library carpeting and book stacks."
  },
  {
    ticketId: "CC-2026-1003",
    complaintText: "Overflowing waste bins outside the cafeteria courtyard. Stray animals scattering trash on student seating.",
    summary: "Overflowing waste receptacles and food debris in outdoor courtyard",
    category: "Cleanliness",
    department: "Campus Hygiene & Sanitation Services",
    location: "Student Center, North Cafeteria Courtyard",
    severity: "MEDIUM",
    severityReason: "Medium severity because overflowing food waste creates an environmental hygiene hazard in student dining zones.",
    photo: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
    status: "NEW",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    submittedBy: "Arjun Mehta (Roll: CS-2024-042)",
    assignedTo: "",
    aiProvider: "gemini",
    extractedDetails: [
      "Receptacles: 3 commercial bins exceeding capacity",
      "Health concern: Food scraps attracting campus pests",
      "Requirement: Bulk bin clearance and pressure wash"
    ],
    aiReasoning: "Cleanliness issue of MEDIUM severity given health hygiene standards in a food dining perimeter."
  },
  {
    ticketId: "CC-2026-1000",
    complaintText: "Campus-Secure WiFi has zero signal in Seminar Room 4B. Unable to join presentation screen.",
    summary: "Complete loss of 5GHz WiFi SSID coverage in seminar hall",
    category: "Internet Connectivity",
    department: "IT & Network Infrastructure",
    location: "Engineering Block C, Room 4B",
    severity: "LOW",
    severityReason: "Low severity because localized AP connectivity disruption had wired podium ethernet fallback.",
    photo: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    submittedBy: "David Miller (Staff)",
    assignedTo: "David Miller (IT & Network Infrastructure)",
    resolutionNotes: "PoE switch port 14 power-cycled. Upgraded Cisco AP firmware to 17.9.4. Verified 120 Mbps throughput and stable RSSI.",
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    aiProvider: "gemini",
    extractedDetails: [
      "Network: Campus-Secure Enterprise WPA3",
      "Hardware: Cisco Catalyst AP 9120AX",
      "Impact: Seminar projection latency"
    ],
    aiReasoning: "Classified as Internet Connectivity/LOW as Ethernet fallback was available in the podium."
  },
  {
    ticketId: "CC-2026-1004",
    complaintText: "Emergency exit directional lighting fixture completely unlit during routine evening patrol.",
    summary: "Emergency exit corridor directional lighting unpowered",
    category: "Electricity",
    department: "Campus Electrical & Power Operations",
    location: "Humanities Complex, West Wing Corridor",
    severity: "HIGH",
    severityReason: "High severity because unpowered emergency egress lighting violates university life safety regulations.",
    status: "NEW",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    submittedBy: "Campus Safety Patrol",
    assignedTo: "",
    aiProvider: "gemini",
    extractedDetails: [
      "Fixture: Dual-head illuminated battery backup exit luminaire",
      "Compliance: Campus safety egress code violation",
      "Action: Electrician battery pack inspection needed"
    ],
    aiReasoning: "Classified as Electricity/HIGH due to life safety egress requirements."
  }
];

const INITIAL_UPDATES: TicketUpdate[] = [
  {
    id: "upd_1001_1",
    ticketId: "CC-2026-1001",
    status: "NEW",
    note: "AI Operations Agent triaged ticket with CRITICAL severity. Flagged for urgent electrical isolation.",
    updatedBy: "Gemini Operations Agent",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "upd_1001_2",
    ticketId: "CC-2026-1001",
    status: "ASSIGNED",
    note: "Assigned ticket to Ananya Sharma. Dispatching emergency electrician kit.",
    updatedBy: "Operations Desk",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "upd_1002_1",
    ticketId: "CC-2026-1002",
    status: "NEW",
    note: "AI Operations Agent analyzed complaint & photo. Detected potential water damage risk to carpet.",
    updatedBy: "Gemini Operations Agent",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "upd_1002_2",
    ticketId: "CC-2026-1002",
    status: "ASSIGNED",
    note: "Assigned to Rajesh Kumar (Plumbing Lead).",
    updatedBy: "Operations Desk",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "upd_1002_3",
    ticketId: "CC-2026-1002",
    status: "IN_PROGRESS",
    note: "On site. Isolated secondary shut-off valve. Replacing broken PVC slip joint and wet-vacuuming hallway carpet.",
    updatedBy: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "upd_1003_1",
    ticketId: "CC-2026-1003",
    status: "NEW",
    note: "AI Agent logged sanitation ticket and routed to Campus Hygiene team.",
    updatedBy: "Gemini Operations Agent",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "upd_1000_1",
    ticketId: "CC-2026-1000",
    status: "NEW",
    note: "Ticket generated via student portal.",
    updatedBy: "Gemini Operations Agent",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "upd_1000_2",
    ticketId: "CC-2026-1000",
    status: "ASSIGNED",
    note: "Assigned to David Miller (IT Infrastructure).",
    updatedBy: "Operations Desk",
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "upd_1000_3",
    ticketId: "CC-2026-1000",
    status: "IN_PROGRESS",
    note: "Inspecting switch closet IDF-3 and running PoE diagnostics.",
    updatedBy: "David Miller",
    timestamp: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: "upd_1000_4",
    ticketId: "CC-2026-1000",
    status: "RESOLVED",
    note: "PoE switch port 14 power-cycled. Upgraded Cisco AP firmware to 17.9.4. Verified 120 Mbps throughput and stable RSSI.",
    updatedBy: "David Miller (IT & Network Infrastructure)",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "upd_1004_1",
    ticketId: "CC-2026-1004",
    status: "NEW",
    note: "AI Operations Agent logged emergency egress lighting failure with HIGH severity for expedited electrician dispatch.",
    updatedBy: "Gemini Operations Agent",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const INITIAL_DUPLICATES: DuplicateMatch[] = [];

function ensureDb(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE_PATH)) {
      const initialData: DatabaseSchema = {
        users: INITIAL_USERS,
        tickets: INITIAL_TICKETS,
        ticket_updates: INITIAL_UPDATES,
        duplicate_matches: INITIAL_DUPLICATES,
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error("Error reading database file, returning fallback in-memory state:", error);
    return {
      users: INITIAL_USERS,
      tickets: INITIAL_TICKETS,
      ticket_updates: INITIAL_UPDATES,
      duplicate_matches: INITIAL_DUPLICATES,
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write database file:", error);
  }
}

// Database API helper functions
export function getTickets(filters?: {
  status?: Status;
  category?: Category;
  severity?: Severity;
  search?: string;
  sortByPriority?: boolean;
}): Ticket[] {
  const db = ensureDb();
  let list = [...db.tickets];

  if (filters?.status) {
    list = list.filter((t) => t.status === filters.status);
  }
  if (filters?.category) {
    list = list.filter((t) => t.category === filters.category);
  }
  if (filters?.severity) {
    list = list.filter((t) => t.severity === filters.severity);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.ticketId.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.complaintText.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  return list.sort((a, b) => filters?.sortByPriority ? priorityScore(b) - priorityScore(a) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTicketById(ticketId: string): Ticket | undefined {
  const db = ensureDb();
  return db.tickets.find((t) => t.ticketId.toUpperCase() === ticketId.toUpperCase());
}

export function createTicket(ticketData: Omit<Ticket, "createdAt" | "updatedAt">): Ticket {
  const db = ensureDb();
  const now = new Date().toISOString();
  const newTicket: Ticket = {
    ...ticketData,
    createdAt: now,
    updatedAt: now,
    slaDeadline: ticketData.slaDeadline || slaDeadline(now, ticketData.severity),
  };

  db.tickets.unshift(newTicket);

  // Automatically insert the initial update in ticket_updates
  const initialNote = newTicket.assignedTo
    ? `Ticket created via CampusConnect AI Operations Agent. Initial status: ${newTicket.status}. Auto-assigned equally to ${newTicket.assignedTo} for balanced workload distribution.`
    : `Ticket created via CampusConnect AI Operations Agent. Initial status: ${newTicket.status}.`;

  const initialUpdate: TicketUpdate = {
    id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId: newTicket.ticketId,
    status: newTicket.status,
    note: initialNote,
    updatedBy: newTicket.submittedBy || "CampusConnect AI",
    timestamp: now,
  };
  db.ticket_updates.push(initialUpdate);

  writeDb(db);
  return newTicket;
}

export function updateTicket(
  ticketId: string, 
  updates: Partial<Omit<Ticket, "ticketId" | "createdAt">> & { updatedBy?: string; note?: string }
): Ticket | undefined {
  const db = ensureDb();
  const idx = db.tickets.findIndex((t) => t.ticketId.toUpperCase() === ticketId.toUpperCase());
  if (idx === -1) return undefined;

  const now = new Date().toISOString();
  const existing = db.tickets[idx];
  const oldStatus = existing.status;
  const newStatus = updates.status || oldStatus;

  const updatedTicket: Ticket = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  if (newStatus === "RESOLVED" && !updatedTicket.resolvedAt) {
    updatedTicket.resolvedAt = now;
  }

  if (updates.severity && updates.severity !== existing.severity) updatedTicket.slaDeadline = slaDeadline(existing.createdAt, updates.severity);
  db.tickets[idx] = updatedTicket;

  // Add an entry in ticket_updates if status changed or note was provided
  if (newStatus !== oldStatus || updates.note || updates.assignedTo !== existing.assignedTo) {
    let noteText = updates.note || "";
    if (!noteText) {
      if (newStatus !== oldStatus) {
        noteText = `Status transitioned from ${oldStatus} to ${newStatus}.`;
      } else if (updates.assignedTo && updates.assignedTo !== existing.assignedTo) {
        noteText = `Assigned to ${updates.assignedTo}.`;
      } else {
        noteText = "Ticket details updated.";
      }
    }

    const updateRecord: TicketUpdate = {
      id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketId: updatedTicket.ticketId,
      status: newStatus,
      note: noteText,
      updatedBy: updates.updatedBy || "Campus Operations Staff",
      timestamp: now,
    };
    db.ticket_updates.push(updateRecord);
  }

  writeDb(db);
  return updatedTicket;
}

export function getTicketUpdates(ticketId: string): TicketUpdate[] {
  const db = ensureDb();
  return db.ticket_updates
    .filter((u) => u.ticketId.toUpperCase() === ticketId.toUpperCase())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function addTicketUpdate(
  ticketId: string, 
  status: Status, 
  note: string, 
  updatedBy: string
): TicketUpdate {
  const db = ensureDb();
  const now = new Date().toISOString();
  const record: TicketUpdate = {
    id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId,
    status,
    note,
    updatedBy,
    timestamp: now,
  };
  db.ticket_updates.push(record);
  writeDb(db);
  return record;
}

export function rateTicket(
  ticketId: string,
  rating: number,
  ratingFeedback?: string,
  studentName?: string
): Ticket | undefined {
  const db = ensureDb();
  const idx = db.tickets.findIndex((t) => t.ticketId.toUpperCase() === ticketId.toUpperCase());
  if (idx === -1) return undefined;

  const now = new Date().toISOString();
  const existing = db.tickets[idx];

  const updatedTicket: Ticket = {
    ...existing,
    rating,
    ratingFeedback: ratingFeedback || existing.ratingFeedback,
    ratedAt: now,
    updatedAt: now,
  };

  db.tickets[idx] = updatedTicket;

  const ratingUpdate: TicketUpdate = {
    id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId: existing.ticketId,
    status: existing.status,
    note: `Student rated resolution: ${rating}/5 stars. ${ratingFeedback ? `Feedback: "${ratingFeedback}"` : ""}`,
    updatedBy: studentName || existing.submittedBy || "Student",
    timestamp: now,
  };
  db.ticket_updates.push(ratingUpdate);

  writeDb(db);
  return updatedTicket;
}

export function addDuplicateMatch(
  ticketId: string, 
  matchedTicketId: string, 
  reason: string, 
  similarityScore: number
): DuplicateMatch {
  const db = ensureDb();
  const record: DuplicateMatch = {
    id: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId,
    matchedTicketId,
    reason,
    similarityScore,
    createdAt: new Date().toISOString(),
  };
  db.duplicate_matches.push(record);
  writeDb(db);
  return record;
}

export function getDuplicateMatches(ticketId: string): DuplicateMatch[] {
  const db = ensureDb();
  return db.duplicate_matches.filter(
    (d) => d.ticketId.toUpperCase() === ticketId.toUpperCase() || d.matchedTicketId.toUpperCase() === ticketId.toUpperCase()
  );
}

export function getUsers(): User[] {
  const db = ensureDb();
  return db.users;
}

export function getStats() {
  const db = ensureDb();
  const tickets = db.tickets;

  const total = tickets.length;
  const newCount = tickets.filter((t) => t.status === "NEW").length;
  const assignedCount = tickets.filter((t) => t.status === "ASSIGNED").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  const byCategory: Record<Category, number> = {
    Plumbing: 0,
    Electricity: 0,
    Cleanliness: 0,
    "Internet Connectivity": 0,
  };

  tickets.forEach((t) => {
    if (byCategory[t.category] !== undefined) {
      byCategory[t.category]++;
    }
  });

  const criticalCount = tickets.filter((t) => t.severity === "CRITICAL" && t.status !== "RESOLVED").length;
  const highCount = tickets.filter((t) => t.severity === "HIGH" && t.status !== "RESOLVED").length;

  return {
    total,
    newCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    byCategory,
    criticalCount,
    highCount,
    slaBreaches: tickets.filter(t => ticketSla(t).breached).length,
    activeCount: tickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED").length,
    averageResolutionHours: (() => { const resolved = tickets.filter(t => t.resolvedAt); return resolved.length ? resolved.reduce((sum, t) => sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 3600000, 0) / resolved.length : 0; })(),
  };
}

export function resetToSeedData(): void {
  const data: DatabaseSchema = {
    users: INITIAL_USERS,
    tickets: INITIAL_TICKETS,
    ticket_updates: INITIAL_UPDATES,
    duplicate_matches: INITIAL_DUPLICATES,
  };
  writeDb(data);
}
