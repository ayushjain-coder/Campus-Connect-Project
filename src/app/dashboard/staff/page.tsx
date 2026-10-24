"use client";

import React, { useState } from "react";
import { StaffDashboard } from "@/components/StaffDashboard";
import { DemoGuideModal } from "@/components/DemoGuideModal";
import { AuthenticatedNavbar } from "@/components/auth/AuthenticatedNavbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { CheckCircle2, ArrowRight } from "lucide-react";

function StaffDashboardContent() {
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [initialSelectedTicketId, setInitialSelectedTicketId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <AuthenticatedNavbar
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
      />

      {/* Demo banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white py-2 px-4 border-b border-indigo-700/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-indigo-200">Admin Operations Center:</span>
            <span className="text-white hidden sm:inline">Real-time Ticket Management, AI Triage &amp; Campus Dispatch</span>
          </div>
          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="inline-flex items-center gap-1 font-semibold text-indigo-200 hover:text-white underline text-xs"
          >
            <span>View Demo Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <main className="flex-1">
        <StaffDashboard
          initialSelectedTicketId={initialSelectedTicketId}
          onClearInitialSelectedTicket={() => setInitialSelectedTicketId(null)}
        />
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">CampusConnect</span>
            <span>— AI Campus Operations Agent</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500">
            Powered by Google Gemini 3.8 Flash · Admin Operations Center
          </p>
        </div>
      </footer>

      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onLoadScenario={() => {}}
        onSwitchToStaff={() => {}}
        onSwitchToStudent={() => {}}
      />
    </div>
  );
}

export default function StaffDashboardPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <StaffDashboardContent />
    </ProtectedRoute>
  );
}
