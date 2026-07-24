"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CircleParking, Eye, EyeOff, TriangleAlert, ScanLine, Receipt, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: ScanLine, label: "Registro de placas al entrar y salir" },
  { icon: Receipt, label: "Cobros y cierres de caja sin hojas de cálculo" },
  { icon: ShieldCheck, label: "Accesos y permisos por rol" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      setSession(result);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <section className="relative hidden lg:flex flex-col justify-between px-14 py-12 overflow-hidden bg-page-sidebar border-r border-border-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-dim) 1px, transparent 1px), linear-gradient(90deg, var(--text-dim) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-primary text-primary-foreground">
            <CircleParking className="w-4 h-4" strokeWidth={2} />
          </div>
          <span className="font-mono text-xs tracking-[0.18em] uppercase text-text-secondary">
            Parki
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[2.75rem] leading-[1.08] font-bold tracking-tight text-balance mb-4 text-text-primary">
            Visibilidad total de tu parqueadero, en tiempo real.
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Placas, tiempos de estancia y cobros verificados al segundo, sin hojas de cálculo.
          </p>
        </div>

        <div className="relative rounded-xl border border-border-soft bg-page-card/70 backdrop-blur-sm p-4">
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-primary-dim text-primary flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel de formulario */}
      <section className="flex items-center justify-center px-6 py-16 bg-page">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-primary text-primary-foreground">
              <CircleParking className="w-4 h-4" strokeWidth={2} />
            </div>
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-text-secondary">
              Parki
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1.5 text-text-primary">Bienvenido de nuevo</h2>
          <p className="text-sm text-text-secondary mb-8">
            Ingresa tus credenciales para entrar al panel de tu negocio.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@negocio.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <p className="text-xs text-text-dim mt-8">
            ¿Problemas para ingresar? Contacta a tu administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
