import { NextResponse } from "next/server";

// Link de captación de un asesor: `/a/agustina`.
//
// El asesor lo publica en sus redes. Acá NO se manda a WhatsApp: se deja una
// marca en el navegador y se lo suelta en la portada, para que recorra el
// catálogo como cualquier visitante. Cuando toque "Consultar", el mensaje sale
// con el código del asesor adentro (ver lib/constantes.js) y el bot le atribuye
// la consulta en vez de repartirla por carga.
//
// Si el slug no existe o el asesor está inactivo, igual se lo manda a la
// portada, sin marca: un cliente que llega por un link viejo tiene que ver el
// sitio, no un 404. El costo es que un link mal escrito pierde la atribución en
// silencio, y por eso el panel muestra el link ya armado para copiar.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Ventana de atribución: cuánto vale el link después de que el cliente entra.
// 30 minutos cubre de sobra mirar el catálogo y escribir; pasado ese rato la
// consulta se considera espontánea y cae al reparto equitativo.
const MINUTOS = 30;

export async function GET(request, { params }) {
  const { slug } = await params;
  const respuesta = NextResponse.redirect(new URL("/", request.url));

  try {
    const res = await fetch(`${API_URL}/api/asesores/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return respuesta;

    const json = await res.json().catch(() => ({}));
    const valido = json?.data?.slug;
    if (!valido) return respuesta;

    // La marca CADUCA sola: la atribución vale para la visita que entró por el
    // link, no para las siguientes. Si el cliente vuelve más tarde escribiendo
    // la dirección a mano, esa consulta va al reparto equitativo.
    //
    // Un plazo fijo y no una cookie de sesión porque el navegador del celular
    // casi nunca se cierra del todo: "hasta que cierre el navegador" puede ser
    // días. Con 30 días —como estaba— toda visita posterior seguía llevando la
    // marca y nunca se caía al reparto.
    //
    // Sin httpOnly a propósito: quien arma el link de WhatsApp es el navegador.
    respuesta.cookies.set("asesor", valido, {
      maxAge: MINUTOS * 60,
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // La API caída no puede dejar al visitante sin portada.
  }

  return respuesta;
}
