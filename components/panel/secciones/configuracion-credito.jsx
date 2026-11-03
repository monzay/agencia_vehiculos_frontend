"use client";

import { useEffect, useState } from "react";
import { Landmark, ExternalLink, TriangleAlert } from "lucide-react";
import { obtenerPrivacidad, publicarPrivacidad } from "@/lib/api";
import { CabeceraTarjeta } from "./configuracion-ui";
import { Card, CardContent, CardFooter } from "@/components/interfaz/tarjeta";
import { Boton } from "@/components/interfaz/boton";
import { Label } from "@/components/interfaz/etiqueta";
import { Separator } from "@/components/interfaz/separador";
import { Badge } from "@/components/interfaz/insignia";
import { Alert, AlertDescription } from "@/components/interfaz/alerta";

// Borrador para arrancar: lo tiene que revisar un abogado antes de publicarlo.
const PLANTILLA = `Política de privacidad de [NOMBRE DE LA AGENCIA]

Quién trata tus datos: [NOMBRE DE LA AGENCIA], [DIRECCIÓN], CUIT [CUIT]. Contacto: [EMAIL].

Para qué: si nos pedís financiar un vehículo y nos das tu autorización, consultamos tu situación en la Central de Deudores del Banco Central de la República Argentina (Fuente: BCRA) con tu CUIL. Lo usamos solo para que un asesor te arme opciones de financiación. No decide por sí solo si se te otorga un crédito: la decisión la toma una persona.

Qué guardamos: tu CUIL, el nombre con que figura en el BCRA y un resumen del resultado (sin el detalle de tus deudas), con la fecha y tu autorización.

Con quién se comparte: la conversación pasa por WhatsApp (Meta) y la atiende una asistente virtual que usa servicios de inteligencia artificial de Anthropic; ambas empresas pueden procesar los datos fuera de la Argentina, solo para prestarnos ese servicio. El resultado de la consulta no se comparte con nadie más.

Tus derechos: podés pedir acceder, corregir o suprimir tus datos, y retirar tu autorización en cualquier momento escribiéndonos a [EMAIL] (Ley 25.326). La Agencia de Acceso a la Información Pública es la autoridad de control.`;

// Los datos a completar de la plantilla, como [NOMBRE DE LA AGENCIA].
const MARCADOR_SIN_COMPLETAR = /\[[A-ZÁÉÍÓÚÑ ]+\]/;

const fechaCorta = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

export function TarjetaCredito() {
  const [vigente, setVigente] = useState(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const sinCambios = vigente ? texto.trim() === vigente.texto : !texto.trim();

  useEffect(() => {
    let montado = true;
    obtenerPrivacidad()
      .then((v) => {
        if (!montado) return;
        setVigente(v);
        setTexto(v?.texto ?? PLANTILLA); // null: todavía no publicó ninguna
      })
      .catch((err) => montado && setError(err.message || "No se pudo cargar la política de privacidad."))
      .finally(() => montado && setCargando(false));
    return () => {
      montado = false;
    };
  }, []);

  async function publicar() {
    setError(null);
    setOk(false);
    if (!texto.trim()) return setError("El texto es obligatorio.");
    if (MARCADOR_SIN_COMPLETAR.test(texto)) return setError("Completá los datos entre corchetes antes de publicar.");
    setPublicando(true);
    try {
      const nueva = await publicarPrivacidad(texto);
      setVigente(nueva);
      setTexto(nueva.texto);
      setOk(true);
    } catch (err) {
      setError(err.message || "No se pudo publicar la política.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Card>
      <CabeceraTarjeta
        icon={Landmark}
        titulo="Verificación crediticia (BCRA)"
        descripcion="Semáforo de la Central de Deudores para el asesor. Es solo informativo: no cambia la temperatura ni descarta consultas."
        accion={vigente && <Badge variant="secondary">Versión {vigente.version}</Badge>}
      />
      <CardContent className="space-y-6">
        <Alert>
          <TriangleAlert className="w-4 h-4" />
          <AlertDescription>
            {vigente
              ? "Activa: el bot pide permiso y el CUIL a quien financia. El asesor ve el semáforo en Consultas."
              : "Al publicar la política, el bot empieza a pedir permiso y el CUIL a quien financia, y a consultar al BCRA. Antes hacen falta la autorización del BCRA para uso comercial, la base inscripta en la AAIP y la política revisada por un abogado."}
          </AlertDescription>
        </Alert>

        <Separator />

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cfg-privacidad">Política de privacidad</Label>
            {vigente && (
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Ver página <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <textarea
            id="cfg-privacidad"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={cargando}
            rows={12}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            {vigente ? `Publicada el ${fechaCorta(vigente.publicado)}. Publicar crea una versión nueva; las anteriores se guardan.` : "Todavía no hay una política publicada."}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ok && (
          <Alert>
            <AlertDescription>Política publicada.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Boton type="button" onClick={publicar} disabled={cargando || publicando || sinCambios}>
          {publicando ? "Publicando…" : "Publicar versión nueva"}
        </Boton>
      </CardFooter>
    </Card>
  );
}
