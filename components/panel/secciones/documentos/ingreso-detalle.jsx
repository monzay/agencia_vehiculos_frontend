"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  User,
  Pencil,
  Printer,
  FileSignature,
  Loader2,
  Check,
  Lock,
  Unlock,
} from "lucide-react";
import { obtenerIngreso, firmarContratoIngreso, desfirmarContratoIngreso } from "@/lib/api";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Insignia } from "../../ui/insignia";
import { Aviso } from "./campos";
import { Papeles } from "./papeles";
import { ContratoFormulario } from "./contrato-formulario";
import { Impresos } from "./impresos";
import { VINCULO } from "./vinculos";
import { tituloVehiculo, tieneVehiculo } from "./formato";

// Legajo de un ingreso: el vehículo, quién lo dejó, los papeles y el contrato.

const pesos = (n) => (n == null ? "—" : `$ ${Math.round(n).toLocaleString("es-AR")}`);
const nombreCompleto = (p) => (p ? [p.nombre, p.apellido].filter(Boolean).join(" ") || "Sin nombre" : "—");

const ESTADOS = {
  recepcion: { label: "En recepción", variante: "info" },
  publicado: { label: "Publicado", variante: "exito" },
  retirado: { label: "Retirado", variante: "neutral" },
};

const PESTANAS = [
  { id: "papeles", label: "Papeles" },
  { id: "contrato", label: "Contrato" },
];

// El CBU no se muestra acá a propósito: es el dato más sensible del legajo y en
// esta pantalla no se usa para nada. Se carga en el formulario y se imprime en
// la cláusula de liquidación del contrato, que es donde hace falta.
const dni = (v) => (v ? Number(v).toLocaleString("es-AR") : null);
const cuit = (v) => (v && v.length === 11 ? `${v.slice(0, 2)}-${v.slice(2, 10)}-${v.slice(10)}` : v || null);
const direccion = (p) => [p.domicilio, p.localidad, p.provincia].filter(Boolean).join(", ") || null;

const FILAS = [
  { label: "DNI", valor: (p) => dni(p.dni) },
  { label: "CUIT / CUIL", valor: (p) => cuit(p.cuit) },
  { label: "Teléfono", valor: (p) => p.telefono },
  { label: "Domicilio", valor: (p) => direccion(p) },
  {
    label: "Tel. alternativo",
    valor: (p) => p.contactoAlternativo && `${p.contactoAlternativo.telefono} · ${VINCULO[p.contactoAlternativo.vinculo]}`,
  },
];

// Los datos del titular, rótulo a la izquierda y valor a la derecha. Una sola
// grilla sirve para cualquier ancho de pantalla.
function Titular({ persona }) {
  return (
    <div className="pt-3 border-t border-border">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Titular</p>
      <p className="text-sm text-foreground inline-flex items-center gap-1.5 mb-2">
        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {persona ? nombreCompleto(persona) : <span className="text-muted-foreground">Sin cargar</span>}
      </p>
      {persona &&
        FILAS.map(({ label, valor }) => (
          <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-1 border-t border-border">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs text-foreground">{valor(persona) || <span className="text-muted-foreground">—</span>}</span>
          </div>
        ))}
    </div>
  );
}

function ResumenContrato({ contrato }) {
  if (!contrato) {
    return <p className="text-sm text-muted-foreground">Todavía no se cargaron las condiciones del contrato.</p>;
  }

  const comision = contrato.comision.tipo === "porcentaje" ? `${contrato.comision.valor} %` : pesos(contrato.comision.valor);
  const filas = [
    ["Precio mínimo autorizado", pesos(contrato.precioMinimo)],
    ["Comisión", `${comision} · ${contrato.comision.incluida ? "sale del precio" : "se suma"}`],
    ["Plazo", `${contrato.plazoDias} días`],
    ["Verificación / libre deuda", `${contrato.gastos.verificacion} / ${contrato.gastos.libreDeuda}`],
    ["Lavado / publicación", `${contrato.gastos.lavado} / ${contrato.gastos.publicacion}`],
    [
      "Retiro anticipado",
      contrato.retiroAnticipado.avisoDias || contrato.retiroAnticipado.costo
        ? `${contrato.retiroAnticipado.avisoDias} días de aviso · ${pesos(contrato.retiroAnticipado.costo)}`
        : "Sin condiciones",
    ],
    ["Prueba de manejo", contrato.pruebaManejo.permitida ? `Sí · responde ${contrato.pruebaManejo.responsable}` : "No"],
    ["Seguro a cargo de", contrato.seguroACargo],
    ["Liquidación", `${contrato.liquidacion.dias} días · ${contrato.liquidacion.forma}`],
  ];

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
          <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
          <dd className="text-sm text-foreground text-right">{valor}</dd>
        </div>
      ))}
      {contrato.estadoUnidad && (
        <div className="sm:col-span-2 pt-1">
          <dt className="text-xs text-muted-foreground">Estado de la unidad</dt>
          <dd className="text-sm text-foreground mt-0.5">{contrato.estadoUnidad}</dd>
        </div>
      )}
    </dl>
  );
}

export function IngresoDetalle({ ingresoId, catalogo, esAdmin, onVolver, onEditar, onCambio }) {
  const [ingreso, setIngreso] = useState(null);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState("papeles");
  const [editandoContrato, setEditandoContrato] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [firmando, setFirmando] = useState(false);

  const cargar = useCallback(() => {
    setError(null);
    return obtenerIngreso(ingresoId)
      .then(setIngreso)
      .catch((e) => setError(e.message));
  }, [ingresoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refresca el legajo y avisa a la lista, que muestra contadores de papeles.
  const refrescar = () => {
    cargar();
    onCambio?.();
  };

  async function alternarFirma() {
    setFirmando(true);
    setError(null);
    try {
      if (ingreso.contrato?.firmado) await desfirmarContratoIngreso(ingreso.id);
      else await firmarContratoIngreso(ingreso.id);
      refrescar();
    } catch (e) {
      setError(e.message);
    } finally {
      setFirmando(false);
    }
  }

  if (!ingreso) {
    return (
      <div className="space-y-4">
        <Boton variante="fantasma" className="gap-1.5" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Boton>
        {error ? (
          <Aviso>{error}</Aviso>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  const { vehiculo, contrato } = ingreso;
  const estado = ESTADOS[ingreso.estado] ?? { label: ingreso.estado, variante: "neutral" };
  const firmado = Boolean(contrato?.firmado);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="fantasma" className="gap-1.5" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Boton>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {esAdmin && (
            <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => onEditar(ingreso)}>
              <Pencil className="w-3.5 h-3.5" /> Editar ingreso
            </Boton>
          )}
          <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setImprimiendo(true)} disabled={!contrato}>
            <Printer className="w-3.5 h-3.5" /> Contrato y recibos
          </Boton>
        </div>
      </div>

      {error && <Aviso>{error}</Aviso>}

      {/* Cabecera del legajo */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Solo identificación. Los kilómetros, motor, chasis y origen se ven
              al editar el ingreso y al comparar los papeles, que es donde se
              usan; acá arriba no aportaban nada. */}
          <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
            <Car className="w-4 h-4 text-accent" />
            {tieneVehiculo(vehiculo) ? (
              <>
                {tituloVehiculo(vehiculo)}
                <span className="font-normal text-muted-foreground">{vehiculo.dominio}</span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">
                Sin título cargado · los datos del vehículo se toman del título, en Papeles
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Insignia variante={estado.variante}>{estado.label}</Insignia>
            {firmado && (
              <Insignia variante="exito">
                <Check className="w-3 h-3" /> Contrato firmado
              </Insignia>
            )}
          </div>
        </div>

        <Titular persona={ingreso.titular} />
      </div>

      {/* Papeles / Contrato */}
      <div className="flex items-center gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              pestana === p.id
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            {p.label}
            {p.id === "papeles" && (
              <span className="ml-1.5 text-[11px] opacity-70">
                {ingreso.papeles.cargados}/{ingreso.papeles.cargados + ingreso.papeles.faltantes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {pestana === "papeles" && <Papeles ingreso={ingreso} catalogo={catalogo} esAdmin={esAdmin} onCambio={refrescar} />}

      {pestana === "contrato" && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <ResumenContrato contrato={contrato} />

          {esAdmin && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setEditandoContrato(true)} disabled={firmado}>
                <FileSignature className="w-3.5 h-3.5" /> {contrato ? "Editar condiciones" : "Cargar condiciones"}
              </Boton>
              {contrato && (
                <Boton variante={firmado ? "peligro" : "primario"} tamano="sm" className="gap-1.5" onClick={alternarFirma} cargando={firmando}>
                  {firmado ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {firmado ? "Desfirmar" : "Firmar"}
                </Boton>
              )}
              {firmado && (
                <p className="text-xs text-muted-foreground">
                  Firmado: las condiciones quedan congeladas. Para cambiarlas hay que desfirmar y volver a imprimir.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {editandoContrato && (
        <ContratoFormulario
          ingresoId={ingreso.id}
          contrato={contrato}
          onCerrar={() => setEditandoContrato(false)}
          onGuardado={refrescar}
        />
      )}

      {imprimiendo && <Impresos ingresoId={ingreso.id} onCerrar={() => setImprimiendo(false)} />}
    </div>
  );
}
