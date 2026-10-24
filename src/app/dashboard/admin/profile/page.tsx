"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Users,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Flame,
  Radio,
  FileText,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthenticatedNavbar } from "@/components/auth/AuthenticatedNavbar";

interface StaffSummary {
  totalStaff: number;
  availableStaff: number;
  onDutyStaff: number;
  handlingEmergencies: number;
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  totalEmergencies: number;
  openEmergencies: number;
}

interface StaffDirectoryItem {
  staffId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  department: string;
  emergencyRole: string;
  isAvailable: boolean;
  isOnEmergencyDuty: boolean;
  activeEmergencyCount: number;
  totalTickets: number;
  activeTicketsCount: number;
  resolvedTicketsCount: number;
  totalEmergenciesCount: number;
}

interface StaffDetailModalData extends StaffDirectoryItem {
  hasActiveEmergency: boolean;
  avgResolutionMinutes: number;
  avgResolutionFormatted: string;
  assignedTickets: any[];
  handledEmergencies: any[];
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: "TICKET" | "EMERGENCY";
    status: string;
  }>;
}

function AdminProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [staffList, setStaffList] = useState<StaffDirectoryItem[]>([]);
  
  // Modal state
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffDetailModalData | null>(null);
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load admin staff directory:", err);
    } finally {
      setLoading(false);
    }
  }

  async function openStaffModal(staffId: string) {
    setSelectedStaffId(staffId);
    setModalLoading(true);
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch(`/api/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.staff) {
        setSelectedStaffDetail(data.staff);
      }
    } catch (err) {
      console.error("Failed to load staff details:", err);
    } finally {
      setModalLoading(false);
    }
  }

  async function toggleStaffAvailability(staffId: string, currentStatus: boolean, ev: React.MouseEvent) {
    ev.stopPropagation();
    setTogglingStaffId(staffId);
    try {
      const token = localStorage.getItem("cc_auth_token") || "";
      const res = await fetch(`/api/staff/${staffId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStaffList((prev) =>
          prev.map((s) => (s.staffId === staffId ? { ...s, isAvailable: !currentStatus } : s))
        );
        if (selectedStaffDetail && selectedStaffDetail.staffId === staffId) {
          setSelectedStaffDetail((prev) =>
            prev ? { ...prev, isAvailable: !currentStatus } : null
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle staff availability:", err);
    } finally {
      setTogglingStaffId(null);
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
    : "AD";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <AuthenticatedNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading Campus Administration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <AuthenticatedNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/staff")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Operations Center
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Role: <span className="font-bold text-purple-600 dark:text-purple-400">Campus Administrator</span> · ID: <span className="font-bold text-slate-700 dark:text-slate-300">{user?.staffId || "CC-ADM-001"}</span>
          </div>
        </div>

        {/* Hero Card: Admin Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shadow-lg shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {user?.name || "Dr. Anita Roy"}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-purple-400/40">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      👑 Admin Profile
                    </span>
                    {isDemo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-300/40 text-[10px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Demo Account
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-purple-100 mt-1 font-medium">
                    Campus Administrator &amp; Director of Operations
                  </p>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Campus Administration &amp; Operations · ID: {user?.staffId || "CC-ADM-001"}
                  </p>
                </div>
              </div>

              {/* Admin Level Badge */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-bold text-white border border-white/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Full System Privileges
                </span>
                <span className="text-[11px] text-purple-200">
                  Global Oversight &amp; Staff Dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Contact Strip */}
          <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Mail className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Admin Email</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate font-mono">
                  {user?.email || "admin.demo@campusconnect.demo"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Emergency Phone</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {user?.phone || "+91 98200 11223"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Department</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Campus Administration &amp; Operations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campus Overview Metrics (6 cards) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Campus Overview &amp; Live Telemetry
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Total Staff */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Staff
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {summary?.totalStaff ?? staffList.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Campus responders</p>
            </div>

            {/* 2. Available Staff */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Available
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {summary?.availableStaff ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Ready for dispatch</p>
            </div>

            {/* 3. Handling Emergencies */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Handling EMG
                </span>
                <Radio className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {summary?.handlingEmergencies ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Active responder duty</p>
            </div>

            {/* 4. Active Tickets */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Active Tickets
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {summary?.activeTickets ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Open work orders</p>
            </div>

            {/* 5. Resolved Tickets */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Resolved
                </span>
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                {summary?.resolvedTickets ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Closed issues</p>
            </div>

            {/* 6. Open Emergencies */}
            <div
              className={`p-4 rounded-xl border shadow-2xs ${
                (summary?.openEmergencies ?? 0) > 0
                  ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 animate-pulse"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Open EMG
                </span>
                <Flame className="w-4 h-4 text-rose-500" />
              </div>
              <p
                className={`text-2xl font-black mt-2 ${
                  (summary?.openEmergencies ?? 0) > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {summary?.openEmergencies ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {(summary?.openEmergencies ?? 0) > 0 ? "Active incidents" : "All clear"}
              </p>
            </div>
          </div>
        </div>

        {/* Staff Directory Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                👥 Staff Directory
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                {staffList.length} members
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click <strong className="text-slate-700 dark:text-slate-300">[ VIEW STAFF ]</strong> to inspect personal info, workload &amp; activity timeline.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Staff Member</th>
                  <th className="pb-3">Department &amp; Role</th>
                  <th className="pb-3">Employee ID</th>
                  <th className="pb-3">Availability</th>
                  <th className="pb-3">Duty Status</th>
                  <th className="pb-3 text-center">Workload</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {staffList.map((s) => (
                  <tr
                    key={s.staffId}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Name & Avatar */}
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{s.phoneNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3">
                      <p className="text-slate-800 dark:text-slate-200">{s.department}</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {s.emergencyRole}
                      </p>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                      {s.staffId}
                    </td>

                    {/* Availability Toggle */}
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={togglingStaffId === s.staffId}
                        onClick={(ev) => toggleStaffAvailability(s.staffId, s.isAvailable, ev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          s.isAvailable
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                        } disabled:opacity-50`}
                        title="Click to toggle availability"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        {s.isAvailable ? "Available" : "Unavailable"}
                      </button>
                    </td>

                    {/* Emergency Duty */}
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isOnEmergencyDuty
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Radio className="w-2.5 h-2.5" />
                        {s.isOnEmergencyDuty ? "On Duty" : "Off Duty"}
                      </span>
                    </td>

                    {/* Workload */}
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                          title="Assigned Tickets"
                        >
                          📋 {s.totalTickets || 0}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.activeEmergencyCount > 0
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                          }`}
                          title="Active Emergencies"
                        >
                          🚨 {s.activeEmergencyCount || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openStaffModal(s.staffId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                      >
                        <span>VIEW STAFF</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Detail Modal */}
        {selectedStaffId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-6 text-white relative">
                <button
                  onClick={() => {
                    setSelectedStaffId(null);
                    setSelectedStaffDetail(null);
                  }}
                  className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {modalLoading || !selectedStaffDetail ? (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <p className="text-xs text-purple-200">Loading staff information...</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border-2 border-white/30 shrink-0">
                      {selectedStaffDetail.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedStaffDetail.name}
                      </h3>
                      <p className="text-xs text-purple-200 mt-0.5">
                        {selectedStaffDetail.emergencyRole} · {selectedStaffDetail.department}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                          ID: {selectedStaffDetail.staffId}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                            selectedStaffDetail.isAvailable
                              ? "bg-emerald-400/30 text-emerald-200"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {selectedStaffDetail.isAvailable ? "🟢 Available" : "⚪ Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              {selectedStaffDetail && (
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Phone</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedStaffDetail.phoneNumber}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Avg Resolution Time</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {selectedStaffDetail.avgResolutionFormatted} (calculated from live timestamps)
                      </p>
                    </div>
                  </div>

                  {/* Workload Stats */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Current Workload Summary
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Tickets</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                          {selectedStaffDetail.totalTickets}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-amber-500 font-semibold">Active</p>
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                          {selectedStaffDetail.activeTicketsCount}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-emerald-500 font-semibold">Resolved</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {selectedStaffDetail.resolvedTicketsCount}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-rose-500 font-semibold">Emergencies</p>
                        <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                          {selectedStaffDetail.totalEmergenciesCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Recent Activity &amp; Dispatch Timeline
                    </h4>

                    {selectedStaffDetail.timeline.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No activity recorded for this responder.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedStaffDetail.timeline.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                item.type === "EMERGENCY"
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600"
                                  : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600"
                              }`}
                            >
                              {item.type === "EMERGENCY" ? (
                                <Flame className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {item.title}
                                </p>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {new Date(item.timestamp).toLocaleDateString()}{" "}
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedStaffId(null);
                    setSelectedStaffDetail(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminProfileContent />
    </ProtectedRoute>
  );
}
