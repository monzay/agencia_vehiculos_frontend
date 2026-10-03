"use client";

import { useEffect, useState } from "react";
import { Car, User, Plus, Loader2, AlertTriangle, Clock, Archive } from "lucide-react";
import { obtenerIngresos, obtenerCatalogoDocumentos } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Tabla, FILA, CELDA } from "../../ui/tabla";
import { Insignia } from "../../ui/insignia";
import { Aviso } from "./campos";
import { MODALIDADES, MODALIDAD } from "./modalidades";
import { tituloVehiculo, tieneVehiculo } from "./formato";
import { IngresoFormulario } from "./ingreso-formulario";
import { IngresoDetalle } from "./ingreso-detalle";

// Documentos: cómo entra un vehículo a la agencia (consignación, parte de
// pago o compra) y qué papeles hacen falta. Las tres comparten el legajo de papeles;
// cambia el contrato que se firma.

const PAGINA = 10;

const COLUMNAS = [
  { label: "Vehículo" },
  { label: "Titular" },
  { label: "Papeles" },
  { label: "Originales" },
  { label: "Contrato" },
  { label: "Estado" },
];

const ESTADOS = [
  { valor: "recepcion", label: "En recepción" },
  { valor: "publicado", label: "Publicados" },
  { valor: "retirado", label: "Retirados" },
  { valor: "vendido", label: "Vendidos" },
];
const FILTROS = [{ valor: "", label: "Todos" }, ...ESTADOS];
const LABEL_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e.label]));
const VARIANTE_ESTADO = { recepcion: "info", publicado: "exito", retirado: "neutral", vendido: "exito" };

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

function ListaIngresos({ modalidad, busqueda, esAdmin, onAbrir }) {
  const [estado, setEstado] = useState("");
  const [editando, setEditando] = useState(null); // null | undefined (nuevo) | ingreso
  const [recarga, setRecarga] = useState(0);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error: errorLista, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerIngresos({ modalidad, estado, q: busqueda, offset, limite }),
    [modalidad, estado, busqueda, recarga],
    { limite: PAGINA }
  );

  const refrescar = () => setRecarga((n) => n + 1);
  const { nuevo } = MODALIDAD[modalidad];
  const vacio = `Todavía no se registró ninguna ${MODALIDAD[modalidad].label.toLowerCase()}.`;
  // Publicado y retirado son estados de la consignación: un auto comprado o
  // tomado en parte de pago ya es de la agencia y no pasa por ahí.
  const filtros = modalidad === "consignacion" ? FILTROS : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filtros.map((f) => (
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
            <Plus className="w-4 h-4" /> {nuevo}
          </Boton>
        )}
      </div>

      {errorLista && <Aviso>{errorLista}</Aviso>}

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
            <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio={vacio}>
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
                </tr>
              ))}
            </Tabla>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">{vacio}</p>
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
        <IngresoFormulario ingreso={editando} modalidad={modalidad} onCerrar={() => setEditando(null)} onGuardado={refrescar} />
      )}
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

      {!catalogo && !error && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {catalogo && (
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
          <ListaIngresos key={`${modalidad}-${recarga}`} modalidad={modalidad} busqueda={busqueda} esAdmin={esAdmin} onAbrir={setAbierto} />
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
