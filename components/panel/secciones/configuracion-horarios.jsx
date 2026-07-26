"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { guardarHorarios } from "@/lib/api";
import { CabeceraTarjeta } from "./configuracion-ui";
import { Card, CardContent, CardFooter } from "@/components/interfaz/tarjeta";
import { Boton } from "@/components/interfaz/boton";
import { Input } from "@/components/interfaz/entrada";
import { Switch } from "@/components/interfaz/interruptor";
import { Alert, AlertDescription } from "@/components/interfaz/alerta";

// Orden de visualización: la semana arranca en lunes. `dia` sigue getDay() (0=Dom),
// que es lo que guarda y lee el backend/bot.
const ORDEN = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

const POR_DEFECTO = { abierto: false, apertura: "09:00", cierre: "18:00" };

// De la lista del backend a un mapa { [dia]: {abierto, apertura, cierre} } listo
// para editar. Las horas quedan siempre como string para los inputs, aunque el
// día esté cerrado (así el admin no pierde lo escrito al togglear).
function aFormulario(horarios) {
  const mapa = {};
  for (const { dia } of ORDEN) {
    const h = horarios?.find((x) => x.dia === dia);
    mapa[dia] = h
      ? { abierto: h.abierto, apertura: h.apertura || "09:00", cierre: h.cierre || "18:00" }
      : { ...POR_DEFECTO };
  }
  return mapa;
}

function validar(mapa) {
  for (const { dia, nombre } of ORDEN) {
    const d = mapa[dia];
    if (!d.abierto) continue;
    if (!d.apertura || !d.cierre) return `Completá el horario del ${nombre}.`;
    if (d.apertura >= d.cierre) return `El ${nombre} la apertura debe ser anterior al cierre.`;
  }
  return null;
}

export function TarjetaHorarios({ horarios, onHorarios }) {
  const [mapa, setMapa] = useState(() => aFormulario(horarios));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  // El panel carga los horarios de forma asíncrona: se sincroniza al llegar.
  useEffect(() => setMapa(aFormulario(horarios)), [horarios]);

  const inicial = useMemo(() => aFormulario(horarios), [horarios]);
  const sinCambios = JSON.stringify(mapa) === JSON.stringify(inicial);

  const set = (dia, campo, valor) => {
    setMapa((m) => ({ ...m, [dia]: { ...m[dia], [campo]: valor } }));
    setOk(false);
  };

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const problema = validar(mapa);
    if (problema) return setError(problema);

    setGuardando(true);
    try {
      const dias = ORDEN.map(({ dia }) => {
        const d = mapa[dia];
        return d.abierto
          ? { dia, abierto: true, apertura: d.apertura, cierre: d.cierre }
          : { dia, abierto: false, apertura: null, cierre: null };
      });
      const guardados = await guardarHorarios(dias);
      onHorarios?.(guardados);
      setOk(true);
    } catch (err) {
      setError(err.message || "No se pudieron guardar los horarios.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <CabeceraTarjeta
        icon={Clock}
        iconClassName="text-white"
        titulo="Horarios de atención"
        descripcion="El bot los usa para responder si la agencia está abierta. Apagá el día para marcarlo cerrado."
      />

      <form onSubmit={enviar}>
        <CardContent className="space-y-2">
          {ORDEN.map(({ dia, nombre }) => {
            const d = mapa[dia];
            return (
              <div
                key={dia}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-secondary/40 px-4 py-3"
              >
                <span className="w-24 text-sm text-foreground">{nombre}</span>
                <Switch checked={d.abierto} onCheckedChange={(v) => set(dia, "abierto", v)} disabled={guardando} />
                {d.abierto ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`Apertura ${nombre}`}
                      value={d.apertura}
                      onChange={(e) => set(dia, "apertura", e.target.value)}
                      disabled={guardando}
                      className="w-32 scheme-dark"
                    />
                    <span className="text-sm text-muted-foreground">a</span>
                    <Input
                      type="time"
                      aria-label={`Cierre ${nombre}`}
                      value={d.cierre}
                      onChange={(e) => set(dia, "cierre", e.target.value)}
                      disabled={guardando}
                      className="w-32 scheme-dark"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                )}
              </div>
            );
          })}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {ok && (
            <Alert>
              <AlertDescription>Horarios actualizados.</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="justify-end border-t pt-4">
          <Boton type="submit" disabled={sinCambios || guardando}>
            {guardando ? "Guardando…" : "Guardar horarios"}
          </Boton>
        </CardFooter>
      </form>
    </Card>
  );
}
