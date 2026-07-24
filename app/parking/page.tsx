"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getActiveVehicles, exitVehicle, registerVehicleEntry, type ActiveVehicle } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { LogOut, LogIn, Loader2, AlertCircle, CheckCircle2, Search, Car, Clock, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

const ENTRY_TYPE_OPTIONS = [
  { value: "car", label: "Carro" },
  { value: "moto", label: "Moto" },
];

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

const entryActionLabel: Record<string, string> = {
  GRANTED: "Mensualidad activa",
  ALERT: "Mensualidad vencida",
  VISITOR: "Visitante",
};

function ExitDrawer({
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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => { if (!loading) onClose(); }} />
      <div className="drawer-in relative w-full max-w-sm h-full bg-page-modal border-l border-border-medium flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-danger-dim border border-destructive/30">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dar Salida</h2>
              <p className="text-xs text-text-muted">Confirma la salida del vehículo</p>
            </div>
          </div>
          <button
            onClick={() => { if (!loading) onClose(); }}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary cursor-pointer flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-xl p-4 space-y-3 bg-page-row-hover border border-border-default">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Placa</span>
              <span className="text-sm font-bold tracking-wider px-2.5 py-1 rounded-lg bg-primary-dim text-primary font-mono">
                {vehicle.plate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Tipo</span>
              <span className="text-sm text-text-secondary">{vehicleTypeLabel[vehicle.vehicleType] ?? vehicle.vehicleType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Hora de ingreso</span>
              <span className="text-sm text-text-secondary">{formatTime(vehicle.entryTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Tiempo transcurrido</span>
              <span className="text-sm font-semibold text-warn">{elapsedTime(vehicle.entryTime)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border-soft">
              <span className="text-xs font-semibold text-text-muted">Cobro estimado</span>
              <span className="text-base font-bold text-ok">{formatCOP(vehicle.estimatedCost)}</span>
            </div>
          </div>

          <NoticeBox notice={notice} className="mt-4" />
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-border-soft">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 bg-page-input border border-border-medium text-text-secondary">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 text-white bg-destructive">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
            ) : (
              <><LogOut className="w-4 h-4" />Confirmar Salida</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryDrawer({
  plate,
  onPlateChange,
  vehicleType,
  onVehicleTypeChange,
  onClose,
  onConfirm,
  loading,
  notice,
}: {
  plate: string;
  onPlateChange: (v: string) => void;
  vehicleType: "car" | "moto";
  onVehicleTypeChange: (v: "car" | "moto") => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  notice: SubmitNotice | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => { if (!loading) onClose(); }} />
      <div className="drawer-in relative w-full max-w-sm h-full bg-page-modal border-l border-border-medium flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-ok-dim border border-ok/30">
              <LogIn className="w-5 h-5 text-ok" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrar Entrada</h2>
              <p className="text-xs text-text-muted">Ingresa la placa del vehículo</p>
            </div>
          </div>
          <button
            onClick={() => { if (!loading) onClose(); }}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary cursor-pointer flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <label htmlFor="entry-plate" className="text-xs font-semibold uppercase tracking-wider text-text-dim">
            Placa
          </label>
          <input
            id="entry-plate"
            type="text"
            autoFocus
            value={plate}
            onChange={(e) => onPlateChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading && plate.trim()) onConfirm(); }}
            placeholder="ABC123"
            className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider text-white outline-none border border-border-medium bg-page-input"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-text-dim">
            Tipo de vehículo
          </label>
          <div className="mt-2">
            <CustomSelect
              value={vehicleType}
              onChange={(v) => onVehicleTypeChange(v as "car" | "moto")}
              options={ENTRY_TYPE_OPTIONS}
            />
          </div>

          <NoticeBox notice={notice} className="mt-4" />
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-border-soft">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 bg-page-input border border-border-medium text-text-secondary">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading || !plate.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 text-white bg-ok">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
            ) : (
              <><LogIn className="w-4 h-4" />Confirmar Entrada</>
            )}
          </button>
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
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryPlate, setEntryPlate] = useState("");
  const [entryType, setEntryType] = useState<"car" | "moto">("car");
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryNotice, setEntryNotice] = useState<SubmitNotice | null>(null);
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null);
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

  const handleEntry = async () => {
    const plate = entryPlate.trim();
    if (!plate) return;
    setEntryLoading(true);
    setEntryNotice(null);
    try {
      const result = await registerVehicleEntry(tenantId, plate, entryType);
      setEntryOpen(false);
      setEntryPlate("");
      setEntryType("car");
      setEntrySuccess(`${result.plate} · ${entryActionLabel[result.action] ?? result.action}`);
      await load();
    } catch (err: unknown) {
      setEntryNotice(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setEntryLoading(false);
    }
  };

  useEffect(() => {
    if (!entrySuccess) return;
    const t = setTimeout(() => setEntrySuccess(null), 4000);
    return () => clearTimeout(t);
  }, [entrySuccess]);

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
          <p className="text-sm text-text-secondary">Vehículos dentro del parqueadero en este momento</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-text-dim">
              Actualizado {lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ok-dim border border-ok/25">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-ok" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-ok" />
            </span>
            <span className="text-xs text-ok">En vivo · 10s</span>
          </div>
          <button
            onClick={() => { setEntryNotice(null); setEntryPlate(""); setEntryType("car"); setEntryOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer text-white bg-ok hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            Registrar Entrada
          </button>
        </div>
      </div>

      {/* Éxito registro entrada */}
      {entrySuccess && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border border-ok/30 text-ok bg-ok-dim">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Entrada registrada: {entrySuccess}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Vehículos adentro", value: loading ? "—" : String(vehicles.length), color: "var(--primary)" },
          {
            label: "Tiempo promedio",
            value: loading || vehicles.length === 0 ? "—" : (() => {
              const avg = vehicles.reduce((acc, v) => acc + v.currentMinutes, 0) / vehicles.length;
              const h = Math.floor(avg / 60);
              const m = Math.round(avg % 60);
              return h > 0 ? `${h}h ${m}m` : `${m}m`;
            })(),
            color: "var(--text-secondary)",
          },
          {
            label: "Última actualización",
            value: lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—",
            color: "var(--ok)",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5 border border-border-default bg-page-card backdrop-blur">
            <p className="text-xs font-medium mb-1 text-text-muted">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border border-destructive/30 text-destructive bg-danger-dim">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none border border-border-medium bg-page-input"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-border-default bg-page-card backdrop-blur">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm text-text-muted">Cargando...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary-dim">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <p className="text-white font-semibold mb-1">Parqueadero vacío</p>
            <p className="text-sm text-text-muted">No hay vehículos dentro en este momento</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white font-semibold mb-1">Sin resultados</p>
            <p className="text-sm text-text-muted">Ningún vehículo dentro coincide con &quot;{search}&quot;</p>
          </div>
        ) : (
          <div>
            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-b-border-soft">
                    {["Placa", "Tipo", "Hora de ingreso", "Tiempo dentro", "Costo estimado", "Acción"].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v, i) => (
                    <tr key={v.id}
                      className={`hover:bg-page-row-hover transition-colors duration-150 ${i < filteredVehicles.length - 1 ? "border-b border-border-row" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider text-primary font-mono bg-primary-dim border border-primary/30">
                          {v.plate}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-text-secondary">{vehicleTypeLabel[v.vehicleType] ?? v.vehicleType}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-text-secondary">{formatTime(v.entryTime)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-warn">
                          <Clock className="w-3.5 h-3.5" />
                          {elapsedTime(v.entryTime)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-ok">{formatCOP(v.estimatedCost)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => { setExitNotice(null); setExitTarget(v); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer border border-destructive/30 text-destructive bg-danger-dim hover:bg-destructive/25">
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
                <div key={v.id} className="rounded-xl p-4 space-y-3 border border-border-default bg-page-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider text-primary font-mono bg-primary-dim border border-primary/30">
                      {v.plate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-warn">
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedTime(v.entryTime)}
                    </span>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-t-border-soft">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Tipo</span>
                      <span className="text-sm text-right text-text-secondary">{vehicleTypeLabel[v.vehicleType] ?? v.vehicleType}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Ingreso</span>
                      <span className="text-sm text-right text-text-secondary">{formatTime(v.entryTime)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">Costo estimado</span>
                      <span className="text-sm font-semibold text-right text-ok">{formatCOP(v.estimatedCost)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setExitNotice(null); setExitTarget(v); }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer border border-destructive/30 text-destructive bg-danger-dim">
                    <LogOut className="w-3.5 h-3.5" />
                    Dar salida
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-t-border-soft">
              <p className="text-xs text-text-dim">
                {filteredVehicles.length} vehículo{filteredVehicles.length !== 1 ? "s" : ""} · Actualización automática cada 10 segundos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exit drawer */}
      {exitTarget && (
        <ExitDrawer
          vehicle={exitTarget}
          onClose={() => { if (!exitLoading) { setExitTarget(null); setExitNotice(null); } }}
          onConfirm={handleExit}
          loading={exitLoading}
          notice={exitNotice}
        />
      )}

      {/* Entry drawer */}
      {entryOpen && (
        <EntryDrawer
          plate={entryPlate}
          onPlateChange={setEntryPlate}
          vehicleType={entryType}
          onVehicleTypeChange={setEntryType}
          onClose={() => { if (!entryLoading) { setEntryOpen(false); setEntryNotice(null); } }}
          onConfirm={handleEntry}
          loading={entryLoading}
          notice={entryNotice}
        />
      )}
    </div>
  );
}
