import React from "react";
import { Severity } from "@/lib/types";
import { AlertCircle, AlertTriangle, Info, Flame } from "lucide-react";

interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md" | "lg";
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
    md: "px-2.5 py-0.5 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1 text-sm font-semibold gap-1.5",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const config = {
    LOW: {
      label: "Low",
      className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
      iconClass: "",
      icon: Info,
      pulse: false,
    },
    MEDIUM: {
      label: "Medium",
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
      iconClass: "",
      icon: AlertCircle,
      pulse: false,
    },
    HIGH: {
      label: "High",
      className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
      iconClass: "",
      icon: AlertTriangle,
      pulse: false,
    },
    CRITICAL: {
      label: "Critical",
      className: "bg-red-50 text-red-700 border-red-300 dark:bg-red-500/12 dark:text-red-300 dark:border-red-500/25",
      iconClass: "text-red-600 dark:text-red-400",
      icon: Flame,
      pulse: true,
    },
  }[severity] || {
    label: severity,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    iconClass: "",
    icon: Info,
    pulse: false,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${config.className} ${sizeClasses[size]}`}
    >
      <Icon
        className={`${iconSize[size]} shrink-0 ${config.iconClass} ${config.pulse ? "animate-pulse" : ""}`}
      />
      <span>{config.label}</span>
    </span>
  );
};
