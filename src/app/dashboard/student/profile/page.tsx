"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Hash,
  Building2,
  BookOpen,
  ArrowLeft,
  User,
  Calendar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthenticatedNavbar } from "@/components/auth/AuthenticatedNavbar";

function ProfileField({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StudentProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  const isDemo = user?.email?.toLowerCase().includes(".demo") || user?.email?.toLowerCase().includes("demo@");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <AuthenticatedNavbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <button
          onClick={() => router.push("/dashboard/student")}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 text-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border border-white/30">
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Student
                    </div>
                    {user?.year && (
                      <span className="text-xs text-emerald-100">{user.year}</span>
                    )}
                  </div>
                </div>
              </div>

              {isDemo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  DEMO MODE
                </span>
              )}
            </div>
          </div>

          {/* Info fields */}
          <div className="p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Account Information</h2>

            <ProfileField label="Full Name" value={user?.name} icon={<User className="w-4 h-4" />} />
            <ProfileField label="Email Address" value={user?.email} icon={<Mail className="w-4 h-4" />} />
            <ProfileField label="Student / Roll Number" value={user?.studentId} icon={<Hash className="w-4 h-4" />} />
            <ProfileField label="Department" value={user?.department} icon={<Building2 className="w-4 h-4" />} />
            <ProfileField label="Year / Semester" value={user?.year} icon={<BookOpen className="w-4 h-4" />} />
            <ProfileField
              label="Account Role"
              value="Student"
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <ProfileField
              label="Member Since"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                year: "numeric", month: "long", day: "numeric"
              }) : undefined}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <ProtectedRoute requiredRole="STUDENT">
      <StudentProfileContent />
    </ProtectedRoute>
  );
}
