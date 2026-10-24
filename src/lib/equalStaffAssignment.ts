import { Category, Ticket } from "./types";
import { getTickets } from "./db";

export interface QualifiedStaff {
  name: string;
  role: string;
  department: string;
  displayName: string;
  staffId?: string;
  email?: string;
}

export const STAFF_ROSTER: Record<Category, QualifiedStaff[]> = {
  Plumbing: [
    {
      name: "Rajesh Kumar",
      role: "Facilities & Hydraulic Maintenance Lead",
      department: "Facilities & Hydraulic Maintenance",
      displayName: "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
      staffId: "CC-STAFF-001",
      email: "rajesh.facilities@campus.edu",
    },
    {
      name: "Vikram Rao",
      role: "Senior Plumber & Hydraulic Specialist",
      department: "Facilities & Hydraulic Maintenance",
      displayName: "Vikram Rao (Senior Plumber)",
      staffId: "CC-STAFF-005",
      email: "vikram.rao@campus.edu",
    },
  ],
  Electricity: [
    {
      name: "Ananya Sharma",
      role: "Campus Electrical Operations Lead",
      department: "Campus Electrical & Power Operations",
      displayName: "Ananya Sharma (Campus Electrical & Power Operations)",
      staffId: "CC-STAFF-004",
      email: "ananya.electrical@campus.edu",
    },
    {
      name: "Deepak Verma",
      role: "Master Electrician & High Voltage Specialist",
      department: "Campus Electrical & Power Operations",
      displayName: "Deepak Verma (Master Electrician)",
      staffId: "CC-STAFF-006",
      email: "deepak.verma@campus.edu",
    },
  ],
  Cleanliness: [
    {
      name: "Sunita Rao",
      role: "Campus Hygiene & Sanitation Lead",
      department: "Campus Hygiene & Sanitation Services",
      displayName: "Sunita Rao (Campus Hygiene & Sanitation Services)",
      staffId: "CC-STAFF-007",
      email: "sunita.hygiene@campus.edu",
    },
    {
      name: "Manoj Patil",
      role: "Sanitation Team Lead & Facility Hygiene",
      department: "Campus Hygiene & Sanitation Services",
      displayName: "Manoj Patil (Sanitation Team Lead)",
      staffId: "CC-STAFF-008",
      email: "manoj.patil@campus.edu",
    },
  ],
  "Internet Connectivity": [
    {
      name: "David Miller",
      role: "IT & Network Infrastructure Lead",
      department: "IT & Network Infrastructure",
      displayName: "David Miller (IT & Network Infrastructure)",
      staffId: "CC-STAFF-009",
      email: "david.it@campus.edu",
    },
    {
      name: "Pooja Sengupta",
      role: "WLAN Systems Engineer & Network Architect",
      department: "IT & Network Infrastructure",
      displayName: "Pooja Sengupta (WLAN Systems Engineer)",
      staffId: "CC-STAFF-010",
      email: "pooja.sengupta@campus.edu",
    },
  ],
};

const GENERAL_STAFF: QualifiedStaff[] = [
  {
    name: "General Campus Operations Team",
    role: "Campus Operations Dispatch",
    department: "Campus Facilities Operations",
    displayName: "General Campus Operations Team",
    staffId: "CC-STAFF-000",
  },
];

export interface StaffWorkload {
  staff: QualifiedStaff;
  activeCount: number;
  totalCount: number;
  lastAssignedTime: number;
}

/**
 * Calculates current active task workload for staff in a given category.
 * Active tickets: status is not RESOLVED or CLOSED.
 */
export function getStaffWorkloadForCategory(
  category: Category,
  allTickets?: Ticket[]
): StaffWorkload[] {
  const tickets = allTickets || getTickets();
  const team = STAFF_ROSTER[category] || GENERAL_STAFF;

  const activeTickets = tickets.filter(
    (t) => t.status !== "RESOLVED" && t.status !== "CLOSED"
  );

  return team.map((member) => {
    const memberLower = member.name.toLowerCase();
    const displayLower = member.displayName.toLowerCase();

    // Check matching active tickets
    const assignedActive = activeTickets.filter((t) => {
      if (!t.assignedTo) return false;
      const a = t.assignedTo.toLowerCase();
      return a.includes(memberLower) || a.includes(displayLower);
    });

    // Check matching total tickets
    const assignedTotal = tickets.filter((t) => {
      if (!t.assignedTo) return false;
      const a = t.assignedTo.toLowerCase();
      return a.includes(memberLower) || a.includes(displayLower);
    });

    // Find most recent assignment timestamp
    let lastAssignedTime = 0;
    for (const t of assignedTotal) {
      const time = new Date(t.updatedAt || t.createdAt).getTime();
      if (time > lastAssignedTime) {
        lastAssignedTime = time;
      }
    }

    return {
      staff: member,
      activeCount: assignedActive.length,
      totalCount: assignedTotal.length,
      lastAssignedTime,
    };
  });
}

export interface EqualAssignmentResult {
  assignedTo: string;
  staffName: string;
  role: string;
  department: string;
  activeTasksBeforeAssignment: number;
  teamAverageActiveTasks: number;
  reason: string;
}

/**
 * Assigns a ticket to the staff member with the lowest current workload in that category.
 * If multiple staff members have the same workload, breaks ties using:
 * 1. Total lifetime tickets assigned (lowest first)
 * 2. Least recently assigned ticket timestamp (oldest first - round-robin)
 *
 * This ensures that when many students raise tickets of the same issue type,
 * the tasks are distributed EQUALLY among the qualified staff.
 */
export function getEquallyAssignedStaff(
  category: Category,
  excludeStaffNames: string[] = [],
  allTickets?: Ticket[]
): EqualAssignmentResult {
  const workloads = getStaffWorkloadForCategory(category, allTickets);

  const eligible = workloads.filter(
    (w) =>
      !excludeStaffNames.some(
        (name) =>
          w.staff.name.toLowerCase().includes(name.toLowerCase()) ||
          w.staff.displayName.toLowerCase().includes(name.toLowerCase())
      )
  );

  const pool = eligible.length > 0 ? eligible : workloads;

  // Sort candidate pool for equal distribution:
  // 1. Lowest active task count (primary workload balance)
  // 2. Lowest total tickets assigned (secondary equity)
  // 3. Least recently assigned (tertiary round-robin fairness)
  pool.sort((a, b) => {
    if (a.activeCount !== b.activeCount) {
      return a.activeCount - b.activeCount;
    }
    if (a.totalCount !== b.totalCount) {
      return a.totalCount - b.totalCount;
    }
    return a.lastAssignedTime - b.lastAssignedTime;
  });

  const selected = pool[0];
  const totalActive = workloads.reduce((sum, w) => sum + w.activeCount, 0);
  const teamAvg =
    workloads.length > 0
      ? Math.round((totalActive / workloads.length) * 10) / 10
      : 0;

  const reason = `Auto-assigned equally to ${selected.staff.name} (${selected.staff.role}) to balance workload across ${category} staff. Current active load: ${selected.activeCount} tasks (team avg: ${teamAvg}).`;

  return {
    assignedTo: selected.staff.displayName,
    staffName: selected.staff.name,
    role: selected.staff.role,
    department: selected.staff.department,
    activeTasksBeforeAssignment: selected.activeCount,
    teamAverageActiveTasks: teamAvg,
    reason,
  };
}
