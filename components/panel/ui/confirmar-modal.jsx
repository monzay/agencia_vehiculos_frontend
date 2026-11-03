"use client";

import { AlertTriangle } from "lucide-react";
import { Modal, ModalPie } from "./modal";
import { Boton } from "./boton";

// Modal de confirmación para acciones destructivas (borrar). Reemplaza el
// confirm() nativo. Se muestra cuando `abierto` es true.
export function ConfirmarModal({
  abierto,
  titulo = "¿Seguro querés eliminar este dato?",
  mensaje = "Esta acción no se puede deshacer.",
  textoConfirmar = "Eliminar",
  textoCancelar = "Cancelar",
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  if (!abierto) return null;
  return (
    <Modal titulo={titulo} icono={AlertTriangle} onCerrar={onCancelar} ancho="max-w-sm">
      <div className="px-6 py-5">
        <p className="text-sm text-muted-foreground">{mensaje}</p>
      </div>
      <ModalPie>
        <Boton variante="fantasma" onClick={onCancelar}>
          {textoCancelar}
        </Boton>
        <Boton
          variante="peligro"
          onClick={onConfirmar}
          cargando={cargando}
          className="bg-destructive text-destructive-foreground border-transparent hover:opacity-90"
        >
          {textoConfirmar}
        </Boton>
      </ModalPie>
    </Modal>
  );
}
