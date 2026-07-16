"use client";

import { useEffect, useState, useCallback } from "react";
import { getClients, createClient, createVehicle, updateClient, deleteClient, type Client, type CreateClientDto, type UpdateClientDto } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomSelect } from "@/components/ui/custom-select";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, errorNotice, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";

const statusConfig = {
  active:   { label: "Activo",    bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  color: "#34D399", dot: "#10B981" },
  inactive: { label: "Inactivo",  bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)",  color: "var(--text-secondary)", dot: "#64748B" },
  blocked:  { label: "Bloqueado", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)",   color: "#FCA5A5", dot: "#EF4444" },
};

const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "blocked", label: "Bloqueado" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "car", label: "Carro" },
  { value: "moto", label: "Moto" },
  { value: "truck", label: "Camión" },
];

const EMPTY_FORM: Omit<CreateClientDto, "tenantId"> = { fullName: "", document: "", phone: "", email: "", address: "" };
const EMPTY_VEHICLE = { plate: "", type: "car" as "car" | "moto" | "truck", brand: "", color: "" };

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  // Backend interceptor returns "DD/MM/YYYY HH:mm:ss"
  const datePart = dateStr.split(" ")[0];
  if (datePart?.includes("/")) return datePart;
  // Fallback for raw ISO strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-0">
      <div className="flex items-center gap-4 px-1 pb-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        {[140, 100, 120, 150, 80, 70].map((w, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: w, backgroundColor: "var(--bg-input)" }} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4" style={{ borderBottom: i < 4 ? "1px solid var(--border-row)" : "none" }}>
          <div className="flex items-center gap-3" style={{ minWidth: 140 }}>
            <Skeleton className="w-8 h-8 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
            <Skeleton className="h-3 w-28 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          </div>
          <Skeleton className="h-3 w-24 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-28 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-36 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-20 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
        </div>
      ))}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-medium)",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.6)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; }}
      />
    </div>
  );
}

export default function ClientesPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<CreateClientDto, "tenantId">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<SubmitNotice | null>(null);
  const [step, setStep] = useState<"client" | "vehicle">("client");
  const [newClientId, setNewClientId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState<SubmitNotice | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState<UpdateClientDto>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<SubmitNotice | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<SubmitNotice | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setClients(await getClients(tenantId));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.document || !form.phone) {
      setFormError(errorNotice("Nombre, documento y teléfono son obligatorios."));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const client = await createClient({ ...form, tenantId });
      setNewClientId(client.id);
      setVehicleForm(EMPTY_VEHICLE);
      setVehicleError(null);
      setStep("vehicle");
      await load();
    } catch (err: unknown) {
      setFormError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleForm.plate || !newClientId) return;
    setVehicleSaving(true);
    setVehicleError(null);
    try {
      await createVehicle({ ...vehicleForm, clientId: newClientId, tenantId });
      closeModal();
    } catch (err: unknown) {
      setVehicleError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setVehicleSaving(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setStep("client");
    setNewClientId(null);
    setVehicleForm(EMPTY_VEHICLE);
    setVehicleError(null);
    setFormError(null);
  }

  function openEdit(client: Client) {
    setEditTarget(client);
    setEditForm({
      fullName: client.fullName,
      document: client.document,
      phone: client.phone ?? "",
      email: client.email ?? "",
      address: client.address ?? "",
      status: client.status,
    });
    setEditError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteClient(deleteTarget.id, tenantId);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      setDeleteError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.fullName || !editForm.document || !editForm.phone) {
      setEditError(errorNotice("Nombre, documento y teléfono son obligatorios."));
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateClient(editTarget.id, editForm, tenantId);
      setEditTarget(null);
      await load();
    } catch (err: unknown) {
      setEditError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Gestiona los clientes registrados en el sistema</p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setForm(EMPTY_FORM); setFormError(null); setStep("client"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
        {loading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
              <svg className="w-8 h-8" style={{ color: "#2563EB" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">Sin clientes</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Crea el primer cliente con el botón superior</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  {["Cliente", "Documento", "Teléfono", "Email", "Estado", "Registrado", ""].map((col) => (
                    <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => {
                  const st = statusConfig[c.status] ?? statusConfig.inactive;
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors duration-150 cursor-pointer"
                      style={{ borderBottom: i < clients.length - 1 ? "1px solid var(--border-row)" : "none" }}
                      onClick={() => openEdit(c)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-row-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                            {c.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white leading-tight">{c.fullName}</p>
                            {c.address && <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>{c.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{c.document}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.phone}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(c.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setDeleteError(null); setDeleteTarget(c); }}
                          title="Desactivar cliente"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                          style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>{clients.length} cliente{clients.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!editSaving && !v) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden"
          style={{ background: "var(--bg-modal)", backdropFilter: "blur(20px)", border: "1px solid var(--border-medium)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#F59E0B,#D97706)" }} />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <svg className="w-5 h-5" style={{ color: "#FCD34D" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Editar Cliente</DialogTitle>
                </div>
              </div>
              <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                {editTarget?.fullName} · modificando datos del cliente
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField label="Nombre completo *" name="fullName"
                    value={editForm.fullName ?? ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Ej. Juan Pérez García" />
                </div>
                <InputField label="Documento *" name="document"
                  value={editForm.document ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, document: e.target.value }))}
                  placeholder="Cédula o NIT" />
                <InputField label="Teléfono *" name="phone" type="tel"
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="300 123 4567" />
                <div className="col-span-2">
                  <InputField label="Email" name="email" type="email"
                    value={editForm.email ?? ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="correo@ejemplo.com" />
                </div>
                <div className="col-span-2">
                  <InputField label="Dirección" name="address"
                    value={editForm.address ?? ""}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle 123 #45-67" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Estado</label>
                  <CustomSelect
                    value={editForm.status ?? "active"}
                    onChange={(v) => setEditForm((p) => ({ ...p, status: v as Client["status"] }))}
                    options={CLIENT_STATUS_OPTIONS}
                  />
                </div>
              </div>

              <NoticeBox notice={editError} />

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} disabled={editSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: editSaving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", border: "1px solid rgba(245,158,11,0.4)" }}>
                  {editSaving ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>Guardando...</>
                  ) : (
                    <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>Guardar cambios</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
                  <h2 className="text-base font-bold text-white">¿Desactivar este cliente?</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sus datos se conservan, no se borra nada</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm text-white font-medium mb-1">{deleteTarget.fullName}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Doc: {deleteTarget.document}</p>
                <p className="text-xs mt-2" style={{ color: "#F87171" }}>
                  También se desactivarán sus vehículos y mensualidades. Dejarán de aparecer en los listados, pero la información queda guardada.
                </p>
              </div>
              <NoticeBox notice={deleteError} className="mb-4" />
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
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!saving && !vehicleSaving) { if (!v) closeModal(); } }}>
        <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden"
          style={{ background: "var(--bg-modal)", backdropFilter: "blur(20px)", border: "1px solid var(--border-medium)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)" }} />
          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {(["client", "vehicle"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className="w-8 h-px" style={{ backgroundColor: step === "vehicle" ? "rgba(37,99,235,0.5)" : "var(--border-medium)" }} />}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: step === s || (s === "client" && step === "vehicle") ? "#2563EB" : "var(--bg-input)", color: "#fff" }}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium" style={{ color: step === s ? "#60A5FA" : "var(--text-dim)" }}>
                      {s === "client" ? "Datos cliente" : "Vehículo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {step === "client" ? (
              <>
                <DialogHeader className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                      <svg className="w-5 h-5" style={{ color: "#60A5FA" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <DialogTitle className="text-lg font-bold text-white">Nuevo Cliente</DialogTitle>
                  </div>
                  <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                    Completa el formulario para registrar un nuevo cliente.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <InputField label="Nombre completo *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Ej. Juan Pérez García" />
                    </div>
                    <InputField label="Documento *" name="document" value={form.document} onChange={handleChange} placeholder="Cédula o NIT" />
                    <InputField label="Teléfono *" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="300 123 4567" />
                    <div className="col-span-2">
                      <InputField label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="col-span-2">
                      <InputField label="Dirección" name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 #45-67" />
                    </div>
                  </div>
                  <NoticeBox notice={formError} />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                      style={{ background: saving ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}>
                      {saving ? (
                        <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>Guardando...</>
                      ) : (
                        <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>Crear Cliente</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <DialogHeader className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <svg className="w-5 h-5" style={{ color: "#34D399" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" />
                        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white">Agregar Vehículo</DialogTitle>
                    </div>
                  </div>
                  <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                    Cliente creado. Registra su vehículo o sáltate este paso.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddVehicle} className="space-y-4">
                  <InputField label="Placa *" name="plate" value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm((p) => ({ ...p, plate: e.target.value.toUpperCase() }))}
                    placeholder="Ej. ABC123" />
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Tipo *</label>
                    <CustomSelect
                      value={vehicleForm.type}
                      onChange={(v) => setVehicleForm((p) => ({ ...p, type: v as "car" | "moto" | "truck" }))}
                      options={VEHICLE_TYPE_OPTIONS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Marca" name="brand" value={vehicleForm.brand}
                      onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="Ej. Chevrolet" />
                    <InputField label="Color" name="color" value={vehicleForm.color}
                      onChange={(e) => setVehicleForm((p) => ({ ...p, color: e.target.value }))}
                      placeholder="Ej. Blanco" />
                  </div>
                  <NoticeBox notice={vehicleError} />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} disabled={vehicleSaving}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-secondary)" }}>
                      Omitir
                    </button>
                    <button type="submit" disabled={vehicleSaving || !vehicleForm.plate}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg,#10B981,#059669)", color: "#fff", border: "1px solid rgba(16,185,129,0.4)" }}>
                      {vehicleSaving ? (
                        <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>Guardando...</>
                      ) : "Agregar Vehículo"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
