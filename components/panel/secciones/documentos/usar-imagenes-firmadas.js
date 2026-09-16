"use client";

import { useEffect, useState } from "react";
import { firmarImagenesDocumento } from "@/lib/api";

// Las imágenes de los papeles están en un store privado: lo que se guarda es el
// pathname, que solo, no abre nada. Este hook los cambia por URLs firmadas que
// sirven un rato.
//
// Devuelve un mapa pathname → URL en vez de una lista, porque quien llama sigue
// identificando cada imagen por su pathname (para borrarla, por ejemplo) y la
// URL firmada cambia en cada pedido.
export function useImagenesFirmadas(ingresoId, pathnames) {
  const [urls, setUrls] = useState({});
  const [error, setError] = useState(null);

  // La lista se compara por contenido y no por identidad: en cada render llega
  // un array nuevo, y depender de él dispararía un pedido por render.
  const clave = (pathnames ?? []).join("|");

  useEffect(() => {
    const lista = clave ? clave.split("|") : [];
    if (!ingresoId || !lista.length) {
      setUrls({});
      return;
    }

    let activo = true;
    setError(null);

    firmarImagenesDocumento(ingresoId, lista)
      .then(({ urls: firmadas }) => {
        if (!activo) return;
        setUrls(Object.fromEntries(lista.map((p, i) => [p, firmadas[i]])));
      })
      .catch((e) => activo && setError(e.message));

    return () => {
      activo = false;
    };
  }, [ingresoId, clave]);

  return { urls, error };
}
