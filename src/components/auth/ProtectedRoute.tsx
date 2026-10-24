"use client";

/**
 * ProtectedRoute – wraps any page that requires authentication.
 * Handles: loading states, redirect to /auth, role enforcement.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/authContext";
import { Building2, Loader2, ShieldAlert, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading skeleton while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show nothing (redirect happening)
  if (!isAuthenticated || !user) {
    return null;
  }

  const allowedRoles = requiredRole
    ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole])
    : null;

  // Role check — wrong role trying to access a restricted page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const formattedRoles = allowedRoles
      .map((r) => (r === "STAFF" ? "Staff" : r === "ADMIN" ? "Admin" : "Student"))
      .join(" or ");

    const destination =
      user.role === "ADMIN"
        ? "/dashboard/admin/profile"
        : user.role === "STAFF"
        ? "/dashboard/staff/profile"
        : "/dashboard/student";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            You don't have permission to access this page. This area is restricted to{" "}
            <strong className="text-slate-800 dark:text-slate-200">{formattedRoles}</strong> only.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push(destination)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
