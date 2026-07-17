"use client";

import { TriangleAlert } from "lucide-react";

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
          <TriangleAlert className="w-5 h-5" style={{ color: "#F59E0B" }} />
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
