"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";

const NO_SIDEBAR_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const isLoginRoute = NO_SIDEBAR_ROUTES.includes(pathname);

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
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}
