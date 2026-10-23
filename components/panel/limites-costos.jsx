"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getToken, obtenerMe, obtenerGastoIa } from "@/lib/api";
import { GastoIa } from "./secciones/gasto-ia";

// /admin/limites: lo que la agencia lleva gastado este mes contra sus topes (la
// IA del bot y los mensajes de WhatsApp). Solo admin: sin sesión va al login y
// otro rol vuelve al panel. Ocultarla no alcanza: la API también responde 403.
export function LimitesCostos() {
  const router = useRouter();
  const [gasto, setGasto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    obtenerMe()
      .then((u) => {
        if (u?.rol !== "admin") {
          router.replace("/admin");
          return;
        }
        return obtenerGastoIa().then(setGasto);
      })
      .catch(() => setError("No se pudieron cargar los límites de costos. Recargá la página."));
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al panel
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Límites de costos</h1>
        <p className="text-sm text-muted-foreground">Gasto de IA y mensajes de WhatsApp del mes contra sus topes.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && !gasto && (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
        </p>
      )}
      {gasto && <GastoIa datos={gasto} />}
    </div>
  );
}
