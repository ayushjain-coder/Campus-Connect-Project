import React, { useState, useEffect, useMemo } from "react";
import { 
  AlertOctagon, 
  X, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  ShieldAlert,
  Flame,
  Zap,
  Activity,
  Droplets,
  LifeBuoy,
  Sparkles,
  PhoneCall,
  Copy,
  Check,
  Send,
  Building,
  Users,
  Star
} from "lucide-react";
import { 
  EmergencyType, 
  EmergencyIncident, 
  EmergencyStatus,
  EmergencyStaffAvailability
} from "@/lib/emergencyTypes";
import { EmergencyChat } from "./EmergencyChat";
import { useEmergencyStream } from "@/lib/useEmergencyStream";
import { useAuth } from "@/lib/authContext";
import { inferEmergencyTypeFromRequirement } from "@/lib/emergencyClassifier";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIncident?: EmergencyIncident | null;
  onIncidentCreated?: (incident: EmergencyIncident) => void;
}

// Preset quick requirement triggers for instant 1-tap reporting
const REQUIREMENT_PRESETS = [
  {
    icon: Zap,
    color: "amber",
    label: "Electrical Hazard",
    text: "Smoke and heavy sparking coming from electrical panel and circuit board. Danger of fire outbreak.",
    type: "Electrical Hazard" as EmergencyType,
    previewStaff: {
      name: "Rajesh Kumar / Ananya Sharma",
      role: "Electrical Maintenance & Facilities Responder",
      dept: "Campus Electrical Operations",
      phone: "+91 98201 23456"
    }
  },
  {
    icon: Activity,
    color: "rose",
    label: "Medical Emergency",
    text: "Student collapsed and is unconscious with breathing difficulty. Urgent medical care required immediately.",
    type: "Medical" as EmergencyType,
    previewStaff: {
      name: "Dr. Priya Sharma",
      role: "Campus Medical Officer",
      dept: "Campus Health & Medical Center",
      phone: "+91 98202 34567"
    }
  },
  {
    icon: Flame,
    color: "red",
    label: "Fire / Smoke",
    text: "Visible flames and thick smoke detected spreading in hallway. Fire extinguisher needed immediately.",
    type: "Fire / Smoke" as EmergencyType,
    previewStaff: {
      name: "Vikram Rao",
      role: "Fire Safety Responder",
      dept: "Campus Fire & Life Safety Unit",
      phone: "+91 98205 67890"
    }
  },
  {
    icon: ShieldAlert,
    color: "indigo",
    label: "Security Threat",
    text: "Physical confrontation and violent intruder trespassing in campus facility. Immediate security intervention needed.",
    type: "Security / Safety" as EmergencyType,
    previewStaff: {
      name: "Amit Verma",
      role: "Chief Security Officer",
      dept: "Campus Security Division",
      phone: "+91 98203 45678"
    }
  },
  {
    icon: Droplets,
    color: "blue",
    label: "Flooding / Pipe Burst",
    text: "Main plumbing supply pipe ruptured. High-pressure water flooding hallway and encroaching on equipment.",
    type: "Flooding" as EmergencyType,
    previewStaff: {
      name: "Rajesh Kumar",
      role: "Facilities Emergency Responder",
      dept: "Campus Facilities & Utilities",
      phone: "+91 98201 23456"
    }
  },
  {
    icon: AlertTriangle,
    color: "yellow",
    label: "Gas Leak / Odor",
    text: "Pungent sulfur gas odor and hissing cylinder line detected. Hazard of asphyxiation and combustion.",
    type: "Gas Leak" as EmergencyType,
    previewStaff: {
      name: "Rajesh Kumar",
      role: "Facilities Emergency Responder",
      dept: "Campus Facilities & Utilities",
      phone: "+91 98201 23456"
    }
  }
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  activeIncident: initialIncident,
  onIncidentCreated,
}) => {
  const { user, token } = useAuth();

  // Mode: "form" (report requirement) vs "active" (live command room)
  const [mode, setMode] = useState<"form" | "active">(initialIncident ? "active" : "form");
  const [currentIncident, setCurrentIncident] = useState<EmergencyIncident | null>(
    initialIncident || null
  );

  // Requirement text written by student
  const [requirementText, setRequirementText] = useState(
    "Smoke is coming from an electrical panel. Around 15 students are nearby."
  );
  const [selectedType, setSelectedType] = useState<EmergencyType>("Electrical Hazard");

  // Location inputs
  const [building, setBuilding] = useState("Engineering Block");
  const [floor, setFloor] = useState("Floor 2");
  const [room, setRoom] = useState("Lab 204");
  const [peopleAffected, setPeopleAffected] = useState<number>(15);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Emergency resolution rating state
  const [emgRating, setEmgRating] = useState<number>(0);
  const [emgHoverRating, setEmgHoverRating] = useState<number>(0);
  const [emgFeedback, setEmgFeedback] = useState("");
  const [isSubmittingEmgRating, setIsSubmittingEmgRating] = useState(false);
  const [emgRatingSuccess, setEmgRatingSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentIncident?.rating) {
      setEmgRating(currentIncident.rating);
      setEmgFeedback(currentIncident.ratingFeedback || "");
    }
  }, [currentIncident?.rating]);

  const handleRateEmergency = async (score: number) => {
    if (!currentIncident) return;
    setIsSubmittingEmgRating(true);
    setEmgRatingSuccess(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/emergencies/${currentIncident.id}/rate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating: score,
          feedback: emgFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit emergency rating.");
      }

      setCurrentIncident(data.incident);
      setEmgRatingSuccess("Thank you! Your emergency response rating has been logged.");
    } catch (err: any) {
      console.error("Emergency rating error:", err);
      alert(err.message || "Failed to submit emergency rating.");
    } finally {
      setIsSubmittingEmgRating(false);
    }
  };

  // Sync initial incident
  useEffect(() => {
    if (initialIncident) {
      setCurrentIncident(initialIncident);
      setMode("active");
    }
  }, [initialIncident]);

  // Real-time event streaming for active emergency status updates
  useEmergencyStream((event) => {
    if (!currentIncident) return;

    if (
      (event.type === "incident:updated" ||
        event.type === "incident:accepted" ||
        event.type === "incident:declined") &&
      event.payload?.incident?.id === currentIncident.id
    ) {
      setCurrentIncident(event.payload.incident);
    }
  }, isOpen && mode === "active");

  // Intelligent real-time classification & staff matching preview as student writes
  const matchedAnalysis = useMemo(() => {
    if (!requirementText.trim()) {
      return {
        type: selectedType,
        staffName: "Rajesh Kumar",
        staffRole: "Facilities Emergency Responder",
        staffDept: "Campus Facilities & Utilities",
        staffPhone: "+91 98201 23456",
        reason: "Default facilities duty officer on standby.",
        matchedKeywords: [] as string[]
      };
    }

    const inferred = inferEmergencyTypeFromRequirement(requirementText);
    const type = inferred.type;

    switch (type) {
      case "Medical":
        return {
          type: "Medical" as EmergencyType,
          staffName: "Dr. Priya Sharma",
          staffRole: "Campus Medical Officer",
          staffDept: "Campus Health & Medical Center",
          staffPhone: "+91 98202 34567",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
      case "Fire / Smoke":
        return {
          type: "Fire / Smoke" as EmergencyType,
          staffName: "Vikram Rao",
          staffRole: "Fire Safety Responder",
          staffDept: "Campus Fire & Life Safety Unit",
          staffPhone: "+91 98205 67890",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
      case "Security / Safety":
        return {
          type: "Security / Safety" as EmergencyType,
          staffName: "Amit Verma",
          staffRole: "Chief Security Officer",
          staffDept: "Campus Security Division",
          staffPhone: "+91 98203 45678",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
      case "Flooding":
        return {
          type: "Flooding" as EmergencyType,
          staffName: "Rajesh Kumar",
          staffRole: "Facilities Emergency Responder",
          staffDept: "Campus Facilities & Utilities",
          staffPhone: "+91 98201 23456",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
      case "Gas Leak":
        return {
          type: "Gas Leak" as EmergencyType,
          staffName: "Rajesh Kumar",
          staffRole: "Facilities Emergency Responder",
          staffDept: "Campus Facilities & Utilities",
          staffPhone: "+91 98201 23456",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
      case "Electrical Hazard":
      default:
        return {
          type: "Electrical Hazard" as EmergencyType,
          staffName: "Rajesh Kumar / Ananya Sharma",
          staffRole: "Electrical & Facilities Response Specialist",
          staffDept: "Campus Electrical Operations",
          staffPhone: "+91 98201 23456",
          reason: inferred.reason,
          matchedKeywords: inferred.matchedKeywords
        };
    }
  }, [requirementText, selectedType]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof REQUIREMENT_PRESETS[0]) => {
    setRequirementText(preset.text);
    setSelectedType(preset.type);
  };

  const handleCopyPhone = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  };

  const handleSubmitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementText.trim()) {
      setErrorMsg("Please write your emergency requirement so we can dispatch the correct staff.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: matchedAnalysis.type || selectedType,
          requirement: requirementText,
          description: requirementText,
          location: {
            building,
            floor,
            room,
          },
          peopleAffected,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch emergency response.");
      }

      setCurrentIncident(data.incident);
      setMode("active");
      if (onIncidentCreated) {
        onIncidentCreated(data.incident);
      }
    } catch (err: any) {
      console.error("Emergency submit error:", err);
      setErrorMsg(err.message || "An error occurred while connecting to emergency services.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = currentIncident?.status || "REPORTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500/60 dark:border-red-600/70 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Emergency Beacon Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
            </span>
            <div>
              <h2 className="text-base font-black tracking-wide uppercase flex items-center gap-2">
                <span>🚨 Emergency Dispatch & Staff Assignment</span>
                <span className="text-[10px] bg-red-900/90 text-red-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-400/40">
                  LIVE SYSTEM
                </span>
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Direct assignment to qualified on-duty specialist with instant phone contact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ────────────────── FORM VIEW: REQUIREMENT & INSTANT ASSIGNMENT ────────────────── */}
          {mode === "form" && (
            <form onSubmit={handleSubmitEmergency} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Requirement Section (Hero) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-500" />
                    <span>State Your Emergency Requirement</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Auto-analyzes task & assigns qualified staff
                  </span>
                </div>

                <textarea
                  required
                  rows={3}
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  placeholder="Describe what is happening in your own words (e.g. Student fainted and needs doctor, or Short circuit sparking with smoke, or Water pipe burst overflowing...)"
                  className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition shadow-sm leading-relaxed"
                />

                {/* Quick Requirement Chips */}
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Or select a common emergency scenario to pre-fill:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REQUIREMENT_PRESETS.map((preset) => {
                      const Icon = preset.icon;
                      const isActive = requirementText === preset.text;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                            isActive
                              ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-bold shadow-xs"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-red-500" />
                          <span className="text-xs truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DYNAMIC REAL-TIME ASSIGNED STAFF PREVIEW CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-100 dark:from-slate-800/80 dark:via-red-950/20 dark:to-slate-800 border-2 border-red-200 dark:border-red-900/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-red-200/60 dark:border-red-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Targeted Specialist Match
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    ● On Emergency Duty
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {matchedAnalysis.staffName}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
                        {matchedAnalysis.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {matchedAnalysis.staffRole} • {matchedAnalysis.staffDept}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{matchedAnalysis.reason}"
                    </p>
                  </div>

                  {/* Highlighted Direct Phone Number */}
                  <div className="w-full sm:w-auto bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 shadow-xs flex items-center justify-between sm:justify-start gap-3">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                        Staff Direct Number
                      </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                        {matchedAnalysis.staffPhone}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Exact Incident Location</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Building
                    </span>
                    <input
                      type="text"
                      required
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. Engineering Block"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Floor
                    </span>
                    <input
                      type="text"
                      required
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. Floor 2"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Room / Area
                    </span>
                    <input
                      type="text"
                      required
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. Lab 204"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* People Affected & Student Verification Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      People Affected:
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(Number(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center font-bold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-bold text-[11px]">{user?.name || "Arjun Mehta"}</p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300">
                        Roll: {(user as any)?.studentId || "CC-STU-001"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-200/70 dark:bg-blue-900/80 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 text-white font-black text-xs shadow-lg shadow-red-500/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Dispatching to {matchedAnalysis.staffName}...</span>
                  ) : (
                    <span>🚨 DISPATCH TO {matchedAnalysis.staffName.split(" ")[0].toUpperCase()}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ────────────────── ACTIVE ROOM: PROMINENT STAFF PHONE & LIVE CHAT ────────────────── */}
          {mode === "active" && currentIncident && (
            <div className="space-y-5">
              {/* Top Status & 4-Stage Visual Lifecycle */}
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-black text-sm text-red-950 dark:text-red-200 uppercase tracking-wider">
                      Incident #{currentIncident.id} Active
                    </span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-red-600 text-white font-extrabold shadow-xs">
                    {currentIncident.status}
                  </span>
                </div>

                {/* 4-Step Visual Lifecycle */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="space-y-1">
                    <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Reported
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                      ["STAFF_NOTIFIED", "ACCEPTED", "RESPONDING", "RESOLVED"].includes(status)
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-600"
                    }`}>
                      ✓
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Staff Notified
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                      ["ACCEPTED", "RESPONDING", "RESOLVED"].includes(status)
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-600 animate-pulse"
                    }`}>
                      {["ACCEPTED", "RESPONDING", "RESOLVED"].includes(status) ? "✓" : "●"}
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {currentIncident.assignedStaffName
                        ? `${currentIncident.assignedStaffName.split(" ")[0]} Accepted`
                        : "Staff Assigned"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                      status === "RESPONDING"
                        ? "bg-red-500 text-white animate-pulse"
                        : status === "RESOLVED"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-600"
                    }`}>
                      {status === "RESOLVED" ? "✓" : "●"}
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Responding
                    </p>
                  </div>
                </div>
              </div>

              {/* ────────────────── PROMINENT ASSIGNED STAFF CONTACT CARD ────────────────── */}
              {currentIncident.assignedStaffName && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <PhoneCall className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                        Specific Responder Assigned for This Task
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Direct Hotline
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{currentIncident.assignedStaffName}</span>
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {currentIncident.assignedStaffRole || "Emergency Team Lead"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Assigned on-duty to handle your requirement immediately.
                      </p>
                    </div>

                    {/* Prominent Number & Call Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      {currentIncident.assignedStaffPhone ? (
                        <>
                          <a
                            href={`tel:${currentIncident.assignedStaffPhone}`}
                            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Call {currentIncident.assignedStaffPhone}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyPhone(currentIncident.assignedStaffPhone || "")}
                            className="px-3 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                            title="Copy phone number"
                          >
                            {copiedPhone ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          Phone dispatch routing...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Incident Details Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[10px]">
                    Requirement Reported:
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Location: {currentIncident.location.building}, {currentIncident.location.floor}, {currentIncident.location.room}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  "{currentIncident.description}"
                </p>
              </div>

              {/* Parallel AI Assessment Card (if ready) */}
              {currentIncident.aiSeverity && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>🤖 Safety AI Assessment:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        currentIncident.aiSeverity === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {currentIncident.aiSeverity}
                      </span>
                    </span>
                  </div>
                  {currentIncident.aiReasoning && (
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      "{currentIncident.aiReasoning}"
                    </p>
                  )}
                </div>
              )}

              {/* Emergency Resolution Rating Option */}
              {status === "RESOLVED" && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/70 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500 text-white">
                      <Star className="w-3.5 h-3.5 fill-white" />
                    </span>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Rate Emergency Responder Care & Promptness
                    </h4>
                  </div>

                  {currentIncident.rating ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (currentIncident.rating || 0)
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {currentIncident.rating}/5 Stars
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        ✓ Rating Logged
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = emgHoverRating ? star <= emgHoverRating : star <= emgRating;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEmgRating(star)}
                                onMouseEnter={() => setEmgHoverRating(star)}
                                onMouseLeave={() => setEmgHoverRating(0)}
                                className="p-1 text-slate-300 hover:scale-125 transition-transform"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    active
                                      ? "fill-amber-400 text-amber-500"
                                      : "text-slate-300 dark:text-slate-700"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {emgRating > 0 ? `${emgRating} of 5 Stars` : "Select stars"}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={emgFeedback}
                        onChange={(e) => setEmgFeedback(e.target.value)}
                        placeholder="Optional feedback on responder promptness..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                      />

                      <div className="flex items-center justify-between">
                        {emgRatingSuccess && (
                          <span className="text-xs font-bold text-emerald-600">{emgRatingSuccess}</span>
                        )}
                        <button
                          type="button"
                          disabled={isSubmittingEmgRating || emgRating === 0}
                          onClick={() => handleRateEmergency(emgRating)}
                          className="ml-auto px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs disabled:opacity-50 transition"
                        >
                          {isSubmittingEmgRating ? "Submitting..." : "Submit Rating"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dedicated Live Emergency Chat */}
              <div className="pt-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Live Emergency Communication Channel
                </h4>
                <EmergencyChat
                  emergencyId={currentIncident.id}
                  currentUser={{
                    id: user?.id || "student_user",
                    name: user?.name || "Arjun Mehta",
                    role: "STUDENT",
                  }}
                  recipientName={currentIncident.assignedStaffName || "On-duty Responder"}
                  recipientRole={currentIncident.assignedStaffRole || "Campus Emergency Staff"}
                  incidentStatus={currentIncident.status}
                  authToken={token}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
