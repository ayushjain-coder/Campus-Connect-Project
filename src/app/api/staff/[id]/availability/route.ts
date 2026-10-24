import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { updateStaffAvailability, getEmergencyStaffList } from "@/lib/emergencyDb";

export const dynamic = "force-dynamic";

export async function PATCH(
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
      { success: false, error: "Access denied. Students cannot update staff availability." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const targetId = id === "me" ? (user.staffId || user.id) : id;

  // Strict IDOR Protection: Staff can only update their own availability
  if (user.role === "STAFF") {
    const isSelf =
      targetId === user.staffId ||
      targetId === user.id ||
      targetId.toLowerCase() === (user.name || "").toLowerCase();

    if (!isSelf) {
      return NextResponse.json(
        { success: false, error: "Access denied. You can only update your own availability." },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json();
    const { isAvailable, isOnEmergencyDuty } = body;

    // Find real staff ID in emergency list if user gave a name or userId
    const staffList = getEmergencyStaffList();
    const matched = staffList.find(
      (s) =>
        s.staffId.toLowerCase() === targetId.toLowerCase() ||
        s.userId.toLowerCase() === targetId.toLowerCase() ||
        s.name.toLowerCase() === targetId.toLowerCase()
    );

    const effectiveId = matched ? matched.staffId : targetId;

    const updated = updateStaffAvailability(effectiveId, {
      ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
      ...(typeof isOnEmergencyDuty === "boolean" ? { isOnEmergencyDuty } : {}),
    });

    return NextResponse.json({
      success: true,
      staff: updated,
      message: `Updated availability for ${updated?.name || effectiveId}.`,
    });
  } catch (error: any) {
    console.error("Error updating staff availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update availability." },
      { status: 500 }
    );
  }
}
