"use client";

import { Texto, Selector } from "./campos";
import { BuscadorPersona } from "./buscador-persona";
import { PROVINCIAS } from "./provincias";
import { VINCULOS } from "./vinculos";

// Datos del titular de la consignación. Antes de cargar a alguien nuevo se lo
// busca entre los clientes que ya están en la base (ver BuscadorPersona).

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
  bancoCbu: "",
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
        bancoCbu: p.bancoCbu ?? "",
        contactoAltTelefono: p.contactoAlternativo?.telefono ?? "",
        contactoAltVinculo: p.contactoAlternativo?.vinculo ?? "",
      }
    : { ...PERSONA_VACIA };

const OPCIONES_PROVINCIA = PROVINCIAS.map((p) => ({ valor: p, label: p }));

export function PersonaFormulario({ persona, onCambio }) {
  const set = (campo) => (valor) => onCambio({ ...persona, [campo]: valor });

  return (
    <div className="space-y-3">
      <BuscadorPersona onElegir={(encontrada) => onCambio(aPersona(encontrada))} />

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
        {(persona.cbu.trim() || persona.aliasCbu.trim()) && (
          <Texto
            label="Banco o billetera"
            valor={persona.bancoCbu}
            onCambio={set("bancoCbu")}
            placeholder="Banco Nación, Mercado Pago…"
            ayuda="De qué banco o medio de pago es la cuenta."
            className="sm:col-span-2"
          />
        )}
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
