"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

// Panel que entra desde la derecha, por encima de todo: z-[60] le gana a la barra
// lateral y a los modales (z-50). Va portado a <body>, por eso reaplica `panel-dark`.
// Radix resuelve Esc, click afuera, foco atrapado y el bloqueo del scroll de fondo.
export function PanelLateral({ abierto, onCerrar, titulo, descripcion, cabecera, children }) {
  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={(sigueAbierto) => { if (!sigueAbierto) onCerrar(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="panel-dark fixed inset-y-0 right-0 z-[60] flex w-full max-w-2xl flex-col border-l border-border bg-card text-foreground shadow-[var(--shadow-lg)] duration-300 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:animate-none">
          <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-base font-semibold tracking-tight text-foreground">
                  {titulo}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                  {descripcion}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            {cabecera}
          </header>
          <div className="min-h-0 flex-1 p-4 sm:p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
