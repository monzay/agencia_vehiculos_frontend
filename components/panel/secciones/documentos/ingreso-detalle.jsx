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
  Globe,
  EyeOff,
  LogOut,
  CircleDollarSign,
} from "lucide-react";
import { obtenerIngreso, cambiarEstadoIngreso, venderIngreso } from "@/lib/api";
import { VenderModal } from "../vender-modal";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Insignia } from "../../ui/insignia";
import { Aviso } from "./campos";
import { Papeles } from "./papeles";
import { Impresos } from "./impresos";
import { RequisitosContrato, PapelesObligatorios } from "./requisitos-contrato";
import { PublicarModal } from "./publicar-modal";
import { VINCULO } from "./vinculos";
import { CONTRATOS } from "./contratos";
import { MODALIDAD } from "./modalidades";
import { tituloVehiculo, tieneVehiculo, dni, cuit, fechaDeMomento } from "./formato";

// Legajo de un ingreso: el vehículo, quién lo dejó, los papeles y el contrato.

const nombreCompleto = (p) => (p ? [p.nombre, p.apellido].filter(Boolean).join(" ") || "Sin nombre" : "—");

const ESTADOS = {
  recepcion: { label: "En recepción", variante: "info" },
  publicado: { label: "Publicado", variante: "exito" },
  retirado: { label: "Retirado", variante: "neutral" },
  vendido: { label: "Vendido", variante: "exito" },
};

const PESTANAS = [
  { id: "papeles", label: "Papeles" },
  { id: "contrato", label: "Contrato" },
];

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
  // Adónde se le paga al titular: el CBU y su alias, lo que haya.
  { label: "CBU / Alias", valor: (p) => [p.cbu, p.aliasCbu].filter(Boolean).join(" · ") || null },
];

// Los datos del titular, rótulo a la izquierda y valor a la derecha. Una sola
// grilla sirve para cualquier ancho de pantalla.
function Titular({ persona }) {
  return (
    <div>
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

// Cuándo se creó el ingreso y cuándo entró al estado actual, al lado del
// titular y con el mismo formato de filas. "En recepción" no lleva fecha
// propia: es el estado inicial.
function Fechas({ ingreso }) {
  const filas = [
    { label: "Creado", valor: fechaDeMomento(ingreso.creado) },
    ...(ingreso.estado !== "recepcion"
      ? [{ label: ESTADOS[ingreso.estado]?.label ?? ingreso.estado, valor: fechaDeMomento(ingreso.estadoDesde) }]
      : []),
  ];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Fechas</p>
      {filas.map(({ label, valor }) => (
        <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs text-foreground tabular-nums">{valor || <span className="text-muted-foreground">—</span>}</span>
        </div>
      ))}
    </div>
  );
}

export function IngresoDetalle({ ingresoId, catalogo, esAdmin, onVolver, onEditar, onCambio }) {
  const [ingreso, setIngreso] = useState(null);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState("papeles");
  const [editandoContrato, setEditandoContrato] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [vendiendo, setVendiendo] = useState(false);
  const [confirmandoVenta, setConfirmandoVenta] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [avisos, setAvisos] = useState([]);

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

  // Publicar / despublicar / retirar. El backend es el que decide si se puede:
  // acá no se replican las reglas, se muestra lo que responde.
  async function cambiarEstado(estado) {
    setCambiandoEstado(true);
    setError(null);
    setAvisos([]);
    try {
      const r = await cambiarEstadoIngreso(ingreso.id, estado);
      setAvisos(r.avisos ?? []);
      refrescar();
    } catch (e) {
      setError(e.message);
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function alternarFirma() {
    setFirmando(true);
    setError(null);
    try {
      const { firmar, desfirmar } = CONTRATOS[ingreso.modalidad];
      if (ingreso.contrato?.firmado) await desfirmar(ingreso.id);
      else await firmar(ingreso.id);
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
  // Solo la consignación trae requisitos. Un contrato ya firmado no se bloquea:
  // es la copia que el cliente tiene en la mano.
  const contratoBloqueado = Boolean(ingreso.requisitosContrato && !ingreso.requisitosContrato.habilitado && !firmado);
  const { Resumen, Formulario } = CONTRATOS[ingreso.modalidad];
  // Publicar y retirar son de la consignación: el auto comprado o tomado en parte de pago ya
  // es de la agencia.
  const esConsignacion = ingreso.modalidad === "consignacion";
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
          <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setImprimiendo(true)} disabled={!contrato || contratoBloqueado}>
            <Printer className="w-3.5 h-3.5" /> Contrato y recibos
          </Boton>
        </div>
      </div>

      {error && <Aviso>{error}</Aviso>}
      {/* Lo que quedó a medias al publicar. Es aviso y no error: el auto ya está
          en la web, pero le falta algo para que la ficha no salga pobre. */}
      {avisos.length > 0 && (
        <Aviso tono="alerta">
          {avisos.map((a) => (
            <p key={a}>{a}</p>
          ))}
        </Aviso>
      )}

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
          <div className="flex flex-wrap items-center gap-2">
            <Insignia variante="neutral">{MODALIDAD[ingreso.modalidad].label}</Insignia>
            {esConsignacion && <Insignia variante={estado.variante}>{estado.label}</Insignia>}
            {firmado && (
              <Insignia variante="exito">
                <Check className="w-3 h-3" /> Contrato firmado
              </Insignia>
            )}

            {/* Solo las acciones que este estado admite. Un desplegable con los
                tres valores ofrecería "publicado" aunque falte firmar, y el
                rechazo llegaría recién al intentarlo. */}
            {/* Vendido no tiene acciones acá: la venta se deshace desde Vehículos. */}
            {esAdmin && esConsignacion && ingreso.estado !== "vendido" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {ingreso.estado !== "publicado" && (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    className="gap-1.5"
                    cargando={cambiandoEstado}
                    onClick={() => setPublicando(true)}
                    title={firmado ? "Cargá las fotos y poné el auto a la venta" : "Primero hay que firmar el contrato"}
                  >
                    <Globe className="w-3.5 h-3.5" /> Publicar
                  </Boton>
                )}
                {ingreso.estado === "publicado" && (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    className="gap-1.5"
                    cargando={cambiandoEstado}
                    onClick={() => cambiarEstado("recepcion")}
                    title="Lo saca de la web; la ficha y sus fotos se conservan"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Despublicar
                  </Boton>
                )}
                {ingreso.estado !== "retirado" && (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    className="gap-1.5"
                    cargando={cambiandoEstado}
                    onClick={() => cambiarEstado("retirado")}
                    title="El dueño se llevó el vehículo"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Marcar retirado
                  </Boton>
                )}
                {/* Solo un auto publicado tiene ficha que vender. */}
                {ingreso.estado === "publicado" && (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    className="gap-1.5"
                    onClick={() => setVendiendo(true)}
                    title="Se vendió: cierra la venta con su precio y fecha"
                  >
                    <CircleDollarSign className="w-3.5 h-3.5" /> Vendido
                  </Boton>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 pt-3 border-t border-border">
          <Titular persona={ingreso.titular} />
          <Fechas ingreso={ingreso} />
        </div>
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

      {/* Solo la consignación trae requisitos: compra y parte de pago no. */}
      {pestana === "contrato" && ingreso.requisitosContrato && <PapelesObligatorios requisitos={ingreso.requisitosContrato} />}

      {pestana === "contrato" && contratoBloqueado && (
        <div className="rounded-xl border border-border bg-card p-4">
          <RequisitosContrato requisitos={ingreso.requisitosContrato} />
        </div>
      )}

      {pestana === "contrato" && !contratoBloqueado && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {contrato ? (
            <Resumen contrato={contrato} />
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no se cargaron las condiciones del contrato.</p>
          )}

          {esAdmin && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setEditandoContrato(true)} disabled={firmado}>
                <FileSignature className="w-3.5 h-3.5" /> {contrato ? "Editar condiciones" : "Cargar condiciones"}
              </Boton>
              {contrato && (
                <Boton
                  variante={firmado ? "peligro" : "primario"}
                  tamano="sm"
                  // Desfirmar es la acción que deshace el contrato: rojo siempre, no solo al pasar el mouse.
                  className={cn("gap-1.5", firmado && "text-destructive border-destructive/50 hover:bg-destructive/10")}
                  onClick={alternarFirma}
                  cargando={firmando}
                >
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
        <Formulario
          ingresoId={ingreso.id}
          modalidad={ingreso.modalidad}
          contrato={contrato}
          onCerrar={() => setEditandoContrato(false)}
          onGuardado={refrescar}
        />
      )}

      {vendiendo && (
        <VenderModal
          vehiculo={{ brand: vehiculo.marca, model: vehiculo.modelo, precio: contrato?.precioPublicacion }}
          cargando={confirmandoVenta}
          onCancelar={() => setVendiendo(false)}
          onConfirmar={async (datos) => {
            setConfirmandoVenta(true);
            setError(null);
            try {
              await venderIngreso(ingreso.id, datos);
              setVendiendo(false);
              refrescar();
            } catch (e) {
              setError(e.message);
              setVendiendo(false);
            } finally {
              setConfirmandoVenta(false);
            }
          }}
        />
      )}

      {publicando && (
        <PublicarModal
          ingreso={ingreso}
          onCerrar={() => setPublicando(false)}
          onPublicado={(r) => {
            setAvisos(r.avisos ?? []);
            refrescar();
          }}
        />
      )}

      {imprimiendo && <Impresos ingresoId={ingreso.id} modalidad={ingreso.modalidad} onCerrar={() => setImprimiendo(false)} />}
    </div>
  );
}
