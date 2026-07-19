"use client";

import { useState } from "react";
import { Car, User, Phone, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { obtenerConsignaciones, eliminarConsignacion } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Insignia } from "../ui/insignia";
import { ConfirmarModal } from "../ui/confirmar-modal";
import { FormularioConsignacion, ESTADOS } from "./consignacion-formulario";

const PAGINA = 10;

const COLUMNAS = [
  { label: "Vehículo" },
  { label: "Dueño" },
  { label: "Teléfono" },
  { label: "Precio pactado" },
  { label: "Comisión" },
  { label: "Estado" },
  { label: "", className: "w-24" },
];

const VARIANTE_ESTADO = { en_venta: "info", vendido: "exito", retirado: "neutral" };
const LABEL_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e.label]));

const pesos = (n) => `$ ${Number(n).toLocaleString("es-AR")}`;
// El vehículo viene del catálogo. Si lo borraron, la relación puede faltar.
const tituloVehiculo = (v) => (v ? `${v.marca} ${v.modelo} ${v.anio}` : "Vehículo no disponible");

const FILTROS = [{ valor: "", label: "Todas" }, ...ESTADOS];

export function SeccionConsignaciones({ busqueda, esAdmin, vehiculos = [] }) {
  const [estado, setEstado] = useState("");
  const [editando, setEditando] = useState(null); // null | undefined (nueva) | consignación
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerConsignaciones({ estado, q: busqueda, offset, limite }),
    [estado, busqueda, recarga],
    { limite: PAGINA }
  );

  const refrescar = () => setRecarga((n) => n + 1);

  async function confirmarBorrado() {
    setBorrando(true);
    setError(null);
    try {
      await eliminarConsignacion(aBorrar.id);
      setABorrar(null);
      refrescar();
    } catch (e) {
      setError(e.message);
    } finally {
      setBorrando(false);
    }
  }

  const acciones = (c) =>
    esAdmin ? (
      <div className="flex items-center gap-1 justify-end">
        <button type="button" onClick={() => setEditando(c)} title="Editar" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => setABorrar(c)} title="Eliminar" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {/* Filtros + alta */}
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
        {esAdmin && (
          <Boton variante="primario" className="ml-auto gap-1.5" onClick={() => setEditando(undefined)}>
            <Plus className="w-4 h-4" /> Nueva consignación
          </Boton>
        )}
      </div>

      {(error || errorLista) && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">{error || errorLista}</div>
      )}

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Mostrando {items.length} de {total} {total === 1 ? "consignación" : "consignaciones"}
          </p>

          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="Todavía no hay consignaciones cargadas.">
              {items.map((c) => (
                <tr key={c.id} className={FILA}>
                  <td className={CELDA}>
                    <span className="font-medium text-foreground inline-flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-accent shrink-0" /> {tituloVehiculo(c.vehiculo)}
                    </span>
                  </td>
                  <td className={CELDA}>
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {c.duenio.nombre}
                    </span>
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    {c.duenio.telefono ? (
                      <span className="inline-flex items-center gap-1.5 text-foreground tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {c.duenio.telefono}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={`${CELDA} tabular-nums whitespace-nowrap`}>{pesos(c.precioPactado)}</td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    <span className="text-foreground">{c.comision}%</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">{pesos(c.comisionPesos)}</span>
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    <Insignia variante={VARIANTE_ESTADO[c.estado] ?? "neutral"}>{LABEL_ESTADO[c.estado] ?? c.estado}</Insignia>
                  </td>
                  <td className={CELDA}>{acciones(c)}</td>
                </tr>
              ))}
            </Tabla>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">
                Todavía no hay consignaciones cargadas.
              </p>
            ) : (
              items.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-1.5 min-w-0">
                      <Car className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{tituloVehiculo(c.vehiculo)}</span>
                    </p>
                    <Insignia variante={VARIANTE_ESTADO[c.estado] ?? "neutral"}>{LABEL_ESTADO[c.estado] ?? c.estado}</Insignia>
                  </div>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {c.duenio.nombre}
                    {c.duenio.telefono ? ` · ${c.duenio.telefono}` : ""}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="tabular-nums text-foreground">{pesos(c.precioPactado)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{c.comision}% · {pesos(c.comisionPesos)}</span>
                  </div>
                  {esAdmin && <div className="pt-1">{acciones(c)}</div>}
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

      {editando !== null && (
        <FormularioConsignacion
          consignacion={editando}
          vehiculos={vehiculos}
          onCerrar={() => setEditando(null)}
          onGuardado={refrescar}
        />
      )}

      <ConfirmarModal
        abierto={Boolean(aBorrar)}
        titulo="¿Eliminar esta consignación?"
        mensaje={aBorrar ? `Se va a quitar ${tituloVehiculo(aBorrar.vehiculo)} de ${aBorrar.duenio.nombre} del listado.` : ""}
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
