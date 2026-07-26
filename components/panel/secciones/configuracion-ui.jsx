import { CardHeader, CardTitle, CardDescription } from "@/components/interfaz/tarjeta";

// Piezas compartidas por las tarjetas de Configuración, para que todas respeten
// el mismo estilo minimalista del dashboard (encabezados de texto, sin adornos).

// Bloque de grupo: título + bajada al estilo de las secciones del panel
// (mismo tratamiento que los `h3` del Resumen), con las tarjetas debajo.
export function GrupoConfig({ titulo, descripcion, children }) {
  return (
    <section className="space-y-4">
      <div className="px-1">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{titulo}</h3>
        {descripcion && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

// Cabecera de tarjeta liviana: ícono sutil en línea con el título (sin el chip
// relleno), descripción debajo y un lugar opcional para una acción a la derecha.
export function CabeceraTarjeta({ icon: Icon, titulo, descripcion, accion, iconClassName }) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${iconClassName || "text-muted-foreground"}`} />}
          <CardTitle className="text-base truncate">{titulo}</CardTitle>
        </div>
        {accion}
      </div>
      {descripcion && <CardDescription className="leading-relaxed">{descripcion}</CardDescription>}
    </CardHeader>
  );
}
