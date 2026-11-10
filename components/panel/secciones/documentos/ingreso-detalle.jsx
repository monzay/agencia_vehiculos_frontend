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
  Undo2,
  HandCoins,
  BookmarkCheck,
  XCircle,
} from "lucide-react";
import {
  obtenerIngreso,
  eliminarIngreso,
  cambiarEstadoIngreso,
  venderIngreso,
  deshacerVentaIngreso,
  venderAutoDelBoleto,
  deshacerVentaDelBoleto,
} from "@/lib/api";
import { VenderModal } from "../vender-modal";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Boton } from "../../ui/boton";
import { Insignia } from "../../ui/insignia";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Aviso } from "./campos";
import { Papeles } from "./papeles";
import { Seguimiento } from "./seguimiento";
import { Impresos } from "./impresos";
import { RequisitosContrato, PapelesObligatorios } from "./requisitos-contrato";
import { PublicarModal } from "./publicar-modal";
import { FinanciacionModal } from "./financiacion-modal";
import { CierreVenta } from "./cierre-venta";
import { PublicacionUsado } from "./publicacion-usado";
import { VINCULO } from "./vinculos";
import { CONTRATOS } from "./contratos";
import { MODALIDAD, vendeLaAgencia } from "./modalidades";
import { tituloVehiculo, tieneVehiculo, dni, cuit, fechaDeMomento } from "./formato";
import { pesos } from "./impresos/etiquetas";

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
];

// Adónde se le paga al titular: solo en la consignación, que es cuando se le transfiere.
const FILA_CUENTA = { label: "CBU / Alias", valor: (p) => [p.cbu, p.aliasCbu, p.bancoCbu].filter(Boolean).join(" · ") || null };

// Los datos del titular, rótulo a la izquierda y valor a la derecha. Una sola
// grilla sirve para cualquier ancho de pantalla.
function Titular({ persona, conCuenta }) {
  const filas = conCuenta ? [...FILAS, FILA_CUENTA] : FILAS;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Titular</p>
      <p className="text-sm text-foreground inline-flex items-center gap-1.5 mb-2">
        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {persona ? nombreCompleto(persona) : <span className="text-muted-foreground">Sin cargar</span>}
      </p>
      {persona &&
        filas.map(({ label, valor }) => (
          <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-1 border-t border-border">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs text-foreground">{valor(persona) || <span className="text-muted-foreground">—</span>}</span>
          </div>
        ))}
    </div>
  );
}

// Cuándo se creó el ingreso, cuándo se publicó y cuándo entró al estado actual,
// al lado del titular y con el mismo formato de filas. "En recepción" no lleva
// fecha propia: es el estado inicial. La publicación se muestra aunque después
// se haya vendido o retirado.
function Fechas({ ingreso }) {
  const filas = [
    { label: "Creado", valor: fechaDeMomento(ingreso.creado) },
    ...(ingreso.publicado ? [{ label: ESTADOS.publicado.label, valor: fechaDeMomento(ingreso.publicado) }] : []),
    ...(!["recepcion", "publicado"].includes(ingreso.estado)
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

// Lo que el cliente deja en la parte de pago, con el mismo formato de filas.
// `sena`: si el trámite nació de una seña, lo que ya pagó para reservar el auto.
function ParteDePago({ datos, sena }) {
  const filas = [
    ...(sena ? [{ label: "Seña", valor: `${pesos(sena.monto)} · ${fechaDeMomento(sena.senado)}` }] : []),
    { label: "Vehículo que deja", valor: datos.vehiculo || "No entrega vehículo" },
    { label: "Valor de toma", valor: datos.valor != null ? pesos(datos.valor) : null },
    { label: "Anticipo o entrega", valor: datos.efectivo != null ? pesos(datos.efectivo) : null },
  ];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Anticipo o parte de pago</p>
      {filas.map(({ label, valor }) => (
        <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs text-foreground tabular-nums">{valor || <span className="text-muted-foreground">—</span>}</span>
        </div>
      ))}
    </div>
  );
}

// Lo que la agencia publicó para el auto que vende: el descuento (con el precio
// que vio el cliente en la web) y las promociones vigentes.
const valorPromo = (p) =>
  p.descuento == null ? null : p.descuento_tipo === "monto" ? `−${pesos(p.descuento)}` : `−${p.descuento}%`;

function Beneficios({ datos }) {
  const filas = [
    ...(datos.descuento
      ? [
          { label: "Descuento", valor: `${datos.descuento.nombre} · −${pesos(datos.ahorro)}` },
          { label: "Precio con descuento", valor: `${pesos(datos.precioFinal)} (lista ${pesos(datos.precio)})` },
        ]
      : []),
    ...datos.promociones.map((p) => ({ label: "Promoción", valor: [p.nombre, valorPromo(p)].filter(Boolean).join(" · ") })),
  ];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
        Beneficios del vehículo · {datos.auto.marca} {datos.auto.modelo}
      </p>
      {filas.map(({ label, valor }, i) => (
        <div key={i} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs text-foreground tabular-nums">{valor}</span>
        </div>
      ))}
    </div>
  );
}

// El precio del auto que vende la agencia y, si tiene descuento, cuánto queda.
function PrecioDeVenta({ precio, beneficios }) {
  const conDescuento = beneficios?.descuento ? beneficios : null;
  return (
    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
      Precio <span className="text-sm font-semibold text-foreground">{pesos(precio)}</span>
      {conDescuento && (
        <>
          {" · "}Con descuento <span className="text-sm font-semibold text-foreground">{pesos(conDescuento.precioFinal)}</span>{" "}
          ({conDescuento.descuento.nombre} · −{pesos(conDescuento.ahorro)})
        </>
      )}
    </p>
  );
}

// `version` cambia cuando el ingreso se edita afuera (el modal de Editar
// ingreso): sin recargar, el detalle y el próximo Editar mostrarían datos viejos.
export function IngresoDetalle({ ingresoId, version, catalogo, esAdmin, onVolver, onEditar, onCambio }) {
  const [ingreso, setIngreso] = useState(null);
  const [error, setError] = useState(null);
  const [pestana, setPestana] = useState("papeles");
  const [editandoContrato, setEditandoContrato] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [financiando, setFinanciando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [vendiendo, setVendiendo] = useState(false);
  const [confirmandoVenta, setConfirmandoVenta] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  // La venta que se confirma: "vender" | "deshacer" | null.
  const [confirmandoAccionVenta, setConfirmandoAccionVenta] = useState(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [hitoAMarcar, setHitoAMarcar] = useState(null);
  const [avisos, setAvisos] = useState([]);

  const cargar = useCallback(() => {
    setError(null);
    return obtenerIngreso(ingresoId)
      .then(setIngreso)
      .catch((e) => setError(e.message));
  }, [ingresoId]);

  useEffect(() => {
    cargar();
  }, [cargar, version]);

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

  // Marcar vendido o deshacerlo. En la consignación se deshace desde acá; en la
  // venta al contado y la parte de pago se marca el auto del boleto.
  async function accionVenta() {
    const deshacer = confirmandoAccionVenta === "deshacer";
    setCambiandoEstado(true);
    setError(null);
    try {
      if (ingreso.modalidad === "consignacion") await deshacerVentaIngreso(ingreso.id);
      else if (deshacer) await deshacerVentaDelBoleto(ingreso.id);
      else await venderAutoDelBoleto(ingreso.id);
      refrescar();
    } catch (e) {
      setError(e.message);
    } finally {
      setCambiandoEstado(false);
      setConfirmandoAccionVenta(null);
    }
  }

  // Lo que abre cada paso de la tira de Seguimiento: siempre lo que ya existe en el legajo.
  const ACCIONES_DE_PASO = {
    papeles: () => setPestana("papeles"),
    ver_contrato: () => setPestana("contrato"),
    cargar_contrato: () => setEditandoContrato(true),
    firmar: () => setPestana("contrato"),
    financiar: () => setFinanciando(true),
    vender: () => setConfirmandoAccionVenta("vender"),
    publicar: () => setPublicando(true),
    vender_consignacion: () => setVendiendo(true),
    cobrado: () => setHitoAMarcar("cobrado"),
    entregado: () => setHitoAMarcar("entregado"),
    transferido: () => setHitoAMarcar("transferido"),
    preparacion: () => setPestana("publicacion"),
  };

  // El backend dice si se puede: si no, muestra qué hacer primero.
  async function cancelarTramite() {
    setCancelando(true);
    setError(null);
    try {
      await eliminarIngreso(ingreso.id);
      onCambio?.();
      onVolver();
    } catch (e) {
      setError(e.message);
      setConfirmandoCancelar(false);
    } finally {
      setCancelando(false);
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
  // La agencia vende un auto propio (contado o parte de pago): se vende desde acá.
  const autoVendido = vendeLaAgencia(ingreso.modalidad) ? ingreso.autoInteres : null;
  // Sin usado no hay papeles del cliente: el legajo es solo el boleto.
  // Un usado ya recibido (boleto firmado) se prepara y se publica desde acá.
  const pestanas = [
    ...(ingreso.conUsado ? PESTANAS : PESTANAS.filter((p) => p.id !== "papeles")),
    ...(ingreso.preparacion ? [{ id: "publicacion", label: "Publicación" }] : []),
  ];
  const pestanaActual = pestanas.some((p) => p.id === pestana) ? pestana : "contrato";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="fantasma" className="gap-1.5" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </Boton>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {esAdmin && (
            <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => onEditar(ingreso)}>
              <Pencil className="w-3.5 h-3.5" /> Editar trámite
            </Boton>
          )}
          <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setImprimiendo(true)} disabled={!contrato || contratoBloqueado}>
            <Printer className="w-3.5 h-3.5" /> Contrato y recibos
          </Boton>
          {/* Solo la parte de pago tiene saldo que financiar; las financiaciones son del admin. */}
          {esAdmin && ingreso.modalidad === "permuta" && (
            <Boton variante="secundario" tamano="sm" className="gap-1.5" onClick={() => setFinanciando(true)}>
              <HandCoins className="w-3.5 h-3.5" /> Financiación
              {ingreso.financiacion && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </Boton>
          )}
          {/* Lo que ya tuvo ficha en la web se cierra con Marcar retirado. */}
          {esAdmin && ingreso.estado !== "vendido" && !ingreso.consignacionId && (
            <Boton
              variante="peligro"
              tamano="sm"
              className="gap-1.5"
              onClick={() => setConfirmandoCancelar(true)}
              title="Se deja de ver y el auto queda libre"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancelar trámite
            </Boton>
          )}
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
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground inline-flex items-center gap-2">
              <Car className="w-4 h-4 text-accent" />
              {/* En una venta manda el auto que compra el cliente, aunque entregue un usado. */}
              {autoVendido ? (
                <>
                  {`${autoVendido.marca} ${autoVendido.modelo} ${autoVendido.anio}`}
                  {autoVendido.dominio && <span className="font-normal text-muted-foreground">{autoVendido.dominio}</span>}
                </>
              ) : vendeLaAgencia(ingreso.modalidad) ? (
                <span className="font-normal text-muted-foreground">Falta elegir el vehículo que compra el cliente: Editar trámite</span>
              ) : tieneVehiculo(vehiculo) ? (
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
            {autoVendido?.precio != null && <PrecioDeVenta precio={autoVendido.precio} beneficios={ingreso.beneficios} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Insignia variante="neutral">{MODALIDAD[ingreso.modalidad].label}</Insignia>
            {/* Solo si el trámite nació de una seña; sin seña no se muestra nada. */}
            {ingreso.sena && (
              <Insignia variante="info" title={`Seña del ${fechaDeMomento(ingreso.sena.senado)}: se descuenta del precio en el boleto`}>
                <BookmarkCheck className="w-3 h-3" /> Con seña {pesos(ingreso.sena.monto)}
              </Insignia>
            )}
            {esConsignacion && <Insignia variante={estado.variante}>{estado.label}</Insignia>}
            {firmado && (
              <Insignia variante="exito">
                <Check className="w-3 h-3" /> Contrato firmado
              </Insignia>
            )}

            {/* Solo las acciones que este estado admite. Un desplegable con los
                tres valores ofrecería "publicado" aunque falte firmar, y el
                rechazo llegaría recién al intentarlo. */}
            {esAdmin && esConsignacion && ingreso.estado === "vendido" && (
              <Boton
                variante="secundario"
                tamano="sm"
                className="gap-1.5"
                cargando={cambiandoEstado}
                onClick={() => setConfirmandoAccionVenta("deshacer")}
                title="Se marcó vendido por error: vuelve a estar publicado"
              >
                <Undo2 className="w-3.5 h-3.5" /> Deshacer venta
              </Boton>
            )}

            {/* Venta al contado o con parte de pago: el auto del boleto se marca vendido acá. */}
            {contrato?.permuta?.vendido && <Insignia variante="exito">Vendido</Insignia>}
            {esAdmin && contrato?.permuta && (
              <Boton
                variante="secundario"
                tamano="sm"
                className="gap-1.5"
                cargando={cambiandoEstado}
                disabled={!contrato.permuta.vendido && !firmado}
                onClick={() => setConfirmandoAccionVenta(contrato.permuta.vendido ? "deshacer" : "vender")}
                title={
                  contrato.permuta.vendido
                    ? "Se marcó por error: el auto vuelve a estar a la venta"
                    : firmado
                      ? "Marca vendido el auto del boleto, a su precio"
                      : "Primero hay que firmar el boleto"
                }
              >
                {contrato.permuta.vendido ? <Undo2 className="w-3.5 h-3.5" /> : <CircleDollarSign className="w-3.5 h-3.5" />}
                {contrato.permuta.vendido ? "Deshacer venta" : "Vendido"}
              </Boton>
            )}

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
          <Titular persona={ingreso.titular} conCuenta={esConsignacion} />
          <div className="space-y-4">
            <Fechas ingreso={ingreso} />
            {ingreso.parteDePago && <ParteDePago datos={ingreso.parteDePago} sena={ingreso.sena} />}
            {/* Solo si el auto que se vende tiene descuento o promociones. */}
            {ingreso.beneficios && <Beneficios datos={ingreso.beneficios} />}
          </div>
        </div>
      </div>

      <Seguimiento seguimiento={ingreso.seguimiento} onAccion={esAdmin ? (accion) => ACCIONES_DE_PASO[accion]?.() : undefined} />
      {esAdmin && <CierreVenta ingreso={ingreso} hitoAMarcar={hitoAMarcar} onElegirHito={setHitoAMarcar} onCambio={refrescar} />}

      {/* Papeles / Contrato */}
      <div className="flex items-center gap-2">
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              pestanaActual === p.id
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

      {pestanaActual === "papeles" && <Papeles ingreso={ingreso} catalogo={catalogo} esAdmin={esAdmin} onCambio={refrescar} />}

      {pestanaActual === "publicacion" && <PublicacionUsado preparacionId={ingreso.preparacion.id} esAdmin={esAdmin} onCambio={refrescar} />}

      {/* Solo la consignación trae requisitos: compra y parte de pago no. */}
      {pestanaActual === "contrato" && ingreso.requisitosContrato && <PapelesObligatorios requisitos={ingreso.requisitosContrato} />}

      {pestanaActual === "contrato" && contratoBloqueado && (
        <div className="rounded-xl border border-border bg-card p-4">
          <RequisitosContrato requisitos={ingreso.requisitosContrato} />
        </div>
      )}

      {/* Se cambió el auto del trámite después de guardar el boleto: hay que guardarlo de nuevo. */}
      {pestanaActual === "contrato" && !firmado && contrato?.permuta && autoVendido && contrato.permuta.ref !== autoVendido.ref && (
        <Aviso tono="alerta">El vehículo del trámite cambió. Volvé a guardar las condiciones del boleto para firmarlo o imprimirlo.</Aviso>
      )}

      {pestanaActual === "contrato" && !contratoBloqueado && (
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
          ingreso={ingreso}
          modalidad={ingreso.modalidad}
          contrato={contrato}
          onCerrar={() => setEditandoContrato(false)}
          onGuardado={refrescar}
        />
      )}

      <ConfirmarModal
        abierto={Boolean(confirmandoAccionVenta)}
        titulo={confirmandoAccionVenta === "deshacer" ? "¿Deshacer la venta?" : "¿Marcar vendido?"}
        mensaje={
          confirmandoAccionVenta === "deshacer"
            ? "El vehículo vuelve a estar a la venta y la venta deja de contar en la contabilidad."
            : `El ${autoVendido ? `${autoVendido.marca} ${autoVendido.modelo}` : "vehículo"} queda vendido a ${pesos(contrato?.permuta?.valor)} y sale del catálogo.`
        }
        textoConfirmar={confirmandoAccionVenta === "deshacer" ? "Deshacer venta" : "Marcar vendido"}
        cargando={cambiandoEstado}
        onConfirmar={accionVenta}
        onCancelar={() => setConfirmandoAccionVenta(null)}
      />

      <ConfirmarModal
        abierto={confirmandoCancelar}
        titulo="¿Cancelar este trámite?"
        mensaje="Deja de verse y el vehículo queda libre. Si nació de una seña, la seña vuelve a estar vigente."
        textoConfirmar="Cancelar trámite"
        textoCancelar="Volver"
        cargando={cancelando}
        onConfirmar={cancelarTramite}
        onCancelar={() => setConfirmandoCancelar(false)}
      />

      {financiando && <FinanciacionModal ingreso={ingreso} onCerrar={() => setFinanciando(false)} onGuardado={refrescar} />}

      {vendiendo && (
        <VenderModal
          vehiculo={{ brand: vehiculo.marca, model: vehiculo.modelo, precio: contrato?.precioPublicacion }}          cargando={confirmandoVenta}
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
