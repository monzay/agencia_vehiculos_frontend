"use client";

import { useState } from "react";
import { TarjetasOperacion, FormularioOperacion } from "./operaciones";

// Trámites: para los clientes que no vienen de una consulta. Una consulta avanza
// desde su propio botón Avanzar. Lo creado se sigue después en su sección (Señas
// o Documentos).

// `onSenaCreada`: lleva a Señas. `onTramiteCreado({ id, modalidad })`: abre el legajo en Documentos.
export function SeccionTramites({ onSenaCreada, onTramiteCreado }) {
  const [abierto, setAbierto] = useState(null); // sena | consignacion | compra | contado | permuta

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-foreground">¿Qué necesita el cliente?</p>
        <p className="text-xs text-muted-foreground mt-0.5">Para clientes que no vienen de una consulta.</p>
      </div>
      <TarjetasOperacion className="sm:grid-cols-2" onElegir={setAbierto} />

      {abierto && (
        <FormularioOperacion
          operacion={abierto}
          onCerrar={() => setAbierto(null)}
          onSenaCreada={onSenaCreada}
          onTramiteCreado={onTramiteCreado}
        />
      )}
    </div>
  );
}
