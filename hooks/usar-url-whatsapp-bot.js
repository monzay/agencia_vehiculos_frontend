"use client";
import { useEffect, useState } from "react";
import { codigoAsesor, obtenerUrlWhatsAppBot } from "@/lib/constantes";

// URL al bot para los CTA que son `<a href>`.
//
// El código del asesor que trajo la visita vive en una cookie, y estos
// componentes también se renderizan en el servidor, donde no existe. El primer
// render tiene que dar EXACTAMENTE lo mismo en los dos lados: si el href difiere,
// React avisa "some attributes... won't be patched up" y se queda con el del
// servidor, sin marca, para siempre.
//
// Por eso el slug arranca vacío —también en el cliente, aunque la cookie ya esté
// ahí— y recién se lee después de montar. Ese cambio de "" a "agustina" es lo que
// dispara el re-render que sí actualiza el atributo.
export function usarUrlWhatsAppBot(mensaje) {
  const [slug, setSlug] = useState("");

  useEffect(() => {
    setSlug(codigoAsesor());
  }, []);

  return obtenerUrlWhatsAppBot(mensaje, slug);
}
