import { CheckCircle2, Circle, FileText, Lock } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";
import { Aviso } from "./campos";

// Lo que falta para habilitar el contrato de consignación. El backend es quien
// arma la lista y quien la exige: acá solo se muestra.
//
// Los papeles van en su propio aviso, siempre visible arriba de la pestaña:
// son lo único que no se completa tipeando, hay que pedírselo al cliente. Los
// datos del titular y del vehículo van en la lista de abajo, solo mientras
// falte algo.

const GRUPOS_DE_DATOS = [
  { id: "titular", titulo: "Datos del titular" },
  { id: "vehiculo", titulo: "Datos del vehículo" },
];

function Item({ item }) {
  return (
    <div className="grid grid-cols-[1rem_1fr] gap-x-2 py-1 border-t border-border">
      {item.cumplido ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
      )}
      <div>
        <p className={cn("text-sm", item.cumplido ? "text-muted-foreground" : "text-foreground")}>{item.label}</p>
        {!item.cumplido && <p className="text-xs text-muted-foreground">{item.donde}</p>}
      </div>
    </div>
  );
}

export function PapelesObligatorios({ requisitos }) {
  const papeles = requisitos.items.filter((i) => i.grupo === "papeles");
  const completos = papeles.every((p) => p.cumplido);

  return (
    <Aviso tono={completos ? "info" : "alerta"}>
      <p className="inline-flex items-center gap-1.5 font-medium">
        <FileText className="w-3.5 h-3.5" />
        Papeles obligatorios para completar e imprimir el contrato
      </p>
      <p className="text-xs mt-1 mb-2 opacity-80">Tienen que estar cargados en Papeles como Copia u Original.</p>
      <ul className="space-y-1">
        {papeles.map((p) => (
          <li key={p.clave} className="inline-flex items-center gap-1.5 w-full text-sm">
            {p.cumplido ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
            <span className={p.cumplido ? "text-muted-foreground" : "text-foreground"}>{p.label}</span>
            <span className="text-xs text-muted-foreground">{p.cumplido ? "· recibido" : "· falta"}</span>
          </li>
        ))}
      </ul>
    </Aviso>
  );
}

export function RequisitosContrato({ requisitos }) {
  const pendientes = requisitos.items.filter((i) => !i.cumplido).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground inline-flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        Para habilitar el contrato {pendientes === 1 ? "falta 1 requisito" : `faltan ${pendientes} requisitos`}. Son los datos que
        imprime el contrato: ninguno puede quedar en blanco.
      </p>

      {GRUPOS_DE_DATOS.map(({ id, titulo }) => {
        const items = requisitos.items.filter((i) => i.grupo === id);
        if (!items.length) return null;
        return (
          <div key={id}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{titulo}</p>
            {items.map((i) => (
              <Item key={i.clave} item={i} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
