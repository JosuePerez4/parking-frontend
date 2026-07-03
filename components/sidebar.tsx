"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/parking",
    label: "Parking Activo",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    ),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/vehiculos",
    label: "Vehículos",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/mensualidades",
    label: "Mensualidades",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/tarifas",
    label: "Tarifas",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-soft)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>Parking IA</p>
          <p className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>Gestión de parqueaderos</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p
          className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          Principal
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group"
              style={{
                backgroundColor: isActive ? "rgba(37, 99, 235, 0.15)" : "transparent",
                color: isActive ? "#60A5FA" : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span style={{ color: isActive ? "#2563EB" : "inherit" }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#2563EB" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 mb-3"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-input)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <span style={{ color: isLight ? "#F59E0B" : "#60A5FA" }}>
            {isLight ? <SunIcon /> : <MoonIcon />}
          </span>
          <span className="flex-1 text-left">
            {isLight ? "Modo claro" : "Modo oscuro"}
          </span>
          {/* Toggle pill */}
          <span
            className="relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ backgroundColor: isLight ? "#2563EB" : "rgba(255,255,255,0.15)" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
              style={{
                backgroundColor: "#fff",
                transform: isLight ? "translateX(18px)" : "translateX(2px)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          >
            P
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>Admin</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>Parking IA</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
