"use client";

/**
 * AuthenticatedNavbar – shown when a user is logged in.
 * Preserves the existing CampusConnect design system with Dark Mode + Demo indicator.
 */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  Crown,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthNavbarProps {
  currentView?: "student" | "staff";
  setCurrentView?: (v: "student" | "staff") => void;
  onResetData?: () => void;
  isResetting?: boolean;
  onOpenDemoGuide?: () => void;
  showViewSwitcher?: boolean;
}

export const AuthenticatedNavbar: React.FC<AuthNavbarProps> = ({
  currentView,
  setCurrentView,
  onResetData,
  isResetting,
  onOpenDemoGuide,
  showViewSwitcher = false,
}) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/auth");
  }

  const isDemoUser =
    user?.email?.toLowerCase().endsWith(".demo") ||
    user?.email?.toLowerCase().includes("demo@campusconnect");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1424]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() =>
              router.push(
                user?.role === "ADMIN"
                  ? "/dashboard/admin/profile"
                  : user?.role === "STAFF"
                  ? "/dashboard/staff/profile"
                  : "/dashboard/student"
              )
            }
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950/70 transition-transform group-hover:scale-105 group-active:scale-95">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[17px] tracking-tight text-slate-900 dark:text-white">
                  Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 hidden sm:inline-flex">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse-soft" />
                  Gemini AI
                </span>

                {/* Demo Mode Badge */}
                {isDemoUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:block leading-none mt-0.5">
                AI-Powered Campus Operations
              </p>
            </div>
          </div>

          {/* Center: view switcher (strictly admin-only, never visible to staff or students) */}
          {showViewSwitcher && user?.role === "ADMIN" && setCurrentView && currentView && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                onClick={() => setCurrentView("student")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  currentView === "student"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                onClick={() => setCurrentView("staff")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  currentView === "staff"
                    ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Operations</span>
              </button>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {onOpenDemoGuide && (
              <button
                onClick={onOpenDemoGuide}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:scale-[1.02] active:scale-[0.98] border border-indigo-200/80 dark:border-indigo-800/60 rounded-lg transition-all duration-150"
                title="Demo Walkthrough Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="hidden lg:inline">Demo Guide</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl transition-all duration-150 border ${
                  menuOpen
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/80"
                }`}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                {/* Avatar */}
                <div
                  className={`w-7.5 h-7.5 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${
                    user?.role === "ADMIN"
                      ? "bg-gradient-to-br from-purple-500 to-purple-700"
                      : user?.role === "STAFF"
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                  }`}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                    {user?.name?.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-tight">
                    {user?.role === "ADMIN" ? "Admin" : user?.role === "STAFF" ? "Staff" : "Student"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#141e30] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/80 py-1.5 z-50 animate-fade-in-up">
                  {/* User info header */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                          user?.role === "ADMIN"
                            ? "bg-gradient-to-br from-purple-500 to-purple-700"
                            : user?.role === "STAFF"
                            ? "bg-gradient-to-br from-indigo-500 to-indigo-700"
                            : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user?.name}
                          </p>
                          {isDemoUser && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold uppercase flex-shrink-0">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {user?.email}
                        </p>
                        <div
                          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            user?.role === "ADMIN"
                              ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50"
                              : user?.role === "STAFF"
                              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                          }`}
                        >
                          {user?.role === "ADMIN" ? (
                            <Crown className="w-2.5 h-2.5" />
                          ) : user?.role === "STAFF" ? (
                            <ShieldCheck className="w-2.5 h-2.5" />
                          ) : (
                            <GraduationCap className="w-2.5 h-2.5" />
                          )}
                          <span>
                            {user?.role === "ADMIN" ? "Admin" : user?.role === "STAFF" ? "Staff" : "Student"}
                          </span>
                          {user?.role === "STUDENT" && user?.studentId && (
                            <span className="text-[9px] opacity-70">· {user.studentId}</span>
                          )}
                          {(user?.role === "STAFF" || user?.role === "ADMIN") && user?.staffId && (
                            <span className="text-[9px] opacity-70">· {user.staffId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-0.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (user?.role === "ADMIN") {
                          router.push("/dashboard/admin/profile");
                        } else if (user?.role === "STAFF") {
                          router.push("/dashboard/staff/profile");
                        } else {
                          router.push("/dashboard/student/profile");
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]"
                    >
                      {user?.role === "ADMIN" ? (
                        <>
                          <Crown className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                          <span>Admin Profile</span>
                        </>
                      ) : user?.role === "STAFF" ? (
                        <>
                          <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                          <span>Staff Profile</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          <span>Student Profile</span>
                        </>
                      )}
                    </button>

                    {/* Operations Center link for Admin only */}
                    {user?.role === "ADMIN" && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/dashboard/staff");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>Operations Center</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/60 mt-0.5 pt-0.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
