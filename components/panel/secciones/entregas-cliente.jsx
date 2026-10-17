"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { buscarClientesEntrega } from "@/lib/api";
import { CLASE_INPUT } from "../ui/campo";

const ESPERA_MS = 300;
const MIN_LETRAS = 2;

// Elige el cliente que recibió el auto de la entrega. Busca por nombre o teléfono.
export function ElegirClienteEntrega({ cliente, onElegir }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const volverAlBuscador = useRef(false);

  useEffect(() => {
    const q = texto.trim();
    setError(null);
    if (q.length < MIN_LETRAS) {
      setResultados([]);
      setBuscando(false);
      return undefined;
    }
    let vigente = true;
    setBuscando(true);
    const espera = setTimeout(() => {
      buscarClientesEntrega(q)
        .then((lista) => vigente && setResultados(lista ?? []))
        .catch((e) => vigente && (setResultados([]), setError(e.message || "No se pudo buscar.")))
        .finally(() => vigente && setBuscando(false));
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto]);

  // Al tocar "Cambiar", el foco vuelve al buscador.
  useEffect(() => {
    if (!cliente && volverAlBuscador.current) {
      volverAlBuscador.current = false;
      inputRef.current?.focus();
    }
  }, [cliente]);

  function elegir(c) {
    setTexto("");
    setResultados([]);
    onElegir(c);
  }

  if (cliente) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <UserRound className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Fotos de la entrega a</span>
        <span className="font-medium text-foreground">{cliente.nombre}</span>
        {cliente.telefono && <span className="text-muted-foreground tabular-nums">{cliente.telefono}</span>}
        <button
          type="button"
          onClick={() => ((volverAlBuscador.current = true), onElegir(null))}
          className="ml-auto inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" /> Cambiar cliente
        </button>
      </div>
    );
  }

  const q = texto.trim();
  const estado = error
    ? null
    : buscando
      ? "Buscando…"
      : q.length >= MIN_LETRAS && resultados.length === 0
        ? "No hay clientes con ese nombre o teléfono."
        : null;

  return (
    <div className="space-y-1.5">
      <label htmlFor="entrega-buscar-cliente" className="block text-xs font-medium text-muted-foreground">
        Cliente que recibió el auto
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id="entrega-buscar-cliente"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscá por nombre o teléfono"
          className={`${CLASE_INPUT} h-9 pl-8`}
          autoComplete="off"
          aria-describedby="entrega-buscar-estado"
        />
      </div>
      <p id="entrega-buscar-estado" aria-live="polite" className="text-xs text-muted-foreground min-h-4">
        {estado}
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {resultados.length > 0 && (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden" aria-label="Clientes encontrados">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => elegir(c)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/60 focus:bg-secondary/60 focus:outline-none"
              >
                <span className="text-foreground">{c.nombre}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{c.telefono}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
