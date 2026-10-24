/**
 * Server-side auth middleware helper for Next.js API routes.
 * Validates the Bearer token from Authorization header and optionally
 * enforces a required role.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateSession, AuthUser, UserRole } from "./auth";

export interface AuthResult {
  ok: true;
  user: AuthUser;
}
export interface AuthError {
  ok: false;
  response: NextResponse;
}

export function requireAuth(
  req: NextRequest,
  requiredRole?: UserRole | UserRole[]
): AuthResult | AuthError {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  const session = validateSession(token);
  if (!session.valid) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: session.error || "Session expired. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (allowed.length > 0 && !allowed.includes(session.user.role)) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: `Access denied. This action requires ${allowed.join(" or ")} privileges.` },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, user: session.user };
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;
  const session = validateSession(token);
  return session.valid ? session.user : null;
}
