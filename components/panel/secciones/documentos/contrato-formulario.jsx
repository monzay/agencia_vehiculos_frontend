"use client";

import { useState } from "react";
import { FileSignature } from "lucide-react";
import { guardarContratoIngreso } from "@/lib/api";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Selector, Area, Alternador, Paso, Aviso } from "./campos";

// Las condiciones del contrato de consignación.
//
// No hay formulario oficial: cada agencia arma el suyo. Lo que sí es fijo es la
// lista de puntos que, si faltan, terminan en discusión. Son estos.

const A_CARGO = [
  { valor: "agencia", label: "La agencia" },
  { valor: "cliente", label: "El cliente" },
];

const LIQUIDACION = [
  { valor: "transferencia", label: "Transferencia" },
  { valor: "efectivo", label: "Efectivo" },
  { valor: "cheque", label: "Cheque" },
];

const VACIO = {
  precioMinimo: "",
  comisionTipo: "porcentaje",
  comisionValor: "",
  comisionIncluida: true,
  plazoDias: "90",
  gastosVerificacion: "cliente",
  gastosLibreDeuda: "cliente",
  gastosLavado: "agencia",
  gastosPublicacion: "agencia",
  retiroAvisoDias: "0",
  retiroCosto: "0",
  estadoUnidad: "",
  pruebaManejo: false,
  pruebaResponsable: "agencia",
  seguroACargo: "cliente",
  liquidacionDias: "0",
  liquidacionForma: "transferencia",
};

const aFormulario = (c) =>
  c
    ? {
        precioMinimo: String(c.precioMinimo ?? ""),
        comisionTipo: c.comision.tipo,
        comisionValor: String(c.comision.valor ?? ""),
        comisionIncluida: c.comision.incluida,
        plazoDias: String(c.plazoDias ?? "90"),
        gastosVerificacion: c.gastos.verificacion,
        gastosLibreDeuda: c.gastos.libreDeuda,
        gastosLavado: c.gastos.lavado,
        gastosPublicacion: c.gastos.publicacion,
        retiroAvisoDias: String(c.retiroAnticipado.avisoDias ?? "0"),
        retiroCosto: String(c.retiroAnticipado.costo ?? "0"),
        estadoUnidad: c.estadoUnidad ?? "",
        pruebaManejo: c.pruebaManejo.permitida,
        pruebaResponsable: c.pruebaManejo.responsable ?? "agencia",
        seguroACargo: c.seguroACargo,
        liquidacionDias: String(c.liquidacion.dias ?? "0"),
        liquidacionForma: c.liquidacion.forma,
      }
    : { ...VACIO };

const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export function ContratoFormulario({ ingresoId, contrato, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => aFormulario(contrato));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const precio = Number(form.precioMinimo);
  const valor = Number(form.comisionValor);
  // Lo que se lleva la agencia si se vende justo al precio mínimo.
  const comisionPesos =
    Number.isFinite(precio) && Number.isFinite(valor) ? (form.comisionTipo === "porcentaje" ? (precio * valor) / 100 : valor) : null;
  const recibeElCliente = comisionPesos == null ? null : form.comisionIncluida ? precio - comisionPesos : precio;

  async function guardar() {
    if (!Number.isFinite(precio) || precio <= 0) return setError("El precio mínimo autorizado es obligatorio.");
    if (!Number.isFinite(valor) || valor < 0) return setError("La comisión no es válida.");
    if (form.comisionTipo === "porcentaje" && valor > 100) return setError("La comisión no puede superar el 100 %.");

    setGuardando(true);
    setError(null);
    try {
      await guardarContratoIngreso(ingresoId, {
        precioMinimo: precio,
        comisionTipo: form.comisionTipo,
        comisionValor: valor,
        comisionIncluida: form.comisionIncluida,
        plazoDias: Number(form.plazoDias) || 90,
        gastosVerificacion: form.gastosVerificacion,
        gastosLibreDeuda: form.gastosLibreDeuda,
        gastosLavado: form.gastosLavado,
        gastosPublicacion: form.gastosPublicacion,
        retiroAvisoDias: Number(form.retiroAvisoDias) || 0,
        retiroCosto: Number(form.retiroCosto) || 0,
        estadoUnidad: form.estadoUnidad.trim() || null,
        pruebaManejo: form.pruebaManejo,
        pruebaResponsable: form.pruebaManejo ? form.pruebaResponsable : null,
        seguroACargo: form.seguroACargo,
        liquidacionDias: Number(form.liquidacionDias) || 0,
        liquidacionForma: form.liquidacionForma,
      });
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Condiciones del contrato" icono={FileSignature} onCerrar={onCerrar} ancho="max-w-3xl">
      <div className="px-6 py-5 space-y-5 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        <Paso n={1} titulo="Precio y comisión" ayuda="Por debajo del mínimo no se puede cerrar sin consultar al dueño." primero>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Texto label="Precio mínimo autorizado" valor={form.precioMinimo} onCambio={set("precioMinimo")} inputMode="decimal" placeholder="18500000" />
            <Selector
              label="La comisión se pacta como"
              valor={form.comisionTipo}
              onCambio={set("comisionTipo")}
              opciones={[
                { valor: "porcentaje", label: "Porcentaje" },
                { valor: "monto", label: "Monto fijo" },
              ]}
            />
            <Texto
              label={form.comisionTipo === "porcentaje" ? "Comisión (%)" : "Comisión ($)"}
              valor={form.comisionValor}
              onCambio={set("comisionValor")}
              inputMode="decimal"
            />
            <Alternador
              label="¿De dónde sale la comisión?"
              valor={form.comisionIncluida}
              onCambio={set("comisionIncluida")}
              opciones={[
                { valor: true, label: "Del precio" },
                { valor: false, label: "Se suma" },
              ]}
            />
          </div>

          {comisionPesos != null && precio > 0 && (
            <p className="text-xs text-muted-foreground">
              Vendiendo al mínimo, la agencia se lleva <span className="text-foreground tabular-nums">{pesos(comisionPesos)}</span> y el
              cliente recibe <span className="text-foreground tabular-nums">{pesos(recibeElCliente)}</span>.
            </p>
          )}
        </Paso>

        <Paso n={2} titulo="Plazo y retiro anticipado" ayuda="Cuánto tiempo la agencia tiene la unidad, y qué pasa si el dueño se arrepiente.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Texto label="Plazo (días)" valor={form.plazoDias} onCambio={set("plazoDias")} inputMode="numeric" />
            <Texto label="Aviso para retirarlo (días)" valor={form.retiroAvisoDias} onCambio={set("retiroAvisoDias")} inputMode="numeric" />
            <Texto label="Costo del retiro ($)" valor={form.retiroCosto} onCambio={set("retiroCosto")} inputMode="decimal" ayuda="0 si no paga nada." />
          </div>
        </Paso>

        <Paso n={3} titulo="Gastos" ayuda="Quién paga cada cosa mientras el auto está en el playón.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Alternador label="Verificación policial" valor={form.gastosVerificacion} onCambio={set("gastosVerificacion")} opciones={A_CARGO} />
            <Alternador label="Libre deuda" valor={form.gastosLibreDeuda} onCambio={set("gastosLibreDeuda")} opciones={A_CARGO} />
            <Alternador label="Lavado" valor={form.gastosLavado} onCambio={set("gastosLavado")} opciones={A_CARGO} />
            <Alternador label="Publicación" valor={form.gastosPublicacion} onCambio={set("gastosPublicacion")} opciones={A_CARGO} />
          </div>
        </Paso>

        <Paso n={4} titulo="Uso de la unidad" ayuda="El auto sigue a nombre del dueño mientras está en el playón.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Alternador
              label="¿La agencia puede hacer pruebas de manejo?"
              valor={form.pruebaManejo}
              onCambio={set("pruebaManejo")}
              opciones={[
                { valor: true, label: "Sí" },
                { valor: false, label: "No" },
              ]}
            />
            {form.pruebaManejo && (
              <Alternador
                label="¿Quién responde si hay un choque?"
                valor={form.pruebaResponsable}
                onCambio={set("pruebaResponsable")}
                opciones={A_CARGO}
              />
            )}
            <Alternador label="El seguro queda a cargo de" valor={form.seguroACargo} onCambio={set("seguroACargo")} opciones={A_CARGO} />
          </div>
          <Area
            label="Estado de la unidad al recibirla"
            valor={form.estadoUnidad}
            onCambio={set("estadoUnidad")}
            placeholder="Chapa, faltantes, cubiertas, rueda de auxilio…"
            ayuda="Los kilómetros salen del ingreso; acá va todo lo demás."
          />
        </Paso>

        <Paso n={5} titulo="Liquidación" ayuda="Cuántos días después de la venta se le paga al dueño, y cómo.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Texto label="Días para liquidar" valor={form.liquidacionDias} onCambio={set("liquidacionDias")} inputMode="numeric" />
            <Selector label="Forma de pago" valor={form.liquidacionForma} onCambio={set("liquidacionForma")} opciones={LIQUIDACION} />
          </div>
        </Paso>
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          Guardar condiciones
        </Boton>
      </ModalPie>
    </Modal>
  );
}
