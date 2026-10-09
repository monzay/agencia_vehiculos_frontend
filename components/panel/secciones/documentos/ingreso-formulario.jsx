"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
import { crearIngreso, actualizarIngreso } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Numero, Area, Alternador, Paso, Aviso } from "./campos";
import { PersonaFormulario, aPersona } from "./persona-formulario";
import { MODALIDAD } from "./modalidades";
import { VehiculoQueCompra } from "./vehiculo-que-compra";

// Alta del trámite: quién es el cliente y, si entrega un auto, cómo se recibió.
//
// En la parte de pago y la venta al contado se elige acá el auto que compra el
// cliente (el boleto lo toma de acá). En la venta al contado el cliente solo
// compra: no entrega nada. En la parte de pago puede entregar un usado
// (opcional) y plata; con eso se calcula lo que queda por pagar y su financiación.
//
// Los datos del vehículo (dominio, marca, modelo, año, motor, chasis, origen)
// no se piden acá: salen del título del automotor cuando se carga ese papel.
// Lo único del auto que se pide es lo que no figura en ningún papel: los km del
// tablero al recibirlo y el estado en que se recibió (columna `notas`).

const RECEPCION_VACIA = {
  kmRecepcion: "",
  notas: "",
  entregaUsado: true,
  parteDePagoVehiculo: "",
  parteDePagoValor: "",
  parteDePagoEfectivo: "",
};

const SI_NO = [
  { valor: true, label: "Sí" },
  { valor: false, label: "No" },
];

const aTexto = (n) => (n != null ? String(n) : "");
const aMonto = (v) => (v === "" ? null : Number(v));

const aRecepcion = (i) =>
  i
    ? {
        kmRecepcion: aTexto(i.vehiculo.kmRecepcion),
        notas: i.notas ?? "",
        entregaUsado: i.conUsado !== false,
        parteDePagoVehiculo: i.parteDePago?.vehiculo ?? "",
        parteDePagoValor: aTexto(i.parteDePago?.valor),
        parteDePagoEfectivo: aTexto(i.parteDePago?.efectivo),
      }
    : { ...RECEPCION_VACIA };

// Mismos topes que el backend.
const TOPE_VEHICULO = 150;
const TOPE_MONTO = 9999999999.99;

// Las mismas reglas que el backend, para avisar sin ir y volver.
function validar(recepcion, titular, esParteDePago, esVenta, autoRef) {
  if (esVenta && !autoRef) return "Elegí el vehículo que compra el cliente.";
  if (!titular.nombre.trim()) return "El nombre del titular es obligatorio.";
  const dni = titular.dni.replace(/\D/g, "");
  if (dni.length < 7 || dni.length > 9) return "El DNI del titular debe tener entre 7 y 9 dígitos.";

  if (Boolean(titular.contactoAltTelefono.trim()) !== Boolean(titular.contactoAltVinculo)) {
    return "Completá el teléfono alternativo y de quién es, o dejá los dos vacíos.";
  }

  if (recepcion.kmRecepcion !== "") {
    const km = Number(recepcion.kmRecepcion);
    if (!Number.isInteger(km) || km < 0) return "Los kilómetros tienen que ser un número entero.";
  }

  if (esParteDePago && recepcion.entregaUsado && !(Number(recepcion.parteDePagoValor) > 0)) {
    return "Indicá en cuánto se toma el usado, o marcá que no entrega vehículo.";
  }
  if (Number(recepcion.parteDePagoValor) > TOPE_MONTO) return "El valor de toma supera el máximo que admite el sistema.";
  if (Number(recepcion.parteDePagoEfectivo) > TOPE_MONTO) return "Lo que tiene para entregar supera el máximo que admite el sistema.";
  return null;
}

// El backend ignora los campos vacíos, pero mandarlos en blanco ensucia la
// validación de formato (un CUIT "" no es un CUIT de 11 dígitos).
const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

// `modalidad` solo se usa al crear: un ingreso existente ya trae la suya y no
// se cambia.
// `onGuardado` recibe el ingreso guardado (al crear, para abrir su legajo).
export function IngresoFormulario({ ingreso, modalidad, onCerrar, onGuardado }) {
  const editando = Boolean(ingreso);
  const tipo = ingreso?.modalidad ?? modalidad;
  const esParteDePago = tipo === "permuta";
  const esContado = tipo === "contado";
  const esVenta = esParteDePago || esContado;

  const [recepcion, setRecepcion] = useState(() => aRecepcion(ingreso));
  const [titular, setTitular] = useState(() => aPersona(ingreso?.titular));
  const [autoRef, setAutoRef] = useState(ingreso?.autoInteres?.ref ?? "");
  // Firmado el boleto, o si el trámite nació de una seña, el auto ya no cambia.
  const autoBloqueado = Boolean(ingreso?.contrato?.firmado || ingreso?.sena);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarRecepcion = (campo) => (valor) => setRecepcion((r) => ({ ...r, [campo]: valor }));

  async function guardar() {
    const problema = validar(recepcion, titular, esParteDePago, esVenta, autoRef);
    if (problema) return setError(problema);

    setGuardando(true);
    setError(null);
    try {
      // Los opcionales viajan como `null` explícito y no omitidos: así, al
      // editar, vaciar un campo lo borra en vez de dejarlo como estaba.
      // Sin usado no hay nada que recibir: los datos del usado se borran.
      const sinUsado = esContado || (esParteDePago && !recepcion.entregaUsado);
      const cuerpo = {
        kmRecepcion: sinUsado || recepcion.kmRecepcion === "" ? null : Number(recepcion.kmRecepcion),
        notas: sinUsado ? null : recepcion.notas.trim() || null,
        ...(esParteDePago && {
          parteDePagoVehiculo: sinUsado ? null : recepcion.parteDePagoVehiculo.trim() || null,
          parteDePagoValor: sinUsado ? null : aMonto(recepcion.parteDePagoValor),
          parteDePagoEfectivo: aMonto(recepcion.parteDePagoEfectivo),
        }),
        // Al editar viaja entero: un campo vaciado tiene que llegar para borrarse.
        titular: editando ? titular : sinVacios(titular),
        ...(esVenta && !autoBloqueado && { autoInteresRef: autoRef }),
      };

      const guardado = editando ? await actualizarIngreso(ingreso.id, cuerpo) : await crearIngreso({ ...cuerpo, modalidad });
      onGuardado(guardado);
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  let n = 0;
  const paso = () => ++n;

  return (
    <Modal
      titulo={editando ? "Editar trámite" : MODALIDAD[modalidad].nuevo}
      icono={Handshake}
      onCerrar={onCerrar}
      ancho="max-w-3xl"
    >
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        {esVenta && (
          <Paso
            n={paso()}
            titulo="Vehículo que compra"
            ayuda={autoBloqueado ? "Ya no se puede cambiar: el boleto está firmado o el trámite nació de una seña." : "El auto de la agencia que le interesa al cliente. Sale del stock a la venta."}
            primero
          >
            <VehiculoQueCompra
              valor={autoRef}
              onCambio={setAutoRef}
              ingresoId={ingreso?.id ?? null}
              actual={ingreso?.autoInteres ?? null}
              bloqueado={autoBloqueado}
            />
          </Paso>
        )}

        <Paso
          n={paso()}
          titulo={esVenta ? "Comprador" : "Titular"}
          ayuda={
            esVenta
              ? "Quien compra el auto y firma el boleto. Buscalo primero: puede que ya esté cargado."
              : "Quien entrega el auto y firma el contrato. Buscalo primero: puede que ya esté cargado."
          }
          primero={!esVenta}
        >
          <PersonaFormulario persona={titular} onCambio={setTitular} />
        </Paso>

        {esParteDePago && (
          <Paso
            n={paso()}
            titulo="Parte de pago"
            ayuda="Lo que deja el cliente para comprar el auto. Con esto se calcula lo que queda por pagar y su financiación."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Alternador
                label="¿Entrega un vehículo?"
                valor={recepcion.entregaUsado}
                onCambio={cambiarRecepcion("entregaUsado")}
                opciones={SI_NO}
              />
            </div>
            {recepcion.entregaUsado && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Texto
                  label="Vehículo que deja"
                  valor={recepcion.parteDePagoVehiculo}
                  onCambio={cambiarRecepcion("parteDePagoVehiculo")}
                  placeholder="Volkswagen Gol Trend 1.6 Highline 2017"
                  maxLength={TOPE_VEHICULO}
                  className="sm:col-span-2"
                  ayuda="Nombre completo: marca, modelo, versión y año."
                />
                <Numero
                  label="Valor de toma ($) *"
                  valor={recepcion.parteDePagoValor}
                  onCambio={cambiarRecepcion("parteDePagoValor")}
                  placeholder="12.000.000"
                  ayuda="En cuánto se toma el usado."
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Numero
                label="Cuánto tiene para entregar ($)"
                valor={recepcion.parteDePagoEfectivo}
                onCambio={cambiarRecepcion("parteDePagoEfectivo")}
                placeholder="2.000.000"
                ayuda="Vacío = no entrega plata."
              />
            </div>
          </Paso>
        )}

        {/* Solo si el cliente entrega un auto: sin usado no hay nada que recibir. */}
        {!esContado && (!esParteDePago || recepcion.entregaUsado) && (
          <Paso
            n={paso()}
            titulo="Recepción"
            ayuda="Los datos del vehículo se toman del título del automotor, cuando se carga en Papeles."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Numero
                label="Kilómetros al recibirlo"
                valor={recepcion.kmRecepcion}
                onCambio={cambiarRecepcion("kmRecepcion")}
                placeholder="87.500"
                ayuda="Queda congelado en el recibo."
              />
            </div>
            <Area
              label="Estado en el que se recibió la unidad"
              valor={recepcion.notas}
              onCambio={cambiarRecepcion("notas")}
              placeholder="Faltantes, detalles de chapa, cubiertas, rueda de auxilio…"
              ayuda="Se usa como estado de la unidad en el boleto."
            />
          </Paso>
        )}
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          {editando ? "Guardar cambios" : "Crear trámite"}
        </Boton>
      </ModalPie>
    </Modal>
  );
}
