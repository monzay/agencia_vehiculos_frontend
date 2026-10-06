"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
import { crearIngreso, actualizarIngreso } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Numero, Area, Paso, Aviso } from "./campos";
import { PersonaFormulario, aPersona } from "./persona-formulario";
import { MODALIDAD } from "./modalidades";

// Alta de la toma: quién deja el auto y cómo se recibió.
//
// Los datos del vehículo (dominio, marca, modelo, año, motor, chasis, origen)
// no se piden acá: salen del título del automotor cuando se carga ese papel.
// Lo único del auto que se pide es lo que no figura en ningún papel: los km del
// tablero al recibirlo y el estado en que se recibió (columna `notas`).

const RECEPCION_VACIA = { kmRecepcion: "", notas: "", parteDePagoVehiculo: "", parteDePagoValor: "", parteDePagoEfectivo: "" };

const aTexto = (n) => (n != null ? String(n) : "");
const aMonto = (v) => (v === "" ? null : Number(v));

const aRecepcion = (i) =>
  i
    ? {
        kmRecepcion: aTexto(i.vehiculo.kmRecepcion),
        notas: i.notas ?? "",
        parteDePagoVehiculo: i.parteDePago?.vehiculo ?? "",
        parteDePagoValor: aTexto(i.parteDePago?.valor),
        parteDePagoEfectivo: aTexto(i.parteDePago?.efectivo),
      }
    : { ...RECEPCION_VACIA };

// Mismos topes que el backend.
const TOPE_VEHICULO = 150;
const TOPE_MONTO = 9999999999.99;

// Las mismas reglas que el backend, para avisar sin ir y volver.
function validar(recepcion, titular) {
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

  if (Number(recepcion.parteDePagoValor) > TOPE_MONTO) return "El valor de toma supera el máximo que admite el sistema.";
  if (Number(recepcion.parteDePagoEfectivo) > TOPE_MONTO) return "Lo que tiene para entregar supera el máximo que admite el sistema.";
  return null;
}

// El backend ignora los campos vacíos, pero mandarlos en blanco ensucia la
// validación de formato (un CUIT "" no es un CUIT de 11 dígitos).
const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

// `modalidad` solo se usa al crear: un ingreso existente ya trae la suya y no
// se cambia.
export function IngresoFormulario({ ingreso, modalidad, onCerrar, onGuardado }) {
  const editando = Boolean(ingreso);
  const esParteDePago = (ingreso?.modalidad ?? modalidad) === "permuta";

  const [recepcion, setRecepcion] = useState(() => aRecepcion(ingreso));
  const [titular, setTitular] = useState(() => aPersona(ingreso?.titular));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarRecepcion = (campo) => (valor) => setRecepcion((r) => ({ ...r, [campo]: valor }));

  async function guardar() {
    const problema = validar(recepcion, titular);
    if (problema) return setError(problema);

    setGuardando(true);
    setError(null);
    try {
      // Los opcionales viajan como `null` explícito y no omitidos: así, al
      // editar, vaciar un campo lo borra en vez de dejarlo como estaba.
      const cuerpo = {
        kmRecepcion: recepcion.kmRecepcion === "" ? null : Number(recepcion.kmRecepcion),
        notas: recepcion.notas.trim() || null,
        ...(esParteDePago && {
          parteDePagoVehiculo: recepcion.parteDePagoVehiculo.trim() || null,
          parteDePagoValor: aMonto(recepcion.parteDePagoValor),
          parteDePagoEfectivo: aMonto(recepcion.parteDePagoEfectivo),
        }),
        // Al editar viaja entero: un campo vaciado tiene que llegar para borrarse.
        titular: editando ? titular : sinVacios(titular),
      };

      if (editando) await actualizarIngreso(ingreso.id, cuerpo);
      else await crearIngreso({ ...cuerpo, modalidad });

      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar ingreso" : MODALIDAD[modalidad].nuevo}
      icono={Handshake}
      onCerrar={onCerrar}
      ancho="max-w-3xl"
    >
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        <Paso
          n={1}
          titulo="Titular"
          ayuda="Quien entrega el auto y firma el contrato. Buscalo primero: puede que ya esté cargado."
          primero
        >
          <PersonaFormulario persona={titular} onCambio={setTitular} />
        </Paso>

        {esParteDePago && (
          <Paso
            n={2}
            titulo="Parte de pago"
            ayuda="Lo que deja el cliente para comprar el auto: el usado, en cuánto se lo toma y la plata que entrega además."
          >
            <Texto
              label="Vehículo que deja"
              valor={recepcion.parteDePagoVehiculo}
              onCambio={cambiarRecepcion("parteDePagoVehiculo")}
              placeholder="Volkswagen Gol Trend 1.6 Highline 2017"
              maxLength={TOPE_VEHICULO}
              ayuda="Nombre completo: marca, modelo, versión y año. Vacío = no entrega vehículo."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Numero
                label="Valor de toma ($)"
                valor={recepcion.parteDePagoValor}
                onCambio={cambiarRecepcion("parteDePagoValor")}
                placeholder="12.000.000"
                ayuda="En cuánto se toma el usado."
              />
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

        <Paso
          n={esParteDePago ? 3 : 2}
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
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          {editando ? "Guardar cambios" : "Registrar ingreso"}
        </Boton>
      </ModalPie>
    </Modal>
  );
}
