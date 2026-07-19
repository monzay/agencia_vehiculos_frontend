"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { ENLACES_NAVEGACION, INFO_NEGOCIO, obtenerUrlWhatsApp } from "@/lib/constantes";

function Navegacion() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wa = obtenerUrlWhatsApp("Hola SEA Automotores! Quería hacer una consulta.");

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        scrolled ? "top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          scrolled || menuOpen
            ? "bg-background/85 backdrop-blur-xl border border-foreground/10 shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-4 sm:px-6 lg:px-8 ${
            scrolled ? "h-13" : "h-16 sm:h-20"
          }`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-tight text-base sm:text-lg lg:text-xl text-foreground">
              {INFO_NEGOCIO.name}
            </span>
            <span className="w-1.5 h-1.5 bg-brand shrink-0" aria-hidden="true" />
          </a>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {ENLACES_NAVEGACION.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-mono text-xs tracking-[0.14em] uppercase text-foreground/70 hover:text-foreground transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-brand transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* CTA desktop */}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center h-9 px-5 bg-foreground text-background font-mono text-xs tracking-[0.12em] uppercase hover:bg-brand transition-colors"
          >
            WhatsApp
          </a>

          {/* Botón menú mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Menú mobile */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full px-6 pt-24 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-6">
            {ENLACES_NAVEGACION.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-4xl font-semibold uppercase tracking-tight text-foreground transition-all duration-500 ${
                  menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: menuOpen ? `${i * 70}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-13 bg-brand text-white font-mono text-sm tracking-[0.12em] uppercase"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}

export { Navegacion };
