import { dni, cuit } from "../formato";
import { Hoja, Encabezado, Bloque, Clausula, Clausulas, Firmas, MarcaAgua } from "./hoja";
import { A_CARGO, FORMAS, apocopar, cuentaDestino, enLetras, fecha, kilometros, nombreCompleto, originales, pesos } from "./etiquetas";

// El contrato de consignación, por duplicado: el original del cliente y el
// duplicado de la agencia son el mismo documento, así que son el mismo
// componente.
//
// Ocupa una carilla A4 entera: encabezado, las partes, las once cláusulas y las
// firmas al pie. Está calibrado para que entre con margen incluso con el texto
// libre de las cláusulas 6 y 7 cargado.

// Los datos de una misma línea se separan con guión, no con punto medio.
const unir = (...partes) => partes.filter(Boolean).join(" - ");

const GASTOS = [
  ["verificacion", "verificación policial"],
  ["libreDeuda", "libre deuda"],
  ["lavado", "lavado y preparación"],
  ["publicacion", "publicación"],
];

// "a, b y c", pero si alguno de los ítems ya tiene una "y" adentro ("lavado y
// preparación") el último se separa con coma: sin eso se lee "lavado y
// preparación y publicación", que parecen tres cosas y son dos.
function enumerar(items) {
  if (items.length <= 1) return items[0] ?? "";
  const separador = items.some((i) => i.includes(" y ")) ? ", y " : " y ";
  return `${items.slice(0, -1).join(", ")}${separador}${items[items.length - 1]}`;
}

// Quién paga qué, agrupado por responsable: decirlo una vez para cada uno se
// lee mejor que cuatro pares "concepto: responsable" en fila.
function repartoGastos(gastos) {
  const porQuien = { cliente: [], agencia: [] };
  GASTOS.forEach(([clave, label]) => porQuien[gastos[clave]]?.push(label));

  if (!porQuien.cliente.length) return "Todos los gastos quedan a cargo de la agencia.";
  if (!porQuien.agencia.length) return "Todos los gastos quedan a cargo del cliente.";
  // Un renglón por responsable, con sangría: se lee de un vistazo quién paga qué.
  // Son <span> en bloque porque la cláusula es un párrafo.
  return [
    ["A cargo del cliente", porQuien.cliente],
    ["A cargo de la agencia", porQuien.agencia],
  ].map(([quien, items]) => (
    <span key={quien} className="block pl-4">
      — <span className="font-medium">{quien}:</span> {enumerar(items)}.
    </span>
  ));
}

// El plazo, en letras y con el número al lado. Un plazo de cero días no es "en
// cero días": es en el acto.
const plazoLiquidacion = (dias) =>
  dias === 0
    ? "dentro del mismo día"
    : dias === 1
      ? "dentro de un (1) día"
      : `dentro de los ${apocopar(enLetras(dias))} (${dias}) días`;

const dias = (n) => (n === 1 ? "1 día" : `${n} días`);
// Lo pactado lo escribe la agencia a mano: se le asegura el punto final para
// que la oración que sigue no quede pegada.
const conPunto = (t) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

// Cláusula 6. Primero si puede retirarlo y con cuánto aviso; después, si la
// agencia lo escribió, a qué se compromete el titular en ese caso. El costo fijo
// ya no se carga (se pacta por escrito), pero los contratos que lo tienen lo
// siguen imprimiendo.
function textoRetiro({ avisoDias, costo, condiciones }) {
  const aviso = avisoDias > 0 ? `, avisando con ${dias(avisoDias)} de anticipación` : ", sin necesidad de preaviso";
  const pago = costo > 0 ? ` y abonando ${pesos(costo)} en concepto de gastos` : "";
  const pactado = condiciones
    ? ` En caso de retirarlo antes del vencimiento del plazo, el titular se compromete a lo siguiente: ${conPunto(condiciones)}`
    : "";
  return `El titular puede retirar el vehículo antes del vencimiento del plazo${aviso}${pago}.${pactado}`;
}

// Cláusula 7. Reemplaza al recibo de recepción, que en la consignación ya no se
// imprime: cuándo entró la unidad.
function textoRecepcion(recepcion) {
  const cuando = recepcion?.recibido ? ` el ${fecha(recepcion.recibido)}` : "";
  return `La agencia recibió la unidad${cuando},`;
}

// El bloque del vehículo recibido: el del ingreso, con los km con que entró.
const vehiculoRecibido = (vehiculo) => ({
  rotulo: "Vehículo",
  principal: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`,
  lineas: [
    unir(vehiculo.dominio && `Dominio ${vehiculo.dominio}`, vehiculo.kmRecepcion != null && `${kilometros(vehiculo.kmRecepcion)} km al recibirlo`),
    unir(vehiculo.motor && `Motor ${vehiculo.motor}`, vehiculo.chasis && `Chasis ${vehiculo.chasis}`),
  ],
});

// Quién firma y qué auto. El boleto de compraventa usa el mismo bloque con otro
// rótulo para el titular ("Vendedor", "Comprador") y, en la venta con parte de
// pago, con el auto que vende la agencia en lugar del recibido (`vehiculo`:
// { rotulo, principal, lineas }).
export function Partes({ datos, rotuloTitular = "Titular", vehiculo }) {
  const { titular } = datos;
  const auto = vehiculo ?? vehiculoRecibido(datos.vehiculo);

  return (
    <div className="grid grid-cols-2 gap-x-10 pb-4 mb-5 border-b border-current/15">
      <Bloque
        rotulo={rotuloTitular}
        principal={nombreCompleto(titular)}
        lineas={[
          unir(titular?.dni && `DNI ${dni(titular.dni)}`, titular?.cuit && `CUIT ${cuit(titular.cuit)}`),
          [titular?.domicilio, titular?.localidad, titular?.provincia].filter(Boolean).join(", "),
          titular?.telefono && `Tel. ${titular.telefono}`,
        ]}
      />
      <Bloque rotulo={auto.rotulo} principal={auto.principal} lineas={auto.lineas} />
    </div>
  );
}

export function Contrato({ datos, copia, marcaAgua }) {
  const c = datos.condiciones;
  const comision = c.comision.tipo === "porcentaje" ? `${c.comision.valor} %` : pesos(c.comision.valor);
  const deDonde = c.comision.incluida ? "se descuenta del precio de venta" : "se suma por encima del precio";

  return (
    <Hoja pagina>
      <MarcaAgua texto={marcaAgua} />
      {/* El contenido va en un contenedor posicionado para que se pinte después
          de la marca de agua: así la marca queda detrás del texto. Es además la
          columna que baja las firmas al pie de la hoja. */}
      <div className="relative flex flex-col flex-1">
        <Encabezado
          agencia={datos.agencia}
          titulo="Contrato de consignación"
          bajada={copia.charAt(0).toUpperCase() + copia.slice(1)}
          generado={datos.firmado ?? datos.generado}
        />
        <Partes datos={datos} />

        <Clausulas>
          <Clausula n={1} titulo="Objeto">
            El titular entrega el vehículo descripto a la agencia para su exhibición y venta por cuenta y orden del titular. El vehículo
            permanece a nombre del titular hasta su transferencia.
          </Clausula>
          <Clausula n={2} titulo="Precio de publicación y mínimo autorizado">
            {/* Los contratos firmados antes de que existiera el precio de publicación
                no lo traen en su copia congelada: esa clausula se imprime como antes. */}
            {c.precioPublicacion != null && (
              <>
                El vehículo se publicará en <strong>{pesos(c.precioPublicacion)}</strong>.{" "}
              </>
            )}
            La agencia no podrá cerrar la venta por un valor inferior a <strong>{pesos(c.precioMinimo)}</strong> sin autorización expresa
            del titular.
          </Clausula>
          <Clausula n={3} titulo="Comisión">
            La comisión de la agencia es de <strong>{comision}</strong> y {deDonde}.
          </Clausula>
          <Clausula n={4} titulo="Plazo">
            La agencia dispone del vehículo por <strong>{c.plazoDias} días</strong> contados desde la firma.
          </Clausula>
          <Clausula n={5} titulo="Gastos">
            {repartoGastos(c.gastos)}
          </Clausula>
          <Clausula n={6} titulo="Retiro anticipado">
            {textoRetiro(c.retiroAnticipado)}
          </Clausula>
          <Clausula n={7} titulo="Recepción y estado de la unidad">
            {textoRecepcion(datos.recepcion)} con {kilometros(datos.vehiculo.kmRecepcion) ?? "—"} km.{" "}
            {c.estadoUnidad || "Sin observaciones adicionales al momento de la recepción."} Las fotos del peritaje quedan archivadas
            en el legajo digital de este ingreso.
          </Clausula>
          <Clausula n={8} titulo="Pruebas de manejo">
            {c.pruebaManejo.permitida
              ? `La agencia queda autorizada a realizar pruebas de manejo con interesados. Ante cualquier siniestro responde ${A_CARGO[
                  c.pruebaManejo.responsable
                ].toLowerCase()}.`
              : "La agencia no está autorizada a circular con el vehículo."}
          </Clausula>
          <Clausula n={9} titulo="Seguro">
            La cobertura del vehículo mientras permanece en la agencia queda a cargo de {A_CARGO[c.seguroACargo].toLowerCase()}.
          </Clausula>
          <Clausula n={10} titulo="Liquidación">
            Concretada la venta y acreditado efectivamente el pago del precio, la agencia procederá a liquidar al titular,{" "}
            <strong>{plazoLiquidacion(c.liquidacion.dias)}</strong>, por {FORMAS[c.liquidacion.forma]}
            {cuentaDestino(datos.titular)}.
          </Clausula>
          <Clausula n={11} titulo="Documentación entregada">
            {originales(datos.papelesEntregados).length
              ? `Quedan en poder de la agencia, en original: ${originales(datos.papelesEntregados)
                  .map((p) => p.label)
                  .join(", ")}. El detalle completo consta en el recibo adjunto.`
              : "La agencia no retiene documentación original del vehículo."}
          </Clausula>
        </Clausulas>

        <Firmas titular={datos.titular} />
      </div>
    </Hoja>
  );
}
