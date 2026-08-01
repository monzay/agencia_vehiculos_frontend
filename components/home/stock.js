"use client";
import { useEffect, useState } from "react";
import { obtenerVehiculos } from "@/lib/api";

// El stock lo necesitan tres secciones de la portada —el hero, la grilla de
// vehículos y la tira de marcas— y es la misma lista. La promesa se cachea a
// nivel de módulo: el primero que la pide dispara el fetch y los demás se
// cuelgan de ese mismo, así la portada hace UNA request y no tres.
//
// Los errores se resuelven como lista vacía a propósito: ninguna sección debe
// tener que saber por qué no hay datos, solo si los hay.
let promesa = null;

function obtenerStock() {
  if (!promesa) {
    promesa = obtenerVehiculos()
      .then((v) => (Array.isArray(v) ? v : []))
      .catch(() => []);
  }
  return promesa;
}

// null mientras carga, array después.
function useStock() {
  const [stock, setStock] = useState(null);

  useEffect(() => {
    let vivo = true;
    obtenerStock().then((v) => vivo && setStock(v));
    return () => {
      vivo = false;
    };
  }, []);

  return stock;
}

export { useStock };
