"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Car } from "lucide-react";
import { login, getToken } from "@/lib/api";
import { CampoContrasena } from "@/components/interfaz/campo-contrasena";

// Formulario de inicio de sesión del panel. Compartido por las rutas /login y
// /financiacion/login para no duplicar el markup ni la lógica de auth.
export function FormularioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Si ya hay sesion, no mostramos el login.
  useEffect(() => {
    if (getToken()) router.replace("/admin");
  }, [router]);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
      setCargando(false);
    }
  }

  return (
    <main className="panel-dark min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Car className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Panel de administración</h1>
          <p className="text-sm text-muted-foreground">Ingresá con tu cuenta</p>
        </div>

        <form onSubmit={enviar} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="admin@agencia.com"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Contraseña</span>
            <CampoContrasena
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent"
            />
          </label>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
