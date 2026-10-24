import React from "react";
import { Category } from "@/lib/types";
import { Droplets, Zap, Sparkles, Wifi } from "lucide-react";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md" | "lg";
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-1.5",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const config = {
    Plumbing: {
      label: "Plumbing",
      className: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
      icon: Droplets,
    },
    Electricity: {
      label: "Electricity",
      className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      icon: Zap,
    },
    Cleanliness: {
      label: "Cleanliness",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      icon: Sparkles,
    },
    "Internet Connectivity": {
      label: "Internet",
      className: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
      icon: Wifi,
    },
  }[category] || {
    label: category,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    icon: Sparkles,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${config.className} ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSize[size]} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};
