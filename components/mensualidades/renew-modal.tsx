"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type Membership } from "@/lib/api";
import { RefreshCw, ArrowRight, Loader2 } from "lucide-react";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function addOneMonth(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  date.setMonth(date.getMonth() + 1);
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

interface RenewModalProps {
  membership: Membership | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function RenewModal({ membership, open, onClose, onConfirm, loading }: RenewModalProps) {
  if (!membership) return null;

  const newEndDate = addOneMonth(membership.endDate);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent
        className="sm:max-w-md border-0 p-0 overflow-hidden"
        style={{
          background: "var(--bg-modal)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-medium)",
        }}
      >
        {/* Header accent */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, #2563EB, #7C3AED)" }}
        />

        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(37, 99, 235, 0.15)", border: "1px solid rgba(37, 99, 235, 0.3)" }}
              >
                <RefreshCw className="w-5 h-5" style={{ color: "#60A5FA" }} />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Renovar Mensualidad
              </DialogTitle>
            </div>
            <DialogDescription style={{ color: "var(--text-secondary)" }} className="text-sm">
              Confirma la renovación de esta mensualidad por un mes adicional.
            </DialogDescription>
          </DialogHeader>

          {/* Info card */}
          <div
            className="rounded-xl p-4 mb-6 space-y-3"
            style={{
              backgroundColor: "var(--bg-row-hover)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Cliente</span>
              <span className="text-sm font-semibold text-white">
                {membership.client?.fullName ?? `#${membership.clientId}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Placa</span>
              <span
                className="text-xs font-bold tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "rgba(37, 99, 235, 0.15)",
                  color: "#93C5FD",
                  fontFamily: "monospace",
                }}
              >
                {membership.vehicle?.plate ?? `#${membership.vehicleId}`}
              </span>
            </div>
            <div
              className="border-t pt-3 flex justify-between items-center"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Vencimiento actual</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "#FCA5A5" }}>
                  {formatDate(membership.endDate)}
                </p>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: "var(--text-dim)" }} />
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nuevo vencimiento</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "#34D399" }}>
                  {newEndDate}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-medium)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "var(--bg-input)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-input)";
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: loading ? "rgba(37, 99, 235, 0.5)" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "#fff",
                border: "1px solid rgba(37, 99, 235, 0.5)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Renovando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Confirmar Renovación
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
