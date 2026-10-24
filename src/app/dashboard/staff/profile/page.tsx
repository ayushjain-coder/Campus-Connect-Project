"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Building2,
  ArrowLeft,
  User,
  Calendar,
  Briefcase,
  Sparkles,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Radio,
  FileText,
  Activity,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthenticatedNavbar } from "@/components/auth/AuthenticatedNavbar";

interface StaffData {
  personal: {
    id: string;
    name: string;
    email: string;
    phone: string;
    staffId: string;
    department: string;
    jobTitle: string;
    role: string;
  };
  work: {
    department: string;
    staffRole: string;
    assignedResponsibilities: string[];
    isAvailable: boolean;
    isOnEmergencyDuty: boolean;
    currentStatus: string;
    emergencyStatus: string;
  };
  metrics: {
    myTickets: number;
    inProgress: number;
    resolved: number;
    emergencyResponses: number;
    activeEmergency: number;
    hasActiveEmergency: boolean;
    averageResolutionMinutes: number;
    averageResolutionFormatted: string;
  };
  assignedTickets: any[];
  emergencyResponses: any[];
}

function StaffProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffData | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [updatingEmergencyDuty, setUpdatingEmergencyDuty] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, []);

  async function loadStaffData() {
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch("/api/staff/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error loading staff data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    if (!data) return;
    setUpdatingAvailability(true);
    const newStatus = !data.work.isAvailable;
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch("/api/emergency-availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                work: {
                  ...prev.work,
                  isAvailable: newStatus,
                  currentStatus: newStatus ? "Available" : "Unavailable",
                },
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to update availability:", err);
    } finally {
      setUpdatingAvailability(false);
    }
  }

  async function toggleEmergencyDuty() {
    if (!data) return;
    setUpdatingEmergencyDuty(true);
    const newDuty = !data.work.isOnEmergencyDuty;
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch("/api/emergency-availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnEmergencyDuty: newDuty }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                work: {
                  ...prev.work,
                  isOnEmergencyDuty: newDuty,
                  emergencyStatus: newDuty ? "Available for Emergencies" : "Off Emergency Duty",
                },
              }
            : null
        );
      }
    } catch (err) {
      console.error("Failed to update emergency duty:", err);
    } finally {
      setUpdatingEmergencyDuty(false);
    }
  }

  const isDemo =
    user?.email?.toLowerCase().includes(".demo") ||
    user?.email?.toLowerCase().includes("demo@");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] flex flex-col">
        <AuthenticatedNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Staff Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] flex flex-col transition-colors">
      <AuthenticatedNavbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Staff Member Portal</h2>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
            ID: <span className="font-bold text-slate-600 dark:text-slate-300">{data?.personal.staffId}</span>
          </div>
        </div>

        {/* Hero Card: Profile Header */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px"}} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl font-black text-white border-2 border-white/25 shadow-lg shrink-0 select-none">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {data?.personal.name}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white border border-white/20">
                      <ShieldCheck className="w-3 h-3" />
                      Staff Profile
                    </span>
                    {isDemo && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-indigo-100 mt-1 font-medium">
                    {data?.work.staffRole} · {data?.personal.department}
                  </p>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    CampusConnect Operations Staff
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    data?.work.isAvailable
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                      : "bg-white/10 text-white/60 border-white/15"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      data?.work.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-white/40"
                    }`}
                  />
                  {data?.work.currentStatus}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    data?.work.isOnEmergencyDuty
                      ? "bg-rose-500/20 text-rose-200 border-rose-400/30"
                      : "bg-white/10 text-white/60 border-white/15"
                  }`}
                >
                  <Radio
                    className={`w-3 h-3 ${
                      data?.work.isOnEmergencyDuty ? "text-rose-300 animate-pulse" : "text-white/40"
                    }`}
                  />
                  {data?.work.emergencyStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Contact Strip */}
          <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Mail className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Official Email</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate font-mono">
                  {data?.personal.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Direct Phone</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {data?.personal.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Department</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {data?.personal.department}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. My Tickets */}
          <div className="group p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                My Tickets
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
              {data?.metrics.myTickets ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Assigned work orders</p>
          </div>

          {/* 2. In Progress */}
          <div className="group p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-amber-200 dark:hover:border-amber-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                In Progress
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
              {data?.metrics.inProgress ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Under active repair</p>
          </div>

          {/* 3. Resolved */}
          <div className="group p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Resolved
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {data?.metrics.resolved ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Completed tickets</p>
          </div>

          {/* 4. Emergency Responses */}
          <div className="group p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-rose-200 dark:hover:border-rose-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Responses
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 leading-none">
              {data?.metrics.emergencyResponses ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Incidents handled</p>
          </div>

          {/* 5. Active Emergency */}
          <div
            className={`group p-4 rounded-xl border shadow-card transition-all duration-200 hover:-translate-y-0.5 cursor-default ${
              data?.metrics.hasActiveEmergency
                ? "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60"
                : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Active EMG
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                data?.metrics.hasActiveEmergency
                  ? "bg-rose-100 dark:bg-rose-900/60"
                  : "bg-rose-50 dark:bg-rose-950/60"
              }`}>
                <Radio className={`w-3.5 h-3.5 text-rose-500 ${data?.metrics.hasActiveEmergency ? "animate-pulse" : ""}`} />
              </div>
            </div>
            <p
              className={`text-3xl font-black leading-none ${
                data?.metrics.hasActiveEmergency
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            >
              {data?.metrics.activeEmergency ?? 0}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
              {data?.metrics.hasActiveEmergency ? "🚨 Urgent on-call" : "No active incident"}
            </p>
          </div>

          {/* 6. Avg Resolution Time */}
          <div className="group p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Avg. Time
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
              {data?.metrics.averageResolutionFormatted ?? "—"}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">Avg. resolution</p>
          </div>
        </div>

        {/* Work Information & Availability Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Work Information &amp; Responsibilities
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data?.work.department}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Staff Role</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {data?.work.staffRole}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Employee ID</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {data?.personal.staffId}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Assigned Operational Responsibilities
              </p>
              <ul className="space-y-1.5">
                {data?.work.assignedResponsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Live Duty Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Live Status &amp; Duty Controls
              </h2>
            </div>

            {/* Toggle 1: General Availability */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      data?.work.isAvailable ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  Current Availability
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Controls whether new campus maintenance tickets can be auto-assigned to you.
                </p>
              </div>

              <button
                type="button"
                disabled={updatingAvailability}
                onClick={toggleAvailability}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  data?.work.isAvailable ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                } disabled:opacity-50`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    data?.work.isAvailable ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Emergency Duty */}
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      data?.work.isOnEmergencyDuty ? "bg-rose-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  Emergency On-Duty Availability
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows the Gemini emergency dispatch algorithm to route critical incidents to your device.
                </p>
              </div>

              <button
                type="button"
                disabled={updatingEmergencyDuty}
                onClick={toggleEmergencyDuty}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 ${
                  data?.work.isOnEmergencyDuty ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
                } disabled:opacity-50`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    data?.work.isOnEmergencyDuty ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section: My Assigned Tickets */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Assigned Tickets
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {data?.assignedTickets.length ?? 0}
              </span>
            </div>
          </div>

          {(!data?.assignedTickets || data.assignedTickets.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm font-medium text-slate-500">No tickets currently assigned to you.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Ticket ID</th>
                    <th className="pb-3">Summary</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {data.assignedTickets.map((t) => (
                    <tr
                      key={t.ticketId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.ticketId}
                      </td>
                      <td className="py-3 text-slate-900 dark:text-white max-w-xs truncate">
                        {t.summary || t.category}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{t.location}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.severity === "CRITICAL"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                              : t.severity === "HIGH"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {t.severity}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === "RESOLVED" || t.status === "CLOSED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: My Emergency Responses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                My Emergency Responses
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {data?.emergencyResponses.length ?? 0}
              </span>
            </div>
          </div>

          {(!data?.emergencyResponses || data.emergencyResponses.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm font-medium text-slate-500">No emergency incidents on record for your responder ID.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.emergencyResponses.map((e) => (
                <div
                  key={e.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        {e.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {e.type} Emergency
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          e.status === "RESOLVED"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {e.location.building}, {e.location.floor}, {e.location.room} · Student: {e.studentName} ({e.studentPhone})
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{e.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400 font-mono">
                      {new Date(e.createdAt).toLocaleDateString()} {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StaffProfilePage() {
  return (
    <ProtectedRoute requiredRole={["STAFF", "ADMIN"]}>
      <StaffProfileContent />
    </ProtectedRoute>
  );
}
