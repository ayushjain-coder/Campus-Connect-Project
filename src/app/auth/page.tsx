"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  ShieldCheck,
  Crown,
  ChevronDown,
  Lock,
  Mail,
  User,
  Hash,
  BookOpen,
  Briefcase,
  KeyRound,
  Zap,
  BarChart3,
  Bell,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ThemeToggle } from "@/components/ThemeToggle";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AuthMode = "signin" | "signup" | "forgot";
type RoleChoice = "STUDENT" | "STAFF";
type SignupStep = "role" | "form";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Computer Science",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Facilities",
  "Physics",
  "Mathematics",
  "Chemistry",
  "Humanities & Social Sciences",
  "Business Administration",
  "Architecture",
  "Biotechnology",
  "Campus Facilities Operations",
  "Facilities & Hydraulic Maintenance",
  "Campus Electrical & Power Operations",
  "Campus Hygiene & Sanitation Services",
  "IT & Network Infrastructure",
  "Campus Security & Safety",
  "Administration & Records",
  "Library Services",
  "Student Affairs",
  "Health Center",
];

const YEAR_OPTIONS = [
  "1st Year / 1st Semester",
  "1st Year / 2nd Semester",
  "2nd Year / 3rd Semester",
  "2nd Year / 4th Semester",
  "3rd Year / 5th Semester",
  "3rd Year / 6th Semester",
  "4th Year / 7th Semester",
  "4th Year / 8th Semester",
  "6th Semester",
  "Postgraduate Year 1",
  "Postgraduate Year 2",
  "PhD Scholar",
];

const FEATURES = [
  {
    icon: <AlertCircle className="w-4 h-4" />,
    title: "Report Campus Issues",
    desc: "Submit maintenance requests with AI-powered triage and smart routing.",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: "Gemini AI Operations",
    desc: "Real-time AI analysis, duplicate detection, and priority scoring.",
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    title: "Live Status Tracking",
    desc: "Follow every ticket from submission to resolution with timeline updates.",
  },
  {
    icon: <Bell className="w-4 h-4" />,
    title: "Connected Campus Intelligence",
    desc: "Staff dashboards, dispatch operations, and analytics in one place.",
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: "Too short", color: "bg-red-500", width: "20%" },
    { label: "Weak", color: "bg-red-400", width: "30%" },
    { label: "Fair", color: "bg-amber-500", width: "50%" },
    { label: "Good", color: "bg-yellow-400", width: "70%" },
    { label: "Strong", color: "bg-emerald-500", width: "90%" },
    { label: "Very Strong", color: "bg-emerald-600", width: "100%" },
  ];
  return { score, ...map[Math.min(score, 5)] };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Shared UI primitives ──────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  required?: boolean;
}

function FormInput({ label, icon, error, hint, rightElement, className = "", required, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full ${icon ? "pl-10" : "pl-4"} ${rightElement ? "pr-11" : "pr-4"} py-2.5 text-sm bg-white dark:bg-slate-800 border-2 ${
            error
              ? "border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950/40"
              : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/40"
          } rounded-xl focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${className}`}
        />
        {rightElement && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</span>
        )}
      </div>
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

function FormSelect({ label, icon, error, options, placeholder, className = "", required, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10 w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        <select
          {...props}
          className={`w-full appearance-none ${icon ? "pl-10" : "pl-4"} pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border-2 ${
            error ? "border-red-300 dark:border-red-800" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/40"
          } rounded-xl focus:outline-none transition-all text-slate-900 dark:text-white ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o} className="dark:bg-slate-800 dark:text-white">{o}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { label, color, width } = getPasswordStrength(password);
  const textColor = color.includes("red") ? "text-red-600 dark:text-red-400" : color.includes("amber") || color.includes("yellow") ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>
      <span className={`text-[11px] font-semibold whitespace-nowrap ${textColor}`}>{label}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-sm text-red-700 dark:text-red-300">
      <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200/60 dark:shadow-indigo-950/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

// ─── Main Auth Page ─────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [signupStep, setSignupStep] = useState<SignupStep>("role");
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(
        user.role === "ADMIN"
          ? "/dashboard/admin/profile"
          : user.role === "STAFF"
          ? "/dashboard/staff/profile"
          : "/dashboard/student"
      );
    }
  }, [user, isLoading, router]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setSignupStep("role");
    setSelectedRole(null);
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[45%] flex-col bg-gradient-to-br from-[#0f1629] via-[#1a1f4e] to-[#0d1117] relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 w-64 h-64 bg-indigo-800/20 rounded-full blur-2xl" />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">
                Campus<span className="text-indigo-400">Connect</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-[11px] text-indigo-300 font-medium">
                  Gemini Operations Agent
                </span>
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mt-auto mb-auto pt-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Campus Platform
            </div>
            <h1 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
              One campus.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Every signal.
              </span>
              <br />
              One connected
              <br />
              community.
            </h1>
            <p className="mt-5 text-slate-300 text-sm leading-relaxed max-w-sm">
              CampusConnect unifies students and staff through AI-powered maintenance
              reporting, intelligent dispatch, and real-time campus operations.
            </p>

            {/* Features */}
            <ul className="mt-8 space-y-4">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-xs text-slate-500">
              Powered by Google Gemini 3.8 Flash · Hackathon MVP 2026
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen overflow-y-auto relative">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[440px] py-6">
          {/* Mobile brand */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </span>
          </div>

          {/* Auth card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/8 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
            {/* Mode tabs — only for signin/signup */}
            {mode !== "forgot" && (
              <div className="flex bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800">
                {(["signin", "signup"] as AuthMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                      mode === m
                        ? "text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {m === "signin" ? "Sign In" : "Create Account"}
                    {mode === m && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 sm:p-8">
              {mode === "signin" && (
                <SignInForm onForgotPassword={() => setMode("forgot")} />
              )}
              {mode === "signup" && signupStep === "role" && (
                <RoleSelector
                  selected={selectedRole}
                  onSelect={(r) => {
                    setSelectedRole(r);
                    setSignupStep("form");
                  }}
                />
              )}
              {mode === "signup" && signupStep === "form" && selectedRole && (
                <SignUpForm
                  role={selectedRole}
                  onBack={() => {
                    setSignupStep("role");
                    setSelectedRole(null);
                  }}
                  onSuccess={() => switchMode("signin")}
                />
              )}
              {mode === "forgot" && (
                <ForgotPasswordForm onBack={() => switchMode("signin")} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sign In Form with Hackathon Demo Section ───────────────────────────────────

function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoActionLoading, setDemoActionLoading] = useState<"STUDENT" | "STAFF" | "ADMIN" | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof fieldErrors = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    setFieldErrors(e);
    return !Object.keys(e).length;
  }

  async function executeSignIn(targetEmail: string, targetPassword: string, isDemo?: "STUDENT" | "STAFF" | "ADMIN") {
    if (isDemo) {
      setDemoActionLoading(isDemo);
    } else {
      setLoading(true);
    }
    setError("");

    const result = await signIn(targetEmail.trim(), targetPassword, remember);
    if (!result.success) {
      setError(result.error || "Sign in failed. Please try again.");
      setLoading(false);
      setDemoActionLoading(null);
      return;
    }

    // Determine role from session endpoint
    const tok = localStorage.getItem("cc_auth_token") || "";
    try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role === "ADMIN") {
          router.push("/dashboard/admin/profile");
        } else if (data.user.role === "STAFF") {
          router.push("/dashboard/staff/profile");
        } else {
          router.push("/dashboard/student");
        }
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    await executeSignIn(email, password);
  }

  // Demo 1-Click Login Handler (calls the normal signIn endpoint)
  function handleDemoClick(role: "STUDENT" | "STAFF" | "ADMIN") {
    if (role === "STUDENT") {
      const demoEmail = "student.demo@campusconnect.demo";
      const demoPw = "Demo@12345";
      setEmail(demoEmail);
      setPassword(demoPw);
      setFieldErrors({});
      executeSignIn(demoEmail, demoPw, "STUDENT");
    } else if (role === "STAFF") {
      const demoEmail = "staff.demo@campusconnect.demo";
      const demoPw = "Demo@12345";
      setEmail(demoEmail);
      setPassword(demoPw);
      setFieldErrors({});
      executeSignIn(demoEmail, demoPw, "STAFF");
    } else {
      const demoEmail = "admin.demo@campusconnect.demo";
      const demoPw = "Demo@12345";
      setEmail(demoEmail);
      setPassword(demoPw);
      setFieldErrors({});
      executeSignIn(demoEmail, demoPw, "ADMIN");
    }
  }

  return (
    <div className="space-y-6">
      {/* Hackathon Demo 1-Click Section */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hackathon Demo Access</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/20">
            1-Click Login
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Demo Student Button */}
          <button
            type="button"
            disabled={loading || demoActionLoading !== null}
            onClick={() => handleDemoClick("STUDENT")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 text-left transition-all group disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Student
              </span>
              {demoActionLoading === "STUDENT" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate w-full font-mono">
              student.demo@...
            </p>
            <p className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80 font-medium mt-0.5 truncate w-full">
              Arjun Mehta · CS
            </p>
          </button>

          {/* Demo Staff Button */}
          <button
            type="button"
            disabled={loading || demoActionLoading !== null}
            onClick={() => handleDemoClick("STAFF")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 text-left transition-all group disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Staff
              </span>
              {demoActionLoading === "STAFF" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate w-full font-mono">
              staff.demo@...
            </p>
            <p className="text-[9px] text-indigo-700/80 dark:text-indigo-400/80 font-medium mt-0.5 truncate w-full">
              Rajesh Kumar · Fac.
            </p>
          </button>

          {/* Demo Admin Button */}
          <button
            type="button"
            disabled={loading || demoActionLoading !== null}
            onClick={() => handleDemoClick("ADMIN")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-purple-200 dark:border-purple-800/70 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 text-left transition-all group disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Admin
              </span>
              {demoActionLoading === "ADMIN" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate w-full font-mono">
              admin.demo@...
            </p>
            <p className="text-[9px] text-purple-700/80 dark:text-purple-400/80 font-medium mt-0.5 truncate w-full">
              Dr. Anita Roy · Admin
            </p>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Or sign in with email
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <FormInput
          label="Email address"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          icon={<Mail className="w-4 h-4" />}
          error={fieldErrors.email}
          placeholder="you@campus.edu"
        />

        <FormInput
          label="Password"
          required
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
          icon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password}
          placeholder="Your password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors select-none">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors whitespace-nowrap focus-visible:underline"
          >
            Forgot password?
          </button>
        </div>

        <SubmitButton
          loading={loading && demoActionLoading === null}
          label="Sign In"
          loadingLabel="Signing in…"
        />
      </form>
    </div>
  );
}

// ─── Role Selector ──────────────────────────────────────────────────────────────

function RoleSelector({
  selected,
  onSelect,
}: {
  selected: RoleChoice | null;
  onSelect: (r: RoleChoice) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create your account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Who are you? We'll tailor your experience.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            {
              role: "STUDENT" as RoleChoice,
              icon: <GraduationCap className="w-7 h-7" />,
              title: "Student",
              desc: "Report issues, track tickets, get status updates",
              accentBg: "bg-emerald-600",
              accentBgSm: "bg-emerald-50 dark:bg-emerald-950/40",
              accentBorder: "border-emerald-500 dark:border-emerald-600",
              accentText: "text-emerald-700 dark:text-emerald-300",
            },
            {
              role: "STAFF" as RoleChoice,
              icon: <ShieldCheck className="w-7 h-7" />,
              title: "Staff",
              desc: "Manage tickets, assign teams, dispatch operations",
              accentBg: "bg-indigo-600",
              accentBgSm: "bg-indigo-50 dark:bg-indigo-950/40",
              accentBorder: "border-indigo-500 dark:border-indigo-600",
              accentText: "text-indigo-700 dark:text-indigo-300",
            },
          ] as const
        ).map(({ role, icon, title, desc, accentBg, accentBgSm, accentBorder, accentText }) => {
          const isSelected = selected === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onSelect(role)}
              className={`relative flex flex-col items-center text-center gap-3 p-5 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                isSelected
                  ? `${accentBorder} ${accentBgSm} shadow-sm`
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              {isSelected && (
                <span
                  className={`absolute top-2.5 right-2.5 w-5 h-5 ${accentBg} rounded-full flex items-center justify-center`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? `${accentBg} text-white shadow-lg`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {icon}
              </div>
              <div>
                <p className={`text-sm font-bold ${isSelected ? accentText : "text-slate-800 dark:text-slate-200"}`}>
                  {title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <p>
          <span className="font-semibold text-slate-700 dark:text-slate-200">Students:</span> Use your college/university email to sign up and start reporting.
        </p>
        <p>
          <span className="font-semibold text-slate-700 dark:text-slate-200">Staff:</span> Requires a valid Employee ID and a verification code from your campus administrator.
        </p>
      </div>
    </div>
  );
}

// ─── Sign Up Form ───────────────────────────────────────────────────────────────

function SignUpForm({
  role,
  onBack,
  onSuccess,
}: {
  role: RoleChoice;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else {
      if (password.length < 8) e.password = "Must be at least 8 characters.";
      else if (!/[A-Z]/.test(password)) e.password = "Must include an uppercase letter.";
      else if (!/[0-9]/.test(password)) e.password = "Must include a number.";
    }
    if (!confirmPw) e.confirmPw = "Please confirm your password.";
    else if (password !== confirmPw) e.confirmPw = "Passwords do not match.";
    if (!department) e.department = "Please select your department.";
    if (role === "STUDENT" && !studentId.trim()) e.studentId = "Student/Roll Number is required.";
    if (role === "STAFF") {
      if (!staffId.trim()) e.staffId = "Employee/Staff ID is required.";
      if (!staffCode.trim()) e.staffCode = "Verification code is required.";
    }
    setFieldErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword: confirmPw,
          role,
          department,
          studentId: studentId.trim() || undefined,
          year: year || undefined,
          staffId: staffId.trim() || undefined,
          staffCode: staffCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Sign up failed.");
        return;
      }
      setSuccess(true);
      setTimeout(onSuccess, 2200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const clearErr = (key: string) =>
    setFieldErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  const pwStrength = getPasswordStrength(password);
  const isStudent = role === "STUDENT";

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
            isStudent ? "bg-emerald-100 dark:bg-emerald-950/60" : "bg-indigo-100 dark:bg-indigo-950/60"
          }`}
        >
          <CheckCircle2
            className={`w-9 h-9 ${isStudent ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}
          />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account created!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Welcome to CampusConnect, {name.split(" ")[0]}.<br />
            Redirecting you to sign in…
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Back to role selection"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isStudent ? (
              <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            )}
            {isStudent ? "Student Account" : "Staff Account"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fill in your details to create your account.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Name */}
      <FormInput
        label="Full Name"
        required
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          clearErr("name");
        }}
        icon={<User className="w-4 h-4" />}
        error={fieldErrors.name}
        placeholder="Your full name"
      />

      {/* Email */}
      <FormInput
        label={isStudent ? "College / University Email" : "Official Staff Email"}
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          clearErr("email");
        }}
        icon={<Mail className="w-4 h-4" />}
        error={fieldErrors.email}
        placeholder={isStudent ? "you@college.edu" : "staff@campus.edu"}
      />

      {/* Password */}
      <div>
        <FormInput
          label="Password"
          required
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearErr("password");
          }}
          icon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password}
          placeholder="Min 8 chars · 1 uppercase · 1 number"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
              aria-label={showPw ? "Hide" : "Show"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <PasswordStrengthBar password={password} />
      </div>

      {/* Confirm Password */}
      <FormInput
        label="Confirm Password"
        required
        type={showConfirm ? "text" : "password"}
        autoComplete="new-password"
        value={confirmPw}
        onChange={(e) => {
          setConfirmPw(e.target.value);
          clearErr("confirmPw");
        }}
        icon={<Lock className="w-4 h-4" />}
        error={fieldErrors.confirmPw}
        hint={confirmPw && !fieldErrors.confirmPw && confirmPw === password ? "✓ Passwords match" : undefined}
        placeholder="Repeat your password"
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
            aria-label={showConfirm ? "Hide" : "Show"}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {/* Department */}
      <FormSelect
        label="Department"
        required
        icon={<Building2 className="w-4 h-4" />}
        value={department}
        onChange={(e) => {
          setDepartment(e.target.value);
          clearErr("department");
        }}
        error={fieldErrors.department}
        options={DEPARTMENTS}
        placeholder="— Select department —"
      />

      {/* Student fields */}
      {isStudent && (
        <>
          <FormInput
            label="Student / Roll Number"
            required
            type="text"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              clearErr("studentId");
            }}
            icon={<Hash className="w-4 h-4" />}
            error={fieldErrors.studentId}
            placeholder="e.g. CC-STU-001"
          />
          <FormSelect
            label="Year / Semester"
            icon={<BookOpen className="w-4 h-4" />}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEAR_OPTIONS}
            placeholder="— Select year / semester —"
          />
        </>
      )}

      {/* Staff fields */}
      {!isStudent && (
        <>
          <FormInput
            label="Employee / Staff ID"
            required
            type="text"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              clearErr("staffId");
            }}
            icon={<Briefcase className="w-4 h-4" />}
            error={fieldErrors.staffId}
            placeholder="e.g. CC-STAFF-001"
          />
          <FormInput
            label="Staff Verification Code"
            required
            type={showCode ? "text" : "password"}
            value={staffCode}
            onChange={(e) => {
              setStaffCode(e.target.value);
              clearErr("staffCode");
            }}
            icon={<KeyRound className="w-4 h-4" />}
            error={fieldErrors.staffCode}
            hint="Obtain this from your campus administrator. Validated server-side."
            placeholder="Enter the verification code"
            rightElement={
              <button
                type="button"
                onClick={() => setShowCode((s) => !s)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded"
                aria-label={showCode ? "Hide" : "Show"}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </>
      )}

      <div className="pt-1">
        <SubmitButton
          loading={loading}
          label={`Create ${isStudent ? "Student" : "Staff"} Account`}
          loadingLabel="Creating account…"
        />
      </div>
    </form>
  );
}

// ─── Forgot Password Form ───────────────────────────────────────────────────────

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleEmailStep(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email.trim() || !isValidEmail(email)) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed. Please try again.");
        return;
      }
      if (data.accountFound && data.devToken) {
        setResetToken(data.devToken);
        setInfoMsg(`Found account for ${data.name}. Your reset token is pre-filled below.`);
      } else {
        setInfoMsg("If an account exists for that email, a reset link has been generated.");
      }
      setStep("reset");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetStep(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!resetToken.trim()) e.token = "Reset token is required.";
    if (!newPw) e.password = "New password is required.";
    else if (newPw.length < 8) e.password = "Must be at least 8 characters.";
    else if (!/[A-Z]/.test(newPw)) e.password = "Must include an uppercase letter.";
    else if (!/[0-9]/.test(newPw)) e.password = "Must include a number.";
    if (!confirmPw) e.confirmPw = "Please confirm your new password.";
    else if (newPw !== confirmPw) e.confirmPw = "Passwords do not match.";
    setFieldErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPw,
          confirmPassword: confirmPw,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Password reset!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Your password has been updated. You can now sign in with your new credentials.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950"
        >
          Back to Sign In <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {step === "email" ? "Reset password" : "Set new password"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {step === "email"
              ? "Enter your account email to get a reset token."
              : "Enter the reset token and choose a new password."}
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {step === "email" ? (
        <form onSubmit={handleEmailStep} noValidate className="space-y-4">
          <FormInput
            label="Email address"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors({});
            }}
            icon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            placeholder="you@campus.edu"
          />
          <SubmitButton loading={loading} label="Get Reset Token" loadingLabel="Sending…" />
        </form>
      ) : (
        <form onSubmit={handleResetStep} noValidate className="space-y-4">
          {infoMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-px text-emerald-500" />
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
          )}

          <FormInput
            label="Reset Token"
            required
            type="text"
            value={resetToken}
            onChange={(e) => {
              setResetToken(e.target.value);
              setFieldErrors((p) => ({ ...p, token: "" }));
            }}
            icon={<KeyRound className="w-4 h-4" />}
            error={fieldErrors.token}
            hint="In production, this arrives via email. In dev/demo mode, it's pre-filled above."
            placeholder="Paste your reset token"
          />

          <div>
            <FormInput
              label="New Password"
              required
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => {
                setNewPw(e.target.value);
                setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              icon={<Lock className="w-4 h-4" />}
              error={fieldErrors.password}
              placeholder="Min 8 chars · 1 uppercase · 1 number"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded"
                  aria-label={showPw ? "Hide" : "Show"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <PasswordStrengthBar password={newPw} />
          </div>

          <FormInput
            label="Confirm New Password"
            required
            type="password"
            value={confirmPw}
            onChange={(e) => {
              setConfirmPw(e.target.value);
              setFieldErrors((p) => ({ ...p, confirmPw: "" }));
            }}
            icon={<Lock className="w-4 h-4" />}
            error={fieldErrors.confirmPw}
            hint={confirmPw && !fieldErrors.confirmPw && confirmPw === newPw ? "✓ Passwords match" : undefined}
            placeholder="Repeat your new password"
          />

          <SubmitButton loading={loading} label="Reset Password" loadingLabel="Resetting…" />
        </form>
      )}
    </div>
  );
}
