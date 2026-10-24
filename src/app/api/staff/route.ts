import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { getEmergencyStaffList, getAllEmergencies } from "@/lib/emergencyDb";
import { getTickets } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Strictly restricted to ADMIN only
  const auth = requireAuth(req, "ADMIN");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const staffList = getEmergencyStaffList();
    const allTickets = getTickets();
    const allEmergencies = getAllEmergencies();

    const enrichedStaff = staffList.map((staff) => {
      // Find assigned tickets by name or staffId
      const tickets = allTickets.filter(
        (t) =>
          t.assignedTo &&
          (t.assignedTo.toLowerCase().includes(staff.name.toLowerCase()) ||
           t.assignedTo.toLowerCase().includes(staff.staffId.toLowerCase()))
      );

      const activeTickets = tickets.filter(
        (t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS" || t.status === "NEW"
      );
      const resolvedTickets = tickets.filter(
        (t) => t.status === "RESOLVED" || t.status === "CLOSED"
      );

      // Find emergency incidents handled
      const emergencies = allEmergencies.filter(
        (e) =>
          e.assignedStaffId === staff.staffId ||
          (e.assignedStaffName && e.assignedStaffName.toLowerCase() === staff.name.toLowerCase())
      );

      const activeEmergencies = emergencies.filter(
        (e) => e.status !== "RESOLVED" && e.status !== "CANCELLED"
      );

      return {
        ...staff,
        totalTickets: tickets.length,
        activeTicketsCount: activeTickets.length,
        resolvedTicketsCount: resolvedTickets.length,
        totalEmergenciesCount: emergencies.length,
        activeEmergenciesCount: activeEmergencies.length,
      };
    });

    const summary = {
      totalStaff: staffList.length,
      availableStaff: staffList.filter((s) => s.isAvailable).length,
      onDutyStaff: staffList.filter((s) => s.isOnEmergencyDuty).length,
      handlingEmergencies: enrichedStaff.filter((s) => s.activeEmergenciesCount > 0).length,
      totalTickets: allTickets.length,
      activeTickets: allTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length,
      resolvedTickets: allTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
      totalEmergencies: allEmergencies.length,
      openEmergencies: allEmergencies.filter((e) => e.status !== "RESOLVED" && e.status !== "CANCELLED").length,
    };

    return NextResponse.json({
      success: true,
      staff: enrichedStaff,
      summary,
    });
  } catch (error: any) {
    console.error("Error in GET /api/staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load staff directory." },
      { status: 500 }
    );
  }
}
