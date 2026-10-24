import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { getEmergencyStaffList, getEmergencyStaffById, getAllEmergencies } from "@/lib/emergencyDb";
import { getTickets } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  if (user.role === "STUDENT") {
    return NextResponse.json(
      { success: false, error: "Access denied. Students cannot access staff details." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const targetId = id === "me" ? (user.staffId || user.id) : id;

  // Strict IDOR Protection: Staff can only access their own staff profile
  if (user.role === "STAFF") {
    const isSelf =
      targetId === user.staffId ||
      targetId === user.id ||
      targetId.toLowerCase() === (user.name || "").toLowerCase();

    if (!isSelf) {
      return NextResponse.json(
        { success: false, error: "Access denied. You can only access your own staff profile." },
        { status: 403 }
      );
    }
  }

  try {
    const staffList = getEmergencyStaffList();
    let staff = staffList.find(
      (s) =>
        s.staffId.toLowerCase() === targetId.toLowerCase() ||
        s.userId.toLowerCase() === targetId.toLowerCase() ||
        s.name.toLowerCase() === targetId.toLowerCase()
    );

    if (!staff && (targetId === user.staffId || targetId === user.id)) {
      // Fallback for logged-in staff member if not in default emergency list
      staff = {
        staffId: user.staffId || "CC-STAFF-ME",
        userId: user.id,
        name: user.name,
        phoneNumber: user.phone || "+91 98201 23456",
        department: user.department || "Campus Operations",
        emergencyRole: "Staff Responder",
        isAvailable: true,
        isOnEmergencyDuty: true,
        activeEmergencyCount: 0,
        maxActiveEmergencies: 2,
        notificationEnabled: true,
        updatedAt: new Date().toISOString(),
      };
    }

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found." },
        { status: 404 }
      );
    }

    const allTickets = getTickets();
    const allEmergencies = getAllEmergencies();

    // Match assigned tickets
    const assignedTickets = allTickets.filter(
      (t) =>
        t.assignedTo &&
        (t.assignedTo.toLowerCase().includes(staff.name.toLowerCase()) ||
         t.assignedTo.toLowerCase().includes(staff.staffId.toLowerCase()))
    );

    const inProgressTickets = assignedTickets.filter(
      (t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS"
    );
    const resolvedTickets = assignedTickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
    );

    // Match emergency incidents
    const handledEmergencies = allEmergencies.filter(
      (e) =>
        e.assignedStaffId === staff.staffId ||
        (e.assignedStaffName && e.assignedStaffName.toLowerCase() === staff.name.toLowerCase())
    );

    const activeEmergencies = handledEmergencies.filter(
      (e) => e.status !== "RESOLVED" && e.status !== "CANCELLED"
    );

    // Calculate average resolution time from timestamps
    let totalResolutionMinutes = 0;
    let resolvedCount = 0;

    // From tickets
    for (const t of resolvedTickets) {
      if (t.createdAt && t.updatedAt) {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.updatedAt).getTime();
        const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
        if (!isNaN(diffMinutes) && diffMinutes > 0) {
          totalResolutionMinutes += diffMinutes;
          resolvedCount++;
        }
      }
    }

    // From emergencies
    for (const e of handledEmergencies) {
      if (e.resolvedAt && e.createdAt) {
        const start = new Date(e.createdAt).getTime();
        const end = new Date(e.resolvedAt).getTime();
        const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
        if (!isNaN(diffMinutes) && diffMinutes > 0) {
          totalResolutionMinutes += diffMinutes;
          resolvedCount++;
        }
      }
    }

    const avgResolutionMinutes = resolvedCount > 0 ? Math.round(totalResolutionMinutes / resolvedCount) : 45;
    const avgResolutionFormatted =
      avgResolutionMinutes >= 60
        ? `${(avgResolutionMinutes / 60).toFixed(1)} hrs`
        : `${avgResolutionMinutes} mins`;

    // Activity timeline
    const timeline: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: "TICKET" | "EMERGENCY";
      status: string;
    }> = [];

    for (const t of assignedTickets.slice(0, 10)) {
      timeline.push({
        id: t.ticketId,
        title: `Ticket: ${t.summary || t.category}`,
        description: `${t.location} · Status: ${t.status}`,
        timestamp: t.updatedAt || t.createdAt,
        type: "TICKET",
        status: t.status,
      });
    }

    for (const e of handledEmergencies.slice(0, 10)) {
      timeline.push({
        id: e.id,
        title: `Emergency: ${e.type}`,
        description: `${e.location.building}, ${e.location.room} · Status: ${e.status}`,
        timestamp: e.resolvedAt || e.respondingAt || e.acceptedAt || e.createdAt,
        type: "EMERGENCY",
        status: e.status,
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        totalTickets: assignedTickets.length,
        inProgressTickets: inProgressTickets.length,
        resolvedTickets: resolvedTickets.length,
        emergencyResponses: handledEmergencies.length,
        activeEmergencyCount: activeEmergencies.length,
        hasActiveEmergency: activeEmergencies.length > 0,
        avgResolutionMinutes,
        avgResolutionFormatted,
        assignedTickets,
        handledEmergencies,
        timeline,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/staff/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load staff details." },
      { status: 500 }
    );
  }
}
