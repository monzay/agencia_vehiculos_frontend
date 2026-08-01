"use client";
import { ArrowUpRight } from "lucide-react";
import { INFO_NEGOCIO, ENLACES_PIE, ENLACES_SOCIALES } from "@/lib/constantes";
import { useUbicacion } from "@/lib/negocio";

const ANIO = new Date().getFullYear();

// La dirección sale de la DB (la edita el admin en Configuración). Si no hay
// registro cargado, la línea no aparece: antes había una dirección de respaldo
// hardcodeada que podía no ser la vigente.
function SeccionPie() {
  const ubicacion = useUbicacion();
  const direccion = ubicacion?.direccion?.trim() || null;

  return (
    <footer className="relative border-t border-foreground/10">
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="py-10 sm:py-12 md:py-16 lg:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 lg:gap-8">
            <div className="col-span-1 sm:col-span-2">
              <a href="#" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                <span className="text-lg sm:text-xl lg:text-2xl font-display">{INFO_NEGOCIO.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
              </a>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4 max-w-xs">
                Tu próximo auto te espera. Aceptamos vehículos como parte de pago.
              </p>

              {direccion && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-xs">
                  {direccion}
                </p>
              )}

              <div className="flex flex-wrap gap-4 sm:gap-6">
                {ENLACES_SOCIALES.map((enlace) => (
                  <a
                    key={enlace.name}
                    href={enlace.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                  >
                    {enlace.name}
                    <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(ENLACES_PIE).map(([titulo, enlaces]) => (
              <div key={titulo}>
                <h3 className="text-xs sm:text-sm font-medium mb-4 sm:mb-6">{titulo}</h3>
                <ul className="space-y-2 sm:space-y-4">
                  {enlaces.map((enlace) => (
                    <li key={enlace.name}>
                      <a
                        href={enlace.href}
                        className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {enlace.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-4 sm:py-6 md:py-8 border-t border-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {ANIO} {INFO_NEGOCIO.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { SeccionPie };
