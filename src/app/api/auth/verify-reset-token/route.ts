import { NextRequest, NextResponse } from "next/server";
import { validateResetToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided." }, { status: 400 });
    }

    const result = validateResetToken(token);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in GET /api/auth/verify-reset-token:", err);
    return NextResponse.json({ valid: false, error: "Server error." }, { status: 500 });
  }
}
