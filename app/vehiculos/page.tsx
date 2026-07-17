"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getVehicles, getClients, deleteVehicle,
  type Vehicle, type Client,
} from "@/lib/api";
import { AlertCircle, Users, User, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { vehicleTypeLabel } from "@/components/vehicles/config";
import { VehicleTable, TableSkeleton } from "@/components/vehicles/VehicleTable";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleStats } from "@/components/vehicles/VehicleStats";
import { VehicleWizardModal } from "@/components/vehicles/VehicleWizardModal";

export default function VehiculosPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [vehicles, setVehicles]       = useState<Vehicle[]>([]);
  const [clients, setClients]         = useState<Client[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [assignTarget, setAssignTarget] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState<SubmitNotice | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [v, c] = await Promise.all([getVehicles(tenantId), getClients(tenantId)]);
      setVehicles(v);
      setClients(c);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteVehicle(deleteTarget.id, tenantId);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      setDeleteError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setDeleting(false);
    }
  }

  const matchesSearch = (v: Vehicle) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.plate.toLowerCase().includes(q) ||
      (v.client?.fullName ?? "").toLowerCase().includes(q) ||
      (v.brand ?? "").toLowerCase().includes(q)
    );
  };

  const registered = vehicles.filter((v) => v.client != null);
  const visitors   = vehicles.filter((v) => v.client == null);
  const filteredRegistered = registered.filter(matchesSearch);
  const filteredVisitors   = visitors.filter(matchesSearch);

  const stats = {
    registered:     registered.length,
    visitors:       visitors.length,
    withMembership: vehicles.filter((v) => v.membership?.status === "active").length,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Vehículos</h1>
        <p className="text-sm text-text-secondary">Consulta y gestiona los vehículos registrados</p>
      </div>

      {/* Stats */}
      {!loading && vehicles.length > 0 && (
        <VehicleStats stats={stats} />
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <VehicleFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <div className="space-y-6"><TableSkeleton /><TableSkeleton /></div>
      ) : (
        <div className="space-y-8">

          {/* Registrados */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/[0.12] border border-blue-500/25">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white leading-tight">Vehículos Registrados</h2>
                <p className="text-xs text-text-muted">Tienen cliente asignado</p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/[0.12] border border-blue-500/25 text-blue-400">
                {search ? `${filteredRegistered.length} / ${registered.length}` : registered.length}
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-page-card backdrop-blur border border-border-default">
              <VehicleTable
                vehicles={filteredRegistered}
                emptyText={search ? `No hay vehículos registrados que coincidan con "${search}"` : "No hay vehículos con cliente asignado"}
                onAssign={(v) => setAssignTarget(v)}
                onDelete={(v) => { setDeleteError(null); setDeleteTarget(v); }}
              />
            </div>
          </section>

          {/* Visitantes */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-500/[0.12] border border-violet-500/25">
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white leading-tight">Vehículos Visitantes / Ocasionales</h2>
                <p className="text-xs text-text-muted">Sin cliente asignado · Usa Asignar para iniciar el registro</p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/[0.12] border border-violet-500/25 text-violet-400">
                {search ? `${filteredVisitors.length} / ${visitors.length}` : visitors.length}
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden bg-page-card backdrop-blur border border-border-default">
              <VehicleTable
                vehicles={filteredVisitors}
                emptyText={search ? `No hay visitantes que coincidan con "${search}"` : "No hay vehículos sin cliente asignado"}
                onAssign={(v) => setAssignTarget(v)}
                onDelete={(v) => { setDeleteError(null); setDeleteTarget(v); }}
              />
            </div>
          </section>
        </div>
      )}

      {/* ── VehicleWizardModal ── */}
      {assignTarget && (
        <VehicleWizardModal
          vehicle={assignTarget}
          clients={clients}
          tenantId={tenantId}
          onClose={() => setAssignTarget(null)}
          onDone={async () => { setAssignTarget(null); await load(); }}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-page-modal border border-red-500/25">
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/12 border border-red-500/30">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">¿Desactivar este vehículo?</h2>
                  <p className="text-xs mt-0.5 text-text-muted">Sus datos se conservan, no se borra nada</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl bg-red-500/[0.07] border border-red-500/15">
                <p className="text-sm font-bold tracking-wider font-mono text-blue-300">{deleteTarget.plate}</p>
                <p className="text-xs mt-0.5 text-text-secondary">
                  {vehicleTypeLabel[deleteTarget.type] ?? deleteTarget.type}{deleteTarget.brand ? ` · ${deleteTarget.brand}` : ""}
                </p>
                <p className="text-xs mt-2 text-red-400">También se desactivarán sus mensualidades. Dejará de aparecer en los listados, pero la información queda guardada.</p>
              </div>
              <NoticeBox notice={deleteError} className="mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 bg-page-input border border-border-medium text-text-secondary">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 text-white"
                  style={{ background: deleting ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg,#EF4444,#DC2626)", border: "1px solid rgba(239,68,68,0.4)" }}>
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Desactivando...</>
                  ) : "Sí, desactivar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
