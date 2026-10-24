import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/authMiddleware";
import { rateEmergency } from "@/lib/emergencyDb";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emergencyId = params.id;
    const body = await req.json();
    const { rating, feedback } = body;

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const updated = rateEmergency(emergencyId, ratingNum, feedback ? String(feedback).trim() : undefined);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Emergency ${emergencyId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      incident: updated,
      message: `Thank you for rating! Your ${ratingNum}-star feedback has been recorded.`
    });
  } catch (error: any) {
    console.error("Error rating emergency:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit rating." },
      { status: 500 }
    );
  }
}
