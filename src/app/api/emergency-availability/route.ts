import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { 
  getEmergencyStaffList, 
  getEmergencyStaffById, 
  updateStaffAvailability 
} from "@/lib/emergencyDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Only staff or admin can view emergency availability." },
      { status: 403 }
    );
  }

  const staffList = getEmergencyStaffList();
  const currentStaff = getEmergencyStaffById(user.staffId || user.id);

  return NextResponse.json({
    success: true,
    currentStaff: currentStaff || {
      staffId: user.staffId || user.id,
      name: user.name,
      isAvailable: true,
      isOnEmergencyDuty: true,
      activeEmergencyCount: 0,
      maxActiveEmergencies: 2,
    },
    staffList,
  });
}

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Only staff or admin can update emergency availability." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { isAvailable, isOnEmergencyDuty } = body;

    const staffId = user.staffId || user.id;
    const updated = updateStaffAvailability(staffId, {
      ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
      ...(typeof isOnEmergencyDuty === "boolean" ? { isOnEmergencyDuty } : {}),
    });

    return NextResponse.json({
      success: true,
      staff: updated,
      message: updated?.isAvailable
        ? "Available for emergency assignments."
        : "Unavailable for emergency assignments.",
    });
  } catch (err: any) {
    console.error("Error updating emergency availability:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update availability." },
      { status: 500 }
    );
  }
}
