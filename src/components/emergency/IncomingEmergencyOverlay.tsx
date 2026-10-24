import React, { useEffect, useState } from "react";
import { 
  AlertOctagon, 
  Phone, 
  MapPin, 
  User, 
  Clock, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  ArrowRight,
  Flame,
  Zap,
  Activity,
  Check
} from "lucide-react";
import { EmergencyIncident } from "@/lib/emergencyTypes";
import { 
  startEmergencyAlarm, 
  stopEmergencyAlarm, 
  isVoiceAlertsEnabled, 
  playAlertChime, 
  speakText 
} from "@/lib/emergencySound";

interface IncomingEmergencyOverlayProps {
  incident: EmergencyIncident | null;
  onAccept: (incident: EmergencyIncident) => Promise<void>;
  onDecline: (incident: EmergencyIncident) => Promise<void>;
}

export const IncomingEmergencyOverlay: React.FC<IncomingEmergencyOverlayProps> = ({
  incident,
  onAccept,
  onDecline,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (incident) {
      const voiceEnabled = isVoiceAlertsEnabled() && !muted;
      const speechText = `Emergency alert. CampusConnect emergency request. Student ${incident.studentName}. ${incident.type} reported at ${incident.location.building}, ${incident.location.room}.`;

      if (voiceEnabled) {
        startEmergencyAlarm(speechText);
      } else {
        playAlertChime();
      }
    } else {
      stopEmergencyAlarm();
    }

    return () => {
      stopEmergencyAlarm();
    };
  }, [incident, muted]);

  if (!incident) return null;

  const handleAcceptClick = async () => {
    setIsAccepting(true);
    stopEmergencyAlarm();
    try {
      speakText("Emergency accepted. Opening emergency response.");
      await onAccept(incident);
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineClick = async () => {
    setIsDeclining(true);
    stopEmergencyAlarm();
    try {
      speakText("Emergency transferred to next available responder.");
      await onDecline(incident);
    } catch (err) {
      console.error("Decline error:", err);
    } finally {
      setIsDeclining(false);
    }
  };

  const toggleMute = () => {
    if (!muted) {
      stopEmergencyAlarm();
      setMuted(true);
    } else {
      setMuted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Flashing Beacon Accent Ring */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-4 border-red-600 dark:border-red-500 overflow-hidden animate-pulse">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide uppercase">
                  INCOMING EMERGENCY
                </h2>
                <span className="text-[10px] bg-red-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-red-400/50">
                  URGENT DISPATCH
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Assigned to your duty queue • Immediate response needed
              </p>
            </div>
          </div>

          {/* Sound Mute / Fallback Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1.5 text-xs font-bold"
            title={muted ? "Unmute alarm" : "Mute alarm"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? "Unmute" : "Mute"}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Student Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Reporting Student
              </span>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {incident.studentName}
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Roll No: {incident.studentRoll || "Verified Student"}
              </p>
            </div>

            {incident.studentPhone && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Student Phone
                </span>
                <a
                  href={`tel:${incident.studentPhone}`}
                  className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{incident.studentPhone}</span>
                </a>
              </div>
            )}
          </div>

          {/* Incident Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block mb-1">
                Emergency Type
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {incident.type}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Location
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {incident.location.building} • {incident.location.room}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                People Affected
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {incident.peopleAffected || 1} people
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Reported At
              </span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {new Date(incident.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Description from Student:
            </span>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              "{incident.description}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isAccepting || isDeclining}
              onClick={handleDeclineClick}
              className="py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isDeclining ? "Transferring..." : "DECLINE / TRANSFER"}
            </button>

            <button
              type="button"
              disabled={isAccepting || isDeclining}
              onClick={handleAcceptClick}
              className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isAccepting ? "Accepting..." : "ACCEPT EMERGENCY"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
