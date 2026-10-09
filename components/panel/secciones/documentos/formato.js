import { vendeLaAgencia } from "./modalidades";

// Cómo se muestran los valores de un papel. Lo usan la ficha, la vista del papel
// y los impresos, para que una fecha o un monto se lean igual en los tres.

// Fechas sin hora ("2027-08-14"): vencimientos y fechas de emisión.
// `new Date("2027-08-14")` las interpreta como medianoche UTC, y en Argentina
// (UTC-3) eso cae el día anterior: un papel que vence el 14 se mostraba vencido
// el 13. Se arman como fecha local para que el día sea el que dice el papel.
export function fechaSinHora(valor) {
  if (!valor) return null;
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR");
}

// Momentos con hora (cuándo se cargó, cuándo se firmó): ahí sí corresponde
// convertir a la hora local.
export const fechaDeMomento = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR") : null);

const pesos = (n) => `$ ${Number(n).toLocaleString("es-AR")}`;

// Un campo declarado en el catálogo, listo para leer. Devuelve null si está vacío.
export function valorLegible(campo, valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  switch (campo.tipo) {
    case "booleano":
      return valor ? "Sí" : "No";
    case "fecha":
      return fechaSinHora(valor);
    case "moneda":
      return pesos(valor);
    case "opciones":
      return String(valor).replace(/_/g, " ");
    default:
      return String(valor);
  }
}

// Documentos de una persona, con los separadores que tienen impresos en el
// papel: "32.457.981" y "27-32457981-4" en vez de una tira de dígitos.
export const dni = (v) => (v ? Number(v).toLocaleString("es-AR") : null);
export const cuit = (v) => (v && v.length === 11 ? `${v.slice(0, 2)}-${v.slice(2, 10)}-${v.slice(10)}` : v || null);

// Un ingreso no tiene vehículo hasta que se carga el título del automotor, que
// es de donde salen marca, modelo, año y dominio.
export const tieneVehiculo = (v) => Boolean(v?.dominio);
export const tituloVehiculo = (v) => (tieneVehiculo(v) ? `${v.marca} ${v.modelo} ${v.anio}` : "Sin título cargado");

// Cómo se nombra un trámite en la lista: en una venta, por el auto que compra
// el cliente (aunque entregue un usado); si no, por el auto que recibe la agencia.
export function vehiculoDelTramite(i) {
  const a = vendeLaAgencia(i.modalidad) ? i.autoInteres : null;
  if (!a) return { titulo: tituloVehiculo(i.vehiculo), dominio: i.vehiculo.dominio, conDatos: tieneVehiculo(i.vehiculo) };
  return { titulo: `${a.marca} ${a.modelo} ${a.anio}`, dominio: a.dominio, conDatos: true };
}
