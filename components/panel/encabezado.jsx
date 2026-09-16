"use client";

import { RefreshCw, LogOut, Menu } from "lucide-react";
import { logout } from "@/lib/api";
import { Boton } from "./ui/boton";
import { Buscador } from "./ui/buscador";

const titulos = {
  resumen: { titulo: "Resumen", sub: "Vista general de leads y actividad" },
  consultas: { titulo: "Consultas", sub: "Mensajes que van llegando por el bot" },
  clientes: { titulo: "Clientes", sub: "Personas que consultaron por un vehículo" },
  financiacion: { titulo: "Financiación", sub: "Clientes que accedieron a un plan de cuotas" },
  ventas: { titulo: "Vender / Consignación", sub: "Consultas de venta directa y consignación" },
  consignaciones: { titulo: "Consignaciones", sub: "Vehículos que la agencia vende por cuenta del dueño" },
  documentos: { titulo: "Documentos", sub: "Consignaciones tomadas: papeles, contrato y recibos" },
  vehiculos: { titulo: "Vehículos", sub: "Catálogo y stock de la agencia" },
  descuentos: { titulo: "Descuentos / Promos", sub: "Rebajas y promociones aplicadas" },
  asesores: { titulo: "Asesores", sub: "Equipo de ventas" },
  entregas: { titulo: "Entregas", sub: "Fotos de entregas que se muestran en el home" },
  configuracion: { titulo: "Configuración", sub: "Cuenta, datos de la agencia y automatización del bot" },
};

// Secciones sin lista que filtrar: el buscador no tendría sobre qué actuar.
const SIN_BUSCADOR = ["resumen"];

export function Encabezado({ seccion, busqueda, onBusqueda, onActualizar, cargando, usuario, onAbrirMenu }) {
  const info = titulos[seccion] ?? { titulo: "Panel", sub: "" };
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-3 sm:gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onAbrirMenu}
          className="lg:hidden -ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-foreground tracking-tight leading-tight truncate">
            {info.titulo}
          </h1>
          {info.sub && (
            <p className="text-xs text-muted-foreground leading-tight truncate hidden sm:block">{info.sub}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!SIN_BUSCADOR.includes(seccion) && (
          <Buscador valor={busqueda} onCambio={onBusqueda} className="w-44 sm:w-64" />
        )}
        <Boton variante="secundario" onClick={onActualizar}>
          <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Boton>

        {usuario && (
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">{usuario.nombre}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{usuario.rol}</p>
            </div>
            <Boton variante="peligro" tamano="icono" onClick={logout} title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </Boton>
          </div>
        )}
      </div>
    </header>
  );
}
