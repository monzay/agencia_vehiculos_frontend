// Componente de Aceternity UI, instalado con el CLI de shadcn desde
// https://ui.aceternity.com/registry/bento-grid.json
//
// POR QUÉ VIVE EN components/ui/ Y NO EN components/interfaz/
// El alias `ui` de components.json apunta a components/interfaz/, pero este
// registro fuerza la ruta components/ui/ en su definición. Se respeta esa ruta
// a propósito: si el archivo se mueve, la próxima instalación desde el registro
// vuelve a escribir en components/ui/ y quedan dos copias del mismo componente
// divergiendo en silencio. La regla queda entonces:
//   components/interfaz/  → componentes propios del proyecto
//   components/ui/        → código copiado tal cual de registros externos
//
// ESTILOS: se dejan los de Aceternity sin tocar. Sus variantes oscuras
// (dark:bg-black, dark:border-white/[0.2]) necesitan un ancestro con la clase
// `dark`, que en este proyecto es inerte —globals.css solo la declara como
// variante y no redefine ningún token—, así que envolver el bento en un
// contenedor `dark` activa el aspecto original sin alterar la paleta nocturna
// del resto del sitio.
//
// Ojo: `shadow-input` es una utilidad propia de la config de Aceternity y acá
// no existe; queda como clase muerta, sin efecto.
import { cn } from "@/lib/utilidades";

export const BentoGrid = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className
      )}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:shadow-none",
        className
      )}>
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div
          className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
          {title}
        </div>
        <div
          className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
          {description}
        </div>
      </div>
    </div>
  );
};
