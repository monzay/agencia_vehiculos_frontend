"use client";

import { useState } from "react";
import { FileText, Pencil, AlertTriangle, ImageOff, ExternalLink, Loader2 } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Aviso } from "./campos";
import { TENENCIA } from "./tenencia";
import { estadoDe } from "./estado-papel";
import { fechaSinHora, fechaDeMomento, valorLegible } from "./formato";
import { useImagenesFirmadas } from "./usar-imagenes-firmadas";

// Lo que se ve al tocar la ficha de un papel ya cargado: las imágenes y todos
// sus datos, sin poder editarlos. Para cambiar algo, "Editar" abre el formulario.

function Fila({ label, children }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-x-4 py-1.5 border-t border-border">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground break-words">{children ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function Imagenes({ ingresoId, pathnames }) {
  const [elegida, setElegida] = useState(0);
  const { urls: firmadas, error } = useImagenesFirmadas(ingresoId, pathnames);

  if (!pathnames.length) {
    return (
      <div className="h-40 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
        <ImageOff className="w-5 h-5" />
        <span className="text-xs">Este papel no tiene imágenes cargadas</span>
      </div>
    );
  }

  if (error) return <Aviso>{error}</Aviso>;

  const urls = pathnames.map((p) => firmadas[p]).filter(Boolean);
  if (!urls.length) {
    return (
      <div className="h-40 rounded-lg border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Abriendo las imágenes…</span>
      </div>
    );
  }

  const actual = urls[Math.min(elegida, urls.length - 1)];

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg border border-border bg-secondary overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={actual} alt="Imagen del papel" className="w-full max-h-[420px] object-contain" />
        <a
          href={actual}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] hover:bg-black/75 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Ver en grande
        </a>
      </div>

      {urls.length > 1 && (
        <div className="flex gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setElegida(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "w-20 h-14 rounded-md overflow-hidden border-2 transition-colors",
                i === elegida ? "border-foreground" : "border-border opacity-60 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PapelVista({ ingresoId, spec, documento, esAdmin, onCerrar, onEditar }) {
  const estado = estadoDe(documento);
  const tenencia = TENENCIA[documento.tenencia];
  const { Icono } = estado;

  return (
    <Modal titulo={spec.label} icono={FileText} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium", estado.clase)}>
            <Icono className="w-3 h-3" /> {estado.label}
          </span>
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium", tenencia.clase)}>
            {tenencia.corto}
          </span>
        </div>

        {documento.diferencias.length > 0 && (
          <Aviso tono="alerta">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> No coincide con lo cargado en el vehículo
            </span>
            <ul className="mt-1.5 space-y-0.5 text-xs">
              {documento.diferencias.map((d) => (
                <li key={d.campo}>
                  {d.campo}: el papel dice <strong>{String(d.enPapel)}</strong>, el sistema tiene <strong>{String(d.enSistema)}</strong>
                </li>
              ))}
            </ul>
          </Aviso>
        )}

        <Imagenes ingresoId={ingresoId} pathnames={documento.imagenes} />

        {spec.campos.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-foreground mb-1">Datos del papel</h3>
            {spec.campos.map((campo) => (
              <Fila key={campo.clave} label={campo.label}>
                {valorLegible(campo, documento.datos?.[campo.clave])}
              </Fila>
            ))}
          </section>
        )}

        <section>
          <h3 className="text-xs font-medium text-foreground mb-1">El papel físico</h3>
          <Fila label="Qué quedó en la agencia">{tenencia.label}</Fila>
          {documento.tenencia !== "no_recibido" && <Fila label="Guardado en">{documento.ubicacionFisica}</Fila>}
          {spec.vencimiento !== "no" && (
            <Fila label="Vence">
              {documento.fechaVencimiento && (
                <span className={documento.vencido ? "text-destructive" : undefined}>
                  {fechaSinHora(documento.fechaVencimiento)}
                  {documento.vencido ? " — vencido" : ""}
                </span>
              )}
            </Fila>
          )}
          <Fila label="Cargado">
            {fechaDeMomento(documento.fechaCarga)}
            {documento.cargadoPor ? ` por ${documento.cargadoPor.nombre}` : ""}
          </Fila>
          <Fila label="Observaciones">{documento.observaciones}</Fila>
        </section>
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cerrar
        </Boton>
        {esAdmin && (
          <Boton variante="primario" className="gap-1.5" onClick={onEditar}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Boton>
        )}
      </ModalPie>
    </Modal>
  );
}
