"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            You don't have permission to view this page. Please ensure you're signed in
            with the correct account type.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {user ? (
            <button
              onClick={() =>
                router.push(
                  user.role === "ADMIN"
                    ? "/dashboard/admin/profile"
                    : user.role === "STAFF"
                    ? "/dashboard/staff/profile"
                    : "/dashboard/student"
                )
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Dashboard
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950"
            >
              <Home className="w-4 h-4" />
              Go to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
