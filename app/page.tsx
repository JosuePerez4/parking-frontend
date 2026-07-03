"use client";

import Link from "next/link";

const cards = [
  {
    href: "/mensualidades",
    title: "Mensualidades",
    description: "Gestiona y renueva mensualidades de vehículos",
    color: "#2563EB",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/parking",
    title: "Parking Activo",
    description: "Monitorea los vehículos dentro del parqueadero",
    color: "#10B981",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    title: "Clientes",
    description: "Administra los clientes registrados",
    color: "#8B5CF6",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/vehiculos",
    title: "Vehículos",
    description: "Consulta y gestiona vehículos registrados",
    color: "#F59E0B",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>Bienvenido al sistema de gestión de Parking IA</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block rounded-2xl p-6 transition-all duration-200 cursor-pointer"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-default)",
            }}
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
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
