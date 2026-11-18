// ajustes-por-chats-reales, tarea 9: URLs (firmadas, vencen a los 15 min) de las fotos del usado que mandó el cliente.
// Solo http(s): nada de javascript:, data: ni valores vacíos.
export function fotosDelUsado(detalle) {
  const fotos = detalle?.fotosUsado;
  if (!Array.isArray(fotos)) return [];
  return fotos
    .map((f) => (f && typeof f.url === "string" ? f.url.trim() : ""))
    .filter((u) => /^https?:\/\//i.test(u));
}
