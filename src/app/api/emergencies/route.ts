import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  EmergencyIncident, 
  EmergencyType,
  EmergencyLocation 
} from "@/lib/emergencyTypes";
import { 
  getAllEmergencies, 
  saveEmergency, 
  generateIncidentId,
  addEmergencyMessage 
} from "@/lib/emergencyDb";
import { selectEmergencyResponder, inferEmergencyTypeFromRequirement } from "@/lib/emergencyRouter";
import { broadcastEmergencyEvent } from "@/lib/emergencyEvents";
import { runEmergencyAiAssessment } from "@/lib/emergencyAi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const all = getAllEmergencies();

  if (user.role === "STUDENT") {
    const studentIncidents = all.filter(
      (i) => i.studentId === user.id || i.studentEmail.toLowerCase() === user.email.toLowerCase()
    );
    return NextResponse.json({ success: true, incidents: studentIncidents });
  }

  // Staff & Admin: return all incidents, but mask student phone if not admin or assigned responder
  const sanitized = all.map((i) => {
    const isAssigned = user.role === "ADMIN" || i.assignedStaffId === user.id || i.assignedStaffId === user.staffId;
    if (isAssigned) {
      return i;
    }
    return {
      ...i,
      studentPhone: i.studentPhone ? `${i.studentPhone.slice(0, 6)}*****` : "Restricted",
    };
  });

  return NextResponse.json({ success: true, incidents: sanitized });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      type, 
      location, 
      description, 
      requirement,
      photo, 
      peopleAffected 
    } = body;

    const emergencyDesc = String(requirement || description || "").trim();

    if (!emergencyDesc) {
      return NextResponse.json(
        { success: false, error: "Missing required emergency requirement description." },
        { status: 400 }
      );
    }

    if (!location || !location.building) {
      return NextResponse.json(
        { success: false, error: "Missing required emergency location details." },
        { status: 400 }
      );
    }

    // Determine type: use provided type, or infer from requirement if not provided or "Other"
    let finalType: EmergencyType = type as EmergencyType;
    if (!finalType || finalType === "Other") {
      const inferred = inferEmergencyTypeFromRequirement(emergencyDesc);
      finalType = inferred.type;
    }

    const loc: EmergencyLocation = {
      building: String(location.building || "").trim(),
      floor: String(location.floor || "Ground").trim(),
      room: String(location.room || "").trim(),
    };

    const incidentId = generateIncidentId();
    const now = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    // Automatically route to ONE available designated responder for this specific emergency requirement
    const responder = selectEmergencyResponder(finalType);

    const incident: EmergencyIncident = {
      id: incidentId,
      studentId: user.id,
      studentName: user.name,
      studentPhone: (user as any).phone || "+91 98765 43210",
      studentEmail: user.email,
      studentRoll: (user as any).studentId || "CC-STU-001",
      type: finalType,
      location: loc,
      description: emergencyDesc,
      photo: photo || undefined,
      peopleAffected: peopleAffected ? Number(peopleAffected) : 1,
      assignedStaffId: responder ? responder.staffId : undefined,
      assignedStaffName: responder ? responder.name : undefined,
      assignedStaffPhone: responder ? responder.phoneNumber : undefined,
      assignedStaffRole: responder ? responder.emergencyRole : undefined,
      status: responder ? "STAFF_NOTIFIED" : "REPORTED",
      createdAt: now,
    };

    // Save incident to DB
    saveEmergency(incident);

    // Create initial audit trail system messages
    addEmergencyMessage({
      emergencyId: incidentId,
      senderId: "system",
      senderName: "CampusConnect Emergency System",
      senderRole: "SYSTEM",
      message: `Emergency reported at ${timeFormatted}.`,
    });

    if (responder) {
      addEmergencyMessage({
        emergencyId: incidentId,
        senderId: "system",
        senderName: "CampusConnect Emergency System",
        senderRole: "SYSTEM",
        message: `${responder.name} (${responder.emergencyRole}) was notified.`,
      });
    } else {
      addEmergencyMessage({
        emergencyId: incidentId,
        senderId: "system",
        senderName: "CampusConnect Emergency System",
        senderRole: "SYSTEM",
        message: `Alert: No responder immediately available. Emergency escalated to safety desk.`,
      });
    }

    // Immediately emit real-time event to connected staff & student streams
    broadcastEmergencyEvent({
      type: "incident:created",
      payload: { 
        incident, 
        targetStaffId: responder?.staffId,
        targetUserId: responder?.userId
      },
      timestamp: now,
    });

    // Run AI assessment in parallel background (NON-BLOCKING)
    void runEmergencyAiAssessment(incidentId);

    return NextResponse.json(
      { 
        success: true, 
        incident, 
        message: responder 
          ? `Emergency request sent to ${responder.name}.`
          : "Emergency request submitted and escalated." 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating emergency incident:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create emergency request." },
      { status: 500 }
    );
  }
}
