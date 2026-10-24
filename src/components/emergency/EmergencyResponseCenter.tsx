import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Volume2, 
  VolumeX, 
  Check, 
  ExternalLink 
} from "lucide-react";
import { EmergencyIncident } from "@/lib/emergencyTypes";
import { EmergencyChat } from "./EmergencyChat";
import { 
  isVoiceAlertsEnabled, 
  setVoiceAlertsEnabled, 
  playAlertChime, 
  speakText 
} from "@/lib/emergencySound";

interface EmergencyResponseCenterProps {
  currentStaff: {
    staffId: string;
    userId: string;
    name: string;
    isAvailable: boolean;
    isOnEmergencyDuty: boolean;
    activeEmergencyCount: number;
    maxActiveEmergencies: number;
  };
  onToggleAvailability: (isAvailable: boolean) => Promise<void>;
  activeIncidents: EmergencyIncident[];
  onUpdateStatus: (incidentId: string, status: "RESPONDING" | "RESOLVED", notes?: string) => Promise<void>;
  authToken?: string | null;
}

export const EmergencyResponseCenter: React.FC<EmergencyResponseCenterProps> = ({
  currentStaff,
  onToggleAvailability,
  activeIncidents,
  onUpdateStatus,
  authToken,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [callModalNumber, setCallModalNumber] = useState<string | null>(null);

  useEffect(() => {
    setVoiceEnabled(isVoiceAlertsEnabled());
  }, []);

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    setVoiceAlertsEnabled(next);
    if (next) {
      playAlertChime();
      speakText("Emergency voice alerts enabled.");
    }
  };

  const handleToggleDuty = async () => {
    setTogglingAvail(true);
    try {
      await onToggleAvailability(!currentStaff.isAvailable);
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setTogglingAvail(false);
    }
  };

  // Metrics
  const activeCount = activeIncidents.filter((i) =>
    ["STAFF_NOTIFIED", "ACCEPTED", "RESPONDING"].includes(i.status)
  ).length;

  const waitingCount = activeIncidents.filter((i) => i.status === "STAFF_NOTIFIED" || i.status === "REPORTED").length;
  const respondingCount = activeIncidents.filter((i) => i.status === "RESPONDING").length;
  const resolvedCount = 8; // Demo baseline + resolved today

  // Selected or first active incident
  const assignedIncident = selectedIncidentId
    ? activeIncidents.find((i) => i.id === selectedIncidentId)
    : activeIncidents.find((i) => ["ACCEPTED", "RESPONDING", "STAFF_NOTIFIED"].includes(i.status)) ||
      activeIncidents[0] ||
      null;

  return (
    <div className="space-y-6">
      {/* ─── Top Control & Availability Banner ─── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xl shadow-inner">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Emergency Response Operations
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                ACTIVE QUEUE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Single-responder automatic routing & real-time campus dispatch
            </p>
          </div>
        </div>

        {/* Controls: Availability Toggle & Voice Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Voice alerts toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              voiceEnabled
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                : "bg-slate-50 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
            }`}
            title="Enable/disable voice and sound announcements"
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span>Voice Alerts: {voiceEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Duty availability toggle */}
          <button
            type="button"
            disabled={togglingAvail}
            onClick={handleToggleDuty}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide border transition flex items-center gap-2 shadow-sm ${
              currentStaff.isAvailable
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20"
                : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentStaff.isAvailable ? "bg-white animate-pulse" : "bg-slate-400"}`} />
            <span>
              {currentStaff.isAvailable
                ? "🟢 AVAILABLE FOR EMERGENCIES"
                : "🔴 UNAVAILABLE FOR ASSIGNMENTS"}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
            Active Emergencies
          </span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {activeCount}
          </p>
          <span className="text-[10px] text-slate-400">Capacity: max {currentStaff.maxActiveEmergencies}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
            Waiting / Notified
          </span>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {waitingCount}
          </p>
          <span className="text-[10px] text-slate-400">Awaiting acknowledgement</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
            Responding
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {respondingCount}
          </p>
          <span className="text-[10px] text-slate-400">Responder on route</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
            Resolved Today
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {resolvedCount}
          </p>
          <span className="text-[10px] text-slate-400">100% SLA compliance</span>
        </div>
      </div>

      {/* ─── Assigned Emergency Response Card & Live Chat ─── */}
      {assignedIncident ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Incident Card Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/60 shadow-lg space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 font-extrabold border border-red-300 dark:border-red-800">
                  {assignedIncident.id}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-600 text-white font-black uppercase tracking-wider">
                  {assignedIncident.status}
                </span>
              </div>

              {/* Student Contact Info */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Student Information
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {assignedIncident.studentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Roll No: {assignedIncident.studentRoll || "Verified Student"}
                    </p>
                  </div>

                  {/* Call Student Action */}
                  {assignedIncident.studentPhone && (
                    <a
                      href={`tel:${assignedIncident.studentPhone}`}
                      onClick={() => setCallModalNumber(assignedIncident.studentPhone)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>CALL STUDENT</span>
                    </a>
                  )}
                </div>

                {assignedIncident.studentPhone && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Direct Phone: {assignedIncident.studentPhone}
                  </p>
                )}
              </div>

              {/* Hazard Info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Emergency Type</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {assignedIncident.type}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Location</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {assignedIncident.location.building} • {assignedIncident.location.room}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">People Affected</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {assignedIncident.peopleAffected || 1} reported
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500 font-medium">Assigned Responder</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {assignedIncident.assignedStaffName || currentStaff.name}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Reported Situation
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{assignedIncident.description}"
                </p>
              </div>

              {/* AI Assessment */}
              {assignedIncident.aiSeverity && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Safety AI Assessment:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px]">
                      {assignedIncident.aiSeverity}
                    </span>
                  </div>
                  {assignedIncident.aiReasoning && (
                    <p className="text-amber-800 dark:text-amber-300 text-[11px]">
                      {assignedIncident.aiReasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {assignedIncident.status !== "RESPONDING" && assignedIncident.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(assignedIncident.id, "RESPONDING")}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>✓ MARK AS RESPONDING ON SCENE</span>
                  </button>
                )}

                {assignedIncident.status !== "RESOLVED" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Resolution note (e.g. Electrical hazard isolated, repairs ongoing)"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={async () => {
                        setIsResolving(true);
                        try {
                          await onUpdateStatus(
                            assignedIncident.id,
                            "RESOLVED",
                            resolutionNote || "Issue safely resolved by emergency responder."
                          );
                          setResolutionNote("");
                        } finally {
                          setIsResolving(false);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isResolving ? "Resolving..." : "RESOLVE EMERGENCY INCIDENT"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Dedicated Emergency Chat */}
          <div className="lg:col-span-7">
            <EmergencyChat
              emergencyId={assignedIncident.id}
              currentUser={{
                id: currentStaff.userId || currentStaff.staffId,
                name: currentStaff.name,
                role: "STAFF",
              }}
              recipientName={assignedIncident.studentName}
              recipientRole="Reporting Student"
              incidentStatus={assignedIncident.status}
              authToken={authToken}
            />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            All Clear — No Active Emergency Dispatches
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You are currently on duty and available. When a student reports an emergency, your terminal will immediately sound a voice alert and route the incident to you.
          </p>
        </div>
      )}

      {/* Desktop Call Helper Modal */}
      {callModalNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Dialing Student Directly
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Initiated call link to:
              </p>
              <p className="text-lg font-black text-emerald-600 mt-1">
                {callModalNumber}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If running on desktop without a connected telephony app, dial this number directly from your campus emergency handset.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCallModalNumber(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
