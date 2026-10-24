import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  getEmergencyById, 
  saveEmergency, 
  addEmergencyMessage 
} from "@/lib/emergencyDb";
import { broadcastEmergencyEvent } from "@/lib/emergencyEvents";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const incidentId = params.id;
  const incident = getEmergencyById(incidentId);

  if (!incident) {
    return NextResponse.json(
      { success: false, error: `Emergency ${incidentId} not found.` },
      { status: 404 }
    );
  }

  // Authorization check
  if (user.role === "STUDENT") {
    const isOwner =
      incident.studentId === user.id ||
      incident.studentEmail.toLowerCase() === user.email.toLowerCase();

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Access denied to this emergency incident." },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, incident });
  }

  // Staff authorization
  const isAssigned =
    incident.assignedStaffId === user.id ||
    incident.assignedStaffId === user.staffId;

  if (isAssigned) {
    return NextResponse.json({ success: true, incident });
  }

  // Other staff: mask phone number
  const masked = {
    ...incident,
    studentPhone: incident.studentPhone
      ? `${incident.studentPhone.slice(0, 6)}*****`
      : "Restricted",
  };

  return NextResponse.json({ success: true, incident: masked });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const incidentId = params.id;
  const incident = getEmergencyById(incidentId);

  if (!incident) {
    return NextResponse.json(
      { success: false, error: `Emergency ${incidentId} not found.` },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { status, resolutionNotes } = body;
    const now = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (status) {
      incident.status = status;
      if (status === "RESPONDING" && !incident.respondingAt) {
        incident.respondingAt = now;
        addEmergencyMessage({
          emergencyId: incidentId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role === "STAFF" ? "STAFF" : "SYSTEM",
          message: `Emergency status changed to RESPONDING.`,
        });
      } else if (status === "RESOLVED") {
        incident.resolvedAt = now;
        if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
        addEmergencyMessage({
          emergencyId: incidentId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role === "STAFF" ? "STAFF" : "SYSTEM",
          message: `Emergency resolved at ${timeFormatted}.${resolutionNotes ? ` Note: ${resolutionNotes}` : ""}`,
        });
      }
    }

    saveEmergency(incident);

    broadcastEmergencyEvent({
      type: "incident:updated",
      payload: { incident },
      timestamp: now,
    });

    return NextResponse.json({ success: true, incident });
  } catch (err: any) {
    console.error("Error updating emergency incident:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update emergency." },
      { status: 500 }
    );
  }
}
