"use client";

import { useRef, useState } from "react";
import { FileUp, Camera, ScanLine, X, FileText, CheckCircle2, ListPlus } from "lucide-react";
import { leerListaVehiculos, importarVehiculos } from "@/lib/api";
import { subirArchivoDeLista } from "@/lib/subir-imagen";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { Aviso } from "../documentos/campos";
import { TablaImportacion } from "./tabla-importacion";
import {
  ESTADOS,
  filasIniciales,
  alternarFila,
  cambiarCampo,
  cantidadElegida,
  filasIncompletas,
  pedidoDeImportacion,
} from "./importacion";

// Importar la lista del catálogo: se sube un PDF, una imagen o una foto, la IA
// la lee y acá se revisa fila por fila antes de crear. No se guarda nada hasta
// que se confirma. Lo que ya está en el stock no se puede volver a crear, y la
// misma lista no se puede leer ni importar dos veces (lo frena el backend).

const MAX_ARCHIVOS = 6;

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function ElegirArchivos({ archivos, onAgregar, onQuitar, deshabilitado }) {
  const elegirRef = useRef(null);
  const camaraRef = useRef(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Subí la lista del catálogo en PDF, una imagen o una foto. Si son varias hojas, agregalas todas (hasta {MAX_ARCHIVOS}).
        De cada auto se toman solo los datos del formulario: marca, modelo, versión, año, kms, combustible y precios.
      </p>
      <div className="flex flex-wrap gap-2">
        <Boton onClick={() => elegirRef.current?.click()} disabled={deshabilitado || archivos.length >= MAX_ARCHIVOS}>
          <FileUp className="w-4 h-4" /> Elegir archivo
        </Boton>
        <Boton onClick={() => camaraRef.current?.click()} disabled={deshabilitado || archivos.length >= MAX_ARCHIVOS}>
          <Camera className="w-4 h-4" /> Sacar foto
        </Boton>
        <input ref={elegirRef} type="file" accept="application/pdf,image/*" multiple hidden onChange={onAgregar} aria-label="Archivo de la lista" />
        <input ref={camaraRef} type="file" accept="image/*" capture="environment" hidden onChange={onAgregar} aria-label="Foto de la lista" />
      </div>
      {archivos.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {archivos.map((archivo, i) => (
            <li key={`${archivo.name}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{archivo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => onQuitar(i)}
                disabled={deshabilitado}
                aria-label={`Quitar ${archivo.name}`}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Resumen({ filas, descartadas }) {
  const partes = Object.entries(ESTADOS)
    .map(([estado, { etiqueta, plural: varios }]) => {
      const n = filas.filter((f) => f.estado === estado).length;
      return n ? `${n} ${n === 1 ? etiqueta.toLowerCase() : varios}` : null;
    })
    .filter(Boolean);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {plural(filas.length, "vehículo leído", "vehículos leídos")}: {partes.join(" · ")}. Revisá los datos marcados en ámbar contra la lista.
      </p>
      {descartadas > 0 && (
        <Aviso tono="alerta">
          {plural(descartadas, "fila no se pudo leer", "filas no se pudieron leer")} (sin modelo legible o pasada la fila 200). Cargalas a mano.
        </Aviso>
      )}
    </div>
  );
}

function Resultado({ resultado }) {
  if (resultado.creados === 0) {
    return <Aviso tono="info">No se creó ningún vehículo: los elegidos ya estaban cargados en el stock.</Aviso>;
  }
  return (
    <div className="space-y-3 text-sm">
      <p className="inline-flex items-center gap-2 font-medium text-foreground">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        {resultado.creados === 1 ? "Se creó 1 vehículo." : `Se crearon ${resultado.creados} vehículos.`}
      </p>
      {resultado.omitidos > 0 && (
        <p className="text-muted-foreground">{plural(resultado.omitidos, "ya estaba cargado", "ya estaban cargados")} y no se creó de nuevo.</p>
      )}
      <Aviso tono="info">
        Entran sin publicar. Para que se vean en la web, abrí cada uno con Editar, cargale las fotos y el precio y marcá
        &quot;Publicado en la web&quot;.
      </Aviso>
    </div>
  );
}

export function ImportarLista({ onCerrar, onImportado }) {
  const [archivos, setArchivos] = useState([]);
  const [leidos, setLeidos] = useState([]); // pathnames de lo que se leyó: viajan al importar
  const [filas, setFilas] = useState(null); // null: todavía no se leyó
  const [descartadas, setDescartadas] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [trabajando, setTrabajando] = useState(null); // "leyendo" | "importando" | null
  const [error, setError] = useState(null);

  function agregar(e) {
    const nuevos = [...(e.target.files || [])];
    e.target.value = "";
    setError(nuevos.length + archivos.length > MAX_ARCHIVOS ? `Se usan los primeros ${MAX_ARCHIVOS} archivos.` : null);
    setArchivos((previos) => [...previos, ...nuevos].slice(0, MAX_ARCHIVOS));
  }

  async function leer() {
    setTrabajando("leyendo");
    setError(null);
    try {
      const subidos = await Promise.all(archivos.map(subirArchivoDeLista));
      const { filas: propuesta, descartadas: sinLeer = 0 } = await leerListaVehiculos(subidos);
      setLeidos(subidos);
      setDescartadas(sinLeer);
      setFilas(filasIniciales(propuesta));
    } catch (err) {
      setError(err.message);
    } finally {
      setTrabajando(null);
    }
  }

  async function importar() {
    setTrabajando("importando");
    setError(null);
    try {
      setResultado(await importarVehiculos(pedidoDeImportacion(leidos, filas)));
      onImportado?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setTrabajando(null);
    }
  }

  const elegidas = filas ? cantidadElegida(filas) : 0;
  const incompletas = filas ? filasIncompletas(filas).length : 0;
  const ocupado = trabajando !== null;

  return (
    <Modal titulo="Importar lista" icono={ListPlus} onCerrar={onCerrar} ancho={filas && !resultado ? "max-w-6xl" : "max-w-lg"}>
      <div className="px-6 py-5 space-y-4 overflow-y-auto">
        {resultado ? (
          <Resultado resultado={resultado} />
        ) : filas ? (
          <>
            <Resumen filas={filas} descartadas={descartadas} />
            <TablaImportacion
              filas={filas}
              onAlternar={(id) => setFilas((actuales) => alternarFila(actuales, id))}
              onCambiar={(id, campo, valor) => setFilas((actuales) => cambiarCampo(actuales, id, campo, valor))}
              deshabilitada={ocupado}
            />
            {incompletas > 0 && (
              <Aviso tono="alerta">Completá marca, modelo y un año válido en {plural(incompletas, "fila tildada", "filas tildadas")}.</Aviso>
            )}
            <p className="text-xs text-muted-foreground">
              Al crear, estos archivos quedan registrados y la misma lista no se puede volver a importar. Lo que dejes sin
              tildar, cargalo a mano.
            </p>
          </>
        ) : (
          <ElegirArchivos
            archivos={archivos}
            onAgregar={agregar}
            onQuitar={(indice) => setArchivos((previos) => previos.filter((_, i) => i !== indice))}
            deshabilitado={ocupado}
          />
        )}
        <Aviso>{error}</Aviso>
      </div>

      <ModalPie>
        {resultado ? (
          <Boton variante="primario" onClick={onCerrar}>Listo</Boton>
        ) : filas ? (
          <>
            <Boton variante="fantasma" onClick={() => setFilas(null)} disabled={ocupado}>Elegir otros archivos</Boton>
            <Boton variante="primario" onClick={importar} cargando={trabajando === "importando"} disabled={!elegidas || incompletas > 0}>
              Crear {plural(elegidas, "vehículo", "vehículos")}
            </Boton>
          </>
        ) : (
          <>
            <Boton variante="fantasma" onClick={onCerrar} disabled={ocupado}>Cancelar</Boton>
            <Boton variante="primario" onClick={leer} cargando={trabajando === "leyendo"} disabled={!archivos.length}>
              {trabajando !== "leyendo" && <ScanLine className="w-4 h-4" />}
              {trabajando === "leyendo" ? "Leyendo la lista…" : "Leer lista"}
            </Boton>
          </>
        )}
      </ModalPie>
    </Modal>
  );
}
