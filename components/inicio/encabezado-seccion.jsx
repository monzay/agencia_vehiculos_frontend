"use client";
import { usarEnVista } from "@/hooks/usar-en-vista";

// Encabezado del sitio público: rótulo mono + titular serif de dos líneas, con
// la bajada alineada al pie del titular. Lo comparten la portada y el catálogo.
function EncabezadoSeccion({ eyebrow, title, subtitle, description, align = "left" }) {
  const { ref, estaVisible } = usarEnVista();
  const centrado = align === "center";

  return (
    <div ref={ref} className={`mb-16 lg:mb-24 ${centrado ? "text-center" : ""}`}>
      <span
        className={`inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6 ${
          centrado ? "justify-center" : ""
        }`}
      >
        <span className="w-5 h-px bg-brand" />
        {eyebrow}
        {centrado && <span className="w-5 h-px bg-brand" />}
      </span>

      <div
        className={`flex flex-col gap-6 ${
          centrado ? "" : "lg:flex-row lg:items-end lg:justify-between"
        }`}
      >
        <h2
          className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
            estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {title}
          {subtitle && (
            <>
              <br />
              <span className="text-brand">{subtitle}</span>
            </>
          )}
        </h2>

        {description && (
          <p className={`text-muted-foreground max-w-md ${centrado ? "mx-auto" : "lg:text-right"}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export { EncabezadoSeccion };
