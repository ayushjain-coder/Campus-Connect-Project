import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { getEmergencyStaffList, getAllEmergencies } from "@/lib/emergencyDb";
import { getTickets } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  if (user.role === "STUDENT") {
    return NextResponse.json(
      { success: false, error: "Access denied. Students cannot access staff metrics." },
      { status: 403 }
    );
  }

  try {
    const staffList = getEmergencyStaffList();
    const staffId = user.staffId || user.id;

    let staff = staffList.find(
      (s) =>
        s.staffId.toLowerCase() === staffId.toLowerCase() ||
        s.userId.toLowerCase() === user.id.toLowerCase() ||
        s.name.toLowerCase() === user.name.toLowerCase()
    );

    if (!staff) {
      staff = {
        staffId: user.staffId || "CC-STAFF-001",
        userId: user.id,
        name: user.name,
        phoneNumber: user.phone || "+91 98201 23456",
        department: user.department || "Facilities",
        emergencyRole: user.role === "ADMIN" ? "Campus Administrator" : "Facilities Emergency Responder",
        isAvailable: true,
        isOnEmergencyDuty: true,
        activeEmergencyCount: 0,
        maxActiveEmergencies: 2,
        notificationEnabled: true,
        updatedAt: new Date().toISOString(),
      };
    }

    const allTickets = getTickets();
    const allEmergencies = getAllEmergencies();

    // Match assigned tickets
    const myTickets = allTickets.filter(
      (t) =>
        t.assignedTo &&
        (t.assignedTo.toLowerCase().includes(user.name.toLowerCase()) ||
         (user.staffId && t.assignedTo.toLowerCase().includes(user.staffId.toLowerCase())) ||
         (staff && t.assignedTo.toLowerCase().includes(staff.name.toLowerCase())))
    );

    const inProgress = myTickets.filter(
      (t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS"
    );
    const resolved = myTickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
    );

    // Match emergencies
    const myEmergencies = allEmergencies.filter(
      (e) =>
        (staff && e.assignedStaffId === staff.staffId) ||
        (user.staffId && e.assignedStaffId === user.staffId) ||
        (e.assignedStaffName && e.assignedStaffName.toLowerCase() === user.name.toLowerCase())
    );

    const activeEmergencies = myEmergencies.filter(
      (e) => e.status !== "RESOLVED" && e.status !== "CANCELLED"
    );

    // Calculate resolution time from actual ticket and emergency timestamps
    let totalMinutes = 0;
    let resolvedCount = 0;

    for (const t of resolved) {
      if (t.createdAt && t.updatedAt) {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.updatedAt).getTime();
        const diff = Math.max(1, Math.round((end - start) / (1000 * 60)));
        if (!isNaN(diff) && diff > 0) {
          totalMinutes += diff;
          resolvedCount++;
        }
      }
    }

    for (const e of myEmergencies) {
      if (e.resolvedAt && e.createdAt) {
        const start = new Date(e.createdAt).getTime();
        const end = new Date(e.resolvedAt).getTime();
        const diff = Math.max(1, Math.round((end - start) / (1000 * 60)));
        if (!isNaN(diff) && diff > 0) {
          totalMinutes += diff;
          resolvedCount++;
        }
      }
    }

    const avgMinutes = resolvedCount > 0 ? Math.round(totalMinutes / resolvedCount) : 48;
    const avgFormatted =
      avgMinutes >= 60
        ? `${(avgMinutes / 60).toFixed(1)} hrs`
        : `${avgMinutes} mins`;

    return NextResponse.json({
      success: true,
      data: {
        personal: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: staff?.phoneNumber || user.phone || "+91 98201 23456",
          staffId: staff?.staffId || user.staffId || "CC-STAFF-001",
          department: user.department || staff?.department || "Facilities",
          jobTitle: staff?.emergencyRole || "Emergency Responder & Maintenance Specialist",
          role: user.role,
        },
        work: {
          department: user.department || staff?.department || "Facilities",
          staffRole: staff?.emergencyRole || "Facilities Emergency Responder",
          assignedResponsibilities: [
            "Emergency triage & immediate on-site response",
            "High & critical priority maintenance dispatch",
            "Campus safety protocol enforcement",
            "Student issue resolution & status updates",
          ],
          isAvailable: staff?.isAvailable ?? true,
          isOnEmergencyDuty: staff?.isOnEmergencyDuty ?? true,
          currentStatus: (staff?.isAvailable ?? true) ? "Available" : "Unavailable",
          emergencyStatus: (staff?.isOnEmergencyDuty ?? true)
            ? "Available for Emergencies"
            : "Off Emergency Duty",
        },
        metrics: {
          myTickets: myTickets.length,
          inProgress: inProgress.length,
          resolved: resolved.length,
          emergencyResponses: myEmergencies.length,
          activeEmergency: activeEmergencies.length,
          hasActiveEmergency: activeEmergencies.length > 0,
          averageResolutionMinutes: avgMinutes,
          averageResolutionFormatted: avgFormatted,
        },
        assignedTickets: myTickets,
        emergencyResponses: myEmergencies,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/staff/me:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load staff profile data." },
      { status: 500 }
    );
  }
}
