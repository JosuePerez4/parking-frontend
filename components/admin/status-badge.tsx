"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  active: {
    label: "Activo",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.35)",
    color: "#34D399",
    dot: "#10B981",
  },
  inactive: {
    label: "Inactivo",
    bg: "rgba(100,116,139,0.15)",
    border: "rgba(100,116,139,0.3)",
    color: "var(--text-secondary)",
    dot: "#64748B",
  },
} as const;

export function StatusBadge({ status }: { status: "active" | "inactive" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <Badge
      className="gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </Badge>
  );
}
