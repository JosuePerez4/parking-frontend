"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CircleParking } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.14), transparent 70%)" }}
      />

      <div
        className="w-full max-w-sm rounded-2xl p-8 card-hover relative"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-soft)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            <CircleParking className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Parking IA</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
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
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
