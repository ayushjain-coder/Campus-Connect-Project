import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ success: false, error: "No session token." }, { status: 401 });
    }

    const result = validateSession(token);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error("Error in GET /api/auth/session:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
