"use client";
import { usarEnVista } from "@/hooks/usar-en-vista";

function EncabezadoSeccion({ eyebrow, title, subtitle, description, align = "left" }) {
  const { ref, estaVisible } = usarEnVista();
  const centrado = align === "center";

  return (
    <div ref={ref} className={`mb-12 lg:mb-16 ${centrado ? "text-center" : ""}`}>
      <span
        className={`inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.22em] uppercase text-muted-foreground mb-5 ${
          centrado ? "justify-center" : ""
        }`}
      >
        <span className="w-2 h-2 bg-brand" />
        {eyebrow}
      </span>

      <div
        className={`flex flex-col gap-5 ${
          centrado ? "items-center" : "lg:flex-row lg:items-end lg:justify-between"
        }`}
      >
        <h2
          className={`text-3xl lg:text-5xl font-semibold uppercase tracking-tight leading-[0.95] text-foreground reveal ${
            estaVisible ? "visible" : ""
          }`}
        >
          {title}
          {subtitle && (
            <>
              {" "}
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
