"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { combinadorClases as cn } from "@/lib/utilidades";

// Input de contraseña con un ojo para verla u ocultarla. Arranca oculta y alternar no borra lo escrito.
export function CampoContrasena({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  const accion = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn(className, "pr-10")} />
      <button
        type="button"
        onClick={() => setVisible((actual) => !actual)}
        aria-label={accion}
        title={accion}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
