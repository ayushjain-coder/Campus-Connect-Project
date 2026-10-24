import { NextRequest, NextResponse } from "next/server";
import { signUp, validateEmail, validatePassword } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      department,
      studentId,
      year,
      staffId,
      staffCode,
    } = body;

    // ── Basic field validation ──
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required." }, { status: 400 });
    }
    if (!email?.trim() || !validateEmail(email)) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match." }, { status: 400 });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return NextResponse.json({ success: false, error: pwCheck.error }, { status: 400 });
    }

    if (!["STUDENT", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role selected." }, { status: 400 });
    }
    if (!department?.trim()) {
      return NextResponse.json({ success: false, error: "Department is required." }, { status: 400 });
    }

    // ── Role-specific validation ──
    if (role === "STUDENT" && !studentId?.trim()) {
      return NextResponse.json({ success: false, error: "Student/Roll Number is required." }, { status: 400 });
    }
    if (role === "STAFF" && !staffId?.trim()) {
      return NextResponse.json({ success: false, error: "Employee/Staff ID is required." }, { status: 400 });
    }
    // Staff code validated server-side inside signUp()

    const result = signUp({
      name,
      email,
      password,
      role: role as UserRole,
      department,
      studentId,
      year,
      staffId,
      staffCode, // validated inside auth.ts; never returned to client
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (err: any) {
    console.error("Error in POST /api/auth/signup:", err);
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
