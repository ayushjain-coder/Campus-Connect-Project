import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  getEmergencyById, 
  getEmergencyMessages, 
  addEmergencyMessage 
} from "@/lib/emergencyDb";

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
  const isStudentOwner =
    user.role === "STUDENT" &&
    (incident.studentId === user.id || incident.studentEmail.toLowerCase() === user.email.toLowerCase());

  const isStaffAssigned =
    user.role === "STAFF" &&
    (incident.assignedStaffId === user.staffId || incident.assignedStaffId === user.id);

  const isStaffGeneral = user.role === "STAFF";

  if (!isStudentOwner && !isStaffAssigned && !isStaffGeneral) {
    return NextResponse.json(
      { success: false, error: "Access denied to this emergency room." },
      { status: 403 }
    );
  }

  const messages = getEmergencyMessages(incidentId);
  return NextResponse.json({ success: true, messages });
}

export async function POST(
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
  const isStudentOwner =
    user.role === "STUDENT" &&
    (incident.studentId === user.id || incident.studentEmail.toLowerCase() === user.email.toLowerCase());

  const isStaff = user.role === "STAFF";

  if (!isStudentOwner && !isStaff) {
    return NextResponse.json(
      { success: false, error: "Not authorized to send messages in this emergency." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        { success: false, error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    const newMsg = addEmergencyMessage({
      emergencyId: incidentId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role === "STUDENT" ? "STUDENT" : "STAFF",
      message: String(message).trim(),
    });

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (err: any) {
    console.error("Error sending emergency message:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send message." },
      { status: 500 }
    );
  }
}
