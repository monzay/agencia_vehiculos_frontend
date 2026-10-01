"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { actualizarIngreso, cambiarEstadoIngreso } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Aviso, Paso } from "./campos";
import { FotosVehiculo, aFotos, listaDeFotos } from "./fotos-vehiculo";

// Publicar una consignación: antes de salir a la web se cargan las fotos del
// auto. La principal es obligatoria (es la portada de la ficha); las otras 3,
// opcionales. Las fotos se guardan en el ingreso y después se publica: si la
// publicación falla (por ejemplo, falta firmar), las fotos quedan para el
// próximo intento.

export function PublicarModal({ ingreso, onCerrar, onPublicado }) {
  const [fotos, setFotos] = useState(() => aFotos(ingreso.fotos));
  const [error, setError] = useState(null);
  const [publicando, setPublicando] = useState(false);

  async function publicar() {
    if (!fotos.principal) return setError("Subí la foto principal: es la portada del auto en la web.");

    setPublicando(true);
    setError(null);
    try {
      await actualizarIngreso(ingreso.id, { fotos: listaDeFotos(fotos) });
      onPublicado(await cambiarEstadoIngreso(ingreso.id, "publicado"));
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Modal titulo="Publicar en la web" icono={Globe} onCerrar={onCerrar} ancho="max-w-3xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}
        <Paso n={1} titulo="Fotos del vehículo" ayuda="La principal es obligatoria y hasta 3 más. Son las que se ven en la ficha de la web." primero>
          <FotosVehiculo fotos={fotos} onCambio={setFotos} onError={setError} />
        </Paso>
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" className="gap-1.5" onClick={publicar} cargando={publicando} disabled={!fotos.principal}>
          <Globe className="w-3.5 h-3.5" /> Publicar
        </Boton>
      </ModalPie>
    </Modal>
  );
}
