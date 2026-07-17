import type { Vehicle } from "@/lib/api";

export const vehicleTypeLabel: Record<string, string> = { car: "Carro", moto: "Moto", truck: "Camión" };

export const vehicleStatusConfig = {
  active:   { label: "Activo",   bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  color: "#34D399", dot: "#10B981" },
  inactive: { label: "Inactivo", bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.3)",  color: "var(--text-secondary)", dot: "#64748B" },
};

export const membershipStatusConfig = {
  active:    { label: "Al día",      bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",   color: "#34D399" },
  expired:   { label: "Vencida",     bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",    color: "#FCA5A5" },
  cancelled: { label: "Cancelada",   bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)", color: "var(--text-secondary)" },
  none:      { label: "Sin mensual.", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  color: "#FCD34D" },
};

export const BRAND_OPTIONS = ["Chevrolet","Renault","Mazda","Toyota","Nissan","Kia","Hyundai","Ford","Volkswagen","Honda","Suzuki","Mitsubishi","Jeep","Ram","Dodge"];
export const COLOR_OPTIONS  = ["Blanco","Negro","Gris","Plateado","Rojo","Azul","Verde","Amarillo","Naranja","Café","Beige","Morado"];
export const BRANDS = [...BRAND_OPTIONS, "Otra"];
export const COLORS = [...COLOR_OPTIONS, "Otro"];

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function initBrand(v: Vehicle): string {
  if (!v.brand) return "";
  return BRAND_OPTIONS.includes(v.brand) ? v.brand : "Otra";
}
export function initBrandCustom(v: Vehicle): string {
  if (!v.brand || BRAND_OPTIONS.includes(v.brand)) return "";
  return v.brand;
}
export function initColor(v: Vehicle): string {
  if (!v.color) return "";
  return COLOR_OPTIONS.includes(v.color) ? v.color : "Otro";
}
export function initColorCustom(v: Vehicle): string {
  if (!v.color || COLOR_OPTIONS.includes(v.color)) return "";
  return v.color;
}
