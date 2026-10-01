import { CheckCircle2, Circle, Lock } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

// Lo que falta para habilitar el contrato de consignación. El backend es quien
// arma la lista y quien la exige: acá solo se muestra.

const GRUPOS = [
  { id: "papeles", titulo: "Papeles recibidos (copia u original)" },
  { id: "titular", titulo: "Datos del titular" },
  { id: "vehiculo", titulo: "Datos del vehículo" },
];

export function RequisitosContrato({ requisitos }) {
  const pendientes = requisitos.items.filter((i) => !i.cumplido).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground inline-flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        Para habilitar el contrato {pendientes === 1 ? "falta 1 requisito" : `faltan ${pendientes} requisitos`}. Son los datos que
        imprime el contrato: ninguno puede quedar en blanco.
      </p>

      {GRUPOS.map(({ id, titulo }) => {
        const items = requisitos.items.filter((i) => i.grupo === id);
        if (!items.length) return null;
        return (
          <div key={id}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{titulo}</p>
            {items.map((i) => (
              <div key={i.clave} className="grid grid-cols-[1rem_1fr] gap-x-2 py-1 border-t border-border">
                {i.cumplido ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className={cn("text-sm", i.cumplido ? "text-muted-foreground" : "text-foreground")}>{i.label}</p>
                  {!i.cumplido && <p className="text-xs text-muted-foreground">{i.donde}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
