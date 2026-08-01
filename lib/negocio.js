"use client";
import { useEffect, useState } from "react";
import { obtenerUbicacion } from "@/lib/api";
import { INFO_NEGOCIO } from "@/lib/constantes";

// Datos de la agencia leídos de la DB (tabla `ubicacion`). La promesa se cachea
// a nivel módulo: la portada y el pie piden lo mismo y así se hace UNA request.
let promesaUbicacion = null;

function obtenerUbicacionCacheada() {
  if (!promesaUbicacion) {
    promesaUbicacion = obtenerUbicacion().catch(() => null);
  }
  return promesaUbicacion;
}

/**
 * Ubicación cruda de la DB. `null` mientras carga y también si no hay registro
 * cargado: quien la use decide qué mostrar, en vez de recibir datos de relleno.
 */
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerUbicacionCacheada().then((u) => activo && setUbicacion(u ?? null));
    return () => {
      activo = false;
    };
  }, []);

  return ubicacion;
}

// El NOMBRE sí conserva respaldo: es el de la marca, no un dato operativo, y
// una portada sin nombre de agencia no tiene sentido.
export function useNombreAgencia() {
  const [nombre, setNombre] = useState(INFO_NEGOCIO.name);

  useEffect(() => {
    let activo = true;
    obtenerUbicacionCacheada().then(
      (u) => activo && setNombre(u?.nombre?.trim() || INFO_NEGOCIO.name)
    );
    return () => {
      activo = false;
    };
  }, []);

  return nombre;
}
