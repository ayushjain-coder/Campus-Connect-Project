import React from "react";
import { 
  Building2, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  HelpCircle 
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  currentView: "student" | "staff";
  setCurrentView: (view: "student" | "staff") => void;
  onOpenDemoGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenDemoGuide,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Campus<span className="text-indigo-600">Connect</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  Gemini Operations Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI-Powered Campus Maintenance & Dispatch Platform
              </p>
            </div>
          </div>

          {/* Center Navigation Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setCurrentView("student")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === "student"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              onClick={() => setCurrentView("staff")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === "staff"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Staff Dashboard</span>
            </button>
          </div>

          {/* Right actions: Demo Guide, Reset Data */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onOpenDemoGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
              title="10-Step Hackathon Demo Scenario Guide"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Demo Walkthrough</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
