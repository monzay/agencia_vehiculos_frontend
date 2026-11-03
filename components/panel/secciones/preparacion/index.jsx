"use client";

import { useState } from "react";
import { Car, Loader2 } from "lucide-react";
import { obtenerPreparaciones } from "@/lib/api";
import { usarListaPaginada } from "@/hooks/usar-lista-paginada";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Tabla, FILA, CELDA } from "../../ui/tabla";
import { Insignia } from "../../ui/insignia";
import { Aviso } from "../documentos/campos";
import { FichaPreparacion, ETAPAS, ORIGENES, tituloUsado } from "./ficha";

// Preparación: los usados que recibió la agencia en una compra o una parte de pago,
// hasta que salen a la web. Entran solos al firmar el boleto.

const PAGINA = 10;
const COLUMNAS = [{ label: "Vehículo" }, { label: "Origen" }, { label: "Etapa" }, { label: "Días" }, { label: "Para publicar" }];
const FILTROS = [{ valor: "", label: "Todos" }, ...Object.entries(ETAPAS).map(([valor, { label }]) => ({ valor, label }))];

const avanceRequisitos = ({ items }) => `${items.filter((i) => i.cumplido).length} de ${items.length}`;

// `abrirId`: la preparación a abrir de entrada (desde el legajo).
export function SeccionPreparacion({ busqueda = "", esAdmin = false, abrirId = null, onAbrirTramite }) {
  const [etapa, setEtapa] = useState("");
  const [abierta, setAbierta] = useState(abrirId);
  const [recarga, setRecarga] = useState(0);

  const { items, total, hayMas, cargandoInicial, cargandoMas, error, cargarMas } = usarListaPaginada(
    ({ offset, limite }) => obtenerPreparaciones({ etapa, q: busqueda, offset, limite }),
    [etapa, busqueda, recarga],
    { limite: PAGINA }
  );

  if (abierta) {
    return (
      <FichaPreparacion
        preparacionId={abierta}
        esAdmin={esAdmin}
        onVolver={() => setAbierta(null)}
        onAbrirTramite={onAbrirTramite}
        onCambio={() => setRecarga((n) => n + 1)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setEtapa(f.valor)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              etapa === f.valor
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <Aviso>{error}</Aviso>}

      {cargandoInicial ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total === 1 ? "1 usado" : `${total} usados`}. Entran solos al firmar el boleto de una compra o de una parte de pago.
          </p>
          <Tabla columnas={COLUMNAS} vacio={items.length === 0} mensajeVacio="No hay usados en esta etapa.">
            {items.map((p) => (
              <tr key={p.id} className={cn(FILA, "cursor-pointer")} onClick={() => setAbierta(p.id)}>
                <td className={CELDA}>
                  <span className="font-medium text-foreground inline-flex items-center gap-2">
                    <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {tituloUsado(p.vehiculo)}
                  </span>
                  {p.vehiculo.dominio && <span className="ml-5.5 block text-xs text-muted-foreground">{p.vehiculo.dominio}</span>}
                </td>
                <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>{ORIGENES[p.origen]}</td>
                <td className={`${CELDA} whitespace-nowrap`}>
                  <Insignia variante={ETAPAS[p.etapa]?.variante}>{ETAPAS[p.etapa]?.label}</Insignia>
                </td>
                <td className={`${CELDA} text-muted-foreground tabular-nums`}>{p.dias ?? "—"}</td>
                <td className={`${CELDA} text-muted-foreground whitespace-nowrap`}>
                  {["publicado", "vendido"].includes(p.etapa) ? "—" : avanceRequisitos(p.requisitos)}
                </td>
              </tr>
            ))}
          </Tabla>
          {hayMas && (
            <div className="flex justify-center pt-1">
              <Boton variante="secundario" onClick={cargarMas} cargando={cargandoMas}>
                {cargandoMas ? "Cargando…" : `Ver más (${total - items.length} restantes)`}
              </Boton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
