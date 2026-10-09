"use client";

import { useEffect, useState } from "react";
import { obtenerVehiculosAdmin } from "@/lib/api";

// Los autos que la agencia puede vender en un trámite: los suyos (no en
// consignación), a la venta y sin la seña de otro cliente. La seña de este
// mismo trámite (`ingresoId`) no los saca. El backend vuelve a validarlo.
export function usarStockPropio(activo, ingresoId = null) {
  const [stock, setStock] = useState([]);
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    obtenerVehiculosAdmin("no")
      .then((autos) => vigente && setStock((autos ?? []).filter((a) => !a.consignacion && (!a.sena || a.sena.ingresoId === ingresoId))))
      .catch(() => vigente && setStock([]));
    return () => {
      vigente = false;
    };
  }, [activo, ingresoId]);
  return stock;
}
