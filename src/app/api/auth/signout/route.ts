import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (token) signOut(token);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /api/auth/signout:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
