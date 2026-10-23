"use client";

import { useEffect, useState } from "react";
import { MapPin, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { guardarUbicacion } from "@/lib/api";
import { CabeceraTarjeta } from "./configuracion-ui";
import { Card, CardContent, CardFooter } from "@/components/interfaz/tarjeta";
import { Boton } from "@/components/interfaz/boton";
import { Input } from "@/components/interfaz/entrada";
import { Label } from "@/components/interfaz/etiqueta";
import { Alert, AlertDescription } from "@/components/interfaz/alerta";

const VACIA = { nombre: "", direccion: "", mapsUrl: "", latitud: "", longitud: "" };

// Los inputs son texto: se guardan como string y el backend los convierte.
const aFormulario = (u) =>
  u
    ? {
        nombre: u.nombre ?? "",
        direccion: u.direccion ?? "",
        mapsUrl: u.mapsUrl ?? "",
        latitud: u.latitud != null ? String(u.latitud) : "",
        longitud: u.longitud != null ? String(u.longitud) : "",
      }
    : VACIA;

// Solo lo que se puede saber sin consultar al backend. El link se valida allá,
// que es donde vive el parser: duplicarlo acá sería tener dos verdades.
function validar({ nombre, direccion, latitud, longitud }) {
  if (!nombre.trim()) return "El nombre de la agencia es obligatorio.";
  if (!direccion.trim()) return "La dirección es obligatoria.";

  const lat = latitud.trim();
  const lng = longitud.trim();
  if (!lat !== !lng) return "Cargá latitud y longitud juntas, o ninguna de las dos.";
  if (lat) {
    if (!Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90) return "La latitud debe estar entre -90 y 90.";
    if (!Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180) return "La longitud debe estar entre -180 y 180.";
  }
  return null;
}

export function TarjetaUbicacion({ ubicacion, onUbicacion }) {
  const [form, setForm] = useState(aFormulario(ubicacion));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [manual, setManual] = useState(false); // coordenadas a mano (poco común)

  // El panel carga la ubicación de forma asíncrona: se sincroniza al llegar.
  useEffect(() => setForm(aFormulario(ubicacion)), [ubicacion]);

  const campo = (clave) => (e) => {
    setForm((f) => ({ ...f, [clave]: e.target.value }));
    setOk(false);
  };

  const sinCambios = JSON.stringify(form) === JSON.stringify(aFormulario(ubicacion));
  const coordsGuardadas = ubicacion?.tieneCoordenadas ? `${ubicacion.latitud}, ${ubicacion.longitud}` : null;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const problema = validar(form);
    if (problema) return setError(problema);

    setGuardando(true);
    try {
      const guardada = await guardarUbicacion({
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        mapsUrl: form.mapsUrl.trim() || null,
        // Solo se mandan si el admin las escribió: si no, salen del link.
        latitud: manual ? form.latitud.trim() || null : null,
        longitud: manual ? form.longitud.trim() || null : null,
      });
      onUbicacion?.(guardada);
      setOk(true);
    } catch (err) {
      setError(err.message || "No se pudo guardar la ubicación.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <CabeceraTarjeta
        icon={MapPin}
        titulo="Ubicación de la agencia"
        descripcion="El bot la manda sola al terminar una consulta de vehículo o de venta."
      />

      <form onSubmit={enviar}>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="ubi-nombre">Nombre del local</Label>
            <Input id="ubi-nombre" value={form.nombre} onChange={campo("nombre")} placeholder="Ortega Automotores" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ubi-direccion">Dirección</Label>
            <Input id="ubi-direccion" value={form.direccion} onChange={campo("direccion")} placeholder="Av. Siempreviva 742, San Salvador de Jujuy" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ubi-maps">Link de Google Maps</Label>
            <Input
              id="ubi-maps"
              value={form.mapsUrl}
              onChange={campo("mapsUrl")}
              placeholder="https://maps.app.goo.gl/… o https://www.google.com/maps/place/…"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Buscá tu local en Google Maps, tocá <span className="text-foreground">Compartir</span> y pegá el link acá.
              Las coordenadas se sacan solas.
            </p>
          </div>

          {/* Estado de las coordenadas ya guardadas */}
          <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 space-y-2">
            {coordsGuardadas ? (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Coordenadas guardadas:</span> {coordsGuardadas}{" "}
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(coordsGuardadas)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline hover:text-foreground"
                >
                  ver el pin <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Todavía no hay coordenadas. Sin ellas el bot no puede mandar el pin del mapa.
              </p>
            )}

            <button
              type="button"
              onClick={() => setManual((m) => !m)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {manual ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Escribir las coordenadas a mano
            </button>

            {manual && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="grid gap-2">
                  <Label htmlFor="ubi-lat">Latitud</Label>
                  <Input id="ubi-lat" inputMode="decimal" value={form.latitud} onChange={campo("latitud")} placeholder="-24.2153017" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ubi-lng">Longitud</Label>
                  <Input id="ubi-lng" inputMode="decimal" value={form.longitud} onChange={campo("longitud")} placeholder="-65.2769767" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {ok && (
            <Alert>
              <AlertDescription>Ubicación actualizada.</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="justify-end border-t pt-4">
          <Boton type="submit" disabled={sinCambios || guardando}>
            {guardando ? "Guardando…" : "Guardar ubicación"}
          </Boton>
        </CardFooter>
      </form>
    </Card>
  );
}
