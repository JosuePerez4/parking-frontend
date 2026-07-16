"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings, type AppSettings } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

const EMPTY_SETTINGS: Omit<AppSettings, "id" | "tenantId"> = {
  fraccionCarro: 0,
  horaCarro: 0,
  medioDiaCarro: 0,
  diaCarro: 0,
  mensualidadCarro: 0,
  fraccionMoto: 0,
  horaMoto: 0,
  medioDiaMoto: 0,
  diaMoto: 0,
  mensualidadMoto: 0,
};

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);
}

interface TarifaRow {
  key: keyof AppSettings;
  label: string;
  description: string;
}

const carroRows: TarifaRow[] = [
  { key: "fraccionCarro",   label: "Fracción (≤15 min)",  description: "Cobro mínimo de entrada" },
  { key: "horaCarro",       label: "Hora (≤60 min)",      description: "Hasta una hora completa" },
  { key: "medioDiaCarro",   label: "Medio día (≤6 h)",    description: "Hasta seis horas" },
  { key: "diaCarro",        label: "Día (≤12 h)",         description: "Hasta doce horas" },
  { key: "mensualidadCarro",label: "Mensualidad",         description: "Tarifa mensual fija" },
];

const motoRows: TarifaRow[] = [
  { key: "fraccionMoto",    label: "Fracción (≤15 min)",  description: "Cobro mínimo de entrada" },
  { key: "horaMoto",        label: "Hora (≤60 min)",      description: "Hasta una hora completa" },
  { key: "medioDiaMoto",    label: "Medio día (≤6 h)",    description: "Hasta seis horas" },
  { key: "diaMoto",         label: "Día (≤12 h)",         description: "Hasta doce horas" },
  { key: "mensualidadMoto", label: "Mensualidad",         description: "Tarifa mensual fija" },
];

function TarifaSection({ title, rows, accent, settings, form, onChange }: {
  title: string;
  rows: TarifaRow[];
  accent: string;
  settings: AppSettings | null;
  form: Partial<AppSettings>;
  onChange: (key: keyof AppSettings, value: string) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden card-hover"
      style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)" }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}1a`, border: `1px solid ${accent}33` }}>
          <svg className="w-4 h-4" style={{ color: accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--bg-row-hover)" }}>
        {rows.map((row) => (
          <div key={row.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{row.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{row.description}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
              {settings && (
                <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
                  actual: {formatCOP(settings[row.key] as number)}
                </span>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={(form[row.key] as number) ?? ""}
                  onChange={(e) => onChange(row.key, e.target.value)}
                  className="pl-6 pr-3 py-2 rounded-lg text-sm outline-none w-32 text-right transition-colors duration-150"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-medium)", color: "var(--text-primary)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.6)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TarifasPage() {
  const { session } = useAuth();
  const tenantId = session!.user.tenantId!;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [form, setForm] = useState<Partial<AppSettings>>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings(tenantId)
      .then((s) => { setSettings(s); setForm(s ?? EMPTY_SETTINGS); })
      .catch(() => setError("No se pudo cargar la configuración."))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function handleChange(key: keyof AppSettings, value: string) {
    const digits = value.replace(/\D/g, "");
    const num = parseInt(digits, 10);
    setForm((p) => ({ ...p, [key]: isNaN(num) ? 0 : num }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettings(tenantId, form);
      setSettings(updated);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error al guardar las tarifas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Tarifas</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Configura los precios por tipo de vehículo y tiempo de permanencia
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          {error}
        </div>
      )}

      {/* Negocio nuevo: aún no hay tarifas configuradas. Damos la bienvenida en
          vez de mostrar un error. */}
      {!loading && !error && !settings && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-start gap-3"
          style={{ backgroundColor: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)", color: "#93C5FD" }}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <p className="font-semibold text-white mb-0.5">¡Bienvenido! 👋</p>
            <p>Aún no has configurado las tarifas de tu negocio. Ingresa los precios por tipo de vehículo y guárdalos para empezar a operar.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="w-8 h-8 animate-spin" style={{ color: "#2563EB" }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <TarifaSection title="Carro / Taxi" rows={carroRows} accent="#2563EB" settings={settings} form={form} onChange={handleChange} />
          <TarifaSection title="Moto" rows={motoRows} accent="#7C3AED" settings={settings} form={form} onChange={handleChange} />

          <div className="flex items-center justify-end gap-4">
            {saved && (
              <span className="text-sm flex items-center gap-1.5" style={{ color: "#34D399" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Tarifas guardadas
              </span>
            )}
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "1px solid rgba(37,99,235,0.5)" }}>
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>Guardando...</>
              ) : (
                <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>Guardar Tarifas</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
