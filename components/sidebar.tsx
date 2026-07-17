"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { Building, LayoutGrid, CircleParking, Users, Car, Calendar, DollarSign, BarChart3, UserPlus, Sun, Moon, LogOut } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Admin de plataforma",
  business_admin: "Admin del negocio",
  operator: "Operador",
};

type Role = "platform_admin" | "business_admin" | "operator";

const navItems: { href: string; label: string; roles: Role[]; icon: React.ReactNode }[] = [
  {
    href: "/admin",
    label: "Negocios",
    roles: ["platform_admin"],
    icon: <Building className="w-5 h-5" />,
  },
  {
    href: "/",
    label: "Dashboard",
    roles: ["business_admin", "operator"],
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    href: "/parking",
    label: "Parking Activo",
    roles: ["business_admin", "operator"],
    icon: <CircleParking className="w-5 h-5" />,
  },
  {
    href: "/clientes",
    label: "Clientes",
    roles: ["business_admin", "operator"],
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: "/vehiculos",
    label: "Vehículos",
    roles: ["business_admin", "operator"],
    icon: <Car className="w-5 h-5" />,
  },
  {
    href: "/mensualidades",
    label: "Mensualidades",
    roles: ["business_admin", "operator"],
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    href: "/tarifas",
    label: "Tarifas",
    roles: ["business_admin"],
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    href: "/reportes",
    label: "Reportes",
    roles: ["business_admin"],
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    roles: ["business_admin"],
    icon: <UserPlus className="w-5 h-5" />,
  },
];

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { session, logout } = useAuth();
  const isLight = theme === "light";
  const role = session?.user.role;
  const visibleNavItems = navItems.filter((item) => !role || item.roles.includes(role));

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 flex flex-col z-40 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} bg-page-sidebar border-r border-border-soft`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b border-border-soft"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          <CircleParking className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight text-text-primary">Parking IA</p>
          <p className="text-xs leading-tight text-text-muted">Gestión de parqueaderos</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p
          className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim"
        >
          Principal
        </p>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
                isActive
                  ? ""
                  : "bg-transparent text-text-secondary hover:bg-page-subtle hover:text-text-primary"
              }`}
              style={{
                backgroundColor: isActive ? "rgba(37, 99, 235, 0.15)" : undefined,
                color: isActive ? "#60A5FA" : undefined,
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
      <div className="px-4 py-4 border-t border-border-soft">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 mb-3 bg-page-subtle border border-border-default text-text-secondary hover:bg-page-input hover:text-text-primary"
        >
          <span style={{ color: isLight ? "#F59E0B" : "#60A5FA" }}>
            {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
            {session ? session.user.fullName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-text-primary">
              {session ? session.user.fullName : "Invitado"}
            </p>
            <p className="text-xs truncate text-text-muted">
              {session ? ROLE_LABELS[session.user.role] ?? session.user.role : "Sin sesión"}
            </p>
          </div>
          {session && (
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg flex-shrink-0 cursor-pointer transition-colors duration-150 text-text-muted hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
