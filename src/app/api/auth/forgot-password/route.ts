import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset, validateEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email?.trim() || !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const result = requestPasswordReset(email);

    if (!result.success && result.error === "NO_ACCOUNT") {
      // Return success to prevent user enumeration — but include flag for dev demo
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been generated.",
        // In dev mode we expose the token so the hackathon demo works without email infra
        devToken: process.env.NODE_ENV !== "production" ? null : undefined,
        accountFound: false,
      });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link generated.",
      // Dev-only: expose the reset token so the demo works without email infrastructure
      devToken: process.env.NODE_ENV !== "production" ? result.token : undefined,
      name: result.name,
      accountFound: true,
    });
  } catch (err: any) {
    console.error("Error in POST /api/auth/forgot-password:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
