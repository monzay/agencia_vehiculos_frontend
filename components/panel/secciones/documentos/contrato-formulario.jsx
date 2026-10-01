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
  precioPublicacion: "",
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
  retiroCondiciones: "",
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
        precioPublicacion: String(c.precioPublicacion ?? ""),
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
        retiroCondiciones: c.retiroAnticipado.condiciones ?? "",
        estadoUnidad: c.estadoUnidad ?? "",
        pruebaManejo: c.pruebaManejo.permitida,
        pruebaResponsable: c.pruebaManejo.responsable ?? "agencia",
        seguroACargo: c.seguroACargo,
        liquidacionDias: String(c.liquidacion.dias ?? "0"),
        liquidacionForma: c.liquidacion.forma,
      }
    : { ...VACIO };

const pesos = (n) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

// El mismo tope que la base: los montos son DECIMAL(12,2). Se avisa acá para
// que un cero de más se vea en el campo y no vuelva como error del servidor.
const TOPE_MONTO = 9999999999.99;
const TOPE_TEXTO = `$ ${TOPE_MONTO.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;

// Lo que entra en la carilla del contrato. Es el mismo número que valida el
// backend: acá corta el tipeo, allá se rechaza lo que llegue por otra vía.
const TOPE_LIBRE = 500;

export function ContratoFormulario({ ingresoId, contrato, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => aFormulario(contrato));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const precio = Number(form.precioMinimo);
  const publicacion = Number(form.precioPublicacion);
  const valor = Number(form.comisionValor);

  // Cómo queda repartida una venta cerrada a ese precio.
  //
  // Si la comisión "sale del precio", se descuenta de lo que cobra el dueño. Si
  // "se suma", la paga el comprador por encima y el dueño cobra el precio
  // entero: por eso el reparto no es el mismo en los dos casos.
  const reparto = (precioVenta) => {
    if (!Number.isFinite(precioVenta) || precioVenta <= 0 || !Number.isFinite(valor) || valor < 0) return null;
    const agencia = form.comisionTipo === "porcentaje" ? (precioVenta * valor) / 100 : valor;
    return { agencia, cliente: form.comisionIncluida ? precioVenta - agencia : precioVenta };
  };

  // Los dos extremos de la negociación: lo mejor y lo peor que puede pasar.
  const escenarios = [
    ["Precio de publicación", publicacion, reparto(publicacion)],
    ["Mínimo autorizado", precio, reparto(precio)],
  ].filter(([, , r]) => r);

  async function guardar() {
    if (!Number.isFinite(precio) || precio <= 0) return setError("El precio mínimo autorizado es obligatorio.");
    if (!Number.isFinite(publicacion) || publicacion <= 0) return setError("El precio de publicación es obligatorio.");
    // Mismo control que hace el backend, para avisar antes de gastar el viaje.
    if (publicacion < precio) return setError("El precio de publicación no puede ser menor al mínimo. ¿Están invertidos?");
    if (precio > TOPE_MONTO) return setError(`El precio mínimo autorizado no puede ser mayor a ${TOPE_TEXTO}.`);
    if (publicacion > TOPE_MONTO) return setError(`El precio de publicación no puede ser mayor a ${TOPE_TEXTO}.`);
    if (!Number.isFinite(valor) || valor < 0) return setError("La comisión no es válida.");
    if (form.comisionTipo === "porcentaje" && valor > 100) return setError("La comisión no puede superar el 100 %.");
    if (form.comisionTipo === "monto" && valor > TOPE_MONTO) return setError(`La comisión no puede ser mayor a ${TOPE_TEXTO}.`);
    if (Number(form.retiroCosto) > TOPE_MONTO) return setError(`El costo de retiro anticipado no puede ser mayor a ${TOPE_TEXTO}.`);

    setGuardando(true);
    setError(null);
    try {
      await guardarContratoIngreso(ingresoId, {
        precioMinimo: precio,
        precioPublicacion: publicacion,
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
        retiroCondiciones: form.retiroCondiciones,
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

        <Paso
          n={1}
          titulo="Precio y comisión"
          ayuda="Se publica al primero; por debajo del segundo no se cierra sin consultar al dueño."
          primero
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Texto
              label="Precio de publicación"
              valor={form.precioPublicacion}
              onCambio={set("precioPublicacion")}
              inputMode="decimal"
              placeholder="20000000"
            />
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

          {escenarios.length > 0 && (
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left font-normal px-3 py-2">Si se vende a</th>
                    <th className="text-right font-normal px-3 py-2">Se lleva la agencia</th>
                    <th className="text-right font-normal px-3 py-2">Recibe el cliente</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {escenarios.map(([etiqueta, monto, r]) => (
                    <tr key={etiqueta} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-muted-foreground">{etiqueta}</span>{" "}
                        <span className="text-foreground">{pesos(monto)}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">{pesos(r.agencia)}</td>
                      <td className="px-3 py-2 text-right text-foreground whitespace-nowrap">{pesos(r.cliente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Paso>

        <Paso n={2} titulo="Plazo y retiro anticipado" ayuda="Cuánto tiempo la agencia tiene la unidad, y qué pasa si el dueño se arrepiente.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Texto label="Plazo (días)" valor={form.plazoDias} onCambio={set("plazoDias")} inputMode="numeric" />
            <Texto label="Aviso para retirarlo (días)" valor={form.retiroAvisoDias} onCambio={set("retiroAvisoDias")} inputMode="numeric" />
            <Texto label="Costo del retiro ($)" valor={form.retiroCosto} onCambio={set("retiroCosto")} inputMode="decimal" ayuda="0 si no paga nada." />
          </div>
          <Area
            label="Qué se pacta si lo retira antes"
            valor={form.retiroCondiciones}
            onCambio={set("retiroCondiciones")}
            maximo={TOPE_LIBRE}
            placeholder="Reintegra los gastos de publicación con comprobante. Si había una seña cobrada, abona la comisión completa…"
            ayuda="Se imprime tal cual en la cláusula 6, después del aviso y el costo. Vacío = no se pactó nada especial."
          />
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
            maximo={TOPE_LIBRE}
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
