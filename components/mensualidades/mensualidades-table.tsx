"use client";

import { type Membership } from "@/lib/api";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatCOP(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(num);
}

const vehicleTypeLabel: Record<string, string> = {
  car: "Carro",
  moto: "Moto",
  truck: "Camión",
};

const statusConfig = {
  active: {
    label: "Activa",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
    color: "#34D399",
    dot: "#10B981",
  },
  expired: {
    label: "Vencida",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.35)",
    color: "#FCA5A5",
    dot: "#EF4444",
  },
  cancelled: {
    label: "Cancelada",
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.3)",
    color: "var(--text-secondary)",
    dot: "#64748B",
  },
};

interface MensualidadesTableProps {
  memberships: Membership[];
  expiringIds: number[];
  onRenew: (m: Membership) => void;
  onDelete: (m: Membership) => void;
}

export function MensualidadesTable({ memberships, expiringIds, onRenew, onDelete }: MensualidadesTableProps) {
  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
        >
          <svg className="w-8 h-8" style={{ color: "#2563EB" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">Sin mensualidades</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No hay mensualidades en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
            {["Cliente", "Placa", "Tipo", "Empresa", "Inicio", "Vencimiento", "Estado", "Precio", "Acciones"].map((col) => (
              <th
                key={col}
                className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-dim)" }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberships.map((m, i) => {
            const isExpiring = expiringIds.includes(m.id);
            const status = statusConfig[m.status] ?? statusConfig.cancelled;
            const isLast = i === memberships.length - 1;

            return (
              <tr
                key={m.id}
                className="transition-colors duration-150"
                style={{
                  borderBottom: isLast ? "none" : "1px solid var(--border-row)",
                  backgroundColor: isExpiring ? "rgba(245, 158, 11, 0.04)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isExpiring
                    ? "rgba(245, 158, 11, 0.08)"
                    : "var(--bg-row-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isExpiring
                    ? "rgba(245, 158, 11, 0.04)"
                    : "transparent";
                }}
              >
                {/* Cliente */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
                    >
                      {m.client?.fullName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">
                        {m.client?.fullName ?? `Cliente #${m.clientId}`}
                      </p>
                      {m.client?.phone && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {m.client.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Placa */}
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
                    style={{
                      backgroundColor: "rgba(37, 99, 235, 0.12)",
                      border: "1px solid rgba(37, 99, 235, 0.3)",
                      color: "#93C5FD",
                      fontFamily: "monospace",
                    }}
                  >
                    {m.vehicle?.plate ?? `#${m.vehicleId}`}
                  </span>
                </td>

                {/* Tipo */}
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {vehicleTypeLabel[m.vehicle?.type ?? ""] ?? m.vehicle?.type ?? "—"}
                  </span>
                </td>

                {/* Empresa */}
                <td className="px-5 py-4">
                  {m.company ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#C4B5FD" }}>
                      {m.company}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--text-dim)" }}>—</span>
                  )}
                </td>

                {/* Inicio */}
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {formatDate(m.startDate)}
                  </span>
                </td>

                {/* Vencimiento */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {isExpiring && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{ color: isExpiring ? "#FCD34D" : "var(--text-secondary)" }}
                    >
                      {formatDate(m.endDate)}
                    </span>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: status.bg,
                      border: `1px solid ${status.border}`,
                      color: status.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: status.dot }}
                    />
                    {status.label}
                  </span>
                </td>

                {/* Precio */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatCOP(m.price)}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {m.status !== "cancelled" && (
                      <button
                        onClick={() => onRenew(m)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: "rgba(37, 99, 235, 0.15)",
                          border: "1px solid rgba(37, 99, 235, 0.3)",
                          color: "#60A5FA",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.28)";
                          e.currentTarget.style.color = "#93C5FD";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(37, 99, 235, 0.15)";
                          e.currentTarget.style.color = "#60A5FA";
                        }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Renovar
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(m)}
                      title="Desactivar mensualidad"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                      style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer count */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border-soft)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          {memberships.length} registro{memberships.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
