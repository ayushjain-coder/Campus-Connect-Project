import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { previewEmergencyResponder } from "@/lib/emergencyRouter";
import { EmergencyType } from "@/lib/emergencyTypes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { requirement, type } = body;

    const preview = previewEmergencyResponder(type as EmergencyType, requirement);

    return NextResponse.json({
      success: true,
      classifiedType: preview.type,
      matchedKeywords: preview.matchedKeywords,
      reason: preview.reason,
      responder: preview.responder
        ? {
            staffId: preview.responder.staffId,
            name: preview.responder.name,
            phoneNumber: preview.responder.phoneNumber,
            department: preview.responder.department,
            emergencyRole: preview.responder.emergencyRole,
            isAvailable: preview.responder.isAvailable,
            isOnEmergencyDuty: preview.responder.isOnEmergencyDuty,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
