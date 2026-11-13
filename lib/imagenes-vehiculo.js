// Tope de imágenes por vehículo: la principal y 5 más (el backend acepta 6 en total).
export const IMAGENES_ADICIONALES_MAX = 5;

export const lugaresLibres = (adicionales) => Math.max(0, IMAGENES_ADICIONALES_MAX - adicionales.length);

export function repartirElegidas(adicionales, elegidas) {
  const lugares = lugaresLibres(adicionales);
  return { entran: elegidas.slice(0, lugares), sobran: elegidas.slice(lugares) };
}

export const imagenesParaGuardar = (principal, adicionales) =>
  [principal, ...adicionales.slice(0, IMAGENES_ADICIONALES_MAX)].filter(Boolean);
