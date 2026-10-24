import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  getEmergencyById, 
  saveEmergency, 
  addEmergencyMessage,
  updateStaffAvailability 
} from "@/lib/emergencyDb";
import { selectEmergencyResponder } from "@/lib/emergencyRouter";
import { broadcastEmergencyEvent } from "@/lib/emergencyEvents";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user || user.role !== "STAFF") {
    return NextResponse.json(
      { success: false, error: "Only staff members can decline/transfer emergencies." },
      { status: 403 }
    );
  }

  const incidentId = params.id;
  const incident = getEmergencyById(incidentId);

  if (!incident) {
    return NextResponse.json(
      { success: false, error: `Emergency ${incidentId} not found.` },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();
  const timeFormatted = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const decliningStaffId = user.staffId || user.id;
  const decliningStaffName = user.name;

  // Decrease load for declining staff
  updateStaffAvailability(decliningStaffId, {
    // Decrease active load
    activeEmergencyCount: 0,
  });

  // System audit message
  addEmergencyMessage({
    emergencyId: incidentId,
    senderId: "system",
    senderName: "CampusConnect Emergency System",
    senderRole: "SYSTEM",
    message: `${decliningStaffName} transferred the incident at ${timeFormatted}. Finding next available responder...`,
  });

  // Re-route to next available responder (excluding declining staff)
  const nextResponder = selectEmergencyResponder(incident.type, [
    decliningStaffId,
    user.id,
  ]);

  if (nextResponder) {
    incident.assignedStaffId = nextResponder.staffId;
    incident.assignedStaffName = nextResponder.name;
    incident.assignedStaffPhone = nextResponder.phoneNumber;
    incident.assignedStaffRole = nextResponder.emergencyRole;
    incident.status = "STAFF_NOTIFIED";

    addEmergencyMessage({
      emergencyId: incidentId,
      senderId: "system",
      senderName: "CampusConnect Emergency System",
      senderRole: "SYSTEM",
      message: `${nextResponder.name} (${nextResponder.emergencyRole}) has been assigned.`,
    });
  } else {
    incident.assignedStaffId = undefined;
    incident.assignedStaffName = undefined;
    incident.status = "REPORTED";

    addEmergencyMessage({
      emergencyId: incidentId,
      senderId: "system",
      senderName: "CampusConnect Emergency System",
      senderRole: "SYSTEM",
      message: `Alert: No other responders available. Emergency escalated to safety desk.`,
    });
  }

  saveEmergency(incident);

  // Broadcast decline / transfer
  broadcastEmergencyEvent({
    type: "incident:declined",
    payload: { 
      incident, 
      oldStaffId: decliningStaffId, 
      newStaffId: nextResponder?.staffId 
    },
    timestamp: now,
  });

  return NextResponse.json({
    success: true,
    incident,
    reassignedTo: nextResponder ? nextResponder.name : null,
    message: nextResponder
      ? `Emergency reassigned to ${nextResponder.name}.`
      : "Emergency escalated to safety desk.",
  });
}
