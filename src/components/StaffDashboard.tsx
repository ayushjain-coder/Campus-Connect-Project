import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Layers, 
  Clock, 
  UserCheck, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Building2, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  UserPlus, 
  RefreshCw, 
  FileText,
  Video 
} from "lucide-react";
import { 
  Ticket, 
  Status, 
  Category, 
  Severity, 
  TicketUpdate, 
  DuplicateMatch 
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { CategoryBadge } from "./CategoryBadge";
import { TicketTimeline } from "./TicketTimeline";
import { useAuth } from "@/lib/authContext";
import { IncomingEmergencyOverlay } from "./emergency/IncomingEmergencyOverlay";
import { EmergencyResponseCenter } from "./emergency/EmergencyResponseCenter";
import { EmergencyIncident } from "@/lib/emergencyTypes";
import { useEmergencyStream } from "@/lib/useEmergencyStream";

const STAFF_MEMBERS_BY_CATEGORY: Record<Category, string[]> = {
  Plumbing: [
    "Rajesh Kumar (Facilities & Hydraulic Maintenance)",
    "Vikram Rao (Senior Plumber)",
  ],
  Electricity: [
    "Ananya Sharma (Campus Electrical & Power Operations)",
    "Deepak Verma (Master Electrician)",
  ],
  Cleanliness: [
    "Sunita Rao (Campus Hygiene & Sanitation Services)",
    "Manoj Patil (Sanitation Team Lead)",
  ],
  "Internet Connectivity": [
    "David Miller (IT & Network Infrastructure)",
    "Pooja Sengupta (WLAN Systems Engineer)",
  ],
};

interface StaffDashboardProps {
  initialSelectedTicketId?: string | null;
  onClearInitialSelectedTicket?: () => void;
  authToken?: string; // Optional auth token for protected API calls
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  initialSelectedTicketId,
  onClearInitialSelectedTicket,
  authToken,
}) => {
  const { user, token } = useAuth();
  const effectiveToken = authToken || token || (typeof window !== "undefined" ? localStorage.getItem("cc_auth_token") : null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    assignedCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    criticalCount: 0,
    highCount: 0,
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Ticket Detail Drawer state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedUpdates, setSelectedUpdates] = useState<TicketUpdate[]>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<DuplicateMatch[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Form states inside Drawer
  const [statusToUpdate, setStatusToUpdate] = useState<Status>("NEW");
  const [assignedToInput, setAssignedToInput] = useState("");
  const [resolutionNotesInput, setResolutionNotesInput] = useState("");
  const [staffNoteInput, setStaffNoteInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Emergency Response State
  const [dashboardTab, setDashboardTab] = useState<"tickets" | "emergency">("tickets");
  const [incomingEmergency, setIncomingEmergency] = useState<EmergencyIncident | null>(null);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyIncident[]>([]);
  const [staffAvailability, setStaffAvailability] = useState({
    staffId: user?.staffId || "CC-STAFF-001",
    userId: user?.id || "usr_demo_staff",
    name: user?.name || "Rajesh Kumar",
    isAvailable: true,
    isOnEmergencyDuty: true,
    activeEmergencyCount: 0,
    maxActiveEmergencies: 2,
  });

  const fetchEmergencyData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

      const [emgRes, availRes] = await Promise.all([
        fetch("/api/emergencies", { headers }),
        fetch("/api/emergency-availability", { headers }),
      ]);

      if (emgRes.ok) {
        const emgData = await emgRes.json();
        if (emgData.incidents) {
          setActiveEmergencies(emgData.incidents);
          const staffIdentifier = user?.staffId || user?.id;
          const pendingIncoming = emgData.incidents.find(
            (i: EmergencyIncident) =>
              i.status === "STAFF_NOTIFIED" &&
              (i.assignedStaffId === staffIdentifier || i.assignedStaffId === "CC-STAFF-001")
          );
          if (pendingIncoming) {
            setIncomingEmergency(pendingIncoming);
          }
        }
      }

      if (availRes.ok) {
        const availData = await availRes.json();
        if (availData.currentStaff) {
          setStaffAvailability(availData.currentStaff);
        }
      }
    } catch (err) {
      console.error("Failed to load emergency staff data:", err);
    }
  };

  // Real-time stream updates for emergency events
  useEmergencyStream((event) => {
    const staffId = user?.staffId || user?.id;

    if (event.type === "incident:created") {
      const inc: EmergencyIncident = event.payload.incident;
      setActiveEmergencies((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);

      const isTarget =
        event.payload.targetStaffId === staffId ||
        event.payload.targetUserId === staffId ||
        inc.assignedStaffId === staffId ||
        (user?.email === "staff.demo@campusconnect.demo" && inc.assignedStaffId === "CC-STAFF-001");

      if (isTarget) {
        setIncomingEmergency(inc);
      }
    } else if (
      event.type === "incident:accepted" ||
      event.type === "incident:updated" ||
      event.type === "incident:declined"
    ) {
      const inc: EmergencyIncident = event.payload.incident;
      setActiveEmergencies((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);

      if (incomingEmergency && incomingEmergency.id === inc.id && inc.status !== "STAFF_NOTIFIED") {
        setIncomingEmergency(null);
      }
    } else if (event.type === "availability:updated") {
      if (event.payload?.staff && (event.payload.staff.staffId === staffId || event.payload.staff.userId === staffId)) {
        setStaffAvailability(event.payload.staff);
      }
    }
  });

  const handleAcceptEmergency = async (inc: EmergencyIncident) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

      const res = await fetch(`/api/emergencies/${inc.id}/accept`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setIncomingEmergency(null);
        setDashboardTab("emergency");
        setActiveEmergencies((prev) => [data.incident, ...prev.filter((i) => i.id !== data.incident.id)]);
      }
    } catch (err) {
      console.error("Accept emergency error:", err);
    }
  };

  const handleDeclineEmergency = async (inc: EmergencyIncident) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

      const res = await fetch(`/api/emergencies/${inc.id}/decline`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setIncomingEmergency(null);
        if (data.incident) {
          setActiveEmergencies((prev) => [data.incident, ...prev.filter((i) => i.id !== data.incident.id)]);
        }
      }
    } catch (err) {
      console.error("Decline emergency error:", err);
    }
  };

  const handleToggleAvailability = async (isAvailable: boolean) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

      const res = await fetch("/api/emergency-availability", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isAvailable }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          setStaffAvailability(data.staff);
        }
      }
    } catch (err) {
      console.error("Toggle availability error:", err);
    }
  };

  const handleUpdateEmergencyStatus = async (
    incidentId: string,
    status: "RESPONDING" | "RESOLVED",
    notes?: string
  ) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

      const res = await fetch(`/api/emergencies/${incidentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status, resolutionNotes: notes }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.incident) {
          setActiveEmergencies((prev) => [data.incident, ...prev.filter((i) => i.id !== data.incident.id)]);
        }
      }
    } catch (err) {
      console.error("Update emergency status error:", err);
    }
  };

  // Fetch tickets and stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/stats"),
      ]);

      const ticketsData = await ticketsRes.json();
      const statsData = await statsRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Failed to load staff dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchEmergencyData();
  }, []);

  // Handle open ticket detail
  const handleOpenTicket = async (ticketId: string) => {
    try {
      setDrawerLoading(true);
      setUpdateError(null);
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`);
      const data = await res.json();

      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket);
        setSelectedUpdates(data.updates || []);
        setSelectedDuplicates(data.duplicateMatches || []);
        setStatusToUpdate(data.ticket.status);
        setAssignedToInput(data.ticket.assignedTo || "");
        setResolutionNotesInput(data.ticket.resolutionNotes || "");
        setStaffNoteInput("");
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // If parent specified initial ticket ID (e.g. from student portal click)
  useEffect(() => {
    if (initialSelectedTicketId) {
      handleOpenTicket(initialSelectedTicketId);
      if (onClearInitialSelectedTicket) {
        onClearInitialSelectedTicket();
      }
    }
  }, [initialSelectedTicketId]);

  // Handle Update Ticket from Drawer
  const handleSaveTicketUpdate = async () => {
    if (!selectedTicket) return;

    if (statusToUpdate === "RESOLVED" && !resolutionNotesInput.trim()) {
      setUpdateError("Please provide resolution notes before marking as RESOLVED.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (effectiveToken) {
        headers["Authorization"] = `Bearer ${effectiveToken}`;
      }
      const res = await fetch(`/api/tickets/${encodeURIComponent(selectedTicket.ticketId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: statusToUpdate,
          assignedTo: assignedToInput,
          resolutionNotes: statusToUpdate === "RESOLVED" ? resolutionNotesInput : selectedTicket.resolutionNotes,
          note: staffNoteInput || (statusToUpdate === "RESOLVED" ? `Resolved: ${resolutionNotesInput}` : undefined),
          updatedBy: user?.name ? `${user.name} (${user.department || "Operations"})` : "Operations Staff",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update ticket.");
      }

      // Refresh selected ticket & timeline
      setSelectedTicket(data.ticket);
      setSelectedUpdates(data.updates || []);
      setStaffNoteInput("");

      // Refresh list in background
      fetchDashboardData();
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update ticket.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Workload helper for equal assignment across staff
  const getStaffActiveLoad = (staffStr: string) => {
    const firstName = staffStr.split(" ")[0].toLowerCase();
    return tickets.filter(
      (t) =>
        (t.status === "ASSIGNED" || t.status === "IN_PROGRESS" || t.status === "NEW") &&
        t.assignedTo &&
        t.assignedTo.toLowerCase().includes(firstName)
    ).length;
  };

  const handleAutoAssignEqually = () => {
    if (!selectedTicket) return;
    const candidates = STAFF_MEMBERS_BY_CATEGORY[selectedTicket.category] || [];
    if (candidates.length === 0) return;
    const sorted = [...candidates].sort((a, b) => getStaffActiveLoad(a) - getStaffActiveLoad(b));
    const chosen = sorted[0];
    setAssignedToInput(chosen);
    if (statusToUpdate === "NEW") {
      setStatusToUpdate("ASSIGNED");
    }
    setStaffNoteInput(`Auto-assigned equally to ${chosen} for balanced team workload.`);
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketId.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.complaintText.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Campus Operations Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              Live Dispatch Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time triage queue for Facilities, Electrical, Sanitation, and IT infrastructure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDashboardTab("emergency")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                dashboardTab === "emergency"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <span>🚨 Emergency Response</span>
              {activeEmergencies.filter(i => ["STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(i.status)).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDashboardTab("tickets")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                dashboardTab === "tickets"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Operations & Tickets
            </button>
          </div>

          <button
            onClick={() => {
              fetchDashboardData();
              fetchEmergencyData();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Urgent Active Emergency Alert Banner if on tickets tab */}
      {dashboardTab === "tickets" && activeEmergencies.some(i => ["STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(i.status)) && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/50 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <div>
              <p className="text-xs font-black uppercase text-red-600 dark:text-red-400">
                🚨 Urgent: Active Emergency Dispatch Assigned to Staff
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                A student has reported an active hazard requiring prompt attention.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDashboardTab("emergency")}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition"
          >
            OPEN EMERGENCY CENTER
          </button>
        </div>
      )}

      {/* Emergency Center vs Ticket Queue View */}
      {dashboardTab === "emergency" ? (
        <EmergencyResponseCenter
          currentStaff={staffAvailability}
          onToggleAvailability={handleToggleAvailability}
          activeIncidents={activeEmergencies}
          onUpdateStatus={handleUpdateEmergencyStatus}
          authToken={effectiveToken}
        />
      ) : (
        <>
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Tickets */}
        <div className="group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark transition-all duration-200 hover:-translate-y-0.5 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">Campus wide</span>
        </div>

        {/* New */}
        <div className="group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              New
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">{stats.newCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">Pending triage &amp; dispatch</span>
        </div>

        {/* Assigned */}
        <div className="group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-purple-200 dark:hover:border-purple-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Assigned
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 leading-none">{stats.assignedCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">Technician dispatched</span>
        </div>

        {/* In Progress */}
        <div className="group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-amber-200 dark:hover:border-amber-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              In Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">{stats.inProgressCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">Under active repair</span>
        </div>

        {/* Resolved */}
        <div className="group p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-200 hover:-translate-y-0.5 cursor-default col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resolved
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.resolvedCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">Completed &amp; verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-card dark:shadow-card-dark space-y-3.5 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto text-xs font-semibold">
            {(["ALL", "NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${
                  statusFilter === st
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "ALL" ? "All Statuses" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, location, staff..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Category:
          </span>
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {(["Plumbing", "Electricity", "Cleanliness", "Internet Connectivity"] as Category[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tickets Table / Board */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-card dark:shadow-card-dark transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Issue Summary</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400 dark:text-slate-500">
                      <FileText className="w-6 h-6" />
              </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">No tickets found</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Try adjusting filters or submit a new report from the student portal.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.ticketId}
                    className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors group cursor-pointer"
                    onClick={() => handleOpenTicket(ticket.ticketId)}
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {ticket.ticketId}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <CategoryBadge category={ticket.category} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {ticket.summary}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[160px] truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ticket.location}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <SeverityBadge severity={ticket.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[160px] truncate">
                      {ticket.assignedTo ? (
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.assignedTo}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicket(ticket.ticketId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-600 rounded-lg shadow-2xs transition-all duration-150"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Management Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg text-indigo-400">
                    #{selectedTicket.ticketId}
                  </span>
                  <StatusBadge status={selectedTicket.status} size="sm" />
                  <SeverityBadge severity={selectedTicket.severity} size="sm" />
                  {selectedTicket.aiProvider === "gemini" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold">
                      ✓ Live Gemini
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold">
                      ⚠ Demo Fallback
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedTicket.summary}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* DUPLICATE DETECTION ALERT BOX (if duplicates exist) */}
              {selectedDuplicates.length > 0 && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Possible duplicate reports found</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Gemini flagged this complaint as potentially duplicating active tickets in the same location. Please cross-examine before dispatching duplicate technicians.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {selectedDuplicates.map((dup) => (
                      <div
                        key={dup.id}
                        className="p-2.5 bg-white border border-amber-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>Matching Ticket #{dup.matchedTicketId}</span>
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {Math.round(dup.similarityScore * 100)}% Match
                          </span>
                  </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{dup.reason}</p>
                </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Complaint & Photo Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Original Student Complaint
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  "{selectedTicket.complaintText}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="font-bold text-slate-400 block text-[10px]">Location</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.location}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block text-[10px]">Submitted By</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.submittedBy}</span>
                  </div>
                </div>

                {/* Photo Viewer */}
                {selectedTicket.photo && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Attached Photograph
                    </span>
                    <a
                      href={selectedTicket.photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative rounded-xl overflow-hidden border border-slate-300 max-h-56 bg-slate-100"
                    >
                      <img
                        src={selectedTicket.photo}
                        alt="Evidence"
                        className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>Click to view full image</span>
                      </div>
                    </a>
                  </div>
                )}

                {/* Video Viewer */}
                {selectedTicket.video && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      Attached Video Evidence
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-black">
                      <video
                        src={selectedTicket.video}
                        controls
                        className="w-full max-h-56 object-contain"
                        preload="metadata"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Triage Details & Reasoning */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Triage Assessment
                  </span>
                  <CategoryBadge category={selectedTicket.category} size="sm" />
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-500">Routing: </span>
                    <span className="font-bold text-indigo-900">{selectedTicket.department}</span>
                  </div>
                  {selectedTicket.severityReason && (
                    <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                      <span className="font-bold block text-amber-950 mb-0.5">
                        Severity Explanation ({selectedTicket.severity}):
                      </span>
                      <p className="leading-relaxed">{selectedTicket.severityReason}</p>
              </div>
                  )}
                  {selectedTicket.aiReasoning && (
                    <p className="text-[11px] text-slate-600 italic">
                      "{selectedTicket.aiReasoning}"
                    </p>
                  )}
                </div>

                {/* Extracted Details */}
                {selectedTicket.extractedDetails && selectedTicket.extractedDetails.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Extracted Operational Details
                    </span>
                    <ul className="text-xs space-y-1">
                      {selectedTicket.extractedDetails.map((det, i) => (
                        <li key={i} className="text-slate-700 flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{det}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Staff Management & Actions Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Staff Operations & Dispatch
                </h4>

                {updateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* Status Transition Control */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ticket Lifecycle Status
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    {(["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"] as Status[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusToUpdate(st)}
                        className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                          statusToUpdate === st
                            ? "bg-white text-indigo-700 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign Technician */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Assign Qualified Technician
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoAssignEqually}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      title="Assign equally to technician with the lowest active workload"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Auto-Assign Equally (Lowest Load)</span>
                    </button>
                  </div>
                  <select
                    value={assignedToInput}
                    onChange={(e) => setAssignedToInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">-- Unassigned --</option>
                    {(STAFF_MEMBERS_BY_CATEGORY[selectedTicket.category] || []).map((staff) => {
                      const load = getStaffActiveLoad(staff);
                      return (
                        <option key={staff} value={staff}>
                          {staff} • {load} active {load === 1 ? "task" : "tasks"}
                        </option>
                      );
                    })}
                    <option value="General Campus Operations Team">General Campus Operations Team</option>
                  </select>
                </div>

                {/* On-site Operational Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Operational Note / Audit Log Entry
                  </label>
                  <input
                    type="text"
                    value={staffNoteInput}
                    onChange={(e) => setStaffNoteInput(e.target.value)}
                    placeholder="e.g. Dispatched technician to 2nd floor with replacement pipe"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400"
                  />
                </div>

                {/* Resolution Notes (Highlighted when setting to RESOLVED) */}
                {statusToUpdate === "RESOLVED" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-emerald-900">
                      Resolution Information <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={resolutionNotesInput}
                      onChange={(e) => setResolutionNotesInput(e.target.value)}
                      placeholder="e.g. Replaced worn-out rubber gasket on washbasin P-trap. Wet vacuumed hallway carpet and tested water pressure."
                      rows={3}
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveTicketUpdate}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUpdating ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Dispatch Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Update Ticket & Notify Student</span>
                    </>
                  )}
                </button>
              </div>

              {/* Complete Progress History Timeline */}
              <div className="pt-2">
                <TicketTimeline
                  updates={selectedUpdates}
                  currentStatus={selectedTicket.status}
                />
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Real-time Incoming Emergency Alert Overlay */}
      <IncomingEmergencyOverlay
        incident={incomingEmergency}
        onAccept={handleAcceptEmergency}
        onDecline={handleDeclineEmergency}
      />
    </div>
  );
};
