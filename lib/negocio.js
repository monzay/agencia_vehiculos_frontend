"use client";
import { useEffect, useState } from "react";
import { obtenerUbicacion } from "@/lib/api";
import { INFO_NEGOCIO } from "@/lib/constantes";

// Nombre de la agencia leído de la DB (tabla `ubicacion`), con INFO_NEGOCIO.name
// como respaldo si la API falla o el campo está vacío. La promesa se cachea a
// nivel módulo para hacer una sola request aunque el hook se use en muchas
// tarjetas del catálogo a la vez.
let promesaNombre = null;

export function useNombreAgencia() {
  const [nombre, setNombre] = useState(INFO_NEGOCIO.name);

  useEffect(() => {
    if (!promesaNombre) {
      promesaNombre = obtenerUbicacion()
        .then((u) => u?.nombre?.trim() || INFO_NEGOCIO.name)
        .catch(() => INFO_NEGOCIO.name);
    }
    let activo = true;
    promesaNombre.then((n) => activo && setNombre(n));
    return () => { activo = false; };
  }, []);

  return nombre;
}
