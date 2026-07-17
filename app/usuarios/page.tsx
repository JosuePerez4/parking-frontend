"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listUsers, createUser, updateUser, deactivateUser,
  type AppUser, type CreateUserDto,
} from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, errorNotice, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { Plus, AlertCircle, Users, User, SquarePen, CircleMinus } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

type CreateOperatorForm = Omit<CreateUserDto, "tenantId" | "role">;
type EditUserForm = { fullName: string; status: "active" | "inactive" };

const EMPTY_CREATE_FORM: CreateOperatorForm = { fullName: "", email: "", password: "" };

const roleLabel: Record<AppUser["role"], string> = {
  platform_admin: "Admin plataforma",
  business_admin: "Admin negocio",
  operator: "Operador",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  // Backend interceptor returns "DD/MM/YYYY HH:mm:ss"
  const datePart = dateStr.split(" ")[0];
  if (datePart?.includes("/")) return datePart;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-0">
      <div className="flex items-center gap-4 px-1 pb-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        {[160, 140, 100, 90, 100, 120].map((w, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: w, backgroundColor: "var(--bg-input)" }} />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4" style={{ borderBottom: i < 3 ? "1px solid var(--border-row)" : "none" }}>
          <div className="flex items-center gap-3" style={{ minWidth: 160 }}>
            <Skeleton className="w-8 h-8 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
            <Skeleton className="h-3 w-28 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          </div>
          <Skeleton className="h-3 w-32 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-6 w-24 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-6 w-16 rounded-full" style={{ backgroundColor: "var(--bg-input)" }} />
          <Skeleton className="h-3 w-20 rounded" style={{ backgroundColor: "var(--bg-input)" }} />
        </div>
      ))}
    </div>
  );
}

export default function UsuariosPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateOperatorForm>(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<SubmitNotice | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ fullName: "", status: "active" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<SubmitNotice | null>(null);

  // Deactivate modal
  const [deactivateTarget, setDeactivateTarget] = useState<AppUser | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<SubmitNotice | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await listUsers(tenantId);
      // No mostrar al propio usuario logueado: no tiene sentido que se edite/desactive a sí mismo aquí.
      setUsers(all.filter((u) => u.id !== session!.user.id));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, session]);

  // Carga inicial al montar — load() actualiza estado de forma asíncrona, no en el cuerpo del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      setCreateError(errorNotice("Nombre, email y contraseña son obligatorios."));
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createUser({ ...createForm, tenantId, role: "operator" });
      closeCreateModal();
      await load();
    } catch (err: unknown) {
      setCreateError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setCreating(false);
    }
  }

  function openEdit(user: AppUser) {
    setEditTarget(user);
    setEditForm({ fullName: user.fullName, status: user.status });
    setEditError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.fullName) {
      setEditError(errorNotice("El nombre completo es obligatorio."));
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateUser(editTarget.id, editForm);
      setEditTarget(null);
      await load();
    } catch (err: unknown) {
      setEditError(describeSubmitError(err));
      if (isUnconfirmed(err)) await load();
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateUser(deactivateTarget.id);
      setDeactivateTarget(null);
      await load();
    } catch (err: unknown) {
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
          <h1 className="text-2xl font-bold text-white mb-1">Usuarios</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Gestiona los operadores de tu negocio</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setCreateForm(EMPTY_CREATE_FORM); setCreateError(null); }}>
          <Plus className="w-4 h-4" />
          Crear operador
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
              <Users className="w-6 h-6" style={{ color: "#2563EB" }} />
            </div>
            <p className="text-white font-semibold mb-1">Sin usuarios</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Crea el primer operador con el botón superior</p>
          </div>
        ) : (
          <div>
            {/* Tabla (desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    {["Usuario", "Email", "Rol", "Estado", "Creado", ""].map((col) => (
                      <th key={col} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border-row)" : "none" }}
                      className="transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-row-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-white leading-tight">{u.fullName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{u.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary">{roleLabel[u.role]}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={u.status === "active" ? "default" : "destructive"}>
                          {u.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Editar</Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={u.status === "inactive"}
                            onClick={() => { setDeactivateError(null); setDeactivateTarget(u); }}
                          >
                            Desactivar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (móvil) */}
            <div className="md:hidden p-4 space-y-3">
              {users.map((u) => (
                <div key={u.id} className="rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white leading-tight truncate">{u.fullName}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                      </div>
                    </div>
                    <Badge variant={u.status === "active" ? "default" : "destructive"}>
                      {u.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-1" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Rol</span>
                      <Badge variant="secondary">{roleLabel[u.role]}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Creado</span>
                      <span className="text-sm text-right" style={{ color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Editar</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={u.status === "inactive"}
                      onClick={() => { setDeactivateError(null); setDeactivateTarget(u); }}
                    >
                      Desactivar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>{users.length} usuario{users.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!creating && !v) closeCreateModal(); }}>
        <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden"
          style={{ background: "var(--bg-modal)", backdropFilter: "blur(20px)", border: "1px solid var(--border-medium)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)" }} />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}>
                  <User className="w-5 h-5" style={{ color: "#60A5FA" }} />
                </div>
                <DialogTitle className="text-lg font-bold text-white">Crear Operador</DialogTitle>
              </div>
              <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                El nuevo usuario podrá acceder con rol de operador (Parking, Clientes, Vehículos, Mensualidades).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="op-fullname">Nombre completo *</Label>
                <Input
                  id="op-fullname"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ej. Carlos Gómez"
                />
              </div>
              <div>
                <Label htmlFor="op-email">Email *</Label>
                <Input
                  id="op-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="operador@negocio.com"
                />
              </div>
              <div>
                <Label htmlFor="op-password">Contraseña *</Label>
                <Input
                  id="op-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <NoticeBox notice={createError} />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1 justify-center" disabled={creating} onClick={closeCreateModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 justify-center" disabled={creating}>
                  {creating ? "Creando..." : "Crear Operador"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
                  <SquarePen className="w-5 h-5" style={{ color: "#FCD34D" }} />
                </div>
                <DialogTitle className="text-lg font-bold text-white">Editar Usuario</DialogTitle>
              </div>
              <DialogDescription style={{ color: "var(--text-muted)" }} className="text-sm">
                {editTarget?.email} · el rol de operador no se puede cambiar aquí
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-fullname">Nombre completo *</Label>
                <Input
                  id="edit-fullname"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ej. Carlos Gómez"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Estado</Label>
                <CustomSelect
                  value={editForm.status}
                  onChange={(v) => setEditForm((p) => ({ ...p, status: v as "active" | "inactive" }))}
                  options={STATUS_OPTIONS}
                />
              </div>
              <NoticeBox notice={editError} />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1 justify-center" disabled={editSaving} onClick={() => setEditTarget(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 justify-center" disabled={editSaving}>
                  {editSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deactivating) setDeactivateTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-modal)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <CircleMinus className="w-5 h-5" style={{ color: "#F87171" }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">¿Desactivar este usuario?</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Perderá acceso al sistema, pero sus datos se conservan</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm text-white font-medium mb-1">{deactivateTarget.fullName}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{deactivateTarget.email}</p>
              </div>
              <NoticeBox notice={deactivateError} className="mb-4" />
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 justify-center" disabled={deactivating} onClick={() => setDeactivateTarget(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1 justify-center" disabled={deactivating} onClick={handleDeactivate}>
                  {deactivating ? "Desactivando..." : "Sí, desactivar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
