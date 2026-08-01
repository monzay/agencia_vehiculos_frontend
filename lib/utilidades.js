import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function combinadorClases(...inputs) {
  return twMerge(clsx(inputs));
}
export {
  combinadorClases,
  // Alias `cn`: los componentes que vienen de registros externos (shadcn,
  // Aceternity) importan `{ cn }` por convención. Exportarlo acá evita tener
  // que editar cada archivo instalado y que la próxima actualización lo pise.
  combinadorClases as cn
};
