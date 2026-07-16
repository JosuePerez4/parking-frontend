import type { CSSProperties } from "react";
import type { SubmitNotice } from "@/lib/submit-error";

const toneStyle: Record<SubmitNotice["tone"], CSSProperties> = {
  error: {
    backgroundColor: "rgba(239,68,68,0.1)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  warning: {
    backgroundColor: "rgba(245,158,11,0.1)",
    color: "#FCD34D",
    border: "1px solid rgba(245,158,11,0.35)",
  },
};

/**
 * Caja de aviso tras una operación. El color depende del tono:
 * rojo para fallos reales, ámbar para avisos (conflicto 409 o resultado
 * no confirmado por red/timeout).
 */
export function NoticeBox({
  notice,
  className = "",
}: {
  notice: SubmitNotice | null;
  className?: string;
}) {
  if (!notice) return null;
  return (
    <p
      className={`text-xs px-3 py-2 rounded-lg ${className}`}
      style={toneStyle[notice.tone]}
    >
      {notice.message}
    </p>
  );
}
