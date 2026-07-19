"use client";
import { ArrowUpRight } from "lucide-react";
import { INFO_NEGOCIO, ENLACES_PIE, ENLACES_SOCIALES } from "@/lib/constantes";

function SeccionPie() {
  return (
    <footer className="relative border-t border-foreground/12 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-14 lg:py-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 lg:gap-8">
          {/* Marca */}
          <div className="col-span-1 sm:col-span-2">
            <a href="#" className="inline-flex items-center gap-2 mb-5">
              <span className="text-xl lg:text-2xl font-semibold uppercase tracking-tight">{INFO_NEGOCIO.name}</span>
              <span className="w-1.5 h-1.5 bg-brand shrink-0" aria-hidden="true" />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-4">
              Tu próximo auto te espera. Tomamos tu usado como parte de pago.
            </p>
            <p className="font-mono text-xs text-muted-foreground/70 max-w-xs mb-6 leading-relaxed">
              {INFO_NEGOCIO.fullAddress}
            </p>
            <div className="flex flex-wrap gap-5">
              {ENLACES_SOCIALES.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-mono text-xs tracking-[0.12em] uppercase text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1 group"
                >
                  {link.name}
                  <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de enlaces */}
          {Object.entries(ENLACES_PIE).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-5">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm text-foreground/80 hover:text-brand transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-foreground/12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground/70">
            © 2026 {INFO_NEGOCIO.name}
          </p>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground/70">
            San Salvador de Jujuy · AR
          </p>
        </div>
      </div>
    </footer>
  );
}

export { SeccionPie };
