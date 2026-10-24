import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  getEmergencyById, 
  saveEmergency, 
  addEmergencyMessage,
  updateStaffAvailability,
  getEmergencyStaffById 
} from "@/lib/emergencyDb";
import { broadcastEmergencyEvent } from "@/lib/emergencyEvents";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user || user.role !== "STAFF") {
    return NextResponse.json(
      { success: false, error: "Only staff members can accept emergencies." },
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

  const staffDetails = getEmergencyStaffById(user.staffId || user.id);

  incident.assignedStaffId = user.staffId || user.id;
  incident.assignedStaffName = user.name;
  incident.assignedStaffPhone = staffDetails?.phoneNumber || (user as any).phone || "+91 98201 23456";
  incident.assignedStaffRole = staffDetails?.emergencyRole || user.department || "Emergency Responder";
  incident.status = "ACCEPTED";
  incident.acceptedAt = now;

  saveEmergency(incident);

  // Update staff availability load
  updateStaffAvailability(incident.assignedStaffId, {
    lastAssignedEmergency: now,
  });

  // System audit message
  addEmergencyMessage({
    emergencyId: incidentId,
    senderId: "system",
    senderName: "CampusConnect Emergency System",
    senderRole: "SYSTEM",
    message: `${user.name} accepted the emergency at ${timeFormatted}.`,
  });

  // Broadcast acceptance event
  broadcastEmergencyEvent({
    type: "incident:accepted",
    payload: { incident, staffName: user.name, staffId: incident.assignedStaffId },
    timestamp: now,
  });

  return NextResponse.json({
    success: true,
    incident,
    message: `${user.name} has accepted the emergency request.`,
  });
}
