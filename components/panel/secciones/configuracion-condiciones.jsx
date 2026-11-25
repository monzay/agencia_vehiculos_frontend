"use client";

import { useEffect, useState } from "react";
import { Handshake, Plus, X } from "lucide-react";
import { obtenerCondicionesVenta, guardarCondicionesVenta } from "@/lib/api";
import { aOpcion, armarEnvio, cambiarGarantia, deOpcion, hayCambios, validarCondiciones, validarNombreNuevo } from "@/lib/condiciones-venta";
import { CabeceraTarjeta } from "./configuracion-ui";
import { CLASE_INPUT } from "../ui/campo";
import { cn } from "@/lib/utilidades";
import { Card, CardContent, CardFooter } from "@/components/interfaz/tarjeta";
import { Boton } from "@/components/interfaz/boton";
import { Input } from "@/components/interfaz/entrada";
import { Label } from "@/components/interfaz/etiqueta";
import { Separator } from "@/components/interfaz/separador";
import { Alert, AlertDescription } from "@/components/interfaz/alerta";

const VACIO = {
  trabajaBancos: null,
  bancos: [],
  trabajaFinancieras: null,
  financieras: [],
  financiaCasa: null,
  tiposCuota: null,
  garantia: null,
  garantiaDetalle: null,
  recibeUsados: null,
  usadosDetalle: null,
};

const TIPOS = [
  { valor: "", label: "Sin definir" },
  { valor: "fija", label: "Solo fija" },
  { valor: "uva", label: "Solo UVA" },
  { valor: "fija_y_uva", label: "Fija y UVA" },
];

// Sí / No / Sin definir sobre un campo true/false/null.
function SelectSiNo({ id, etiqueta, valor, onCambio }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <select id={id} value={aOpcion(valor)} onChange={(e) => onCambio(deOpcion(e.target.value))} className={cn(CLASE_INPUT, "h-9")}>
        <option value="sin_definir">Sin definir</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}

// Lista de nombres con campo para agregar y una cruz para sacar cada uno.
function ListaNombres({ id, singular, nombres, onCambio, onError }) {
  const [nuevo, setNuevo] = useState("");

  function agregar() {
    const error = validarNombreNuevo(nombres, nuevo);
    if (error) return onError(error);
    onError(null);
    onCambio([...nombres, nuevo.trim()]);
    setNuevo("");
  }

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-secondary/40 p-3">
      {nombres.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {nombres.map((nombre) => (
            <li key={nombre} className="inline-flex items-center gap-1 rounded-md border border-border bg-background py-1 pl-2.5 pr-1 text-sm">
              <span>{nombre}</span>
              <button
                type="button"
                aria-label={`Sacar ${nombre}`}
                onClick={() => onCambio(nombres.filter((n) => n !== nombre))}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="sr-only">
          {`Agregar ${singular}`}
        </Label>
        <Input
          id={id}
          value={nuevo}
          placeholder={`Nombre de ${singular === "banco" ? "un banco" : "una financiera"}`}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
        />
        <Boton type="button" variant="outline" onClick={agregar}>
          <Plus className="w-4 h-4" />
          {`Agregar ${singular}`}
        </Boton>
      </div>
    </div>
  );
}

function CampoDetalle({ id, etiqueta, ejemplo, valor, onCambio }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} value={valor ?? ""} placeholder={ejemplo} maxLength={200} onChange={(e) => onCambio(e.target.value)} />
    </div>
  );
}

function CampoRespuestaGarantia({ valor, onCambio, ayudaId }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="cv-garantia-respuesta">Qué responde el bot si preguntan por la garantía</Label>
      <textarea
        id="cv-garantia-respuesta"
        rows={3}
        maxLength={200}
        value={valor ?? ""}
        placeholder="Antes de decidir podés traer a tu mecánico de confianza para que lo revise."
        aria-describedby={ayudaId}
        onChange={(e) => onCambio(e.target.value)}
        className={cn(CLASE_INPUT, "py-2")}
      />
    </div>
  );
}

export function TarjetaCondiciones() {
  const [original, setOriginal] = useState(null);
  const [estado, setEstado] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const cambiar = (campo, valor) => {
    setEstado((e) => ({ ...e, [campo]: valor }));
    setOk(false);
    setError(null);
  };
  const cambiarOpcionGarantia = (valor) => {
    setEstado((e) => cambiarGarantia(original, e, valor));
    setOk(false);
    setError(null);
  };
  const sinCambios = !original || !hayCambios(original, estado);

  useEffect(() => {
    let montado = true;
    obtenerCondicionesVenta()
      .then((c) => {
        if (!montado) return;
        setOriginal(c);
        setEstado(c);
      })
      .catch((err) => montado && setError(err.message || "No se pudieron cargar las condiciones de venta."))
      .finally(() => montado && setCargando(false));
    return () => {
      montado = false;
    };
  }, []);

  async function guardar() {
    setError(null);
    setOk(false);
    const errores = validarCondiciones(estado);
    const primero = Object.values(errores)[0];
    if (primero) return setError(primero);
    setGuardando(true);
    try {
      const guardado = await guardarCondicionesVenta(armarEnvio(estado));
      setOriginal(guardado);
      setEstado(guardado);
      setOk(true);
    } catch (err) {
      setError(err.message || "No se pudieron guardar las condiciones.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card role="region" aria-label="Condiciones de venta">
      <CabeceraTarjeta
        icon={Handshake}
        titulo="Condiciones de venta"
        descripcion="Cómo vende la agencia: financiación, garantía y usados. El bot lo usa para responder a los clientes."
      />
      <CardContent className="space-y-6">
        <fieldset disabled={cargando} className="space-y-6">
          <div className="space-y-4">
            <SelectSiNo id="cv-bancos" etiqueta="¿Trabaja con bancos?" valor={estado.trabajaBancos} onCambio={(v) => cambiar("trabajaBancos", v)} />
            {estado.trabajaBancos === true && (
              <ListaNombres id="cv-bancos-nuevo" singular="banco" nombres={estado.bancos} onCambio={(l) => cambiar("bancos", l)} onError={setError} />
            )}
            <SelectSiNo
              id="cv-financieras"
              etiqueta="¿Trabaja con financieras?"
              valor={estado.trabajaFinancieras}
              onCambio={(v) => cambiar("trabajaFinancieras", v)}
            />
            {estado.trabajaFinancieras === true && (
              <ListaNombres
                id="cv-financieras-nuevo"
                singular="financiera"
                nombres={estado.financieras}
                onCambio={(l) => cambiar("financieras", l)}
                onError={setError}
              />
            )}
            <SelectSiNo id="cv-casa" etiqueta="¿Financia por la casa?" valor={estado.financiaCasa} onCambio={(v) => cambiar("financiaCasa", v)} />
            <div className="grid gap-2">
              <Label htmlFor="cv-cuota">Tipos de cuota</Label>
              <select
                id="cv-cuota"
                value={estado.tiposCuota ?? ""}
                onChange={(e) => cambiar("tiposCuota", e.target.value || null)}
                className={cn(CLASE_INPUT, "h-9")}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <SelectSiNo id="cv-garantia" etiqueta="¿Da garantía propia?" valor={estado.garantia} onCambio={cambiarOpcionGarantia} />
            {estado.garantia !== null && (
              <p id="cv-garantia-ayuda" className="text-xs text-muted-foreground">
                Vale para los usados: los 0 km llevan la garantía de fábrica.
                {estado.garantia === false && " Si lo dejás vacío, el bot dice que la garantía la explica el asesor."}
              </p>
            )}
            {estado.garantia === false && (
              <CampoRespuestaGarantia valor={estado.garantiaDetalle} onCambio={(v) => cambiar("garantiaDetalle", v)} ayudaId="cv-garantia-ayuda" />
            )}
            {estado.garantia === true && (
              <CampoDetalle
                id="cv-garantia-detalle"
                etiqueta="Detalle de la garantía"
                ejemplo="3 meses de motor y caja"
                valor={estado.garantiaDetalle}
                onCambio={(v) => cambiar("garantiaDetalle", v)}
              />
            )}
            <SelectSiNo
              id="cv-usados"
              etiqueta="¿Recibe usados como parte de pago?"
              valor={estado.recibeUsados}
              onCambio={(v) => cambiar("recibeUsados", v)}
            />
            {estado.recibeUsados === true && (
              <CampoDetalle
                id="cv-usados-detalle"
                etiqueta="Detalle de los usados"
                ejemplo="autos y camionetas; motos no"
                valor={estado.usadosDetalle}
                onCambio={(v) => cambiar("usadosDetalle", v)}
              />
            )}
          </div>
        </fieldset>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ok && (
          <Alert>
            <AlertDescription>Condiciones actualizadas.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Boton type="button" onClick={guardar} disabled={cargando || guardando || sinCambios}>
          {guardando ? "Guardando…" : "Guardar condiciones"}
        </Boton>
      </CardFooter>
    </Card>
  );
}
