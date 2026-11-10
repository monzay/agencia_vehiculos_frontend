"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Globe, Loader2, X } from "lucide-react";
import { obtenerPreparacion, actualizarPreparacion, publicarPreparacion, despublicarPreparacion, actualizarIngreso } from "@/lib/api";
import { Boton } from "../../ui/boton";
import { Insignia } from "../../ui/insignia";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Aviso, Numero, Area, Selector } from "./campos";
import { FotosVehiculo, aFotos, listaDeFotos } from "./fotos-vehiculo";
import { pesos } from "./impresos/etiquetas";

// Pestaña del legajo de un usado recibido: qué le falta para salir a la web, y lo que
// se carga para publicarlo. El backend decide si se puede: acá se muestra lo que responde.

const ETAPAS = {
  recibido: { label: "Recibido", variante: "neutral" },
  en_preparacion: { label: "En preparación", variante: "alerta" },
  listo: { label: "Listo", variante: "info" },
  publicado: { label: "Publicado", variante: "exito" },
  vendido: { label: "Vendido", variante: "exito" },
};

const ORIGENES = { compra: "Compra", permuta: "Parte de pago" };

const AVANCES = ["recibido", "en_preparacion", "listo"].map((valor) => ({ valor, label: ETAPAS[valor].label }));

const tituloUsado = ({ marca, modelo, anio }) => [marca, modelo, anio].filter(Boolean).join(" ") || "Sin título cargado";

const aFormulario = (p) => ({ avance: p.avance, precio: p.precioVenta != null ? String(p.precioVenta) : "", descripcion: p.descripcion ?? "" });

function Requisitos({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.clave} className="flex items-start gap-2 text-sm">
          {i.cumplido ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />}
          <span className="min-w-0">
            <span className="text-foreground">{i.label}</span>
            {!i.cumplido && <span className="block text-xs text-muted-foreground">{i.donde}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Datos({ p, esAdmin }) {
  const filas = [
    ["Origen", ORIGENES[p.origen]],
    ["Dominio", p.vehiculo.dominio ?? "—"],
    ["Kilómetros", p.vehiculo.kms != null ? p.vehiculo.kms.toLocaleString("es-AR") : "—"],
    ["Precio de venta", p.precioVenta != null ? pesos(p.precioVenta) : "—"],
    ...(esAdmin ? [["Valor de toma", p.valorToma != null ? pesos(p.valorToma) : "—"], ["Le compramos a", p.titular?.nombre ?? "—"]] : []),
    ...(p.auto ? [["En Vehículos", `Ref ${p.auto.ref}`]] : []),
  ];
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex justify-between gap-3 border-b border-border/60 py-1">
          <dt className="text-muted-foreground">{etiqueta}</dt>
          <dd className="text-foreground text-right">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

// `onCambio`: refresca el legajo, que muestra si ya salió a la web.
export function PublicacionUsado({ preparacionId, esAdmin, onCambio }) {
  const [p, setP] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoDespublicar, setConfirmandoDespublicar] = useState(false);

  const mostrar = useCallback((datos) => {
    setP(datos);
    setForm(aFormulario(datos));
  }, []);

  useEffect(() => {
    let vigente = true;
    obtenerPreparacion(preparacionId)
      .then((datos) => vigente && mostrar(datos))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [preparacionId, mostrar]);

  if (!p) {
    return error ? (
      <Aviso>{error}</Aviso>
    ) : (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const enLaWeb = ["publicado", "vendido"].includes(p.etapa);
  const editable = esAdmin && !enLaWeb;
  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function correr(accion) {
    setOcupado(true);
    setError(null);
    try {
      mostrar(await accion());
      onCambio?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const guardarDatos = () =>
    actualizarPreparacion(p.id, { estado: form.avance, precioVenta: form.precio === "" ? null : Number(form.precio), descripcion: form.descripcion });

  const guardar = () => correr(guardarDatos);
  // Publica lo que se ve en pantalla, aunque no se haya tocado Guardar.
  const publicar = () =>
    correr(async () => {
      await guardarDatos();
      return publicarPreparacion(p.id);
    });
  const despublicar = () =>
    correr(async () => {
      setConfirmandoDespublicar(false);
      return despublicarPreparacion(p.id);
    });
  const cambiarFotos = (fotos) =>
    correr(async () => {
      await actualizarIngreso(p.ingresoId, { fotos: listaDeFotos(fotos) });
      return obtenerPreparacion(p.id);
    });

  return (
    <div className="space-y-4">
      {error && <Aviso>{error}</Aviso>}

      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{tituloUsado(p.vehiculo)}</h2>
          <Insignia variante={ETAPAS[p.etapa]?.variante}>{ETAPAS[p.etapa]?.label}</Insignia>
          {p.dias != null && <span className="text-xs text-muted-foreground">{p.dias === 1 ? "1 día" : `${p.dias} días`} en preparación</span>}
        </div>
        <Datos p={p} esAdmin={esAdmin} />
      </section>

      {!enLaWeb && (
        <section aria-label="Requisitos para publicar" className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Para publicar</h3>
          <Requisitos items={p.requisitos.items} />
        </section>
      )}

      {editable && (
        <section aria-label="Datos para publicar" className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Selector label="Avance" valor={form.avance} onCambio={set("avance")} opciones={AVANCES} />
            <Numero label="Precio de venta ($)" valor={form.precio} onCambio={set("precio")} placeholder="9.000.000" />
          </div>
          <Area label="Descripción" valor={form.descripcion} onCambio={set("descripcion")} maximo={2000} filas={3} placeholder="Lo que se va a leer en la web…" />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Fotos: se ven en la web</p>
            <FotosVehiculo fotos={aFotos(p.fotos)} onCambio={cambiarFotos} onError={setError} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Boton variante="secundario" onClick={guardar} cargando={ocupado}>
              Guardar
            </Boton>
            <Boton variante="primario" className="gap-1.5" onClick={publicar} cargando={ocupado}>
              {!ocupado && <Globe className="w-4 h-4" />} Publicar
            </Boton>
          </div>
        </section>
      )}

      {enLaWeb && p.etapa === "publicado" && (
        <Aviso tono="info">Este usado está en la web. Su precio, fotos y descripción se editan en Vehículos.</Aviso>
      )}
      {esAdmin && p.etapa === "publicado" && (
        <div className="flex justify-end">
          <Boton variante="secundario" onClick={() => setConfirmandoDespublicar(true)} cargando={ocupado}>
            Sacar de la web
          </Boton>
        </div>
      )}

      <ConfirmarModal
        abierto={confirmandoDespublicar}
        titulo="¿Sacar este usado de la web?"
        mensaje="Deja de verse en el catálogo. Su ficha se conserva, y se puede volver a publicar."
        textoConfirmar="Sacar de la web"
        textoCancelar="Volver"
        cargando={ocupado}
        onConfirmar={despublicar}
        onCancelar={() => setConfirmandoDespublicar(false)}
      />
    </div>
  );
}
