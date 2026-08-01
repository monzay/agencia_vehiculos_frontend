"use client";
import { useState, useMemo, useEffect } from "react";
import { Boton } from "@/components/interfaz/boton";
import { EncabezadoSeccion } from "@/components/inicio/encabezado-seccion";
import { TarjetaVehiculo } from "@/components/inicio/tarjeta-vehiculo";
import { filtrarVehiculos, obtenerMarcasFiltradas } from "@/lib/vehiculos";
import { obtenerVehiculos } from "@/lib/api";
import { Car, Bike } from "lucide-react";

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "auto",  label: "Autos",  icon: Car },
  { value: "moto",  label: "Motos",  icon: Bike },
];

const CONDICIONES = [
  { value: "todos",  label: "Todos" },
  { value: "0km",    label: "0 km" },
  { value: "usado",  label: "Usados" },
];

// Rótulo de filtro: mismo gesto que el de las secciones de la portada —mono
// chico precedido por el filete rojo—.
function RotuloFiltro({ children }) {
  return (
    <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
      <span className="w-5 h-px bg-brand" />
      {children}
    </span>
  );
}

function PildoraTipo({ value, label, icon: Icon, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300 cursor-pointer
        ${activo
          ? "bg-brand border-brand text-white"
          : "bg-transparent border-foreground/20 text-foreground hover:border-foreground/50"
        }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

function PildoraCondicion({ value, label, activo, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer
        ${activo
          ? "bg-foreground border-foreground text-background"
          : "bg-transparent border-foreground/20 text-muted-foreground hover:border-foreground/50 hover:text-foreground"
        }
        ${disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
    >
      {label}
    </button>
  );
}

function PildoraMarca({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer
        ${activo
          ? "bg-foreground border-foreground text-background"
          : "bg-transparent border-foreground/20 text-muted-foreground hover:border-foreground/50 hover:text-foreground"
        }`}
    >
      {label}
    </button>
  );
}

function ContenidoCatalogo() {
  const [tipo, setTipo]       = useState("todos");
  const [condicion, setCondicion] = useState("todos");
  const [marca, setMarca]     = useState("todas");

  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerVehiculos()
      .then((data) => { if (activo) setVehiculos(data); })
      .catch((e) => { if (activo) setError(e.message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  const handleTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setCondicion("todos");
    setMarca("todas");
  };

  const handleCondicion = (nuevaCondicion) => {
    setCondicion(nuevaCondicion);
    setMarca("todas");
  };

  const vehiculosFiltrados = useMemo(
    () => filtrarVehiculos(vehiculos, { tipo, condicion, marca }),
    [vehiculos, tipo, condicion, marca]
  );

  const condicionesDisponibles = useMemo(() => {
    const conTodos = filtrarVehiculos(vehiculos, { tipo, condicion: "todos" });
    return {
      "0km":   conTodos.some((v) => v.condicion === "0km"),
      "usado": conTodos.some((v) => v.condicion === "usado"),
    };
  }, [vehiculos, tipo]);

  const marcasDisponibles = useMemo(
    () => obtenerMarcasFiltradas(vehiculos, { tipo, condicion }),
    [vehiculos, tipo, condicion]
  );

  const subtitleMap = {
    todos: "disponibles.",
    auto:  "en autos.",
    moto:  "en motos.",
  };

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <EncabezadoSeccion
          eyebrow="Catálogo completo"
          title="Todos nuestros vehículos"
          subtitle={subtitleMap[tipo]}
          description="Encontrá el vehículo perfecto para vos."
        />

        {/* ── Filtros ── */}
        <div className="mb-10 sm:mb-14 space-y-5">

          {/* Tipo */}
          <div className="flex flex-col gap-2">
            <RotuloFiltro>Tipo de vehículo</RotuloFiltro>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <PildoraTipo
                  key={t.value}
                  {...t}
                  activo={tipo === t.value}
                  onClick={() => handleTipo(t.value)}
                />
              ))}
            </div>
          </div>

          {/* Condicion — solo se muestra si hay un tipo seleccionado */}
          {tipo !== "todos" && (
            <div className="flex flex-col gap-2">
              <RotuloFiltro>Condición</RotuloFiltro>
              <div className="flex flex-wrap gap-2">
                {CONDICIONES.map((c) => (
                  <PildoraCondicion
                    key={c.value}
                    {...c}
                    activo={condicion === c.value}
                    disabled={c.value !== "todos" && !condicionesDisponibles[c.value]}
                    onClick={() => handleCondicion(c.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Marca — solo se muestra si hay más de una marca disponible */}
          {marcasDisponibles.length > 1 && (
            <div className="flex flex-col gap-2">
              <RotuloFiltro>Marca</RotuloFiltro>
              <div className="flex flex-wrap gap-2">
                <PildoraMarca
                  label="Todas"
                  activo={marca === "todas"}
                  onClick={() => setMarca("todas")}
                />
                {marcasDisponibles.map((m) => (
                  <PildoraMarca
                    key={m}
                    label={m}
                    activo={marca === m}
                    onClick={() => setMarca(m)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Separador + contador */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 h-px bg-foreground/10" />
            <p className="text-xs text-muted-foreground shrink-0">
              {vehiculosFiltrados.length}{" "}
              {vehiculosFiltrados.length === 1 ? "vehículo encontrado" : "vehículos encontrados"}
            </p>
          </div>
        </div>

        {/* Loading: mismos huecos que la grilla, como en la portada. */}
        {cargando && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[28rem] animate-pulse bg-secondary" />
            ))}
          </div>
        )}

        {/* Error */}
        {!cargando && error && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-base sm:text-lg mb-4">
              No se pudieron cargar los vehículos. ¿Está el servidor de la API encendido?
            </p>
            <p className="text-xs text-muted-foreground/60">{error}</p>
          </div>
        )}

        {/* Grid */}
        {!cargando && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {vehiculosFiltrados.map((vehicle, index) => (
              <TarjetaVehiculo key={vehicle.id} vehicle={vehicle} index={index} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!cargando && !error && vehiculosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-base sm:text-lg mb-4">
              No hay vehículos disponibles con esos filtros.
            </p>
            <Boton
              size="lg"
              className="rounded-full px-8 h-12 text-sm bg-brand text-white hover:bg-white hover:text-brand border-0 hover:border hover:border-brand transition-all duration-300"
              onClick={() => { setTipo("todos"); setCondicion("todos"); setMarca("todas"); }}
            >
              Ver todos los vehículos
            </Boton>
          </div>
        )}

        {/* Back to home */}
        <div className="mt-12 sm:mt-16 text-center">
          <Boton
            variant="outline"
            className="rounded-full px-6 sm:px-8 h-10 sm:h-11 text-sm border-foreground/20 hover:bg-foreground/5"
            asChild
          >
            <a href="/">Volver al inicio</a>
          </Boton>
        </div>
      </div>
    </section>
  );
}

export { ContenidoCatalogo };
