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
import { ORDEN, aFormulario, aPayload, apagarCortado, prenderCortado, validarHorarios } from "@/lib/horarios";

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

  const cambiarCortado = (dia, prendido) => {
    setMapa((m) => ({ ...m, [dia]: prendido ? prenderCortado(m[dia]) : apagarCortado(m[dia]) }));
    setOk(false);
  };

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const problema = validarHorarios(mapa);
    if (problema) return setError(problema);

    setGuardando(true);
    try {
      const guardados = await guardarHorarios(aPayload(mapa));
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
        descripcion="El bot los usa para responder si la agencia está abierta. Apagá el día para marcarlo cerrado; si cierra al mediodía, activá Cortado para cargar la segunda franja."
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
                  <>
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
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch
                        checked={d.cortado}
                        onCheckedChange={(v) => cambiarCortado(dia, v)}
                        disabled={guardando}
                        aria-label={`Horario cortado ${nombre}`}
                      />
                      Cortado
                    </label>
                    {d.cortado && (
                      <div className="flex basis-full items-center gap-2 sm:pl-32">
                        <span className="w-4 text-right text-sm text-muted-foreground">y</span>
                        <Input
                          type="time"
                          aria-label={`Apertura tarde ${nombre}`}
                          value={d.apertura_2}
                          onChange={(e) => set(dia, "apertura_2", e.target.value)}
                          disabled={guardando}
                          className="w-32 scheme-dark"
                        />
                        <span className="text-sm text-muted-foreground">a</span>
                        <Input
                          type="time"
                          aria-label={`Cierre tarde ${nombre}`}
                          value={d.cierre_2}
                          onChange={(e) => set(dia, "cierre_2", e.target.value)}
                          disabled={guardando}
                          className="w-32 scheme-dark"
                        />
                      </div>
                    )}
                  </>
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
