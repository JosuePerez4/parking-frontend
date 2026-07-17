"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getActiveVehicles, exitVehicle, type ActiveVehicle } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { LogOut, Loader2, AlertCircle, Search, Car, Clock } from "lucide-react";

// Backend returns "DD/MM/YYYY HH:mm:ss" via DateFormatterInterceptor
function parseColombianDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("/");
  return new Date(`${year}-${month}-${day}T${timePart}`);
}

function elapsedTime(entryTime: string): string {
  const entry = parseColombianDate(entryTime);
  const diffMs = Date.now() - entry.getTime();
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatTime(dateStr: string): string {
  return parseColombianDate(dateStr).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
}

const vehicleTypeLabel: Record<string, string> = { car: "Carro", moto: "Moto", truck: "Camión" };

function ExitModal({
  vehicle,
  onClose,
  onConfirm,
  loading,
  notice,
}: {
  vehicle: ActiveVehicle;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  notice: SubmitNotice | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-modal)", border: "1px solid var(--border-medium)" }}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <LogOut className="w-5 h-5" style={{ color: "#FCA5A5" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dar Salida</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Confirma la salida del vehículo</p>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 space-y-3"
            style={{ backgroundColor: "var(--bg-row-hover)", border: "1px solid var(--border-default)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Placa</span>
              <span className="text-sm font-bold tracking-wider px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "rgba(37,99,235,0.15)", color: "#93C5FD", fontFamily: "monospace" }}>
                {vehicle.plate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tipo</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{vehicleTypeLabel[vehicle.vehicleType] ?? vehicle.vehicleType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Hora de ingreso</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatTime(vehicle.entryTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tiempo transcurrido</span>
              <span className="text-sm font-semibold" style={{ color: "#F59E0B" }}>{elapsedTime(vehicle.entryTime)}</span>
            </div>
            <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Cobro estimado</span>
              <span className="text-base font-bold" style={{ color: "#34D399" }}>{formatCOP(vehicle.estimatedCost)}</span>
            </div>
          </div>

          <NoticeBox notice={notice} className="mb-4" />

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", border: "1px solid rgba(239,68,68,0.4)" }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
              ) : (
                <><LogOut className="w-4 h-4" />Confirmar Salida</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParkingPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const [exitTarget, setExitTarget] = useState<ActiveVehicle | null>(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [exitNotice, setExitNotice] = useState<SubmitNotice | null>(null);
  const [search, setSearch] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getActiveVehicles(tenantId);
      setVehicles(data);
      setLastUpdate(new Date());
      setError(null);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    intervalRef.current = setInterval(load, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const q = search.trim().toLowerCase();
  const filteredVehicles = q
    ? vehicles.filter((v) => v.plate.toLowerCase().includes(q))
    : vehicles;

  const handleExit = async () => {
    if (!exitTarget) return;
    setExitLoading(true);
    setExitNotice(null);
    try {
      await exitVehicle(tenantId, exitTarget.plate);
      setExitTarget(null);
      await load();
    } catch (err: unknown) {
      // Dejamos el modal abierto con el aviso. Ante red/timeout la salida pudo
      // registrarse igual: refrescamos el listado para que el operador verifique.
      setExitNotice(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setExitLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Parking Activo</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Vehículos dentro del parqueadero en este momento</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              Actualizado {lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#10B981" }} />
              <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: "#10B981" }} />
            </span>
            <span className="text-xs font-medium" style={{ color: "#34D399" }}>En vivo · 10s</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Vehículos adentro", value: loading ? "—" : String(vehicles.length), color: "#2563EB" },
          {
            label: "Tiempo promedio",
            value: loading || vehicles.length === 0 ? "—" : (() => {
              const avg = vehicles.reduce((acc, v) => acc + v.currentMinutes, 0) / vehicles.length;
              const h = Math.floor(avg / 60);
              const m = Math.round(avg % 60);
              return h > 0 ? `${h}h ${m}m` : `${m}m`;
            })(),
            color: "#F59E0B",
          },
          {
            label: "Última actualización",
            value: lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—",
            color: "#10B981",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "#2563EB" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
              <Car className="w-8 h-8" style={{ color: "#2563EB" }} />
            </div>
            <p className="text-white font-semibold mb-1">Parqueadero vacío</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hay vehículos dentro en este momento</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white font-semibold mb-1">Sin resultados</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ningún vehículo dentro coincide con &quot;{search}&quot;</p>
          </div>
        ) : (
          <div>
            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    {["Placa", "Tipo", "Hora de ingreso", "Tiempo dentro", "Costo estimado", "Acción"].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v, i) => (
                    <tr key={v.id}
                      style={{ borderBottom: i < filteredVehicles.length - 1 ? "1px solid var(--border-row)" : "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-row-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
                          style={{ backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", color: "#93C5FD", fontFamily: "monospace" }}>
                          {v.plate}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{vehicleTypeLabel[v.vehicleType] ?? v.vehicleType}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatTime(v.entryTime)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#F59E0B" }}>
                          <Clock className="w-3.5 h-3.5" />
                          {elapsedTime(v.entryTime)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold" style={{ color: "#34D399" }}>{formatCOP(v.estimatedCost)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => { setExitNotice(null); setExitTarget(v); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                          style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)"; }}>
                          <LogOut className="w-3.5 h-3.5" />
                          Dar salida
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (móvil) */}
            <div className="md:hidden p-4 space-y-3">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
                      style={{ backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", color: "#93C5FD", fontFamily: "monospace" }}>
                      {v.plate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#F59E0B" }}>
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedTime(v.entryTime)}
                    </span>
                  </div>
                  <div className="space-y-2 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Tipo</span>
                      <span className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{vehicleTypeLabel[v.vehicleType] ?? v.vehicleType}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Ingreso</span>
                      <span className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{formatTime(v.entryTime)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Costo estimado</span>
                      <span className="text-sm font-semibold text-right" style={{ color: "#34D399" }}>{formatCOP(v.estimatedCost)}</span>
                    </div>
                  </div>
                    <button
                    onClick={() => { setExitNotice(null); setExitTarget(v); }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                    style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
                    <LogOut className="w-3.5 h-3.5" />
                    Dar salida
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {filteredVehicles.length} vehículo{filteredVehicles.length !== 1 ? "s" : ""} · Actualización automática cada 10 segundos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exit modal */}
      {exitTarget && (
        <ExitModal
          vehicle={exitTarget}
          onClose={() => { if (!exitLoading) { setExitTarget(null); setExitNotice(null); } }}
          onConfirm={handleExit}
          loading={exitLoading}
          notice={exitNotice}
        />
      )}
    </div>
  );
}
