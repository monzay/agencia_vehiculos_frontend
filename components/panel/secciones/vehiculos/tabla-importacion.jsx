"use client";

import { conPuntosDeMiles, soloDigitos, aDigitos } from "@/lib/numeros";
import { combinadorClases as cn } from "@/lib/utilidades";
import { COMBUSTIBLES } from "@/lib/combustibles";
import { Insignia } from "../../ui/insignia";
import { ESTADOS, sePuedeElegir } from "./importacion";

// La propuesta de la importación, una fila por vehículo leído. Se puede corregir
// cada dato antes de crear; lo que la IA leyó con dudas se marca en ámbar.

const VARIANTE_ESTADO = { nuevo: "exito", parecido: "alerta", repetido: "alerta", ya_cargado: "neutral" };

const COLUMNAS = [
  { campo: "marca", titulo: "Marca", ancho: "w-24" },
  { campo: "modelo", titulo: "Modelo", ancho: "w-28" },
  { campo: "version", titulo: "Versión", ancho: "w-28" },
  { campo: "anio", titulo: "Año", ancho: "w-14", numero: true },
  { campo: "kms", titulo: "Kms", ancho: "w-20", numero: true, miles: true },
  { campo: "condicion", titulo: "Condición", ancho: "w-20", opciones: [{ valor: "usado", label: "Usado" }, { valor: "0km", label: "0 km" }] },
  { campo: "combustible", titulo: "Combustible", ancho: "w-24", opciones: COMBUSTIBLES },
  { campo: "precio", titulo: "Precio", ancho: "w-24", numero: true, miles: true },
  { campo: "precio_contado", titulo: "Contado", ancho: "w-24", numero: true, miles: true },
];

const CLASE_CELDA =
  "h-8 px-2 rounded-md bg-secondary border text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50";

const valorVisible = (valor, { numero, miles }) => {
  if (!numero) return valor ?? "";
  return miles ? conPuntosDeMiles(aDigitos(valor)) : aDigitos(valor);
};

const autoCoincidente = (c) =>
  `REF ${c.ref}: ${c.marca} ${c.modelo}${c.version ? ` ${c.version}` : ""}, ${c.anio}, ${conPuntosDeMiles(c.kms)} km`;

function CeldaEstado({ fila }) {
  const estado = ESTADOS[fila.estado];
  const detalle = fila.coincide ? `${estado.ayuda} ${autoCoincidente(fila.coincide)}` : estado.ayuda;
  return (
    <div className="space-y-0.5">
      <Insignia variante={VARIANTE_ESTADO[fila.estado]} title={detalle}>
        {estado.etiqueta}
      </Insignia>
      {fila.coincide && <p className="text-[10px] text-muted-foreground whitespace-nowrap">REF {fila.coincide.ref}</p>}
    </div>
  );
}

function Celda({ fila, columna, numeroFila, onCambiar, deshabilitada }) {
  const dudoso = fila.dudosos?.includes(columna.campo);
  const comun = {
    disabled: deshabilitada,
    "aria-label": `${columna.titulo}, fila ${numeroFila}`,
    title: dudoso ? "Leído con dudas: revisalo contra la lista" : undefined,
    className: cn(CLASE_CELDA, columna.ancho, dudoso ? "border-amber-500/70 bg-amber-500/10" : "border-border"),
  };

  if (columna.opciones) {
    return (
      <td className="px-1.5 py-1.5">
        <select {...comun} value={fila[columna.campo] ?? ""} onChange={(e) => onCambiar(fila.id, columna.campo, e.target.value)}>
          <option value="">—</option>
          {columna.opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.label}</option>
          ))}
        </select>
      </td>
    );
  }

  const cambiar = (texto) => onCambiar(fila.id, columna.campo, columna.numero ? soloDigitos(texto) : texto);
  return (
    <td className="px-1.5 py-1.5">
      <input
        {...comun}
        value={valorVisible(fila[columna.campo], columna)}
        onChange={(e) => cambiar(e.target.value)}
        inputMode={columna.numero ? "numeric" : undefined}
        maxLength={columna.campo === "anio" ? 4 : undefined}
      />
    </td>
  );
}

export function TablaImportacion({ filas, onAlternar, onCambiar, deshabilitada = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-muted-foreground text-xs">
          <tr>
            <th className="px-3 py-2 w-10"><span className="sr-only">Crear</span></th>
            <th className="px-2 py-2 text-left font-medium">Estado</th>
            {COLUMNAS.map((c) => (
              <th key={c.campo} className="px-1.5 py-2 text-left font-medium">{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filas.map((fila, i) => {
            const elegible = sePuedeElegir(fila);
            return (
              <tr key={fila.id} className={cn(!fila.elegida && "opacity-60")}>
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={fila.elegida}
                    onChange={() => onAlternar(fila.id)}
                    disabled={!elegible || deshabilitada}
                    aria-label={`Crear fila ${i + 1}`}
                    className="h-4 w-4 accent-accent"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <CeldaEstado fila={fila} />
                </td>
                {COLUMNAS.map((c) => (
                  <Celda
                    key={c.campo}
                    fila={fila}
                    columna={c}
                    numeroFila={i + 1}
                    onCambiar={onCambiar}
                    deshabilitada={!elegible || deshabilitada}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
