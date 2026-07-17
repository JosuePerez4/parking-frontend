"use client";

import { useEffect, useState, useCallback } from "react";
import { getClients, updateClient, deleteClient, type Client, type CreateClientDto, type UpdateClientDto } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Dialog } from "@/components/ui/dialog";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, errorNotice, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientFilters } from "@/components/clients/ClientFilters";
import { Plus, AlertCircle, Loader2, Trash2 } from "lucide-react";

export default function ClientesPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch = !search ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.document.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleCreateSubmit(_data: CreateClientDto | UpdateClientDto) {
    setCreateOpen(false);
    await load();
  }

  async function handleEditSubmit(data: UpdateClientDto) {
    if (!editTarget) return;
    if (!data.fullName || !data.document || !data.phone) {
      throw errorNotice("Nombre, documento y teléfono son obligatorios.");
    }
    setEditSaving(true);
    try {
      await updateClient(editTarget.id, data, tenantId);
      setEditTarget(null);
      await load();
    } catch (err: unknown) {
      setEditSaving(false);
      throw err;
    } finally {
      setEditSaving(false);
    }
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

  function openEdit(client: Client) {
    setEditTarget(client);
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clientes</h1>
          <p className="text-sm text-text-secondary">Gestiona los clientes registrados en el sistema</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <ClientFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Table */}
      <ClientTable
        clients={filteredClients}
        loading={loading}
        onEdit={openEdit}
        onDelete={(c) => { setDeleteError(null); setDeleteTarget(c); }}
      />

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!editSaving && !v) setEditTarget(null); }}>
        {editTarget && (
          <ClientForm
            mode="edit"
            initialData={{
              fullName: editTarget.fullName,
              document: editTarget.document,
              phone: editTarget.phone ?? "",
              email: editTarget.email ?? "",
              address: editTarget.address ?? "",
              status: editTarget.status,
              id: editTarget.id,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditTarget(null)}
            loading={editSaving}
          />
        )}
      </Dialog>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-modal"
            style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#EF4444,#DC2626)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <Trash2 className="w-5 h-5" style={{ color: "#F87171" }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">¿Desactivar este cliente?</h2>
                  <p className="text-xs mt-0.5 text-text-muted">Sus datos se conservan, no se borra nada</p>
                </div>
              </div>
              <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm text-white font-medium mb-1">{deleteTarget.fullName}</p>
                <p className="text-xs text-text-secondary">Doc: {deleteTarget.document}</p>
                <p className="text-xs mt-2" style={{ color: "#F87171" }}>
                  También se desactivarán sus vehículos y mensualidades. Dejarán de aparecer en los listados, pero la información queda guardada.
                </p>
              </div>
              <NoticeBox notice={deleteError} className="mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 bg-page-input border border-border-medium text-text-secondary">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: deleting ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", border: "1px solid rgba(239,68,68,0.4)" }}>
                  {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Desactivando...</>
                  ) : "Sí, desactivar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) setCreateOpen(false); }}>
        <ClientForm
          mode="create"
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateOpen(false)}
          loading={false}
        />
      </Dialog>
    </div>
  );
}
