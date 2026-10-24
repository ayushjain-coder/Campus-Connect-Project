import React from "react";
import { Status } from "@/lib/types";
import { Clock, UserCheck, Wrench, CheckCircle2 } from "lucide-react";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-1.5",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const configMap: Record<string, { label: string; className: string; dotClass: string; icon: typeof Clock; animate?: boolean }> = {
    NEW: {
      label: "New",
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
      dotClass: "bg-blue-500",
      icon: Clock,
      animate: true,
    },
    ASSIGNED: {
      label: "Assigned",
      className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20",
      dotClass: "bg-purple-500",
      icon: UserCheck,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      dotClass: "bg-amber-500",
      icon: Wrench,
      animate: true,
    },
    RESOLVED: {
      label: "Resolved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      dotClass: "bg-emerald-500",
      icon: CheckCircle2,
    },
    VERIFIED: {
      label: "Verified",
      className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
      dotClass: "bg-teal-500",
      icon: CheckCircle2,
    },
    CLOSED: {
      label: "Closed",
      className: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
      dotClass: "bg-slate-400",
      icon: CheckCircle2,
    },
  };

  const config = configMap[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    dotClass: "bg-slate-400",
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSize[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
};
