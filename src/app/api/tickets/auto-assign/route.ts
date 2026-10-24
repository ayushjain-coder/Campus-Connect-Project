import { NextRequest, NextResponse } from "next/server";
import { getTickets, updateTicket } from "@/lib/db";
import { Category } from "@/lib/types";
import {
  STAFF_ROSTER,
  getStaffWorkloadForCategory,
  getEquallyAssignedStaff,
} from "@/lib/equalStaffAssignment";
import { requireAuth } from "@/lib/authMiddleware";

export const dynamic = "force-dynamic";

/**
 * GET /api/tickets/auto-assign
 * Returns current staff workload balance across all categories.
 */
export async function GET(req: NextRequest) {
  try {
    const allTickets = getTickets();
    const categories: Category[] = [
      "Plumbing",
      "Electricity",
      "Cleanliness",
      "Internet Connectivity",
    ];

    const workloadOverview: Record<string, any> = {};

    for (const cat of categories) {
      const workloads = getStaffWorkloadForCategory(cat, allTickets);
      const activeCategoryTickets = allTickets.filter(
        (t) =>
          t.category === cat &&
          t.status !== "RESOLVED" &&
          t.status !== "CLOSED"
      );
      const unassignedCount = activeCategoryTickets.filter(
        (t) => !t.assignedTo || t.assignedTo.trim() === ""
      ).length;

      workloadOverview[cat] = {
        totalActiveTickets: activeCategoryTickets.length,
        unassignedTickets: unassignedCount,
        staff: workloads.map((w) => ({
          name: w.staff.name,
          displayName: w.staff.displayName,
          role: w.staff.role,
          department: w.staff.department,
          activeCount: w.activeCount,
          totalCount: w.totalCount,
        })),
      };
    }

    return NextResponse.json({
      success: true,
      workloadOverview,
    });
  } catch (error: any) {
    console.error("Error in GET /api/tickets/auto-assign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workload overview." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/auto-assign
 * Balances and auto-assigns unassigned tickets equally among staff.
 */
export async function POST(req: NextRequest) {
  // Staff or Admin action
  const auth = requireAuth(req, "STAFF");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const targetCategory = body.category as Category | undefined;

    const allTickets = getTickets();
    const unassignedTickets = allTickets.filter(
      (t) =>
        (!t.assignedTo || t.assignedTo.trim() === "") &&
        t.status !== "RESOLVED" &&
        t.status !== "CLOSED" &&
        (!targetCategory || t.category === targetCategory)
    );

    const assignments: Array<{
      ticketId: string;
      category: Category;
      assignedTo: string;
      reason: string;
    }> = [];

    // Iteratively assign each unassigned ticket so the workload remains equal
    for (const ticket of unassignedTickets) {
      const equalAssignment = getEquallyAssignedStaff(ticket.category);
      const updated = updateTicket(ticket.ticketId, {
        status: "ASSIGNED",
        assignedTo: equalAssignment.assignedTo,
        note: `Auto-assigned equally to ${equalAssignment.assignedTo} (${ticket.category} Operations - Workload Balanced Dispatch).`,
        updatedBy: "CampusConnect Equal Dispatcher",
      });

      if (updated) {
        assignments.push({
          ticketId: ticket.ticketId,
          category: ticket.category,
          assignedTo: equalAssignment.assignedTo,
          reason: equalAssignment.reason,
        });
      }
    }

    return NextResponse.json({
      success: true,
      assignedCount: assignments.length,
      assignments,
    });
  } catch (error: any) {
    console.error("Error in POST /api/tickets/auto-assign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to auto-assign tickets." },
      { status: 500 }
    );
  }
}
