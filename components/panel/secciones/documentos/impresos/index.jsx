"use client";

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, Loader2 } from "lucide-react";
import { obtenerImpresosIngreso, obtenerImpresosCompraventa } from "@/lib/api";
import { Boton } from "../../../ui/boton";
import { fecha } from "./etiquetas";
import { Contrato } from "./contrato";
import { ReciboDocumentacion } from "./recibo-documentacion";
import { ReciboRecepcion } from "./recibo-recepcion";
import { Boleto } from "./boleto";
import { CompromisoTransferencia } from "./compromiso-transferencia";

// Los papeles que se le entregan al cliente, armados de la misma fuente. Cada
// uno es una hoja y salen en este orden; agregar uno es agregarlo a la lista.
//
// No se genera un PDF en el servidor: se imprime la hoja desde el navegador, y
// "Guardar como PDF" del diálogo de impresión da el archivo. Una dependencia
// menos y lo que se ve en pantalla es exactamente lo que sale impreso.

// La marca de agua es solo del contrato: los recibos son constancias de lo que
// el cliente entregó y se firman limpias.
const RECIBO_DOCUMENTACION = { clave: "recibo-documentacion", render: (d) => <ReciboDocumentacion datos={d} /> };
const RECIBO_RECEPCION = { clave: "recibo-recepcion", render: (d) => <ReciboRecepcion datos={d} /> };

// Sin recibo de recepción: la fecha, quién recibió la unidad y su estado ya van
// en la cláusula 7 del contrato, que sale por duplicado.
const CONSIGNACION = {
  cargar: obtenerImpresosIngreso,
  hojas: [
    { clave: "contrato-cliente", render: (d, marca) => <Contrato datos={d} copia="original para el cliente" marcaAgua={marca} /> },
    { clave: "contrato-agencia", render: (d, marca) => <Contrato datos={d} copia="duplicado para la agencia" marcaAgua={marca} /> },
    RECIBO_DOCUMENTACION,
  ],
};

// Compra y permuta: el boleto por duplicado, los mismos recibos y, al final, el
// compromiso de transferencia que se lleva el vendedor.
const COMPRAVENTA = {
  cargar: obtenerImpresosCompraventa,
  hojas: [
    { clave: "boleto-cliente", render: (d, marca) => <Boleto datos={d} copia="original para el cliente" marcaAgua={marca} /> },
    { clave: "boleto-agencia", render: (d, marca) => <Boleto datos={d} copia="duplicado para la agencia" marcaAgua={marca} /> },
    RECIBO_DOCUMENTACION,
    RECIBO_RECEPCION,
    { clave: "compromiso-transferencia", render: (d) => <CompromisoTransferencia datos={d} /> },
  ],
};

const POR_MODALIDAD = { consignacion: CONSIGNACION, compra: COMPRAVENTA, permuta: COMPRAVENTA };

const LARGO_MARCA = 24;

export function Impresos({ ingresoId, modalidad, onCerrar }) {
  const { cargar, hojas } = POR_MODALIDAD[modalidad];
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [montado, setMontado] = useState(false);
  const [marcaAgua, setMarcaAgua] = useState("");

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    let activo = true;
    cargar(ingresoId)
      .then((d) => activo && setDatos(d))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false;
    };
  }, [ingresoId, cargar]);

  if (!montado) return null;

  return createPortal(
    <div className="hoja-impresion fixed inset-0 z-50 bg-white text-black overflow-y-auto">
      <div className="sin-imprimir sticky top-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 bg-white">
        <p className="text-sm font-medium">
          Contrato y recibos
          {datos?.firmado && <span className="ml-2 text-xs text-black/50">Firmado el {fecha(datos.firmado)} — copia congelada</span>}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-black/60">
            Marca de agua
            <input
              value={marcaAgua}
              onChange={(e) => setMarcaAgua(e.target.value)}
              maxLength={LARGO_MARCA}
              placeholder="BORRADOR"
              className="w-36 h-8 px-2 rounded-lg border border-black/15 bg-white text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-black/40"
            />
          </label>
          <Boton variante="primario" className="gap-1.5" onClick={() => window.print()} disabled={!datos}>
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </Boton>
          <button onClick={onCerrar} className="p-2 rounded-lg text-black/60 hover:text-black hover:bg-black/5" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="caja-impresion max-w-[800px] mx-auto px-8 py-8">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!datos && !error && (
          <p className="flex items-center gap-2 text-sm text-black/60">
            <Loader2 className="w-4 h-4 animate-spin" /> Armando los documentos…
          </p>
        )}
        {datos && hojas.map(({ clave, render }) => <Fragment key={clave}>{render(datos, marcaAgua)}</Fragment>)}
      </div>
    </div>,
    document.body
  );
}
