"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { obtenerPrecargaTramite } from "@/lib/api";
import { Modal, ModalPie } from "../ui/modal";
import { Boton } from "../ui/boton";
import { Aviso } from "./documentos/campos";
import { OPERACIONES, TarjetasOperacion, FormularioOperacion } from "./operaciones";

// Botón Avanzar de una consulta: el admin elige la operación y se abre su formulario
// con los datos de la consulta. Nada se crea hasta que confirma el formulario.
//
// Compra y consignación no están acá: no nacen de una consulta, entran por Trámites.

const IDS_DE_CONSULTA = ["sena", "contado", "permuta"];
const OPERACIONES_DE_CONSULTA = OPERACIONES.filter((o) => IDS_DE_CONSULTA.includes(o.id));

export function AvanzarConsulta({ sesionId, onCerrar, onSenaCreada, onTramiteCreado }) {
  const [precarga, setPrecarga] = useState(null);
  const [error, setError] = useState(null);
  const [operacion, setOperacion] = useState(null);

  useEffect(() => {
    let vigente = true;
    obtenerPrecargaTramite(sesionId)
      .then((datos) => vigente && setPrecarga(datos))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [sesionId]);

  if (operacion) {
    return (
      <FormularioOperacion
        operacion={operacion}
        precarga={precarga}
        onCerrar={() => setOperacion(null)}
        onSenaCreada={onSenaCreada}
        onTramiteCreado={onTramiteCreado}
      />
    );
  }

  const aviso = precarga?.auto?.aviso ?? precarga?.avisoAuto;

  return (
    <Modal titulo="Avanzar consulta" icono={ArrowRight} onCerrar={onCerrar}>
      <div className="px-6 py-5 space-y-4 overflow-y-auto">
        {error && <Aviso>No se pudieron traer los datos de la consulta: {error}</Aviso>}
        {!precarga && !error && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {precarga && (
          <>
            <p className="text-sm text-foreground break-words">
              <strong>{precarga.cliente?.nombre || "Sin nombre"}</strong>
              {precarga.titulo && ` · consulta por ${precarga.titulo}`}
            </p>
            {aviso && <Aviso tono="alerta">{aviso}</Aviso>}
            <p className="text-sm text-muted-foreground">¿Qué necesita el cliente?</p>
            <TarjetasOperacion opciones={OPERACIONES_DE_CONSULTA} onElegir={setOperacion} />
          </>
        )}
      </div>
      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Volver
        </Boton>
      </ModalPie>
    </Modal>
  );
}
