"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Camera, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { guardarDocumentoIngreso } from "@/lib/api";
import { subirImagen } from "@/lib/subir-imagen";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Texto, Selector, Area, Aviso, Etiqueta } from "./campos";
import { CampoDeclarado } from "./campo-declarado";
import { Escaner } from "./escaner";
import { TENENCIAS } from "./tenencia";
import { useImagenesFirmadas } from "./usar-imagenes-firmadas";
import { CLASE_INPUT } from "../../ui/campo";

// Carga de un papel. Los campos NO están escritos acá: se dibujan leyendo la
// declaración que manda el backend, así un tipo nuevo aparece solo.

// Del documento guardado al estado del formulario: todo a texto.
function aFormulario(spec, documento) {
  const datos = {};
  for (const campo of spec.campos) {
    const guardado = documento?.datos?.[campo.clave];
    datos[campo.clave] = guardado === undefined || guardado === null ? "" : String(guardado);
  }
  return {
    datos,
    imagenes: documento?.imagenes ?? [],
    // Un papel nuevo arranca en "no_recibido": subir la foto no prueba que el
    // papel esté acá. Lo tiene que declarar quien lo carga.
    tenencia: documento?.tenencia ?? "no_recibido",
    ubicacionFisica: documento?.ubicacionFisica ?? "",
    fechaVencimiento: documento?.fechaVencimiento ?? "",
    observaciones: documento?.observaciones ?? "",
    // Campos que el escaneo leyó con dudas. Vacío mientras se carga a mano.
    dudosos: [],
  };
}

export function PapelFormulario({ ingresoId, tipo, spec, documento, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => aFormulario(spec, documento));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef(null);
  const camaraRef = useRef(null);
  // Las imágenes están en el store privado: para mostrarlas hay que firmarlas.
  const { urls: firmadas } = useImagenesFirmadas(ingresoId, form.imagenes);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // Tocar un campo marcado lo saca de la lista: ya lo miró una persona.
  const setDato = (clave) => (valor) =>
    setForm((f) => ({ ...f, datos: { ...f.datos, [clave]: valor }, dudosos: f.dudosos.filter((c) => c !== clave) }));

  // Lo que devuelve el escaneo entra como texto, igual que si se hubiera
  // tipeado: de ahí en más es un formulario común y corriente.
  function alEscanear({ datos, fechaVencimiento, dudosos }) {
    setForm((f) => ({
      ...f,
      datos: { ...f.datos, ...Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, String(v)])) },
      fechaVencimiento: fechaVencimiento ?? f.fechaVencimiento,
      dudosos,
    }));
  }

  async function alElegirArchivos(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;

    setSubiendo(true);
    setError(null);
    try {
      // "documentos": van al store privado, y lo que vuelve es el pathname.
      const nuevas = [];
      for (const file of files) nuevas.push(await subirImagen(file, "documentos"));
      setForm((f) => ({ ...f, imagenes: [...f.imagenes, ...nuevas] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      // Los campos en blanco no se mandan: el backend distingue "sin completar"
      // de "completado con vacío", y un requerido vacío tiene que fallar ahí.
      const datos = Object.fromEntries(Object.entries(form.datos).filter(([, v]) => v !== ""));

      await guardarDocumentoIngreso(ingresoId, {
        tipo,
        datos,
        imagenes: form.imagenes,
        tenencia: form.tenencia,
        ubicacionFisica: form.ubicacionFisica.trim() || null,
        fechaVencimiento: form.fechaVencimiento || null,
        observaciones: form.observaciones.trim() || null,
      });
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const venceLabel = spec.vencimiento === "requerido" ? "Vence el *" : "Vence el";

  return (
    <Modal titulo={spec.label} icono={FileText} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="px-6 py-5 space-y-4 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}

        {/* La imagen */}
        <Etiqueta label="Imagen del papel" ayuda="Frente y dorso si corresponde. Hasta 6 por papel.">
          <div className="flex flex-wrap gap-2">
            {form.imagenes.map((pathname) => (
              <div key={pathname} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border bg-secondary">
                {/* La miniatura aparece cuando llega la URL firmada; el pathname
                    ya está, así que quitarla funciona desde el primer momento. */}
                {firmadas[pathname] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={firmadas[pathname]} alt="Documento" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imagenes: f.imagenes.filter((u) => u !== pathname) }))}
                  className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Quitar imagen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => camaraRef.current?.click()}
              disabled={subiendo}
              className="w-24 h-24 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors disabled:opacity-50"
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {subiendo ? "Subiendo…" : "Tomar foto"}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="w-24 h-24 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Subir archivo
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={alElegirArchivos} />
          {/* `capture` abre la cámara en el celular; en una compu se comporta
              como un selector de archivos común. */}
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" hidden onChange={alElegirArchivos} />
        </Etiqueta>

        <Escaner ingresoId={ingresoId} tipo={tipo} imagenes={form.imagenes} onDatos={alEscanear} />

        {/* Los campos propios de este papel, tal como los declara el backend */}
        {spec.campos.length > 0 && (
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-xs font-medium text-foreground">Datos a completar a mano</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {spec.campos.map((campo) => (
                <CampoDeclarado
                  key={campo.clave}
                  campo={campo}
                  valor={form.datos[campo.clave]}
                  onCambio={setDato(campo.clave)}
                  dudoso={form.dudosos.includes(campo.clave)}
                />
              ))}
            </div>
          </div>
        )}

        {/* El papel físico: distinto de haber subido la imagen */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs font-medium text-foreground">El papel físico</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Selector
              label="¿Qué quedó en la agencia? *"
              valor={form.tenencia}
              onCambio={set("tenencia")}
              opciones={TENENCIAS.map((t) => ({ valor: t.valor, label: t.label }))}
              ayuda="Tener el escaneo no es tener el papel."
            />
            {form.tenencia !== "no_recibido" && (
              <Texto
                label="Dónde está guardado *"
                valor={form.ubicacionFisica}
                onCambio={set("ubicacionFisica")}
                placeholder="Carpeta A-12, caja fuerte…"
                ayuda="Si está acá, tiene que decir dónde."
              />
            )}
            {spec.vencimiento === "no" ? (
              <Etiqueta label="Vencimiento">
                <div className={`${CLASE_INPUT} h-9 flex items-center text-muted-foreground`}>Este papel no vence</div>
              </Etiqueta>
            ) : (
              <Texto label={venceLabel} valor={form.fechaVencimiento} onCambio={set("fechaVencimiento")} tipo="date" />
            )}
          </div>
          <Area label="Observaciones" valor={form.observaciones} onCambio={set("observaciones")} filas={2} />
        </div>

        {documento?.diferencias?.length > 0 && (
          <Aviso tono="alerta">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> No coincide con lo cargado en el vehículo
            </span>
            <ul className="mt-1.5 space-y-0.5 text-xs">
              {documento.diferencias.map((d) => (
                <li key={d.campo}>
                  {d.campo}: el papel dice <strong>{String(d.enPapel)}</strong>, el sistema tiene <strong>{String(d.enSistema)}</strong>
                </li>
              ))}
            </ul>
          </Aviso>
        )}
      </div>

      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando} disabled={subiendo}>
          Guardar papel
        </Boton>
      </ModalPie>
    </Modal>
  );
}
