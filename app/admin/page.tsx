"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  listTenants,
  createTenant,
  createUser,
  deactivateTenant,
  type Tenant,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { TenantEditModal } from "@/components/admin/tenant-edit-modal";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, errorNotice, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { Plus, AlertCircle, Building, Users, SquarePen, CircleMinus, Trash2, Check } from "lucide-react";

interface CreateFormState {
  name: string;
  contactEmail: string;
  contactPhone: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

const EMPTY_CREATE_FORM: CreateFormState = {
  name: "",
  contactEmail: "",
  contactPhone: "",
  adminFullName: "",
  adminEmail: "",
  adminPassword: "",
};

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
        {[160, 140, 120, 90, 80].map((w, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: w, backgroundColor: "var(--bg-input)" }} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4" style={{ borderBottom: i < 4 ? "1px solid var(--border-row)" : "none" }}>
          <div className="flex items-center gap-3" style={{ minWidth: 160 }}>
            <Skeleton className="w-8 h-8 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
            <Skeleton className="h-3 w-32 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          </div>
          <Skeleton className="h-3 w-36 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-24 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-20 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminNegociosPage() {
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [createStep, setCreateStep] = useState<"form" | "success">("form");
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<SubmitNotice | null>(null);

  // Edit modal (shared component)
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<Tenant | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<SubmitNotice | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTenants(await listTenants());
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function openCreateModal() {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateStep("form");
    setCreatedTenant(null);
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateStep("form");
    setCreatedTenant(null);
    setCreateError(null);
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError(errorNotice("El nombre del negocio es obligatorio."));
      return;
    }
    if (!createdTenant) {
      if (!createForm.adminFullName.trim() || !createForm.adminEmail.trim() || !createForm.adminPassword) {
        setCreateError(errorNotice("Nombre, email y contraseña del administrador son obligatorios."));
        return;
      }
    }
    setCreateSaving(true);
    setCreateError(null);
    try {
      // Si un intento previo ya creó el negocio pero falló al crear el usuario,
      // no lo volvemos a crear — solo reintentamos el usuario administrador.
      let tenant = createdTenant;
      if (!tenant) {
        tenant = await createTenant({
          name: createForm.name.trim(),
          contactEmail: createForm.contactEmail.trim() || undefined,
          contactPhone: createForm.contactPhone.trim() || undefined,
        });
        setCreatedTenant(tenant);
      }
      await createUser({
        tenantId: tenant.id,
        role: "business_admin",
        fullName: createForm.adminFullName.trim(),
        email: createForm.adminEmail.trim(),
        password: createForm.adminPassword,
      });
      setCreateStep("success");
      await load();
    } catch (err) {
      setCreateError(describeSubmitError(err));
      // Error de red/timeout: la operación pudo completarse; refrescamos la
      // lista para que el usuario verifique antes de reintentar (evita duplicar).
      if (isUnconfirmed(err)) await load();
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateTenant(deactivateTarget.id);
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      setDeactivateError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Negocios</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Administra los negocios que usan Parking IA y sus cuentas de acceso
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Crear negocio
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
        {loading ? (
          <TableSkeleton />
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
              <Building className="w-8 h-8" style={{ color: "#2563EB" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Sin negocios registrados</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Crea el primer negocio con el botón superior</p>
          </div>
        ) : (
          <div>
            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    {["Negocio", "Contacto", "Estado", "Creado", ""].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t, i) => (
                    <tr
                      key={t.id}
                      className="transition-colors duration-150 cursor-pointer"
                      style={{ borderBottom: i < tenants.length - 1 ? "1px solid var(--border-row)" : "none" }}
                      onClick={() => router.push(`/admin/negocios/${t.id}`)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-row-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}
                          >
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.contactEmail || "—"}</p>
                        {t.contactPhone && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t.contactPhone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(t.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/negocios/${t.id}`)}
                            title="Ver usuarios"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-input)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Usuarios
                          </button>
                          <button
                            onClick={() => setEditTarget(t)}
                            title="Editar negocio"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                            style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#FCD34D" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.18)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.08)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; }}
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                          </button>
                          {t.status === "active" && (
                            <button
                              onClick={() => { setDeactivateError(null); setDeactivateTarget(t); }}
                              title="Desactivar negocio"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                            >
                              <CircleMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (móvil) */}
            <div className="md:hidden p-4 space-y-3">
              {tenants.map((t) => (
                <div key={t.id} onClick={() => router.push(`/admin/negocios/${t.id}`)}
                  className="rounded-xl p-4 space-y-3 cursor-pointer"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{t.contactEmail || "—"}</p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="space-y-2 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    {t.contactPhone && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Teléfono</span>
                        <span className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{t.contactPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Creado</span>
                      <span className="text-sm text-right" style={{ color: "var(--text-muted)" }}>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/admin/negocios/${t.id}`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Usuarios
                    </button>
                    <button
                      onClick={() => setEditTarget(t)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                      style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#FCD34D" }}
                    >
                      <SquarePen className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {t.status === "active" && (
                      <button
                        onClick={() => { setDeactivateError(null); setDeactivateTarget(t); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                      >
                        <CircleMinus className="w-3.5 h-3.5" />
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>{tenants.length} negocio{tenants.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal (shared) */}
      <TenantEditModal
        tenant={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => { setEditTarget(null); await load(); }}
      />

      {/* Deactivate confirmation modal */}
      {deactivateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deactivating) setDeactivateTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--bg-modal)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <Trash2 className="w-5 h-5" style={{ color: "#F87171" }} />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>¿Desactivar este negocio?</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sus datos se conservan, no se borra nada</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{deactivateTarget.name}</p>
                <p className="text-xs" style={{ color: "#F87171" }}>
                  Sus usuarios seguirán existiendo pero el negocio quedará marcado como inactivo. Puedes reactivarlo luego editando su estado.
                </p>
              </div>
              <NoticeBox notice={deactivateError} className="mb-4" />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 justify-center" disabled={deactivating} onClick={() => setDeactivateTarget(null)}>
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" className="flex-1 justify-center" disabled={deactivating} onClick={handleDeactivate}>
                  {deactivating ? "Desactivando..." : "Sí, desactivar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!createSaving && !v) closeCreateModal(); }}>
        <DialogContent
          className="sm:max-w-lg border-0 p-0 overflow-hidden"
          style={{ background: "var(--bg-modal)", backdropFilter: "blur(20px)", border: "1px solid var(--border-medium)" }}
        >
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)" }} />
          <div className="p-6">
            {createStep === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <Check className="w-7 h-7" style={{ color: "#34D399" }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Negocio creado</h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Credenciales enviadas a <strong style={{ color: "var(--text-primary)" }}>{createForm.adminEmail}</strong>.
                  El administrador ya puede iniciar sesión con ese correo y la contraseña asignada.
                </p>
                <Button className="w-full justify-center" onClick={closeCreateModal}>Listo</Button>
              </div>
            ) : (
              <>
                <DialogHeader className="mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                      <Building className="w-5 h-5" style={{ color: "#60A5FA" }} />
                    </div>
                    <DialogTitle style={{ color: "var(--text-primary)" }} className="text-lg font-bold">Nuevo Negocio</DialogTitle>
                  </div>
                  <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                    Registra el negocio y su primera cuenta de administrador.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Datos del negocio</p>
                    <div>
                      <Label htmlFor="create-name">Nombre del negocio *</Label>
                      <Input
                        id="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ej. Parqueadero Central"
                        disabled={!!createdTenant}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="create-email">Email de contacto</Label>
                        <Input
                          id="create-email"
                          type="email"
                          value={createForm.contactEmail}
                          onChange={(e) => setCreateForm((p) => ({ ...p, contactEmail: e.target.value }))}
                          placeholder="contacto@negocio.com"
                          disabled={!!createdTenant}
                        />
                      </div>
                      <div>
                        <Label htmlFor="create-phone">Teléfono de contacto</Label>
                        <Input
                          id="create-phone"
                          type="tel"
                          value={createForm.contactPhone}
                          onChange={(e) => setCreateForm((p) => ({ ...p, contactPhone: e.target.value }))}
                          placeholder="300 123 4567"
                          disabled={!!createdTenant}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider pt-4" style={{ color: "var(--text-dim)" }}>Administrador inicial</p>
                    <div>
                      <Label htmlFor="create-admin-name">Nombre completo *</Label>
                      <Input
                        id="create-admin-name"
                        value={createForm.adminFullName}
                        onChange={(e) => setCreateForm((p) => ({ ...p, adminFullName: e.target.value }))}
                        placeholder="Ej. María Gómez"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-admin-email">Email *</Label>
                      <Input
                        id="create-admin-email"
                        type="email"
                        value={createForm.adminEmail}
                        onChange={(e) => setCreateForm((p) => ({ ...p, adminEmail: e.target.value }))}
                        placeholder="admin@negocio.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-admin-password">Contraseña *</Label>
                      <Input
                        id="create-admin-password"
                        type="password"
                        autoComplete="new-password"
                        value={createForm.adminPassword}
                        onChange={(e) => setCreateForm((p) => ({ ...p, adminPassword: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <NoticeBox notice={createError} />

                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="outline" className="flex-1 justify-center" disabled={createSaving} onClick={closeCreateModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 justify-center" disabled={createSaving}>
                      {createSaving ? "Creando..." : "Crear negocio"}
                    </Button>
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
