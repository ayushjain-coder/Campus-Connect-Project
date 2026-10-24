import { NextRequest, NextResponse } from "next/server";
import { resetPassword, validatePassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: "Reset token is required." }, { status: 400 });
    }
    if (!newPassword) {
      return NextResponse.json({ success: false, error: "New password is required." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match." }, { status: 400 });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.ok) {
      return NextResponse.json({ success: false, error: pwCheck.error }, { status: 400 });
    }

    const result = resetPassword(token, newPassword);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch (err: any) {
    console.error("Error in POST /api/auth/reset-password:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
