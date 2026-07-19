"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Lista paginada con self-fetch. `cargarPagina({offset, limite})` debe devolver
// { items, hayMas, total }. Cuando cambian `deps` (filtro/búsqueda/refresco) se
// recarga la primera página (con debounce, útil para la búsqueda por tecla).
export function usarListaPaginada(cargarPagina, deps = [], { limite = 10, debounce = 300 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);

  // Ref para no re-crear efectos cuando cambia la función inline en cada render.
  const cargarRef = useRef(cargarPagina);
  cargarRef.current = cargarPagina;

  const cargarPrimera = useCallback(async () => {
    setCargandoInicial(true);
    setError(null);
    try {
      const res = await cargarRef.current({ offset: 0, limite });
      setItems(res?.items ?? []);
      setHayMas(Boolean(res?.hayMas));
      setTotal(res?.total ?? 0);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setCargandoInicial(false);
    }
  }, [limite]);

  useEffect(() => {
    const t = setTimeout(cargarPrimera, debounce);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const cargarMas = useCallback(async () => {
    setCargandoMas(true);
    setError(null);
    try {
      const res = await cargarRef.current({ offset: items.length, limite });
      setItems((prev) => [...prev, ...(res?.items ?? [])]);
      setHayMas(Boolean(res?.hayMas));
      setTotal(res?.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoMas(false);
    }
  }, [items.length, limite]);

  return { items, total, hayMas, cargandoInicial, cargandoMas, error, cargarMas, recargar: cargarPrimera };
}
