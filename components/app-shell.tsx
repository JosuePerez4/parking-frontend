"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";
import { Menu, CircleParking } from "lucide-react";

const NO_SIDEBAR_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const isLoginRoute = NO_SIDEBAR_ROUTES.includes(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginRoute) {
      router.replace("/login");
      return;
    }
    if (session && isLoginRoute) {
      router.replace(session.user.role === "platform_admin" ? "/admin" : "/");
      return;
    }
    if (!session) return;
    const isAdminRoute = pathname.startsWith("/admin");
    if (session.user.role === "platform_admin" && !isAdminRoute) {
      router.replace("/admin");
    } else if (session.user.role !== "platform_admin" && isAdminRoute) {
      router.replace("/");
    }
  }, [loading, session, isLoginRoute, pathname, router]);

  // /login se renderiza de inmediato (sin esperar la sesión) para que sea la
  // pantalla que se ve al abrir la app. Las rutas protegidas sí esperan a
  // resolver la sesión, para no dejar ver contenido antes de redirigir.
  if (isLoginRoute) {
    if (!loading && session) {
      return <main className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }} />;
    }
    return <main className="min-h-screen">{children}</main>;
  }

  if (loading || !session) {
    return <main className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }} />;
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isWrongSection =
    (session.user.role === "platform_admin" && !isAdminRoute) ||
    (session.user.role !== "platform_admin" && isAdminRoute);
  if (isWrongSection) {
    return <main className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Overlay móvil: cierra el drawer al tocar fuera */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Topbar móvil con botón hamburguesa */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="p-1.5 rounded-lg cursor-pointer transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              <CircleParking className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Parking IA</span>
          </div>
        </header>

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
