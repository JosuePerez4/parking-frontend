"use client";

interface ExpiringAlertProps {
  count: number;
  onViewAll: () => void;
}

export function ExpiringAlert({ count, onViewAll }: ExpiringAlertProps) {
  return (
    <div
      className="mb-6 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.10))",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
        >
          <svg className="w-5 h-5" style={{ color: "#F59E0B" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#FCD34D" }}>
            {count} mensualidad{count !== 1 ? "es" : ""} por vencer
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#D97706" }}>
            Vencen en los próximos 7 días. Renuévalas antes de que expiren.
          </p>
        </div>
      </div>
      <button
        onClick={onViewAll}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.25)",
          color: "#FCD34D",
          border: "1px solid rgba(245, 158, 11, 0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.25)";
        }}
      >
        Ver todas
      </button>
    </div>
  );
}
