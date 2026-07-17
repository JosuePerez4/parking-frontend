import type { Client } from "@/lib/api";

const statusConfig = {
  active:   { label: "Activo",    bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  color: "#34D399", dot: "#10B981" },
  inactive: { label: "Inactivo",  bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)",  color: "var(--text-secondary)", dot: "#64748B" },
  blocked:  { label: "Bloqueado", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)",   color: "#FCA5A5", dot: "#EF4444" },
};

export function StatusBadge({ status }: { status: Client["status"] }) {
  const st = statusConfig[status] ?? statusConfig.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
      {st.label}
    </span>
  );
}
