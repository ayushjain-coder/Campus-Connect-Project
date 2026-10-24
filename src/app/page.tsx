"use client";

/**
 * Root page: redirects authenticated users to their dashboard,
 * unauthenticated users to /auth.
 * This preserves all existing CampusConnect functionality by keeping
 * StudentPortal & StaffDashboard at their new protected dashboard routes.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Building2, Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth");
    } else if (user.role === "ADMIN") {
      router.replace("/dashboard/admin/profile");
    } else if (user.role === "STAFF") {
      router.replace("/dashboard/staff/profile");
    } else {
      router.replace("/dashboard/student");
    }
  }, [user, isLoading, router]);

  // Show branded loading while determining where to redirect
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-950">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
          </span>
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      </div>
    </div>
  );
}
