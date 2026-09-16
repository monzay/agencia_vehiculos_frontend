"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
import { crearIngreso, actualizarIngreso } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Area, Paso, Aviso } from "./campos";
import { PersonaFormulario, aPersona } from "./persona-formulario";

// Alta de la toma: quién deja el auto y cómo se recibió.
//
// Los datos del vehículo (dominio, marca, modelo, año, motor, chasis, origen)
// no se piden acá: salen del título del automotor cuando se carga ese papel.
// Lo único del auto que se pide es lo que no figura en ningún papel: los km del
// tablero al recibirlo y las notas.

const RECEPCION_VACIA = { kmRecepcion: "", notas: "" };

const aRecepcion = (i) =>
  i
    ? {
        kmRecepcion: i.vehiculo.kmRecepcion != null ? String(i.vehiculo.kmRecepcion) : "",
        notas: i.notas ?? "",
      }
    : { ...RECEPCION_VACIA };

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
  return null;
}

// El backend ignora los campos vacíos, pero mandarlos en blanco ensucia la
// validación de formato (un CUIT "" no es un CUIT de 11 dígitos).
const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));

export function IngresoFormulario({ ingreso, onCerrar, onGuardado }) {
  const editando = Boolean(ingreso);

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
        titular: sinVacios(titular),
      };

      if (editando) await actualizarIngreso(ingreso.id, cuerpo);
      else await crearIngreso(cuerpo);

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
      titulo={editando ? "Editar ingreso" : "Nueva consignación"}
      icono={Handshake}
      onCerrar={onCerrar}
      ancho="max-w-3xl"
    >
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        <Paso
          n={1}
          titulo="Titular"
          ayuda="Quien deja el auto y firma el contrato. Buscalo primero: puede que ya esté cargado."
          primero
        >
          <PersonaFormulario persona={titular} onCambio={setTitular} />
        </Paso>

        <Paso
          n={2}
          titulo="Recepción"
          ayuda="Los datos del vehículo se toman del título del automotor, cuando se carga en Papeles."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Texto
              label="Kilómetros al recibirlo"
              valor={recepcion.kmRecepcion}
              onCambio={cambiarRecepcion("kmRecepcion")}
              inputMode="numeric"
              placeholder="87500"
              ayuda="Queda congelado en el recibo."
            />
          </div>
          <Area
            label="Notas"
            valor={recepcion.notas}
            onCambio={cambiarRecepcion("notas")}
            placeholder="Faltantes, detalles de chapa, lo que convenga dejar escrito…"
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
