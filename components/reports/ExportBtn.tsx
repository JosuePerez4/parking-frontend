import { Download, type LucideIcon } from "lucide-react";

export function ExportBtn({ label, onClick, loading, icon: Icon = Download }: { label: string; onClick: () => void; loading: boolean; icon?: LucideIcon }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all duration-200"
      style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34D399" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.12)"; }}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
