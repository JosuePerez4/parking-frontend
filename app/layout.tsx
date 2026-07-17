import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    template: "%s — Parking IA",
    default: "Parking IA — Sistema de Gestión de Parqueaderos",
  },
  description:
    "Sistema integral de gestión de parqueaderos con control de clientes, vehículos, mensualidades y reportes",
  keywords: ["parking", "parqueadero", "gestión", "vehículos", "mensualidades"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="min-h-full bg-page font-sans">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
