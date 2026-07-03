import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Parking IA — Dashboard",
  description: "Sistema de gestión de parqueaderos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="min-h-full" style={{ backgroundColor: "var(--bg-page)", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
