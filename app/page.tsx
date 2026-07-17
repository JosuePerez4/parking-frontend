"use client";

import Link from "next/link";
import { Calendar, CircleParking, Users, Car } from "lucide-react";

const cards = [
  {
    href: "/mensualidades",
    title: "Mensualidades",
    description: "Gestiona y renueva mensualidades de vehículos",
    color: "#2563EB",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    href: "/parking",
    title: "Parking Activo",
    description: "Monitorea los vehículos dentro del parqueadero",
    color: "#10B981",
    icon: <CircleParking className="w-6 h-6" />,
  },
  {
    href: "/clientes",
    title: "Clientes",
    description: "Administra los clientes registrados",
    color: "#8B5CF6",
    icon: <Users className="w-6 h-6" />,
  },
  {
    href: "/vehiculos",
    title: "Vehículos",
    description: "Consulta y gestiona vehículos registrados",
    color: "#F59E0B",
    icon: <Car className="w-6 h-6" />,
  },
];

export default function HomePage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-text-secondary">Bienvenido al sistema de gestión de Parking IA</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block rounded-2xl p-6 transition-all duration-200 cursor-pointer bg-page-card backdrop-blur border border-border-default"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = `${card.color}40`;
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-default)";
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-card)";
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              {card.icon}
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">{card.title}</h2>
            <p className="text-sm text-text-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
