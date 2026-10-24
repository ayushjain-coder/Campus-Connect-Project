import React from "react";
import { TicketUpdate, Status } from "@/lib/types";
import { 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Wrench, 
  Sparkles, 
  MessageSquare,
  Check
} from "lucide-react";

interface TicketTimelineProps {
  updates: TicketUpdate[];
  currentStatus: Status;
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({ updates, currentStatus }) => {
  const getIcon = (status: Status, note: string) => {
    if (note.toLowerCase().includes("ai") || note.toLowerCase().includes("gemini")) {
      return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
    }
    switch (status) {
      case "NEW":
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case "ASSIGNED":
        return <UserCheck className="w-3.5 h-3.5 text-purple-500" />;
      case "IN_PROGRESS":
        return <Wrench className="w-3.5 h-3.5 text-amber-500" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = (status: Status) => {
    switch (status) {
      case "NEW":
        return "border-blue-500/30 bg-blue-50 dark:bg-blue-950/40";
      case "ASSIGNED":
        return "border-purple-500/30 bg-purple-50 dark:bg-purple-950/40";
      case "IN_PROGRESS":
        return "border-amber-500/30 bg-amber-50 dark:bg-amber-950/40";
      case "RESOLVED":
        return "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40";
      default:
        return "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800";
    }
  };

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

  // High-level milestone progress bar
  const stages: Status[] = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  const stageLabels = ["Reported & Triaged", "Assigned", "In Progress", "Resolved"];
  const currentIndex = stages.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      {/* Milestone progress bar */}
      <div className="p-5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-card dark:shadow-card-dark transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Lifecycle Progress
          </h4>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {stageLabels[Math.max(0, currentIndex)] || currentStatus}
          </span>
        </div>
        
        <div className="relative flex items-center justify-between px-2 pt-1 pb-2">
          {/* Background track */}
          <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-0 rounded-full" />
          
          {/* Active progress fill */}
          <div
            className="absolute left-6 top-5 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 z-0 rounded-full"
            style={{
              width: currentIndex <= 0 ? "0%" : `calc(${((Math.max(0, currentIndex) / (stages.length - 1)) * 100)}% - 24px)`,
            }}
          />

          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-500/15 dark:ring-indigo-500/25 scale-105"
                      : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : isCompleted
                      ? "text-slate-700 dark:text-slate-300 font-semibold"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {stageLabels[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Chronological History */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Activity &amp; Audit Log ({updates.length})
        </h4>

        {updates.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
            No updates recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {updates.map((item, index) => {
              const isLast = index === updates.length - 1;
              return (
                <div key={item.id || index} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shadow-2xs ${getBorderColor(
                      item.status
                    )}`}
                  >
                    {getIcon(item.status, item.note)}
                  </div>

                  {/* Content card */}
                  <div
                    className={`p-3.5 rounded-xl border text-sm transition-all duration-150 ${
                      isLast
                        ? "bg-white dark:bg-[#111827] border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/10"
                        : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {item.updatedBy}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-[13px]">
                      {item.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
