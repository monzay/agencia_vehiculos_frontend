"use client";

import { combinadorClases as cn } from "@/lib/utilidades";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FilePlus2,
  Car,
  BadgePercent,
  HandCoins,
  FileText,
  BookmarkCheck,
  Calculator,
  Images,
  UserCog,
  Settings,
  ChevronLeft,
  PanelLeft,
  X,
} from "lucide-react";

// `soloAdmin` = el ítem solo se muestra al rol admin.
// `cerrada` = la sección sale del menú por ahora; lo ya cargado sigue vigente.
const items = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "consultas", label: "Consultas", icon: MessageSquare },
  // Único lugar donde se crea una operación (seña, consignación, compra, venta).
  { id: "tramites", label: "Trámites", icon: FilePlus2, soloAdmin: true },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "financiacion", label: "Financiación", icon: HandCoins, soloAdmin: true },
  { id: "senas", label: "Señas", icon: BookmarkCheck, soloAdmin: true },
  { id: "documentos", label: "Documentos", icon: FileText, soloAdmin: true },
  { id: "vehiculos", label: "Vehículos", icon: Car },
  { id: "contabilidad", label: "Contabilidad", icon: Calculator, soloAdmin: true },
  { id: "descuentos", label: "Descuentos/Promos", icon: BadgePercent, cerrada: true },
  { id: "asesores", label: "Asesores", icon: UserCog },
  { id: "entregas", label: "Entregas", icon: Images, soloAdmin: true },
  { id: "configuracion", label: "Configuración", icon: Settings, soloAdmin: true },
];

// `novedades` = { [id de sección]: cantidad } → badge rojo en el ítem.
export function BarraLateral({ seccion, onSeccion, colapsada, onColapsar, esAdmin, abierta = false, onCerrar, novedades = {} }) {
  const visibles = items.filter((it) => !it.cerrada && (!it.soloAdmin || esAdmin));

  // En móvil: drawer off-canvas (translate) de ancho fijo, siempre expandido.
  // En desktop (lg): siempre visible y colapsable a 72px.
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col",
        "transition-transform duration-300 ease-out -translate-x-full lg:translate-x-0 lg:transition-all",
        abierta && "translate-x-0",
        colapsada ? "lg:w-[72px]" : "lg:w-[240px]"
      )}
    >
      {/* Logo + cerrar (móvil) */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-foreground">
            <Car className="w-[18px] h-[18px] text-background" />
          </div>
          <span
            className={cn(
              "font-semibold text-[15px] text-sidebar-foreground whitespace-nowrap tracking-tight transition-all duration-300",
              colapsada && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}
          >
            SEA Panel
          </span>
        </div>
        <button
          onClick={onCerrar}
          className="lg:hidden p-1.5 -mr-1 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibles.map((item) => {
          const Icon = item.icon;
          const activo = seccion === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSeccion(item.id)}
              title={colapsada ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 group relative",
                activo
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-foreground transition-opacity duration-300",
                  activo ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0 transition-colors duration-200",
                  activo ? "text-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  colapsada && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                )}
              >
                {item.label}
              </span>
              {novedades[item.id] > 0 && (
                <>
                  {/* Contador (visible expandido / en móvil) */}
                  <span
                    className={cn(
                      "ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center shrink-0",
                      colapsada && "lg:hidden"
                    )}
                  >
                    {novedades[item.id] > 99 ? "99+" : novedades[item.id]}
                  </span>
                  {/* Punto (solo en el sidebar colapsado de desktop) */}
                  {colapsada && (
                    <span className="hidden lg:block absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Colapsar (solo desktop) */}
      <div className="p-3 border-t border-sidebar-border shrink-0 hidden lg:block">
        <button
          onClick={() => onColapsar(!colapsada)}
          title={colapsada ? "Expandir" : "Colapsar"}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors duration-200"
        >
          {colapsada ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px]" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
