"use client";

import type { Entry } from "@/lib/api";

interface HourCount {
  hour: string;
  count: number;
}

interface HoursChartProps {
  data: HourCount[];
  loading: boolean;
  closedEntries: Entry[];
}

export function HoursChart({ data, loading, closedEntries }: HoursChartProps) {
  const hourCounts: Record<number, number> = {};
  closedEntries.forEach((e) => {
    const d = e.entryTime.includes("/")
      ? (() => {
          const [datePart, timePart = "00:00:00"] = e.entryTime.split(" ");
          const [day, month, year] = datePart.split("/");
          return new Date(`${year}-${month}-${day}T${timePart}`);
        })()
      : new Date(e.entryTime);
    const h = d.getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });
  const maxHourCount = Math.max(...Object.values(hourCounts), 1);

  const peakHours = data;

  if (loading || closedEntries.length === 0) return null;

  return (
    <div className="rounded-2xl p-6 card-hover bg-page-card backdrop-blur border border-border-default">
      <h3 className="text-sm font-semibold text-white mb-4">Horas pico de ingreso</h3>
      <div className="space-y-2">
        {Array.from({ length: 24 }, (_, h) => ({ h, c: hourCounts[h] ?? 0 }))
          .filter(({ c }) => c > 0)
          .sort((a, b) => b.c - a.c)
          .slice(0, 8)
          .map(({ h, c }) => (
            <div key={h} className="flex items-center gap-3">
              <span className="text-xs w-12 text-right font-mono text-text-muted">
                {String(h).padStart(2, "0")}:00
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-page-input">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c / maxHourCount) * 100}%` }} />
              </div>
              <span className="text-xs w-8 text-text-muted">{c}</span>
            </div>
          ))}
      </div>
      {peakHours.length > 0 && (
        <p className="text-xs mt-3 text-text-dim">
          Hora más activa: <span className="text-primary">{peakHours[0]?.hour}</span> ({peakHours[0]?.count} ingresos)
        </p>
      )}
    </div>
  );
}
