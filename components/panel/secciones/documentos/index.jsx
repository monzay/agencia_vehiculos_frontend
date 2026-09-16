"use client";

import { useEffect, useState } from "react";
import { Car, User, Plus, Loader2, Trash2, FileText, AlertTriangle, Clock, Archive } from "lucide-react";
import { obtenerIngresos, eliminarIngreso, obtenerCatalogoDocumentos } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Tabla, FILA, CELDA } from "../../ui/tabla";
import { Insignia } from "../../ui/insignia";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Aviso } from "./campos";
import { MODALIDADES } from "./modalidades";
import { tituloVehiculo, tieneVehiculo } from "./formato";
import { IngresoFormulario } from "./ingreso-formulario";
import { IngresoDetalle } from "./ingreso-detalle";

// Documentos: cómo entra un vehículo a la agencia y qué papeles hacen falta.
// Por ahora solo está implementada la consignación; las otras dos modalidades
// esperan a que se definan sus circuitos.

const PAGINA = 10;

const COLUMNAS = [
  { label: "Vehículo" },
  { label: "Titular" },
  { label: "Papeles" },
  { label: "Originales" },
  { label: "Contrato" },
  { label: "Estado" },
  { label: "", className: "w-12" },
];

const ESTADOS = [
  { valor: "recepcion", label: "En recepción" },
  { valor: "publicado", label: "Publicados" },
  { valor: "retirado", label: "Retirados" },
];
const FILTROS = [{ valor: "", label: "Todos" }, ...ESTADOS];
const LABEL_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e.label]));
const VARIANTE_ESTADO = { recepcion: "info", publicado: "exito", retirado: "neutral" };

const nombreCompleto = (p) => (p ? [p.nombre, p.apellido].filter(Boolean).join(" ") || "Sin nombre" : "—");

// Cuántos originales tiene la agencia de los que debería tener. Es distinto de
// cuántos papeles están cargados: el escaneo no es el papel.
function EstadoOriginales({ papeles }) {
  const esperados = papeles.originales.length + papeles.sinOriginal.length;
  const completo = papeles.sinOriginal.length === 0;

  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", completo ? "text-emerald-500" : "text-amber-500")}
      title={completo ? "Están todos los originales" : `Faltan: ${papeles.sinOriginal.join(", ")}`}
    >
      <Archive className="w-3 h-3" />
      {papeles.originales.length}/{esperados}
    </span>
  );
}

// Cuántos papeles hay y qué tan sanos están: es la información con la que se
// decide si el auto se puede publicar o todavía falta algo.
function EstadoPapeles({ papeles }) {
  const total = papeles.cargados + papeles.faltantes.length;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-foreground tabular-nums">
        {papeles.cargados}/{total}
      </span>
      {papeles.conDiferencias.length > 0 && (
        <span className="text-amber-500 inline-flex items-center gap-0.5" title="Hay papeles que no coinciden con el vehículo">
          <AlertTriangle className="w-3 h-3" /> {papeles.conDiferencias.length}
        </span>
      )}
      {papeles.vencidos.length > 0 && (
        <span className="text-destructive inline-flex items-center gap-0.5" title="Hay papeles vencidos">
          <Clock className="w-3 h-3" /> {papeles.vencidos.length}
        </span>
      )}
    </span>
  );
}

function ListaIngresos({ busqueda, esAdmin, onAbrir }) {
  const [estado, setEstado] = useState("");
  const [editando, setEditando] = useState(null); // null | undefined (nuevo) | ingreso
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerIngresos({ estado, q: busqueda, offset, limite }),
    [estado, busqueda, recarga],
    { limite: PAGINA }
  );

  const refrescar = () => setRecarga((n) => n + 1);

  async function confirmarBorrado() {
    setBorrando(true);
    setError(null);
    try {
      await eliminarIngreso(aBorrar.id);
      setABorrar(null);
      refrescar();
    } catch (e) {
      setError(e.message);
    } finally {
      setBorrando(false);
    }
  }

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
        {esAdmin && (
          <Boton variante="primario" className="ml-auto gap-1.5" onClick={() => setEditando(undefined)}>
            <Plus className="w-4 h-4" /> Nueva consignación
          </Boton>
        )}
      </div>

      {(error || errorLista) && <Aviso>{error || errorLista}</Aviso>}

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Mostrando {items.length} de {total} {total === 1 ? "ingreso" : "ingresos"}
          </p>

          {/* Desktop: tabla */}
          <div className="hidden md:block">
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="Todavía no se registró ninguna consignación.">
              {items.map((i) => (
                <tr key={i.id} className={cn(FILA, "cursor-pointer")} onClick={() => onAbrir(i.id)}>
                  <td className={CELDA}>
                    <span
                      className={cn(
                        "font-medium inline-flex items-center gap-2",
                        tieneVehiculo(i.vehiculo) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <Car className="w-3.5 h-3.5 text-accent shrink-0" /> {tituloVehiculo(i.vehiculo)}
                    </span>
                    {tieneVehiculo(i.vehiculo) && <span className="block text-xs text-muted-foreground">{i.vehiculo.dominio}</span>}
                  </td>
                  <td className={CELDA}>
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> {nombreCompleto(i.titular)}
                    </span>
                    {i.titular?.dni && <span className="block text-xs text-muted-foreground">DNI {i.titular.dni}</span>}
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    <EstadoPapeles papeles={i.papeles} />
                  </td>
                  <td className={`${CELDA} whitespace-nowrap text-xs`}>
                    <EstadoOriginales papeles={i.papeles} />
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    {i.contratoFirmado ? (
                      <Insignia variante="exito">Firmado</Insignia>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin firmar</span>
                    )}
                  </td>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    <Insignia variante={VARIANTE_ESTADO[i.estado] ?? "neutral"}>{LABEL_ESTADO[i.estado] ?? i.estado}</Insignia>
                  </td>
                  <td className={CELDA}>
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setABorrar(i);
                        }}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Tabla>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">
                Todavía no se registró ninguna consignación.
              </p>
            ) : (
              items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => onAbrir(i.id)}
                  className="w-full text-left rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground inline-flex items-center gap-1.5 min-w-0">
                      <Car className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{tituloVehiculo(i.vehiculo)}</span>
                    </p>
                    <Insignia variante={VARIANTE_ESTADO[i.estado] ?? "neutral"}>{LABEL_ESTADO[i.estado] ?? i.estado}</Insignia>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[i.vehiculo.dominio, nombreCompleto(i.titular)].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-3">
                      <EstadoPapeles papeles={i.papeles} />
                      <EstadoOriginales papeles={i.papeles} />
                    </span>
                    <span className="text-muted-foreground">{i.contratoFirmado ? "Contrato firmado" : "Sin firmar"}</span>
                  </div>
                </button>
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
        <IngresoFormulario ingreso={editando} onCerrar={() => setEditando(null)} onGuardado={refrescar} />
      )}

      <ConfirmarModal
        abierto={Boolean(aBorrar)}
        titulo="¿Eliminar este ingreso?"
        mensaje={
          aBorrar
            ? `Se va a archivar ${tituloVehiculo(aBorrar.vehiculo)}${aBorrar.vehiculo.dominio ? ` (${aBorrar.vehiculo.dominio})` : ""} de ${nombreCompleto(aBorrar.titular)}. Los papeles y el contrato quedan guardados.`
            : ""
        }
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}

export function SeccionDocumentos({ busqueda = "", esAdmin = false }) {
  const [modalidad, setModalidad] = useState(MODALIDADES[0].id);
  const [catalogo, setCatalogo] = useState(null);
  const [abierto, setAbierto] = useState(null); // id del ingreso en detalle
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

  // El catálogo define qué papel pide qué. Viene del backend para que el panel
  // no tenga una segunda copia que se desincronice.
  useEffect(() => {
    let activo = true;
    obtenerCatalogoDocumentos()
      .then((datos) => activo && setCatalogo(datos))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false;
    };
  }, []);

  const activa = MODALIDADES.find((m) => m.id === modalidad)?.activa;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {MODALIDADES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setModalidad(m.id);
              setAbierto(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              modalidad === m.id
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && <Aviso>{error}</Aviso>}

      {!activa && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground">Todavía no está definido el circuito de papeles de esta modalidad.</p>
          <p className="text-xs text-muted-foreground mt-1">Consignación ya está operativa.</p>
        </div>
      )}

      {activa && !catalogo && !error && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {activa && catalogo && (
        abierto ? (
          <IngresoDetalle
            ingresoId={abierto}
            catalogo={catalogo}
            esAdmin={esAdmin}
            onVolver={() => setAbierto(null)}
            onEditar={setEditando}
            onCambio={() => setRecarga((n) => n + 1)}
          />
        ) : (
          <ListaIngresos key={recarga} busqueda={busqueda} esAdmin={esAdmin} onAbrir={setAbierto} />
        )
      )}

      {editando && (
        <IngresoFormulario
          ingreso={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => setRecarga((n) => n + 1)}
        />
      )}
    </div>
  );
}
