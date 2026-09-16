import { Check, AlertTriangle, Clock, Plus } from "lucide-react";

// Estado visible de un papel, de peor a mejor. Lo comparten la ficha y la vista
// del papel, para que los dos lo digan igual.
export function estadoDe(documento) {
  if (!documento) return { id: "falta", label: "Falta", clase: "text-muted-foreground border-border", Icono: Plus };
  if (documento.diferencias.length) {
    return { id: "difiere", label: "No coincide", clase: "text-amber-500 border-amber-500/40", Icono: AlertTriangle };
  }
  if (documento.vencido) return { id: "vencido", label: "Vencido", clase: "text-destructive border-destructive/40", Icono: Clock };
  return { id: "ok", label: "Cargado", clase: "text-emerald-500 border-emerald-500/40", Icono: Check };
}
