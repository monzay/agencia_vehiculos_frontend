"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Overlay de modal portado a <body>. Centra el contenido respecto a la PANTALLA
// y no respecto al contenedor del panel (que anima con transform y podría
// descentrar un `position: fixed`). `panel-dark` reaplica los tokens de color,
// porque al portar salimos del contenedor que los define.
//
// Uso: reemplaza el <div className="fixed inset-0 ..."> externo de un modal y
// dejá el contenido (la tarjeta bg-card) como children.
export function Overlay({ children }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) return null;

  return createPortal(
    <div className="panel-dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-auto text-foreground">
      {children}
    </div>,
    document.body
  );
}
