"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Boton } from "@/components/interfaz/boton";
import { EncabezadoSeccion } from "@/components/inicio/encabezado-seccion";
import { TarjetaVehiculo } from "@/components/inicio/tarjeta-vehiculo";
import { obtenerVehiculos } from "@/lib/api";

// La API devuelve el stock del más nuevo al más viejo: los tres primeros son
// los últimos que entraron al showroom. Filtrar y buscar es trabajo de
// /catalogo; acá solo se muestran.
//
// Un error de red se resuelve como lista vacía —la sección lo dice— en vez de
// romper la portada.
const VISIBLES = 3;

function SeccionCatalogo() {
  const [vehiculos, setVehiculos] = useState(null); // null = cargando

  useEffect(() => {
    let vivo = true;
    obtenerVehiculos()
      .then((v) => vivo && setVehiculos(Array.isArray(v) ? v.slice(0, VISIBLES) : []))
      .catch(() => vivo && setVehiculos([]));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <section id="catalogo" className="relative py-16 sm:py-20 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <EncabezadoSeccion
          eyebrow="Catálogo"
          title="Últimos ingresos"
          subtitle="al showroom."
          description="Todo lo que ves está en el showroom. Autos y motos, 0 km y usados, con garantía."
        />

        {vehiculos === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[28rem] animate-pulse bg-secondary" />
            ))}
          </div>
        ) : vehiculos.length === 0 ? (
          <p className="max-w-md py-8 text-muted-foreground">
            El catálogo no está disponible en este momento. Escribinos y te contamos qué tenemos.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {vehiculos.map((vehiculo, i) => (
              <TarjetaVehiculo key={vehiculo.ref ?? vehiculo.id} vehicle={vehiculo} index={i} />
            ))}
          </div>
        )}

        <div className="mt-10 sm:mt-12 lg:mt-16 text-center">
          <Boton
            size="lg"
            className="rounded-full px-8 sm:px-12 h-12 sm:h-14 text-sm sm:text-base bg-brand text-white hover:bg-white hover:text-brand border-0 hover:border hover:border-brand transition-all duration-300"
            asChild
          >
            <a href="/catalogo">
              Ver todo el catálogo
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Boton>
        </div>
      </div>
    </section>
  );
}

export { SeccionCatalogo };
