"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getVehicles, getClients, deleteVehicle, updateVehicle, createClient,
  type Vehicle, type Client, type CreateClientDto,
} from "@/lib/api";
import { UserPlus, CircleMinus, Car, X, SquarePen, Search, ChevronRight, Check, ChevronLeft, Loader2, AlertCircle, Users, User, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { CustomSelect } from "@/components/ui/custom-select";
import { Skeleton } from "@/components/ui/skeleton";
import { NoticeBox } from "@/components/ui/notice-box";
import { describeSubmitError, errorNotice, isUnconfirmed, type SubmitNotice } from "@/lib/submit-error";

// ── Static config ────────────────────────────────────────────────────────────
const vehicleTypeLabel: Record<string, string> = { car: "Carro", moto: "Moto", truck: "Camión" };

const vehicleStatusConfig = {
  active:   { label: "Activo",   bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  color: "#34D399", dot: "#10B981" },
  inactive: { label: "Inactivo", bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)",  color: "var(--text-secondary)", dot: "#64748B" },
};

const membershipStatusConfig = {
  active:    { label: "Al día",      bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",   color: "#34D399" },
  expired:   { label: "Vencida",     bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",    color: "#FCA5A5" },
  cancelled: { label: "Cancelada",   bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)", color: "var(--text-secondary)" },
  none:      { label: "Sin mensual.", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  color: "#FCD34D" },
};

const BRAND_OPTIONS = ["Chevrolet","Renault","Mazda","Toyota","Nissan","Kia","Hyundai","Ford","Volkswagen","Honda","Suzuki","Mitsubishi","Jeep","Ram","Dodge"];
const COLOR_OPTIONS  = ["Blanco","Negro","Gris","Plateado","Rojo","Azul","Verde","Amarillo","Naranja","Café","Beige","Morado"];
const BRANDS = [...BRAND_OPTIONS, "Otra"];
const COLORS = [...COLOR_OPTIONS, "Otro"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function initBrand(v: Vehicle): string {
  if (!v.brand) return "";
  return BRAND_OPTIONS.includes(v.brand) ? v.brand : "Otra";
}
function initBrandCustom(v: Vehicle): string {
  if (!v.brand || BRAND_OPTIONS.includes(v.brand)) return "";
  return v.brand;
}
function initColor(v: Vehicle): string {
  if (!v.color) return "";
  return COLOR_OPTIONS.includes(v.color) ? v.color : "Otro";
}
function initColorCustom(v: Vehicle): string {
  if (!v.color || COLOR_OPTIONS.includes(v.color)) return "";
  return v.color;
}

// ── Modal step types ─────────────────────────────────────────────────────────
type ModalStep = "s1" | "s2a" | "s2b" | "s3a" | "s3b" | "s4";

function stepNumber(s: ModalStep): number {
  if (s === "s1") return 1;
  if (s === "s2a" || s === "s2b") return 2;
  if (s === "s3a" || s === "s3b") return 3;
  return 4;
}

// ── Shared sub-components ────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="p-4 space-y-0">
      <div className="flex items-center gap-4 px-1 pb-3 border-b border-border-soft">
        {[80, 80, 110, 110, 80, 90, 100, 80].map((w, i) => (
          <Skeleton key={i} className="h-3 rounded bg-page-input" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4" style={{ borderBottom: i < 3 ? "1px solid var(--border-row)" : "none" }}>
          <Skeleton className="h-6 w-16 rounded-lg bg-blue-500/10" />
          <Skeleton className="h-3 w-14 rounded bg-page-input" />
          <Skeleton className="h-3 w-24 rounded bg-page-input" />
          <Skeleton className="h-3 w-24 rounded bg-page-input" />
          <Skeleton className="h-6 w-16 rounded-full bg-page-input" />
          <Skeleton className="h-6 w-20 rounded-full bg-page-input" />
          <Skeleton className="h-3 w-20 rounded bg-page-input" />
          <Skeleton className="h-6 w-24 rounded bg-page-input" />
        </div>
      ))}
    </div>
  );
}

function VehiclePlate({ v }: { v: Vehicle }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider bg-blue-500/[0.12] border border-blue-500/30 text-blue-300 font-mono">
      {v.plate}
    </span>
  );
}

function VehicleOwner({ v }: { v: Vehicle }) {
  if (!v.client) return <span className="text-sm text-text-dim">Sin asignar</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
        {v.client.fullName.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm text-white">{v.client.fullName}</span>
    </div>
  );
}

function VehicleStatusBadge({ v }: { v: Vehicle }) {
  const vSt = vehicleStatusConfig[v.status] ?? vehicleStatusConfig.inactive;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: vSt.bg, border: `1px solid ${vSt.border}`, color: vSt.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vSt.dot }} />
      {vSt.label}
    </span>
  );
}

function VehicleMembershipBadge({ v }: { v: Vehicle }) {
  const mKey = (v.membership?.status ?? "none") as keyof typeof membershipStatusConfig;
  const mSt = membershipStatusConfig[mKey] ?? membershipStatusConfig.none;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: mSt.bg, border: `1px solid ${mSt.border}`, color: mSt.color }}>
      {mSt.label}
    </span>
  );
}

function VehicleActions({ v, onAssign, onDelete }: { v: Vehicle; onAssign: (v: Vehicle) => void; onDelete: (v: Vehicle) => void }) {
  return (
    <>
      <button onClick={() => onAssign(v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 bg-page-subtle border border-border-medium text-text-muted"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-input)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
        <UserPlus className="w-4 h-4" />
        Asignar
      </button>
      <button onClick={() => onDelete(v)} title="Desactivar vehículo"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 bg-red-500/[0.08] border border-red-500/20 text-red-400"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}>
        <CircleMinus className="w-4 h-4" />
      </button>
    </>
  );
}

function VehicleCardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function VehicleTable({
  vehicles, emptyText, onAssign, onDelete,
}: {
  vehicles: Vehicle[];
  emptyText: string;
  onAssign: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm font-medium text-white mb-1">Sin vehículos</p>
        <p className="text-xs text-text-muted">{emptyText}</p>
      </div>
    );
  }
  return (
    <div>
      {/* Tabla (desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-soft">
              {["Placa", "Tipo", "Marca / Color", "Propietario", "Estado", "Mensualidad", "Vencimiento", ""].map((col, i) => (
                <th key={i} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => (
              <tr key={v.id} className="transition-colors duration-150"
                style={{ borderBottom: i < vehicles.length - 1 ? "1px solid var(--border-row)" : "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-row-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                <td className="px-5 py-4"><VehiclePlate v={v} /></td>
                <td className="px-5 py-4">
                  <span className="text-sm text-text-secondary">{vehicleTypeLabel[v.type] ?? v.type}</span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-white font-medium leading-tight">{v.brand || "—"}</p>
                  {v.color && <p className="text-xs mt-0.5 text-text-muted">{v.color}</p>}
                </td>
                <td className="px-5 py-4"><VehicleOwner v={v} /></td>
                <td className="px-5 py-4"><VehicleStatusBadge v={v} /></td>
                <td className="px-5 py-4"><VehicleMembershipBadge v={v} /></td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: v.membership?.status === "expired" ? "#FCA5A5" : "var(--text-muted)" }}>
                    {v.membership?.endDate ? formatDate(v.membership.endDate) : "—"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <VehicleActions v={v} onAssign={onAssign} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas (móvil) */}
      <div className="md:hidden p-4 space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="rounded-xl p-4 space-y-3 bg-page-card border border-border-default">
            <div className="flex items-start justify-between gap-3">
              <div>
                <VehiclePlate v={v} />
                <p className="text-sm text-white font-medium mt-2 leading-tight">{v.brand || "—"}</p>
                <p className="text-xs mt-0.5 text-text-muted">
                  {vehicleTypeLabel[v.type] ?? v.type}{v.color ? ` · ${v.color}` : ""}
                </p>
              </div>
              <VehicleStatusBadge v={v} />
            </div>
            <div className="space-y-2 pt-1 border-t border-border-soft">
              <VehicleCardRow label="Propietario"><VehicleOwner v={v} /></VehicleCardRow>
              <VehicleCardRow label="Mensualidad"><VehicleMembershipBadge v={v} /></VehicleCardRow>
              <VehicleCardRow label="Vencimiento">
                <span className="text-sm" style={{ color: v.membership?.status === "expired" ? "#FCA5A5" : "var(--text-muted)" }}>
                  {v.membership?.endDate ? formatDate(v.membership.endDate) : "—"}
                </span>
              </VehicleCardRow>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <VehicleActions v={v} onAssign={onAssign} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border-soft">
        <p className="text-xs text-text-dim">
          {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

// ── BrandColorFields ─────────────────────────────────────────────────────────
function BrandColorFields({
  brand, setBrand, brandCustom, setBrandCustom,
  color, setColor, colorCustom, setColorCustom,
  disabled,
}: {
  brand: string; setBrand: (v: string) => void;
  brandCustom: string; setBrandCustom: (v: string) => void;
  color: string; setColor: (v: string) => void;
  colorCustom: string; setColorCustom: (v: string) => void;
  disabled: boolean;
}) {
  const inputCls = "w-full mt-2 px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-colors bg-page-input border border-border-medium";
  const brandOpts = BRANDS.map((b) => ({ value: b, label: b }));
  const colorOpts = COLORS.map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-text-secondary">Marca</label>
        <CustomSelect
          value={brand}
          onChange={(v) => { setBrand(String(v)); if (String(v) !== "Otra") setBrandCustom(""); }}
          options={[{ value: "", label: "Seleccionar marca..." }, ...brandOpts]}
          placeholder="Seleccionar marca..."
          disabled={disabled}
        />
        {brand === "Otra" && (
          <input
            className={inputCls}
            value={brandCustom}
            onChange={(e) => setBrandCustom(e.target.value)}
            placeholder="Escribe la marca..."
            disabled={disabled}
          />
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-text-secondary">Color</label>
        <CustomSelect
          value={color}
          onChange={(v) => { setColor(String(v)); if (String(v) !== "Otro") setColorCustom(""); }}
          options={[{ value: "", label: "Seleccionar color..." }, ...colorOpts]}
          placeholder="Seleccionar color..."
          disabled={disabled}
        />
        {color === "Otro" && (
          <input
            className={inputCls}
            value={colorCustom}
            onChange={(e) => setColorCustom(e.target.value)}
            placeholder="Escribe el color..."
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

// ── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number | null }) {
  const count = total ?? 1;
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const done = i + 1 < current;
          const active = i + 1 === current;
          return (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: active ? "22px" : "8px",
                height: "8px",
                backgroundColor: done || active ? "#2563EB" : "var(--border-medium)",
                opacity: done ? 0.6 : 1,
              }} />
          );
        })}
      </div>
      <span className="text-xs font-semibold text-text-muted">
        Paso {current}{total ? ` de ${total}` : ""}
      </span>
    </div>
  );
}

// ── SmartAssignModal ──────────────────────────────────────────────────────────
function SmartAssignModal({
  vehicle, clients, tenantId, onClose, onDone,
}: {
  vehicle: Vehicle;
  clients: Client[];
  tenantId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();

  // Flow state
  const [step, setStep]               = useState<ModalStep>("s1");
  const [totalSteps, setTotalSteps]   = useState<number | null>(null);
  const [step3Variant, setStep3Variant] = useState<"s3a" | "s3b" | null>(null);

  // Brand / color (shared between s2a and s4)
  const [brand, setBrand]           = useState(initBrand(vehicle));
  const [brandCustom, setBrandCustom] = useState(initBrandCustom(vehicle));
  const [color, setColor]           = useState(initColor(vehicle));
  const [colorCustom, setColorCustom] = useState(initColorCustom(vehicle));

  // s3a — search existing client
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");

  // s3b — new client form
  const [newClient, setNewClient] = useState<Omit<CreateClientDto, "tenantId">>({
    fullName: "", document: "", phone: "", email: "", address: "",
  });

  // resolved after s3a or s3b
  const [resolvedClientId, setResolvedClientId] = useState<number | null>(null);

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<SubmitNotice | null>(null);

  // Derived
  const effectiveBrand = brand === "Otra"  ? brandCustom.trim() : brand;
  const effectiveColor = color === "Otro"  ? colorCustom.trim() : color;

  function goBack() {
    setError(null);
    if (step === "s2a" || step === "s2b") { setStep("s1"); return; }
    if (step === "s3a" || step === "s3b") { setStep("s2b"); return; }
    if (step === "s4" && step3Variant) setStep(step3Variant);
  }

  // ── Step handlers ──────────────────────────────────────────────────────────
  function handleS1No()  { setTotalSteps(2); setStep("s2a"); setError(null); }
  function handleS1Yes() { setTotalSteps(4); setStep("s2b"); setError(null); }

  function handleS2bExisting() { setStep3Variant("s3a"); setStep("s3a"); setError(null); }
  function handleS2bNew()      { setStep3Variant("s3b"); setStep("s3b"); setError(null); }

  function handleS3aNext() {
    if (!selectedClientId) { setError(errorNotice("Selecciona un cliente para continuar.")); return; }
    setResolvedClientId(selectedClientId as number);
    setStep("s4");
    setError(null);
  }

  async function handleS3bNext() {
    if (!newClient.fullName.trim() || !newClient.document.trim()) {
      setError(errorNotice("Nombre y documento son obligatorios."));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createClient({ ...newClient, tenantId });
      setResolvedClientId(created.id);
      setStep("s4");
    } catch (e: unknown) {
      // Sin confirmación (red/timeout) mostramos el aviso y dejamos el modal
      // abierto para que el operador verifique antes de reintentar.
      setError(describeSubmitError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleS2aSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: { brand?: string; color?: string } = {};
      if (effectiveBrand) payload.brand = effectiveBrand;
      if (effectiveColor) payload.color = effectiveColor;
      await updateVehicle(vehicle.id, payload, tenantId);
      onDone();
    } catch (e: unknown) {
      setError(describeSubmitError(e));
      setSaving(false);
    }
  }

  async function handleS4Save() {
    if (!resolvedClientId) return;
    setSaving(true);
    setError(null);
    try {
      const payload: { clientId: number; brand?: string; color?: string } = { clientId: resolvedClientId };
      if (effectiveBrand) payload.brand = effectiveBrand;
      if (effectiveColor) payload.color = effectiveColor;
      await updateVehicle(vehicle.id, payload, tenantId);
      onDone();
      router.push(`/mensualidades?vehicleId=${vehicle.id}`);
    } catch (e: unknown) {
      setError(describeSubmitError(e));
      setSaving(false);
    }
  }

  // ── Filtered clients for s3a ───────────────────────────────────────────────
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return !q || c.fullName.toLowerCase().includes(q) || c.document.includes(q);
  });
  const clientOptions = filteredClients.map((c) => ({
    value: c.id,
    label: `${c.fullName} — ${c.document}`,
  }));

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-colors bg-page-input border border-border-medium";

  const btnPrimary = {
    background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
    color: "#fff",
    border: "1px solid rgba(37,99,235,0.5)",
  };
  const btnGreen = {
    background: "linear-gradient(135deg,#059669,#047857)",
    color: "#fff",
    border: "1px solid rgba(5,150,105,0.5)",
  };

  // ── Step titles ────────────────────────────────────────────────────────────
  const stepTitles: Record<ModalStep, { title: string; sub: string }> = {
    s1:  { title: "¿Registrar para mensualidad?", sub: "Elige cómo continuar con este vehículo" },
    s2a: { title: "Actualizar datos del vehículo", sub: "Solo se guardará marca y color" },
    s2b: { title: "¿El cliente ya existe?", sub: "Elige cómo vincular el propietario" },
    s3a: { title: "Buscar cliente existente", sub: "Selecciona al propietario del vehículo" },
    s3b: { title: "Registrar nuevo cliente", sub: "Ingresa los datos del propietario" },
    s4:  { title: "Datos del vehículo", sub: "Último paso — luego se abrirá la mensualidad" },
  };

  const { title, sub } = stepTitles[step];
  const currentNum = stepNumber(step);
  const canGoBack = step !== "s1";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col bg-page-modal border border-border-medium max-h-[90vh]">

        {/* Gradient bar */}
        <div className="h-1 w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg,#2563EB,#7C3AED)" }} />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Plate badge + close */}
          <div className="flex items-start justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider bg-blue-500/[0.12] border border-blue-500/30 text-blue-300 font-mono">
              <Car className="w-4 h-4" />
              {vehicle.plate}
            </span>
            <button onClick={onClose} disabled={saving}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 text-text-muted"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-input)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicator */}
          <StepIndicator current={currentNum} total={totalSteps} />

          {/* Step title */}
          <h2 className="text-base font-bold text-white mb-0.5">{title}</h2>
          <p className="text-xs mb-5 text-text-muted">{sub}</p>

          {/* ── Step content ── */}

          {/* S1 — Pregunta inicial */}
          {step === "s1" && (
            <div className="space-y-3">
              <button onClick={handleS1No}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 cursor-pointer bg-page-input border border-border-medium"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(100,116,139,0.5)"; e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.backgroundColor = "var(--bg-input)"; }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-500/15 border border-slate-500/30">
                  <SquarePen className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">No, solo actualizar datos</p>
                  <p className="text-xs mt-0.5 text-text-muted">Guardar marca y color del vehículo</p>
                </div>
              </button>

              <button onClick={handleS1Yes}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 cursor-pointer bg-blue-500/[0.08] border border-blue-500/25"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.5)"; e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.25)"; e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.08)"; }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-500/35">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-300">Sí, registrar para mensualidad</p>
                  <p className="text-xs mt-0.5 text-text-muted">Vincular cliente y crear mensualidad</p>
                </div>
              </button>
            </div>
          )}

          {/* S2A — Solo marca y color */}
          {step === "s2a" && (
            <>
              <BrandColorFields
                brand={brand} setBrand={setBrand}
                brandCustom={brandCustom} setBrandCustom={setBrandCustom}
                color={color} setColor={setColor}
                colorCustom={colorCustom} setColorCustom={setColorCustom}
                disabled={saving}
              />
              <NoticeBox notice={error} className="mt-3" />
              <button onClick={handleS2aSave} disabled={saving}
                className="w-full mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                style={btnPrimary}>
                {saving ? <Spinner /> : null}
                {saving ? "Guardando..." : "Guardar datos"}
              </button>
            </>
          )}

          {/* S2B — ¿Cliente existe? */}
          {step === "s2b" && (
            <div className="space-y-3">
              <button onClick={handleS2bExisting}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 cursor-pointer bg-emerald-500/[0.08] border border-emerald-500/25"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.08)"; }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/15 border border-emerald-500/35">
                  <Search className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Sí, buscar cliente existente</p>
                  <p className="text-xs mt-0.5 text-text-muted">Seleccionar de los clientes registrados</p>
                </div>
              </button>

              <button onClick={handleS2bNew}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150 cursor-pointer bg-violet-500/[0.08] border border-violet-500/25"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.08)"; }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-500/15 border border-violet-500/35">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-300">No, es cliente nuevo</p>
                  <p className="text-xs mt-0.5 text-text-muted">Registrar nuevo propietario</p>
                </div>
              </button>
            </div>
          )}

          {/* S3A — Buscar cliente existente */}
          {step === "s3a" && (
            <>
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  className={`${inputCls} pl-9`}
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setSelectedClientId(""); }}
                  placeholder="Filtrar por nombre o documento..."
                />
              </div>
              <CustomSelect
                value={selectedClientId}
                onChange={(v) => setSelectedClientId(v === "" ? "" : v as number)}
                options={[{ value: "", label: "Seleccionar cliente..." }, ...clientOptions]}
                placeholder="Seleccionar cliente..."
              />
              {selectedClientId !== "" && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                  {(() => {
                    const c = clients.find((x) => x.id === selectedClientId);
                    return c ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.fullName}</p>
                          <p className="text-xs text-text-muted">{c.document}{c.phone ? ` · ${c.phone}` : ""}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              <NoticeBox notice={error} className="mt-3" />
              <button onClick={handleS3aNext}
                className="w-full mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
                style={btnPrimary}>
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* S3B — Nuevo cliente */}
          {step === "s3b" && (
            <>
              <div className="space-y-3">
                {(["fullName","document","phone","email","address"] as (keyof Omit<CreateClientDto, "tenantId">)[]).map((field) => {
                  const labels: Record<keyof Omit<CreateClientDto, "tenantId">, string> = {
                    fullName: "Nombre completo *", document: "Documento *",
                    phone: "Teléfono", email: "Correo electrónico", address: "Dirección",
                  };
                  return (
                    <div key={field}>
                      <label className="block text-xs font-semibold mb-1.5 text-text-secondary">
                        {labels[field]}
                      </label>
                      <input
                        className={inputCls}
                        type={field === "email" ? "email" : "text"}
                        value={newClient[field]}
                        onChange={(e) => setNewClient((p) => ({ ...p, [field]: e.target.value }))}
                        placeholder={labels[field].replace(" *", "")}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
              <NoticeBox notice={error} className="mt-3" />
              <button onClick={handleS3bNext} disabled={saving}
                className="w-full mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                style={btnPrimary}>
                {saving ? <Spinner /> : null}
                {saving ? "Creando cliente..." : "Crear cliente y continuar"}
              </button>
            </>
          )}

          {/* S4 — Datos del vehículo + mensualidad */}
          {step === "s4" && (
            <>
              {resolvedClientId && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-3 bg-emerald-500/[0.08] border border-emerald-500/20">
                  {(() => {
                    const c = clients.find((x) => x.id === resolvedClientId);
                    return c ? (
                      <>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{c.fullName}</p>
                          <p className="text-xs text-text-muted">{c.document}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-white">Cliente #{resolvedClientId}</p>
                    );
                  })()}
                  <Check className="w-4 h-4 ml-auto flex-shrink-0 text-emerald-400" />
                </div>
              )}
              <BrandColorFields
                brand={brand} setBrand={setBrand}
                brandCustom={brandCustom} setBrandCustom={setBrandCustom}
                color={color} setColor={setColor}
                colorCustom={colorCustom} setColorCustom={setColorCustom}
                disabled={saving}
              />
              <NoticeBox notice={error} className="mt-3" />
              <button onClick={handleS4Save} disabled={saving}
                className="w-full mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                style={btnGreen}>
                {saving ? <Spinner /> : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar y crear mensualidad"}
              </button>
            </>
          )}

          {/* Back button */}
          {canGoBack && (
            <button onClick={goBack} disabled={saving}
              className="flex items-center gap-1.5 mt-4 text-xs cursor-pointer disabled:opacity-40 transition-colors text-text-muted"
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tiny helpers inside the modal ─────────────────────────────────────────────
function Spinner() {
  return (
    <Loader2 className="w-4 h-4 animate-spin" />
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Registrados",     value: stats.registered,     color: "#2563EB" },
            { label: "Visitantes",      value: stats.visitors,       color: "#7C3AED" },
            { label: "Con mensualidad", value: stats.withMembership, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 bg-page-card backdrop-blur border border-border-default">
              <p className="text-xs font-medium mb-1 text-text-muted">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa, propietario o marca..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none bg-page-subtle border border-border-default"
        />
      </div>

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

      {/* ── SmartAssignModal ── */}
      {assignTarget && (
        <SmartAssignModal
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
