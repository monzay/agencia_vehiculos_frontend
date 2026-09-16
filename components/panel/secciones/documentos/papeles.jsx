"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Pencil, Trash2, Image as ImagenIcono, Archive, Undo2 } from "lucide-react";
import { eliminarDocumentoIngreso } from "@/lib/api";
import { combinadorClases as cn } from "@/lib/utilidades";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Aviso } from "./campos";
import { PapelFormulario } from "./papel-formulario";
import { PapelVista } from "./papel-vista";
import { TENENCIA } from "./tenencia";
import { estadoDe } from "./estado-papel";
import { fechaSinHora, fechaDeMomento } from "./formato";

// Los papeles del ingreso, uno por tipo. La lista sale del catálogo del
// backend, así que muestra también los que faltan: es media checklist.
//
// Van separados por qué pasa con el papel físico: el original que la agencia
// retiene hasta la transferencia, y el que se escanea y vuelve con el cliente.
// El criterio por defecto lo trae el catálogo; lo que pasó de verdad con cada
// uno es su tenencia, que se carga a mano.

const GRUPOS = [
  {
    id: "agencia",
    titulo: "Quedan en la agencia",
    ayuda: "El original se retiene hasta la transferencia.",
    Icono: Archive,
  },
  {
    id: "cliente",
    titulo: "Se los lleva el cliente",
    ayuda: "Se digitalizan y se devuelven en el momento.",
    Icono: Undo2,
  },
];

// Los botones de la ficha viven dentro de un contenedor clickeable: sin esto,
// "Editar" o "Quitar" también abrirían la vista.
const sinPropagar = (accion) => (e) => {
  e.stopPropagation();
  accion();
};

function Papel({ spec, documento, esAdmin, onVer, onEditar, onBorrar }) {
  const estado = estadoDe(documento);
  const { Icono } = estado;

  // Solo un papel cargado tiene algo para mostrar; el vacío se carga con su botón.
  const clickeable = Boolean(documento);

  return (
    <div
      role={clickeable ? "button" : undefined}
      tabIndex={clickeable ? 0 : undefined}
      onClick={clickeable ? onVer : undefined}
      onKeyDown={
        clickeable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onVer();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border bg-card p-3 space-y-2 transition-colors",
        documento ? "border-border" : "border-dashed border-border",
        clickeable && "cursor-pointer hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{spec.label}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium", estado.clase)}>
            <Icono className="w-3 h-3" /> {estado.label}
          </span>
          {documento && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium",
                TENENCIA[documento.tenencia].clase
              )}
              title="Qué tiene la agencia del papel físico"
            >
              {TENENCIA[documento.tenencia].corto}
            </span>
          )}
        </div>
      </div>

      {documento ? (
        <dl className="text-[11px] text-muted-foreground space-y-0.5">
          <div>
            {documento.tenencia === "no_recibido" ? (
              <dd className="text-amber-500">El papel no está en la agencia</dd>
            ) : (
              <>
                <dt className="inline">Guardado en: </dt>
                <dd className="inline text-foreground">{documento.ubicacionFisica}</dd>
              </>
            )}
          </div>
          {documento.fechaVencimiento && (
            <div>
              <dt className="inline">Vence: </dt>
              <dd className={cn("inline", documento.vencido ? "text-destructive" : "text-foreground")}>{fechaSinHora(documento.fechaVencimiento)}</dd>
            </div>
          )}
          <div>
            <dt className="inline">Cargado: </dt>
            <dd className="inline text-foreground">
              {fechaDeMomento(documento.fechaCarga)}
              {documento.cargadoPor ? ` por ${documento.cargadoPor.nombre}` : ""}
            </dd>
          </div>
          {documento.imagenes.length > 0 && (
            <div className="inline-flex items-center gap-1 pt-0.5">
              <ImagenIcono className="w-3 h-3" /> {documento.imagenes.length} {documento.imagenes.length === 1 ? "imagen" : "imágenes"}
            </div>
          )}
        </dl>
      ) : (
        // Lo que va a haber que completar a mano cuando se cargue este papel.
        <p className="text-[11px] text-muted-foreground">
          {spec.campos.length
            ? `A completar: ${spec.campos.map((c) => c.label).join(", ")}.`
            : spec.vencimiento === "no"
              ? "Solo la imagen."
              : "Solo la imagen y la fecha de vencimiento."}
        </p>
      )}

      {esAdmin && (
        <div className="flex items-center gap-1 pt-1">
          <button
            type="button"
            onClick={sinPropagar(onEditar)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {documento ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {documento ? "Editar" : "Cargar"}
          </button>
          {documento && (
            <button
              type="button"
              onClick={sinPropagar(onBorrar)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Quitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Papeles({ ingreso, catalogo, esAdmin, onCambio }) {
  const [viendo, setViendo] = useState(null); // { tipo, documento }
  const [editando, setEditando] = useState(null); // { tipo, documento }
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState(null);

  const porTipo = Object.fromEntries(ingreso.documentos.map((d) => [d.tipo, d]));
  const conDiferencias = ingreso.documentos.filter((d) => d.diferencias.length);

  async function confirmarBorrado() {
    setBorrando(true);
    setError(null);
    try {
      await eliminarDocumentoIngreso(ingreso.id, aBorrar.id);
      setABorrar(null);
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Aviso>{error}</Aviso>}

      {/* Lo que se espera que quede en la agencia y todavía no está. Incluye
          tanto los que faltan del todo como los que solo tienen el escaneo. */}
      {ingreso.papeles.sinOriginal.length > 0 && (
        <Aviso tono="alerta">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Archive className="w-3.5 h-3.5" /> Faltan originales en la agencia
          </span>
          <ul className="mt-1.5 space-y-0.5 text-xs">
            {ingreso.papeles.sinOriginal.map((tipo) => {
              const doc = porTipo[tipo];
              return (
                <li key={tipo}>
                  {catalogo[tipo].label} —{" "}
                  {!doc
                    ? "sin cargar"
                    : doc.tenencia === "copia"
                      ? "hay una fotocopia, falta el original"
                      : "está el escaneo, el papel no llegó"}
                </li>
              );
            })}
          </ul>
        </Aviso>
      )}

      {conDiferencias.length > 0 && (
        <Aviso tono="alerta">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Hay papeles que no coinciden con los datos del vehículo
          </span>
          <ul className="mt-1.5 space-y-0.5 text-xs">
            {conDiferencias.map((d) =>
              d.diferencias.map((dif) => (
                <li key={`${d.tipo}-${dif.campo}`}>
                  {d.label} — {dif.campo}: dice <strong>{String(dif.enPapel)}</strong>, el sistema tiene{" "}
                  <strong>{String(dif.enSistema)}</strong>
                </li>
              ))
            )}
          </ul>
        </Aviso>
      )}

      {GRUPOS.map(({ id, titulo, ayuda, Icono }) => {
        const tipos = Object.entries(catalogo).filter(([, spec]) => spec.destino === id);
        if (!tipos.length) return null;
        const cargados = tipos.filter(([tipo]) => porTipo[tipo]).length;
        // En el grupo que se queda la agencia, lo que importa no es cuántas
        // fichas hay sino cuántos papeles están de verdad en la carpeta.
        const enMano = tipos.filter(([tipo]) => porTipo[tipo] && porTipo[tipo].tenencia !== "no_recibido").length;

        return (
          <section key={id} className="space-y-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                <Icono className="w-3.5 h-3.5 text-muted-foreground" /> {titulo}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {cargados}/{tipos.length} cargados
              </span>
              {id === "agencia" && (
                <span className={cn("text-xs tabular-nums", enMano < tipos.length ? "text-amber-500" : "text-emerald-500")}>
                  · {enMano} en la carpeta
                </span>
              )}
              <span className="text-xs text-muted-foreground">· {ayuda}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {tipos.map(([tipo, spec]) => (
                <Papel
                  key={tipo}
                  spec={spec}
                  documento={porTipo[tipo]}
                  esAdmin={esAdmin}
                  onVer={() => setViendo({ tipo, documento: porTipo[tipo] })}
                  onEditar={() => setEditando({ tipo, documento: porTipo[tipo] })}
                  onBorrar={() => setABorrar(porTipo[tipo])}
                />
              ))}
            </div>
          </section>
        );
      })}

      {viendo && (
        <PapelVista
          ingresoId={ingreso.id}
          spec={catalogo[viendo.tipo]}
          documento={viendo.documento}
          esAdmin={esAdmin}
          onCerrar={() => setViendo(null)}
          onEditar={() => {
            setEditando(viendo);
            setViendo(null);
          }}
        />
      )}

      {editando && (
        <PapelFormulario
          ingresoId={ingreso.id}
          tipo={editando.tipo}
          spec={catalogo[editando.tipo]}
          documento={editando.documento}
          onCerrar={() => setEditando(null)}
          onGuardado={onCambio}
        />
      )}

      <ConfirmarModal
        abierto={Boolean(aBorrar)}
        titulo="¿Quitar este papel?"
        mensaje={aBorrar ? `Se va a quitar ${aBorrar.label} de este ingreso. Queda registrado para auditoría.` : ""}
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
