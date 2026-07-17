"use client";

export interface VehicleStatsData {
  registered: number;
  visitors: number;
  withMembership: number;
}

export function VehicleStats({ stats }: { stats: VehicleStatsData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: "Registrados",     value: stats.registered,     color: "#2563EB" },
        { label: "Visitantes",      value: stats.visitors,       color: "#7C3AED" },
        { label: "Con mensualidad", value: stats.withMembership, color: "#10B981" },
      ].map((s) => (
        <div key={s.label} className="rounded-2xl p-5 bg-page-card backdrop-blur border border-border-default">
          <p className="text-xs font-medium mb-1 text-text-muted">{s.label}</p>
          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
