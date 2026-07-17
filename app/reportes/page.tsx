"use client";

import { useEffect, useState, useCallback } from "react";
import { getClients, getVehicles, getMemberships, getEntries, getCajaReport, type Entry, type Membership, type CajaReport } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { DatePicker } from "@/components/ui/date-picker";
import { Download, RefreshCw, FileText, Calendar } from "lucide-react";

// ── Date helpers ────────────────────────────────────────────────────────────
function parseColombianDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  if (dateStr.includes("/")) {
    const [datePart, timePart = "00:00:00"] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/");
    return new Date(`${year}-${month}-${day}T${timePart}`);
  }
  return new Date(dateStr);
}

function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function isoToDisplay(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);
}

// ── Excel export ────────────────────────────────────────────────────────────
async function exportXlsx(sheets: { name: string; rows: Record<string, unknown>[] }[], filename: string) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, filename);
}

// ── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, loading }: { label: string; value: string; sub?: string; accent: string; loading: boolean }) {
  return (
    <div className="rounded-2xl p-5 card-hover bg-page-card backdrop-blur border border-border-default">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-text-dim">{label}</p>
      {loading ? (
        <div className="h-8 w-24 rounded-lg animate-pulse bg-page-input" />
      ) : (
        <>
          <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
          {sub && <p className="text-xs mt-1 text-text-dim">{sub}</p>}
        </>
      )}
    </div>
  );
}

function ExportBtn({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all duration-200"
      style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34D399" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.12)"; }}>
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Cierre de Caja helpers ──────────────────────────────────────────────────
function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  // Interceptor returns "DD/MM/YYYY HH:mm:ss" — extract HH:mm directly
  if (dateStr.includes("/")) {
    const timePart = dateStr.split(" ")[1];
    if (!timePart) return "—";
    const [h, m] = timePart.split(":");
    return `${h}:${m}`;
  }
  // ISO fallback
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

async function exportCajaPDF(report: CajaReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 18;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Cierre de Caja Diario", margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const [yr, mo, dy] = report.fecha.split("-");
  doc.text(`Fecha: ${dy}/${mo}/${yr}`, margin, y);
  y += 10;

  // Summary box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, 182, 28, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total recaudado:", margin + 4, y + 9);
  doc.setFontSize(16);
  doc.text(
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(report.totalCOP),
    margin + 4, y + 19
  );
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Vehículos: ${report.totalVehiculos}   Visitantes: ${report.visitantes}   Mensualidades: ${report.mensualidades}`, margin + 90, y + 9);
  doc.setTextColor(0, 0, 0);
  y += 36;

  // Table header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, 182, 7, "F");
  const cols = [14, 32, 20, 54, 68, 86, 110];
  const headers = ["#", "Placa", "Tipo", "Entrada", "Salida", "Duración", "Monto COP"];
  headers.forEach((h, i) => doc.text(h, margin + cols[i], y + 5));
  y += 9;

  doc.setFont("helvetica", "normal");
  report.cobros.forEach((c, idx) => {
    if (y > 270) { doc.addPage(); y = 18; }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, 182, 6.5, "F");
    }
    const monto = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0 }).format(c.monto);
    const row = [
      String(idx + 1),
      c.placa,
      c.tipo,
      formatTime(c.horaEntrada),
      formatTime(c.horaSalida),
      c.duracion,
      `$${monto}`,
    ];
    row.forEach((cell, i) => doc.text(cell, margin + cols[i], y + 4.5));
    y += 6.5;
  });

  y += 10;
  // Signature line
  if (y > 250) { doc.addPage(); y = 18; }
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, margin + 70, y);
  doc.setFontSize(8);
  doc.text("Firma operario", margin, y + 5);
  doc.line(120, y, 196, y);
  doc.text("Firma supervisor", 120, y + 5);

  doc.save(`cierre_caja_${report.fecha}.pdf`);
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cierre de caja state
  const [cajaFecha, setCajaFecha] = useState<string>(todayBogota());
  const [cajaReport, setCajaReport] = useState<CajaReport | null>(null);
  const [cajaLoading, setCajaLoading] = useState(false);
  const [cajaError, setCajaError] = useState<string | null>(null);
  const [cajaExporting, setCajaExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [clients, vehicles, mems, ents] = await Promise.all([
        getClients(tenantId), getVehicles(tenantId), getMemberships(tenantId), getEntries(tenantId),
      ]);
      setClientCount(clients.length);
      setVehicleCount(vehicles.length);
      setMemberships(mems);
      setEntries(ents);
      setLastUpdated(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const today = todayBogota();
  const weekAgo = new Date(today + "T00:00:00");
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today + "T00:00:00");
  monthAgo.setDate(monthAgo.getDate() - 30);

  const closedEntries = entries.filter((e) => e.exitTime && e.amountPaid != null);

  function incomeInRange(from: Date, to: Date) {
    const entriesIncome = closedEntries
      .filter((e) => {
        const d = parseColombianDate(e.exitTime!);
        return d >= from && d <= to;
      })
      .reduce((sum, e) => sum + (e.amountPaid ?? 0), 0);
    const membershipIncome = memberships
      .filter((m) => {
        if (!m.paidAt) return false;
        const d = parseColombianDate(m.paidAt);
        return d >= from && d <= to;
      })
      .reduce((sum, m) => sum + parseFloat(m.price), 0);
    return entriesIncome + membershipIncome;
  }

  const incomeToday = incomeInRange(new Date(today + "T00:00:00"), new Date(today + "T23:59:59"));
  const incomeWeek = incomeInRange(weekAgo, new Date());
  const incomeMonth = incomeInRange(monthAgo, new Date());

  const activeMemberships = memberships.filter((m) => m.status === "active").length;
  const expiredMemberships = memberships.filter((m) => m.status === "expired").length;

  // Top 5 most frequent plates (all entries)
  const plateCounts: Record<string, number> = {};
  entries.forEach((e) => { plateCounts[e.plate] = (plateCounts[e.plate] ?? 0) + 1; });
  const topPlates = Object.entries(plateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Peak hours (closed entries)
  const hourCounts: Record<number, number> = {};
  closedEntries.forEach((e) => {
    const h = parseColombianDate(e.entryTime).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([h, c]) => ({ hour: `${h.padStart(2, "0")}:00`, count: c }));

  // Companies (memberships)
  const companyCounts: Record<string, { count: number; active: number }> = {};
  memberships.forEach((m) => {
    if (!m.company) return;
    if (!companyCounts[m.company]) companyCounts[m.company] = { count: 0, active: 0 };
    companyCounts[m.company].count++;
    if (m.status === "active") companyCounts[m.company].active++;
  });
  const companyRows = Object.entries(companyCounts).sort((a, b) => b[1].count - a[1].count);

  // ── Excel exports ────────────────────────────────────────────────────────
  async function exportIngresos() {
    setExporting(true);
    try {
      const rows = closedEntries.map((e) => ({
        Placa: e.plate,
        Tipo: e.vehicleType ?? "—",
        "Hora entrada": e.entryTime,
        "Hora salida": e.exitTime ?? "—",
        "Cobrado (COP)": e.amountPaid ?? 0,
      }));
      await exportXlsx([{ name: "Ingresos", rows }], "ingresos.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function exportMensualidades() {
    setExporting(true);
    try {
      const rows = memberships
        .filter((m) => m.status === "active")
        .map((m) => ({
          Cliente: m.client?.fullName ?? `#${m.clientId}`,
          Placa: m.vehicle?.plate ?? `#${m.vehicleId}`,
          Tipo: m.vehicle?.type ?? "—",
          Empresa: m.company ?? "—",
          Inicio: isoToDisplay(m.startDate),
          Vencimiento: isoToDisplay(m.endDate),
          "Precio (COP)": m.price,
        }));
      await exportXlsx([{ name: "Mensualidades activas", rows }], "mensualidades_activas.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function exportHistorial() {
    setExporting(true);
    try {
      const rows = entries.map((e) => ({
        Placa: e.plate,
        Tipo: e.vehicleType ?? "—",
        "Hora entrada": e.entryTime,
        "Hora salida": e.exitTime ?? "En parqueadero",
        "Cobrado (COP)": e.amountPaid ?? (e.exitTime ? 0 : "—"),
      }));
      await exportXlsx([{ name: "Historial" , rows }], "historial_entradas.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function exportEmpresas() {
    setExporting(true);
    try {
      const rows = companyRows.map(([company, { count, active }]) => ({
        Empresa: company,
        "Total mensualidades": count,
        "Mensualidades activas": active,
        "Mensualidades vencidas": count - active,
      }));
      await exportXlsx([{ name: "Cobros por empresa", rows }], "cobros_empresa.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function generarCierre() {
    setCajaLoading(true);
    setCajaError(null);
    setCajaReport(null);
    try {
      const report = await getCajaReport(cajaFecha, tenantId);
      setCajaReport(report);
    } catch (e: unknown) {
      setCajaError(e instanceof Error ? e.message : "Error al generar cierre");
    } finally {
      setCajaLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!cajaReport) return;
    setCajaExporting(true);
    try {
      await exportCajaPDF(cajaReport);
    } finally {
      setCajaExporting(false);
    }
  }

  const maxHourCount = Math.max(...Object.values(hourCounts), 1);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reportes</h1>
          <p className="text-sm text-text-secondary">Métricas y exportación de datos</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && !loading && <span className="text-xs text-text-dim">Actualizado {lastUpdated}</span>}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "rgba(37,99,235,0.15)", color: "#60A5FA", border: "1px solid rgba(37,99,235,0.3)" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}

      {/* Ingresos */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-dim">Ingresos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Ingresos hoy" value={formatCOP(incomeToday)} accent="#10B981" loading={loading} />
        <StatCard label="Ingresos últimos 7 días" value={formatCOP(incomeWeek)} accent="#2563EB" loading={loading} />
        <StatCard label="Ingresos últimos 30 días" value={formatCOP(incomeMonth)} accent="#7C3AED" loading={loading} />
      </div>

      {/* Vehículos y mensualidades */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-dim">General</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clientes" value={String(clientCount)} accent="#2563EB" loading={loading} />
        <StatCard label="Vehículos" value={String(vehicleCount)} accent="#7C3AED" loading={loading} />
        <StatCard label="Mensualidades activas" value={String(activeMemberships)} accent="#10B981" loading={loading} />
        <StatCard label="Mensualidades vencidas" value={String(expiredMemberships)} accent="#EF4444" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Horas pico */}
        {!loading && closedEntries.length > 0 && (
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
                      <div className="h-full rounded-full" style={{ width: `${(c / maxHourCount) * 100}%`, backgroundColor: "#2563EB" }} />
                    </div>
                    <span className="text-xs w-8 text-text-muted">{c}</span>
                  </div>
                ))}
            </div>
            {peakHours.length > 0 && (
              <p className="text-xs mt-3 text-text-dim">
                Hora más activa: <span style={{ color: "#60A5FA" }}>{peakHours[0]?.hour}</span> ({peakHours[0]?.count} ingresos)
              </p>
            )}
          </div>
        )}

        {/* Top placas */}
        {!loading && topPlates.length > 0 && (
          <div className="rounded-2xl p-6 card-hover bg-page-card backdrop-blur border border-border-default">
            <h3 className="text-sm font-semibold text-white mb-4">Vehículos más frecuentes</h3>
            <div className="space-y-3">
              {topPlates.map(([plate, count], i) => (
                <div key={plate} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5" style={{ color: i === 0 ? "#F59E0B" : "#475569" }}>#{i + 1}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.25)" }}>
                    {plate}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-page-input">
                    <div className="h-full rounded-full" style={{ width: `${(count / (topPlates[0]?.[1] ?? 1)) * 100}%`, backgroundColor: i === 0 ? "#F59E0B" : "#2563EB" }} />
                  </div>
                  <span className="text-xs text-text-muted">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empresas */}
      {!loading && companyRows.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-dim">Cobros por empresa</h2>
          <div className="rounded-2xl overflow-hidden mb-8 bg-page-card backdrop-blur border border-border-default">
            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    {["Empresa", "Total mensualidades", "Activas", "Vencidas"].map((c) => (
                      <th key={c} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companyRows.map(([company, { count, active }], i) => (
                    <tr key={company} style={{ borderBottom: i < companyRows.length - 1 ? "1px solid var(--border-row)" : "none" }}>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#C4B5FD" }}>
                          {company}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-white">{count}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-emerald-400">{active}</td>
                      <td className="px-5 py-3 text-sm text-red-300">{count - active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (móvil) */}
            <div className="md:hidden p-4 space-y-3">
              {companyRows.map(([company, { count, active }]) => (
                <div key={company} className="rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{ backgroundColor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#C4B5FD" }}>
                    {company}
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{count}</p>
                      <p className="text-xs text-text-dim">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{active}</p>
                      <p className="text-xs text-text-dim">Activas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-300">{count - active}</p>
                      <p className="text-xs text-text-dim">Vencidas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Export buttons */}
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-dim">Exportar a Excel</h2>
      <div className="flex flex-wrap gap-3 mb-12">
        <ExportBtn label="Ingresos del período" onClick={exportIngresos} loading={exporting} />
        <ExportBtn label="Mensualidades activas" onClick={exportMensualidades} loading={exporting} />
        <ExportBtn label="Historial entradas/salidas" onClick={exportHistorial} loading={exporting} />
        <ExportBtn label="Cobros por empresa" onClick={exportEmpresas} loading={exporting} />
      </div>

      {/* ── Cierre de Caja ─────────────────────────────────────────────────── */}
      <div className="border-t pt-10" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Cierre de Caja</h2>
            <p className="text-sm text-text-secondary">Resumen diario de ingresos para cuadre al final del turno</p>
          </div>
          {cajaReport && (
            <button
              onClick={handleExportPDF}
              disabled={cajaExporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all duration-200"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)"; }}>
              <FileText className="w-4 h-4" />
              {cajaExporting ? "Generando PDF..." : "Exportar PDF"}
            </button>
          )}
        </div>

        {/* Date picker + generate button */}
        <div className="flex items-center gap-3 mb-6">
          <DatePicker
            value={cajaFecha}
            onChange={(v) => { setCajaFecha(v); setCajaReport(null); }}
          />
          <button
            onClick={generarCierre}
            disabled={cajaLoading || !cajaFecha}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all duration-200"
            style={{ backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}
            onMouseEnter={(e) => { if (!cajaLoading) e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.15)"; }}>
            {cajaLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {cajaLoading ? "Generando..." : "Generar Cierre"}
          </button>
        </div>

        {cajaError && (
          <div className="mb-6 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-300">
            {cajaError}
          </div>
        )}

        {cajaReport && (
          <>
            {/* Total del día */}
            <div className="rounded-2xl p-7 mb-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(37,99,235,0.1) 100%)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-text-dim">Total recaudado</p>
              <p className="text-4xl font-bold mb-2 text-emerald-400">
                {formatCOP(cajaReport.totalCOP)}
              </p>
              <p className="text-sm text-text-secondary">
                {(() => { const [y2, m2, d2] = cajaReport.fecha.split("-"); return `${d2}/${m2}/${y2}`; })()}
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Vehículos totales" value={String(cajaReport.totalVehiculos)} accent="#60A5FA" loading={false} />
              <StatCard label="Visitantes" value={String(cajaReport.visitantes)} accent="#F59E0B" loading={false} sub="Sin mensualidad" />
              <StatCard label="Mensualidades" value={String(cajaReport.mensualidades)} accent="#34D399" loading={false} sub="Con mensualidad activa" />
              <StatCard label="Cobros realizados" value={String(cajaReport.cobros.length)} accent="#C4B5FD" loading={false} />
            </div>

            {/* Hourly breakdown */}
            {cajaReport.desglosePorHora.length > 0 && (
              <div className="rounded-2xl p-5 mb-6 bg-page-card backdrop-blur border border-border-default">
                <h3 className="text-sm font-semibold text-white mb-4">Desglose por hora</h3>
                <div className="flex items-end gap-2 h-20">
                  {cajaReport.desglosePorHora.map(({ hora, cantidad }) => {
                    const max = Math.max(...cajaReport.desglosePorHora.map((h) => h.cantidad), 1);
                    return (
                      <div key={hora} className="flex flex-col items-center flex-1 gap-1">
                        <span className="text-xs font-bold text-emerald-400">{cantidad}</span>
                        <div className="w-full rounded-t" style={{ height: `${(cantidad / max) * 48}px`, backgroundColor: "#2563EB", minHeight: "4px" }} />
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: "10px" }}>{hora}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed cobros table */}
            <div className="rounded-2xl overflow-hidden mb-6 bg-page-card backdrop-blur border border-border-default">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <h3 className="text-sm font-semibold text-white">Detalle de cobros</h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.2)" }}>
                  {cajaReport.cobros.length} {cajaReport.cobros.length === 1 ? "cobro" : "cobros"}
                </span>
              </div>
              {cajaReport.cobros.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-text-dim">
                  No hay cobros registrados para esta fecha
                </div>
              ) : (
                <div>
                  {/* Tabla (desktop) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                          {["Placa", "Tipo", "Entrada", "Salida", "Duración", "Monto", ""].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cajaReport.cobros.map((c, i) => (
                          <tr key={i} style={{ borderBottom: i < cajaReport.cobros.length - 1 ? "1px solid var(--border-row)" : "none" }}>
                            <td className="px-5 py-3">
                              <span className="text-xs font-bold px-2.5 py-1 rounded font-mono"
                                style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.25)" }}>
                                {c.placa}
                              </span>
                            </td>
                              <td className="px-5 py-3 text-sm text-text-secondary">{c.tipo}</td>
                              <td className="px-5 py-3 text-sm font-mono text-text-secondary">{formatTime(c.horaEntrada)}</td>
                              <td className="px-5 py-3 text-sm font-mono text-text-secondary">{formatTime(c.horaSalida)}</td>
                              <td className="px-5 py-3 text-sm text-text-muted">{c.duracion}</td>
                            <td className="px-5 py-3 text-sm font-semibold" style={{ color: c.monto > 0 ? "#34D399" : "var(--text-muted)" }}>
                              {formatCOP(c.monto)}
                            </td>
                            <td className="px-5 py-3">
                              {c.esMensualidad ? (
                                <span className="text-xs px-2 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)" }}>
                                  Mensualidad
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.25)" }}>
                                  Visitante
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "2px solid var(--border-default)" }}>
                          <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-white">Total</td>
                            <td className="px-5 py-3 text-sm font-bold text-emerald-400">{formatCOP(cajaReport.totalCOP)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tarjetas (móvil) */}
                  <div className="md:hidden p-4 space-y-3">
                    {cajaReport.cobros.map((c, i) => (
                        <div key={i} className="rounded-xl p-4 space-y-3 bg-page-subtle border border-border-default">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded font-mono"
                            style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#93C5FD", border: "1px solid rgba(37,99,235,0.25)" }}>
                            {c.placa}
                          </span>
                          {c.esMensualidad ? (
                            <span className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)" }}>
                              Mensualidad
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.25)" }}>
                              Visitante
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Tipo</span>
                            <span className="text-sm text-right text-text-secondary">{c.tipo}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Entrada → Salida</span>
                            <span className="text-sm text-right font-mono text-text-secondary">{formatTime(c.horaEntrada)} → {formatTime(c.horaSalida)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Duración</span>
                            <span className="text-sm text-right text-text-muted">{c.duracion}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Monto</span>
                            <span className="text-sm font-semibold text-right" style={{ color: c.monto > 0 ? "#34D399" : "var(--text-muted)" }}>{formatCOP(c.monto)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-1 pt-2" style={{ borderTop: "2px solid var(--border-default)" }}>
                      <span className="text-sm font-semibold text-white">Total</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCOP(cajaReport.totalCOP)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
