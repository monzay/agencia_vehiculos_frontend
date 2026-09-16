"use client";

import { useEffect, useState } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import { buscarPersonas } from "@/lib/api";
import { Texto, Selector } from "./campos";
import { PROVINCIAS } from "./provincias";
import { VINCULOS } from "./vinculos";

// Datos del titular de la consignación.
//
// Antes de cargar a alguien nuevo se busca por DNI o nombre entre los clientes
// que ya están en la base. Si esa persona escribió alguna vez por WhatsApp, su
// ficha ya existe: reusarla evita tener al mismo tipo dos veces.

export const PERSONA_VACIA = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  cuit: "",
  domicilio: "",
  localidad: "",
  provincia: "",
  cbu: "",
  aliasCbu: "",
  contactoAltTelefono: "",
  contactoAltVinculo: "",
};

export const aPersona = (p) =>
  p
    ? {
        nombre: p.nombre ?? "",
        apellido: p.apellido ?? "",
        dni: p.dni ?? "",
        telefono: p.telefono ?? "",
        email: p.email ?? "",
        cuit: p.cuit ?? "",
        domicilio: p.domicilio ?? "",
        localidad: p.localidad ?? "",
        provincia: p.provincia ?? "",
        cbu: p.cbu ?? "",
        aliasCbu: p.aliasCbu ?? "",
        contactoAltTelefono: p.contactoAlternativo?.telefono ?? "",
        contactoAltVinculo: p.contactoAlternativo?.vinculo ?? "",
      }
    : { ...PERSONA_VACIA };

const OPCIONES_PROVINCIA = PROVINCIAS.map((p) => ({ valor: p, label: p }));

export function PersonaFormulario({ persona, onCambio }) {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [reusada, setReusada] = useState(null);

  const set = (campo) => (valor) => onCambio({ ...persona, [campo]: valor });

  useEffect(() => {
    const texto = termino.trim();
    if (texto.length < 3) {
      setResultados([]);
      return;
    }
    let activo = true;
    setBuscando(true);
    const t = setTimeout(() => {
      buscarPersonas(texto)
        .then((datos) => activo && setResultados(datos ?? []))
        .catch(() => activo && setResultados([]))
        .finally(() => activo && setBuscando(false));
    }, 300);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [termino]);

  function elegir(encontrada) {
    onCambio(aPersona(encontrada));
    setReusada(encontrada);
    setTermino("");
    setResultados([]);
  }

  return (
    <div className="space-y-3">
      {/* Buscar antes de crear */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Buscar por DNI, nombre o teléfono…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all"
          />
          {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>

        {resultados.length > 0 && (
          <ul className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
            {resultados.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => elegir(r)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-foreground">
                    {[r.nombre, r.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {r.dni ? `DNI ${r.dni}` : "sin DNI"}
                    {r.telefono ? ` · ${r.telefono}` : ""} · {r.canal}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {reusada && (
          <p className="text-xs text-emerald-500 inline-flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Se está reusando la ficha que ya existía en el sistema.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Texto label="Nombre" valor={persona.nombre} onCambio={set("nombre")} placeholder="Juan" />
        <Texto label="Apellido" valor={persona.apellido} onCambio={set("apellido")} placeholder="Pérez" />
        <Texto label="DNI" valor={persona.dni} onCambio={set("dni")} placeholder="30123456" inputMode="numeric" />
        <Texto label="CUIT / CUIL" valor={persona.cuit} onCambio={set("cuit")} placeholder="20301234567" inputMode="numeric" />
        <Texto label="Teléfono" valor={persona.telefono} onCambio={set("telefono")} placeholder="3884001122" />
        <Texto label="Email" valor={persona.email} onCambio={set("email")} tipo="email" placeholder="juan@mail.com" />
        <Texto label="Domicilio" valor={persona.domicilio} onCambio={set("domicilio")} placeholder="San Martín 450" className="sm:col-span-2" />
        <Texto label="Localidad" valor={persona.localidad} onCambio={set("localidad")} />
        <Selector label="Provincia" valor={persona.provincia} onCambio={set("provincia")} opciones={OPCIONES_PROVINCIA} vacio="Sin especificar" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
        <Texto
          label="CBU"
          valor={persona.cbu}
          onCambio={set("cbu")}
          placeholder="22 dígitos"
          inputMode="numeric"
          ayuda="Acá se le transfiere cuando el auto se venda."
        />
        <Texto label="Alias" valor={persona.aliasCbu} onCambio={set("aliasCbu")} placeholder="mi.alias.banco" />
      </div>

      {/* Alguien cercano a quien llamar si el titular no atiende */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
        <Texto
          label="Teléfono alternativo"
          valor={persona.contactoAltTelefono}
          onCambio={set("contactoAltTelefono")}
          placeholder="3884001133"
          ayuda="Por si el titular no atiende."
        />
        <Selector
          label="¿De quién es?"
          valor={persona.contactoAltVinculo}
          onCambio={set("contactoAltVinculo")}
          opciones={VINCULOS}
          vacio="Elegí el vínculo"
        />
      </div>
    </div>
  );
}
