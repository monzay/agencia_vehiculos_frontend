import { ListaResumen } from "./contrato-resumen";
import { fechaSinHora, fechaDeMomento } from "./formato";
import { pesos, hora, FORMAS, A_CARGO } from "./impresos/etiquetas";

// El boleto de una compra directa o de una venta con parte de pago, resumido en
// el legajo.

const PAGADOR = { agencia: "Paga la agencia", cliente: "Paga el cliente" };

// Quién paga, cuánto, y si queda saldo. Si el usado cubre el precio justo, no
// se mueve plata.
function resumenPago({ pagador, monto, forma, enActo, saldo, saldoFecha }) {
  if (!pagador) return "Sin saldo: el usado cubre el precio";
  const base = `${PAGADOR[pagador]} ${pesos(monto)} · ${FORMAS[forma]}`;
  return saldo > 0 ? `${base} · ${pesos(enActo)} en el acto, saldo ${pesos(saldo)} el ${fechaSinHora(saldoFecha)}` : base;
}

export function ResumenCompraventa({ contrato }) {
  const { permuta, transferencia } = contrato;
  const filas = [
    ...(permuta
      ? [
          ["Vende la agencia", `${permuta.marca} ${permuta.modelo} ${permuta.anio} · ${permuta.dominio}`],
          ["Precio de venta", pesos(permuta.valor)],
          ["Usado en parte de pago", pesos(contrato.precio)],
        ]
      : [["Valor del vehículo del cliente", pesos(contrato.precio)]]),
    ["Pago", resumenPago(contrato.pago)],
    ["Entrega de la unidad", `${fechaDeMomento(contrato.entrega)} ${hora(contrato.entrega)}`],
    ["Transferir hasta el", `${fechaDeMomento(transferencia.vence)} (${transferencia.dias} días)`],
    ["Gastos de transferencia", A_CARGO[transferencia.gastosACargo]],
    ["Jurisdicción", contrato.jurisdiccion ?? "Domicilio de la agencia"],
  ];

  return (
    <ListaResumen
      filas={filas}
      textos={[
        ["Estado de la unidad", contrato.estadoUnidad],
        ["Condiciones particulares", contrato.condiciones],
      ]}
    />
  );
}
