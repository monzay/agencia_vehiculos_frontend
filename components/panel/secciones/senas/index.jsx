"use client";

import { useState } from "react";
import { Loader2, Pencil, FileSignature, XCircle, ExternalLink } from "lucide-react";
import { obtenerSenas, cancelarSena, iniciarTramiteSena } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Tabla, FILA, CELDA } from "../../ui/tabla";
import { Insignia } from "../../ui/insignia";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Aviso } from "../documentos/campos";
import { pesos } from "../documentos/impresos/etiquetas";
import { SenaModal } from "./sena-modal";
import { ESTADOS_SENA, tituloAuto, fechaCorta } from "./formato";

// Señas: el control diario de las reservas. Qué está vigente, qué venció y qué
// pasó a trámite. Las señas se crean en Trámites; desde acá se abre el trámite
// de parte de pago en Documentos.

const PAGINA = 10;
const COLUMNAS = [{ label: "Vehículo" }, { label: "Cliente" }, { label: "Seña" }, { label: "Vence" }, { label: "Estado" }, { label: "", alinear: "right" }];
const FILTROS = [
  { valor: "vigente", label: "Vigentes" },
  { valor: "vencida", label: "Vencidas" },
  { valor: "convertida", label: "Pasaron a trámite" },
  { valor: "cancelada", label: "Canceladas" },
  { valor: "", label: "Todas" },
];

const nombre = (c) => [c?.nombre, c?.apellido].filter(Boolean).join(" ") || "Sin nombre";

// Qué se puede hacer con cada seña. Vencida se puede extender (editar) o
// cancelar, pero no pasar a trámite hasta extenderla.
function Acciones({ sena, ocupado, onEditar, onTramite, onCancelar, onAbrirTramite }) {
  const abierta = sena.estado === "vigente" || sena.estado === "vencida";
  if (sena.estado === "convertida" && sena.ingresoId) {
    return (
      <Boton variante="fantasma" tamano="sm" className="gap-1.5" onClick={() => onAbrirTramite(sena.ingresoId)}>
        <ExternalLink className="w-3.5 h-3.5" /> Ver trámite
      </Boton>
    );
  }
  if (!abierta) return null;
  const tramitable = sena.estado === "vigente" && !sena.auto?.deConsignacion;
  return (
    <div className="flex items-center justify-end gap-1.5">
      {tramitable && (
        <Boton variante="secundario" tamano="sm" className="gap-1.5" cargando={ocupado} onClick={() => onTramite(sena)} title="Abre el trámite de parte de pago en Documentos">
          <FileSignature className="w-3.5 h-3.5" /> Iniciar trámite
        </Boton>
      )}
      <Boton variante="fantasma" tamano="sm" onClick={() => onEditar(sena)} title={sena.estado === "vencida" ? "Extender el vencimiento" : "Editar"}>
        <Pencil className="w-3.5 h-3.5" />
      </Boton>
      <Boton variante="fantasma" tamano="sm" onClick={() => onCancelar(sena)} title="El cliente se arrepintió: pierde la seña">
        <XCircle className="w-3.5 h-3.5" />
      </Boton>
    </div>
  );
}

export function SeccionSenas({ busqueda = "", esAdmin = false, onAbrirTramite }) {
  const [estado, setEstado] = useState("vigente");
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState(null); // seña en edición
  const [aCancelar, setACancelar] = useState(null);
  const [ocupado, setOcupado] = useState(null); // id con una acción en curso
  const [error, setError] = useState(null);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerSenas({ estado, q: busqueda, offset, limite }),
    [estado, busqueda, recarga],
    { limite: PAGINA }
  );
  const refrescar = () => setRecarga((n) => n + 1);

  async function correr(id, accion) {
    setOcupado(id);
    setError(null);
    try {
      return await accion();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
    }
  }

  const iniciarTramite = (sena) =>
    correr(sena.id, async () => {
      const { ingresoId } = await iniciarTramiteSena(sena.id);
      onAbrirTramite?.(ingresoId);
    });

  const confirmarCancelacion = () =>
    correr(aCancelar.id, async () => {
      await cancelarSena(aCancelar.id);
      setACancelar(null);
      refrescar();
    });

  const acciones = (s) =>
    esAdmin && (
      <Acciones
        sena={s}
        ocupado={ocupado === s.id}
        onEditar={setEditando}
        onTramite={iniciarTramite}
        onCancelar={setACancelar}
        onAbrirTramite={onAbrirTramite}
      />
    );
  const estadoDe = (s) => <Insignia variante={ESTADOS_SENA[s.estado]?.variante}>{ESTADOS_SENA[s.estado]?.label ?? s.estado}</Insignia>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setEstado(f.valor)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              estado === f.valor
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(error || errorLista) && <Aviso>{error || errorLista}</Aviso>}

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Mostrando {items.length} de {total} {total === 1 ? "seña" : "señas"}
          </p>

          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="No hay señas en este estado.">
              {items.map((s) => (
                <tr key={s.id} className={FILA}>
                  <td className={CELDA}>
                    <span className="text-foreground">{tituloAuto(s.auto)}</span>
                    {s.auto?.deConsignacion && <span className="block text-xs text-amber-500">En consignación</span>}
                  </td>
                  <td className={CELDA}>
                    <span className="text-foreground">{nombre(s.cliente)}</span>
                    {s.cliente?.dni && <span className="block text-xs text-muted-foreground">DNI {s.cliente.dni}</span>}
                  </td>
                  <td className={`${CELDA} tabular-nums`}>{pesos(s.monto)}</td>
                  <td className={`${CELDA} tabular-nums`}>{fechaCorta(s.vence)}</td>
                  <td className={CELDA}>{estadoDe(s)}</td>
                  <td className={CELDA}>{acciones(s)}</td>
                </tr>
              ))}
            </Tabla>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay señas en este estado.</p>
            ) : (
              items.map((s) => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground min-w-0">{tituloAuto(s.auto)}</p>
                    {estadoDe(s)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {nombre(s.cliente)} · {pesos(s.monto)} · vence {fechaCorta(s.vence)}
                  </p>
                  {acciones(s)}
                </div>
              ))
            )}
          </div>

          {hayMas && (
            <div className="flex justify-center pt-1">
              <Boton variante="secundario" onClick={cargarMas} cargando={cargandoMas}>
                {cargandoMas ? "Cargando…" : `Ver más (${total - items.length} restantes)`}
              </Boton>
            </div>
          )}
        </>
      )}

      {editando !== null && <SenaModal sena={editando} onCerrar={() => setEditando(null)} onGuardado={refrescar} />}

      <ConfirmarModal
        abierto={Boolean(aCancelar)}
        titulo="¿El cliente se arrepintió?"
        mensaje={aCancelar ? `La seña de ${pesos(aCancelar.monto)} se pierde y el vehículo vuelve a estar a la venta. No se puede deshacer.` : ""}
        textoConfirmar="Cancelar seña"
        cargando={ocupado === aCancelar?.id}
        onConfirmar={confirmarCancelacion}
        onCancelar={() => setACancelar(null)}
      />
    </div>
  );
}
