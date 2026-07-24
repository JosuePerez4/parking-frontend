"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CircleParking, Users, Car } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  getActiveVehicles,
  getMemberships,
  getClients,
  getVehicles,
  getExpiringMemberships,
} from "@/lib/api";

const cards = [
  {
    href: "/mensualidades",
    title: "Mensualidades",
    description: "Gestiona y renueva mensualidades de vehículos",
    color: "var(--primary)",
    icon: <Calendar className="w-6 h-6" />,
    metricKey: "memberships" as const,
    metricLabel: "activas",
  },
  {
    href: "/parking",
    title: "Parking Activo",
    description: "Monitorea los vehículos dentro del parqueadero",
    color: "var(--ok)",
    icon: <CircleParking className="w-6 h-6" />,
    metricKey: "activeVehicles" as const,
    metricLabel: "en parqueadero",
  },
  {
    href: "/clientes",
    title: "Clientes",
    description: "Administra los clientes registrados",
    color: "var(--text-secondary)",
    icon: <Users className="w-6 h-6" />,
    metricKey: "clients" as const,
    metricLabel: "registrados",
  },
  {
    href: "/vehiculos",
    title: "Vehículos",
    description: "Consulta y gestiona vehículos registrados",
    color: "var(--text-secondary)",
    icon: <Car className="w-6 h-6" />,
    metricKey: "vehicles" as const,
    metricLabel: "registrados",
  },
];

interface Metrics {
  activeVehicles: number | null;
  memberships: number | null;
  expiringMemberships: number | null;
  clients: number | null;
  vehicles: number | null;
}

export default function HomePage() {
  const { session } = useAuth();
  const tenantId = session?.user.tenantId;

  const [metrics, setMetrics] = useState<Metrics>({
    activeVehicles: null,
    memberships: null,
    expiringMemberships: null,
    clients: null,
    vehicles: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchMetrics() {
      try {
        const [active, memberships, expiring, clients, vehicles] =
          await Promise.all([
            getActiveVehicles(tenantId!),
            getMemberships(tenantId!),
            getExpiringMemberships(tenantId!),
            getClients(tenantId!),
            getVehicles(tenantId!),
          ]);

        setMetrics({
          activeVehicles: active.length,
          memberships: memberships.filter((m) => m.status === "active").length,
          expiringMemberships: expiring.length,
          clients: clients.length,
          vehicles: vehicles.length,
        });
      } catch {
        setMetrics({
          activeVehicles: null,
          memberships: null,
          expiringMemberships: null,
          clients: null,
          vehicles: null,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [tenantId]);

  function getMetricDisplay(card: (typeof cards)[number]) {
    if (loading) return "...";
    const value = metrics[card.metricKey];
    if (value === null) return "—";
    if (card.metricKey === "memberships" && metrics.expiringMemberships !== null) {
      return `${value} (${metrics.expiringMemberships} por vencer)`;
    }
    return value;
  }

  function getMetricLabel(card: (typeof cards)[number]) {
    if (card.metricKey === "memberships") return "activas";
    return card.metricLabel;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-text-secondary">
          Bienvenido al sistema de gestión de Parki
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block rounded-2xl p-6 transition-all duration-200 cursor-pointer bg-page-card backdrop-blur border border-border-default"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                `color-mix(in srgb, ${card.color} 40%, transparent)`;
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--bg-card)";
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: `color-mix(in srgb, ${card.color} 15%, transparent)`,
                color: card.color,
              }}
            >
              {card.icon}
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              {card.title}
            </h2>
            <p className="text-sm text-text-muted">{card.description}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span
                className="text-2xl font-bold"
                style={{ color: card.color }}
              >
                {getMetricDisplay(card)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {getMetricLabel(card)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
