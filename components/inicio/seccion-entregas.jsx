"use client";
import { useEffect, useState } from "react";
import { ImageOff, X } from "lucide-react";
import { obtenerEntregas } from "@/lib/api";

// Galería de entregas reales. Las fotos las sube el admin desde el panel
// (Configuración → Entregas), así que la sección se actualiza sola.
//
// Cuando todavía no hay ninguna, la sección NO se oculta: se muestra la
// retícula con los huecos rotulados, para que se vea cómo va a quedar y dónde
// entra cada foto. Ocultarla dejaba a la portada sin una de sus secciones y
// sin pista de que existía.
//
// Las fotos vienen de Vercel Blob (dominio externo), por eso <img> y no
// next/image.

// mobile: 1 col apilado — sm: bento 2 cols — lg: bento 4 cols
// fila 1: [2] [1] [1]  — fila 2: [1] [2] [1]
const CELDAS = [
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-1 lg:col-span-1",
  "sm:col-span-1 lg:col-span-1",
  "sm:col-span-1 lg:col-span-1",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-1 lg:col-span-1",
];

const MARCO = "relative w-full aspect-video lg:aspect-auto lg:h-full overflow-hidden rounded-xl";

// Hueco rotulado: es un marco de hormigón con el filo rojo arriba, para que se
// distinga de una foto que todavía está cargando.
function HuecoDeFoto() {
  return (
    <div className={`${MARCO} bg-secondary`}>
      <span className="absolute top-0 left-0 h-px w-10 bg-brand" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="w-5 h-5" />
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase">Falta la foto</span>
      </div>
    </div>
  );
}

function SeccionEntregas() {
  const [entregas, setEntregas] = useState(null); // null = cargando
  const [ampliada, setAmpliada] = useState(null);

  useEffect(() => {
    obtenerEntregas()
      .then((data) => setEntregas(Array.isArray(data) ? data.slice(0, CELDAS.length) : []))
      .catch(() => setEntregas([]));
  }, []);

  useEffect(() => {
    if (!ampliada) return;
    const alTeclear = (e) => {
      if (e.key === "Escape") setAmpliada(null);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [ampliada]);

  const vacia = entregas !== null && entregas.length === 0;

  return (
    <section id="entregas" className="relative py-14 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-end justify-between mb-8 sm:mb-12 lg:mb-14">
          <div>
            <p className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground uppercase mb-2 sm:mb-3">
              Momento de entrega
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground leading-[1.1]">
              Cada llave,
              <br />
              <span className="text-muted-foreground">una historia.</span>
            </h2>
          </div>
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase self-start mt-1">
            {new Date().getFullYear()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 lg:auto-rows-[240px]">
          {entregas === null &&
            CELDAS.map((celda, i) => (
              <div key={i} className={celda}>
                <div className={`${MARCO} animate-pulse bg-secondary`} />
              </div>
            ))}

          {/* Vacía: la retícula completa rotulada, sin foto de muestra. */}
          {vacia &&
            CELDAS.map((celda, i) => (
              <div key={i} className={celda}>
                <HuecoDeFoto />
              </div>
            ))}

          {entregas?.map((entrega, i) => (
            <figure
              key={entrega.id}
              className={`m-0 group overflow-hidden cursor-pointer rounded-xl ${CELDAS[i]}`}
              onClick={() => setAmpliada(entrega)}
            >
              <div className={MARCO}>
                <img
                  src={entrega.url}
                  alt="Entrega de un vehículo en el showroom de Ortega Automotores"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </figure>
          ))}
        </div>

        <div className="mt-6 sm:mt-10 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            {vacia ? "Las fotos las sube la agencia" : "Fotos reales de clientes"}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {vacia ? "Sin fotos todavía" : "Entregas activas"}
            </span>
          </div>
        </div>
      </div>

      {ampliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-lg"
          onClick={() => setAmpliada(null)}
        >
          <div className="relative max-w-4xl w-full mx-4 sm:mx-8" onClick={(e) => e.stopPropagation()}>
            <img
              src={ampliada.url}
              alt="Entrega de un vehículo en el showroom de Ortega Automotores"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setAmpliada(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-colors duration-200 rounded-full"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export { SeccionEntregas };
