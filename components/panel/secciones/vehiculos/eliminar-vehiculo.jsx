"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { eliminarVehiculo } from "@/lib/api";
import { ConfirmarModal } from "../../ui/confirmar-modal";

export function EliminarVehiculo({ vehiculo, onRecargar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const nombre = `${vehiculo.brand} ${vehiculo.model}`;

  async function eliminar() {
    setCargando(true);
    setError("");
    try {
      await eliminarVehiculo(vehiculo.ref);
      setConfirmando(false);
      onRecargar?.();
    } catch (e) {
      setError(e.message || "No se pudo eliminar el vehículo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        title="Eliminar"
        aria-label={`Eliminar ${nombre}`}
        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <ConfirmarModal
        abierto={confirmando}
        titulo="¿Eliminar este vehículo?"
        mensaje={
          <>
            {`${nombre} (ref ${vehiculo.ref}) va a salir del catálogo y del panel.`}
            {error && <span className="block mt-2 text-destructive">{error}</span>}
          </>
        }
        cargando={cargando}
        onConfirmar={eliminar}
        onCancelar={() => {
          setConfirmando(false);
          setError("");
        }}
      />
    </>
  );
}
