"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getMemberships, getExpiringMemberships, renewMembership, createMembership, deleteMembership,
  getVehicles, getSettings,
  type Membership, type Vehicle, type AppSettings,
} from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { CustomSelect } from "@/components/ui/custom-select";
import { MensualidadesTable } from "./mensualidades-table";
import { ExpiringAlert } from "./expiring-alert";
import { RenewModal } from "./renew-modal";
import { TableSkeleton } from "./table-skeleton";

type FilterTab = "todas" | "activas" | "vencidas" | "proximas";
const tabs: { value: FilterTab; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "vencidas", label: "Vencidas" },
  { value: "proximas", label: "Próximas a vencer" },
];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function nextMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export function MensualidadesClient() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [expiring, setExpiring] = useState<Membership[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [companyFilter, setCompanyFilter] = useState("");
  const [renewTarget, setRenewTarget] = useState<Membership | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Membership | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    vehicleId: "" as number | "",
    startDate: todayISO(),
    endDate: nextMonthISO(),
    price: "",
    company: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Auto-open create modal when navigated from vehiculos wizard (?vehicleId=X)
  const preselectRef = useRef<number | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vid = params.get("vehicleId");
    if (vid) {
      const id = Number(vid);
      if (!isNaN(id)) preselectRef.current = id;
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [all, exp, veh, cfg] = await Promise.all([
        getMemberships(tenantId), getExpiringMemberships(tenantId), getVehicles(tenantId), getSettings(tenantId),
      ]);
      setMemberships(all);
      setExpiring(exp);
      setVehicles(veh);
      setSettings(cfg);
    } catch {
      setError("No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const priceForVehicle = useCallback((vehicleId: number | "") => {
    if (!settings || !vehicleId) return "";
    const v = vehicles.find((x) => x.id === vehicleId);
    const isMoto = v?.type === "moto";
    return String(isMoto ? settings.mensualidadMoto : settings.mensualidadCarro);
  }, [settings, vehicles]);

  // Apply vehicleId preselect once vehicles are loaded
  useEffect(() => {
    if (loading || preselectRef.current === null) return;
    const id = preselectRef.current;
    preselectRef.current = null;
    setCreateForm((prev) => ({ ...prev, vehicleId: id, price: priceForVehicle(id) }));
    setCreateOpen(true);
  }, [loading, priceForVehicle]);

  const companies = Array.from(new Set(memberships.map((m) => m.company).filter(Boolean))) as string[];

  const filtered = memberships.filter((m) => {
    if (activeTab === "activas" && m.status !== "active") return false;
    if (activeTab === "vencidas" && m.status !== "expired") return false;
    if (activeTab === "proximas" && !expiring.some((e) => e.id === m.id)) return false;
    if (companyFilter && m.company !== companyFilter) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMembership(deleteTarget.id, tenantId);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar mensualidad.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      await renewMembership(renewTarget.id, tenantId);
      setRenewTarget(null);
      await load();
    } catch {
      alert("Error al renovar la mensualidad. Intenta de nuevo.");
    } finally {
      setRenewing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.vehicleId || !createForm.price) {
      setCreateError("Vehículo y precio son obligatorios.");
      return;
    }
    const v = vehicles.find((x) => x.id === createForm.vehicleId);
    if (!v) { setCreateError("Vehículo no encontrado."); return; }

    setCreating(true);
    setCreateError(null);
    try {
      await createMembership({
        tenantId,
        vehicleId: v.id,
        clientId: v.clientId,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        price: Number(createForm.price),
        company: createForm.company || undefined,
      });
      setCreateOpen(false);
      setCreateForm({ vehicleId: "", startDate: todayISO(), endDate: nextMonthISO(), price: "", company: "" });
      await load();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error al crear mensualidad.");
    } finally {
      setCreating(false);
    }
  };

  const counts = {
    todas: memberships.length,
    activas: memberships.filter((m) => m.status === "active").length,
    vencidas: memberships.filter((m) => m.status === "expired").length,
    proximas: expiring.length,
  };

  const inputStyle = {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-medium)",
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mensualidades</h1>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm">
            Gestiona y renueva las mensualidades de vehículos registrados
          </p>
        </div>
        <button onClick={() => { setCreateOpen(true); setCreateError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva Mensualidad
        </button>
      </div>

      {!loading && expiring.length > 0 && (
        <ExpiringAlert count={expiring.length} onViewAll={() => setActiveTab("proximas")} />
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
        {/* Tabs + company filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 p-4">
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ backgroundColor: isActive ? "#2563EB" : "transparent", color: isActive ? "#fff" : "#94A3B8" }}>
                  {tab.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", color: isActive ? "#fff" : "#64748B" }}>
                    {counts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>
          {companies.length > 0 && (
            <div className="w-56">
              <CustomSelect
                value={companyFilter}
                onChange={(v) => setCompanyFilter(String(v))}
                options={[
                  { value: "", label: "Todas las empresas" },
                  ...companies.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          )}
        </div>

        {loading ? <TableSkeleton /> : (
          <MensualidadesTable memberships={filtered} expiringIds={expiring.map((e) => e.id)} onRenew={setRenewTarget} onDelete={(m) => { setDeleteError(null); setDeleteTarget(m); }} />
        )}
      </div>

      <RenewModal membership={renewTarget} open={!!renewTarget} onClose={() => setRenewTarget(null)} onConfirm={handleRenew} loading={renewing} />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-modal)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <svg className="w-5 h-5" style={{ color: "#F87171" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">¿Desactivar esta mensualidad?</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sus datos se conservan, no se borra nada</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm text-white font-medium">{deleteTarget.client?.fullName ?? `Cliente #${deleteTarget.clientId}`}</p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: "#93C5FD" }}>{deleteTarget.vehicle?.plate ?? `Vehículo #${deleteTarget.vehicleId}`}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Vence: {deleteTarget.endDate}</p>
              </div>
              {deleteError && (
                <p className="text-xs px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: deleting ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", border: "1px solid rgba(239,68,68,0.4)" }}>
                  {deleting ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>Desactivando...</>
                  ) : "Sí, desactivar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !creating) setCreateOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl"
            style={{ background: "var(--bg-modal)", border: "1px solid var(--border-medium)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)", borderRadius: "0.875rem 0.875rem 0 0" }} />
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-1">Nueva Mensualidad</h2>
              <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Registra una mensualidad para un vehículo</p>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Vehículo *</label>
                  <CustomSelect
                    value={createForm.vehicleId}
                    onChange={(val) => {
                      const vehicleId = val === "" ? "" : (val as number);
                      setCreateForm((p) => ({ ...p, vehicleId, price: priceForVehicle(vehicleId) }));
                    }}
                    options={[
                      { value: "", label: "Seleccionar vehículo..." },
                      ...vehicles.map((v) => ({
                        value: v.id,
                        label: `${v.plate} — ${v.type === "moto" ? "Moto" : "Carro"}${v.client ? ` (${v.client.fullName})` : ""}`,
                      })),
                    ]}
                    placeholder="Seleccionar vehículo..."
                    disabled={creating}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Inicio</label>
                    <input type="date" value={createForm.startDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Vencimiento</label>
                    <input type="date" value={createForm.endDate}
                      onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Precio (COP) *</label>
                  <input type="number" value={createForm.price}
                    onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="120000" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Empresa / Organización</label>
                  <input type="text" value={createForm.company}
                    onChange={(e) => setCreateForm((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Ej. Empresa ABC (opcional)" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
                {createError && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {createError}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setCreateOpen(false)} disabled={creating}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}>
                    {creating ? "Guardando..." : "Crear Mensualidad"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
