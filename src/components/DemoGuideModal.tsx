import React from "react";
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  PlayCircle, 
  Copy, 
  Check 
} from "lucide-react";

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenario: () => void;
  onSwitchToStaff?: () => void;
  onSwitchToStudent?: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadScenario,
  onSwitchToStaff,
  onSwitchToStudent,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "Submit an Incomplete Complaint",
      desc: "Student writes a vague complaint (e.g., 'water leaking') with ambiguous location ('Library') and clicks 'Analyze with Gemini'.",
      actionLabel: "Load Demo Complaint",
      onAction: () => {
        if (onSwitchToStudent) onSwitchToStudent();
        onLoadScenario();
        onClose();
      },
    },
    {
      num: 2,
      title: "Gemini Identifies Missing Information",
      desc: "Gemini detects that specific room/floor and leak severity are missing, and generates 2 targeted follow-up questions.",
    },
    {
      num: 3,
      title: "Student Provides Missing Information",
      desc: "Student selects the quick-reply chip: '2nd Floor Restroom' and 'Continuous steady drip into basin', then clicks 'Refine Ticket'.",
    },
    {
      num: 4,
      title: "AI Generates Structured Ticket Preview",
      desc: "Gemini classifies into 'Plumbing', routes to 'Facilities & Hydraulic Maintenance', assigns 'HIGH' severity, and formats key operational details.",
    },
    {
      num: 5,
      title: "System Detects Possible Duplicate",
      desc: "AI scans active campus tickets and flags: 'Possible duplicate reports found' matching existing ticket #CC-2026-1002 in the Library.",
    },
    {
      num: 6,
      title: "Staff Reviews the Ticket",
      desc: "Student submits the ticket. Operations staff review the incoming ticket in the staff operations triage queue.",
    },
    {
      num: 7,
      title: "Staff Assigns the Ticket",
      desc: "Staff opens the ticket drawer and assigns it to 'Rajesh Kumar (Facilities & Hydraulic Maintenance)'.",
    },
    {
      num: 8,
      title: "Staff Changes Status to In Progress",
      desc: "Staff updates status to 'IN_PROGRESS' and adds an on-site operational note.",
    },
    {
      num: 9,
      title: "Staff Resolves the Ticket",
      desc: "Technician enters resolution notes ('Replaced worn-out P-trap rubber seal and cleaned tile floor') and changes status to 'RESOLVED'.",
    },
    {
      num: 10,
      title: "Student Sees Complete Progress History",
      desc: "Student opens 'Track My Ticket' and views the interactive chronological timeline from submission through resolution with all staff updates.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Official Hackathon Scenario
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              10-Step End-to-End Demo Script
            </h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-md">
              Follow these exact steps to demonstrate Gemini's reasoning, missing-info clarification, duplicate triage, and staff operations dispatch.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3.5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-start gap-3.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {step.title}
                  </h4>
                  {step.actionLabel && (
                    <button
                      onClick={step.onAction}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      {step.actionLabel}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (onSwitchToStudent) onSwitchToStudent();
              onLoadScenario();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Step 1 (Auto-Fill Demo Complaint)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
