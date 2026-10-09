import { Hoja, Encabezado, Clausula, Clausulas, Firmas, MarcaAgua } from "./hoja";
import { Partes } from "./contrato";
import { DE_QUIEN, FORMAS, cuentaDestino, fecha, fechaLarga, hora, kilometros, originales, pesosConLetras } from "./etiquetas";
import { fechaSinHora } from "../formato";

// El boleto de compraventa de automotor, por duplicado: original para el
// cliente y duplicado para la agencia. Sirve para todas las modalidades:
//
//   - Compra directa: el cliente VENDE su auto a la agencia.
//   - Parte de pago: la agencia VENDE un auto de su stock al cliente, y el
//     cliente entrega su usado a cuenta del precio. En los datos, `permuta` es
//     el auto que vende la agencia y `precio` es el valor asignado al usado.
//   - Venta sin usado (al contado, o parte de pago sin entregar un usado): la
//     agencia vende y el cliente paga; `precio` es 0.
//
// Cubre lo que un boleto de automotor tiene que dejar escrito: objeto, precio y
// forma de pago, el momento exacto de la entrega (corta responsabilidades),
// titularidad y gravámenes, evicción y vicios ocultos, deudas anteriores,
// documentación, plazo de transferencia, incumplimiento y jurisdicción.
//
// Las cláusulas se arman como lista y se numeran al final: las condiciones
// particulares aparecen solo cuando hay, y la numeración no queda con huecos.

const unir = (...partes) => partes.filter(Boolean).join(" - ");

const describir = (a) =>
  [`${a.marca} ${a.modelo} (${a.anio})`, `dominio ${a.dominio}`, a.motor && `motor ${a.motor}`, a.chasis && `chasis ${a.chasis}`]
    .filter(Boolean)
    .join(", ");

const estadoDe = (c) => (c.estadoUnidad ? `Estado: ${c.estadoUnidad.replace(/\.?$/, ".")}` : "Sin observaciones sobre su estado.");

// Cuánto se paga en el acto y cuánto después, dicho por quien paga. El recibo
// del pago en el acto es el propio boleto: por eso lo dice.
function pagos(pago, quien, titular) {
  const medio = FORMAS[pago.forma];
  const cuenta = pago.pagador === "agencia" && pago.forma === "transferencia" ? cuentaDestino(titular) : "";

  const partes = [];
  if (pago.enActo > 0) {
    partes.push(`${quien} abona en este acto ${pesosConLetras(pago.enActo)} por ${medio}${cuenta}, sirviendo el presente de suficiente recibo`);
  }
  if (pago.saldo > 0) {
    const saldo = `${pesosConLetras(pago.saldo)} se abonará el ${fechaSinHora(pago.saldoFecha)} por ${medio}${cuenta}`;
    partes.push(pago.enActo > 0 ? `el resto, ${saldo}` : `${quien} abonará la totalidad: ${saldo}`);
  }
  const mora = pago.saldo > 0 ? " La mora en el pago es automática, sin necesidad de interpelación previa." : "";
  return `${partes.join("; ")}.${mora}`;
}

// Las tres del final son iguales en las dos modalidades.
const clausulasFinales = (c) => [
  c.condiciones && { titulo: "Condiciones particulares", texto: c.condiciones },
  {
    titulo: "Incumplimiento",
    texto:
      "Ante el incumplimiento de cualquiera de las partes, la otra podrá exigir el cumplimiento o resolver el contrato, en ambos casos con más los daños y perjuicios (arts. 1083 y ss. del Código Civil y Comercial).",
  },
  {
    titulo: "Domicilios y jurisdicción",
    texto: `Las partes constituyen domicilio en los indicados en este instrumento y se someten a los tribunales ordinarios de ${
      c.jurisdiccion || "la ciudad del domicilio de la agencia"
    }, con renuncia a cualquier otro fuero.`,
  },
];

const GARANTIA =
  "no registra prendas, embargos, inhibiciones, denuncias de robo o hurto ni otras restricciones al dominio. Responde por evicción y por vicios ocultos en los términos de los arts. 1033 a 1058 del Código Civil y Comercial.";
const DENUNCIA = "formular la denuncia de venta ante el Registro (art. 27, Decreto-Ley 6582/58)";

function documentacion(datos, quien) {
  const docs = originales(datos.papelesEntregados);
  const entregados = docs.length
    ? `${quien} entrega en original: ${docs.map((p) => p.label).join(", ")}. El detalle completo consta en el recibo adjunto.`
    : "El detalle de la documentación entregada consta en el recibo adjunto.";
  return `${entregados} ${quien} se obliga a firmar, con firma certificada, el formulario 08 y todo otro instrumento necesario para la transferencia cuando la agencia lo requiera.`;
}

// Compra directa: el cliente vende, la agencia compra.
function clausulasCompra(datos) {
  const c = datos.condiciones;
  const km = kilometros(datos.vehiculo.kmRecepcion) ?? "—";

  return [
    {
      titulo: "Objeto",
      texto:
        "El vendedor vende a la agencia, y ésta compra, el vehículo descripto, en el estado en que se encuentra, que la agencia declara conocer por haberlo revisado.",
    },
    { titulo: "Precio", texto: `El precio total y definitivo de la compraventa es de ${pesosConLetras(c.precio)}.` },
    { titulo: "Forma de pago", texto: pagos(c.pago, "La agencia", datos.titular) },
    {
      titulo: "Entrega y responsabilidad",
      texto: `El vendedor entrega la unidad el ${fechaLarga(c.entrega)} a las ${hora(c.entrega)} hs, con ${km} km. ${estadoDe(c)} Hasta ese momento son a su exclusivo cargo las responsabilidades civiles, penales, administrativas y fiscales derivadas de la unidad; desde ese momento lo son de la agencia.`,
    },
    { titulo: "Titularidad y garantías", texto: `El vendedor declara ser titular de la unidad o estar facultado para disponer de ella, y que ${GARANTIA}` },
    {
      titulo: "Deudas anteriores",
      texto:
        "Las patentes, multas e infracciones devengadas hasta la entrega son a cargo del vendedor, y las posteriores, de la agencia. Si apareciera una deuda anterior a la entrega, la agencia podrá descontarla de lo que reste pagar o reclamarla al vendedor.",
    },
    { titulo: "Documentación", texto: documentacion(datos, "El vendedor") },
    {
      titulo: "Transferencia",
      texto: `La agencia se obliga a inscribir la transferencia a su nombre o de quien designe dentro de los ${c.transferencia.dias} días de la entrega, es decir, hasta el ${fecha(c.transferencia.vence)} inclusive, conforme al compromiso de transferencia adjunto. Los gastos de transferencia son a cargo ${DE_QUIEN[c.transferencia.gastosACargo]}. Vencido el plazo, el vendedor queda facultado a ${DENUNCIA}.`,
    },
    ...clausulasFinales(c),
  ].filter(Boolean);
}

// La seña que el comprador pagó antes del boleto: se imputa al precio. Los
// boletos firmados antes de existir las señas no traen `sena`.
const senaImputada = (pago) =>
  pago.sena > 0
    ? `El comprador abonó con anterioridad, en concepto de seña${pago.senaFecha ? ` el ${fecha(pago.senaFecha)}` : ""}, ${pesosConLetras(pago.sena)}, que se imputa al precio. `
    : "";

// Quién paga la diferencia entre el precio y el usado. Lo normal es que pague
// el comprador; si el usado vale más que el auto, la agencia le paga a él.
function saldoDePrecio(pago, titular) {
  const sena = senaImputada(pago);
  if (!pago.pagador) return `${sena}El valor asignado al usado${sena ? " y la seña cubren" : " cubre"} la totalidad del precio: no queda saldo a abonar.`;
  if (pago.pagador === "cliente") {
    return `${sena}El saldo de precio es de ${pesosConLetras(pago.monto)}. ${pagos(pago, "El comprador", titular)}`;
  }
  return `${sena}El valor asignado al usado supera el precio: la agencia abona al comprador la diferencia de ${pesosConLetras(pago.monto)}. ${pagos(pago, "La agencia", titular)}`;
}

// Parte de pago: la agencia vende, el cliente compra y entrega su usado a
// cuenta del precio.
function clausulasParteDePago(datos) {
  const c = datos.condiciones;
  const vendido = c.permuta;
  const km = kilometros(datos.vehiculo.kmRecepcion) ?? "—";

  return [
    {
      titulo: "Objeto",
      texto:
        "La agencia vende al comprador, y éste compra, el vehículo descripto en el encabezamiento, libre de gravámenes, deudas e inhibiciones, en el estado en que se encuentra, que el comprador declara conocer por haberlo revisado.",
    },
    { titulo: "Precio", texto: `El precio total y definitivo de la compraventa es de ${pesosConLetras(vendido.valor)}.` },
    {
      titulo: "Usado entregado en parte de pago",
      texto: `A cuenta del precio, el comprador entrega a la agencia el vehículo usado ${describir(datos.vehiculo)}, con ${km} km, al que las partes asignan un valor de ${pesosConLetras(c.precio)}, que se imputa al precio. ${estadoDe(c)}`,
    },
    { titulo: "Saldo de precio", texto: saldoDePrecio(c.pago, datos.titular) },
    {
      titulo: "Entrega y responsabilidad",
      texto: `Ambas unidades se entregan el ${fechaLarga(c.entrega)} a las ${hora(c.entrega)} hs. Hasta ese momento cada parte responde civil, penal, administrativa y fiscalmente por la unidad que entrega; desde entonces, por la que recibe.`,
    },
    { titulo: "Garantías sobre el usado", texto: `El comprador declara ser titular del usado o estar facultado para disponer de él, y que ${GARANTIA}` },
    {
      titulo: "Deudas anteriores",
      texto:
        "Las patentes, multas e infracciones de cada unidad devengadas hasta la entrega son a cargo de quien la entrega, y las posteriores, de quien la recibe. Si apareciera una deuda del usado anterior a la entrega, la agencia podrá descontarla de lo que reste pagar o reclamarla al comprador.",
    },
    // Sin la lista de originales (que en la compra sí va): con el usado y el auto
    // vendido en la misma hoja no entraría, y el detalle ya está en el recibo.
    {
      titulo: "Documentación",
      texto:
        "El comprador entrega la documentación del usado detallada en el recibo adjunto y se obliga a firmar, con firma certificada, el formulario 08 y todo instrumento necesario para su transferencia. La agencia entrega la documentación de la unidad vendida.",
    },
    {
      titulo: "Transferencias",
      texto: `La agencia inscribirá la transferencia del usado a su nombre o de quien designe dentro de los ${c.transferencia.dias} días de la entrega, hasta el ${fecha(c.transferencia.vence)} inclusive (compromiso adjunto); vencido el plazo, el comprador podrá ${DENUNCIA}. En el mismo plazo, el comprador inscribirá a su nombre la unidad comprada. Los gastos de transferencia son a cargo ${DE_QUIEN[c.transferencia.gastosACargo]}.`,
    },
    ...clausulasFinales(c),
  ].filter(Boolean);
}

// La agencia vende y el cliente no entrega un usado: paga con plata (y la seña,
// si hubo).
function formaDePagoVenta(pago, titular) {
  const sena = senaImputada(pago);
  if (!pago.pagador) return `${sena}La seña cubre la totalidad del precio: no queda saldo a abonar.`;
  return `${sena}${pagos(pago, "El comprador", titular)}`;
}

function clausulasVentaAgencia(datos) {
  const c = datos.condiciones;
  const vendido = c.permuta;

  return [
    {
      titulo: "Objeto",
      texto:
        "La agencia vende al comprador, y éste compra, el vehículo descripto en el encabezamiento, libre de gravámenes, deudas e inhibiciones, en el estado en que se encuentra, que el comprador declara conocer por haberlo revisado.",
    },
    { titulo: "Precio", texto: `El precio total y definitivo de la compraventa es de ${pesosConLetras(vendido.valor)}.` },
    { titulo: "Forma de pago", texto: formaDePagoVenta(c.pago, datos.titular) },
    {
      titulo: "Entrega y responsabilidad",
      texto: `La agencia entrega la unidad el ${fechaLarga(c.entrega)} a las ${hora(c.entrega)} hs. Hasta ese momento son a su cargo las responsabilidades civiles, penales, administrativas y fiscales derivadas de la unidad; desde ese momento lo son del comprador.`,
    },
    {
      titulo: "Deudas anteriores",
      texto: "Las patentes, multas e infracciones de la unidad devengadas hasta la entrega son a cargo de la agencia, y las posteriores, del comprador.",
    },
    {
      titulo: "Documentación",
      texto:
        "La agencia entrega la documentación de la unidad y se obliga a firmar, con firma certificada, el formulario 08 y todo instrumento necesario para su transferencia.",
    },
    {
      titulo: "Transferencia",
      texto: `El comprador inscribirá la unidad a su nombre dentro de los ${c.transferencia.dias} días de la entrega, hasta el ${fecha(c.transferencia.vence)} inclusive; vencido el plazo, la agencia podrá ${DENUNCIA}. Los gastos de transferencia son a cargo ${DE_QUIEN[c.transferencia.gastosACargo]}.`,
    },
    ...clausulasFinales(c),
  ].filter(Boolean);
}

// El auto que vende la agencia, arriba a la derecha, donde en la compra va el
// usado recibido.
const bloqueVendido = (v) => ({
  rotulo: "Vehículo que se vende",
  principal: `${v.marca} ${v.modelo} (${v.anio})`,
  lineas: [
    unir(`Dominio ${v.dominio}`, v.kms != null && `${kilometros(v.kms)} km`),
    unir(v.motor && `Motor ${v.motor}`, v.chasis && `Chasis ${v.chasis}`),
  ],
});

export function Boleto({ datos, copia, marcaAgua }) {
  const vendido = datos.condiciones.permuta;
  const vendeLaAgencia = Boolean(vendido);
  // Las copias firmadas antes de existir `conUsado` lo traen undefined: tienen usado.
  const conParteDePago = vendeLaAgencia && datos.conUsado !== false;
  const copiaTexto = copia.charAt(0).toUpperCase() + copia.slice(1);
  const clausulas = !vendeLaAgencia
    ? clausulasCompra(datos)
    : conParteDePago
      ? clausulasParteDePago(datos)
      : clausulasVentaAgencia(datos);

  return (
    <Hoja pagina>
      <MarcaAgua texto={marcaAgua} />
      <div className="relative flex flex-col flex-1">
        <Encabezado
          agencia={datos.agencia}
          titulo="Boleto de compraventa de automotor"
          bajada={conParteDePago ? `Con entrega de usado en parte de pago - ${copiaTexto}` : copiaTexto}
          generado={datos.firmado ?? datos.generado}
        />
        {vendeLaAgencia ? (
          <Partes datos={datos} rotuloTitular="Comprador" vehiculo={bloqueVendido(vendido)} />
        ) : (
          <Partes datos={datos} rotuloTitular="Vendedor" />
        )}

        <Clausulas compacto>
          {clausulas.map((c, i) => (
            <Clausula key={c.titulo} n={i + 1} titulo={c.titulo} compacto>
              {c.texto}
            </Clausula>
          ))}
        </Clausulas>

        <Firmas titular={datos.titular} />
      </div>
    </Hoja>
  );
}
