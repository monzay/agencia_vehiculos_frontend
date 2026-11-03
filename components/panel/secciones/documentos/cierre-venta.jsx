"use client";

import { useState } from "react";
import { Banknote, KeyRound, FileCheck2, Check } from "lucide-react";
import { marcarHito, desmarcarHito } from "@/lib/api";
import { subirImagen } from "@/lib/subir-imagen";
import { Modal, ModalPie } from "../../ui/modal";
import { Boton } from "../../ui/boton";
import { ConfirmarModal } from "../../ui/confirmar-modal";
import { Texto, Aviso } from "./campos";
import { fechaSinHora, fechaDeMomento } from "./formato";

// Lo que pasa después de vender: se cobró, se entregó, se transfirió. Se marca con la
// fecha real, en cualquier orden. Qué pasos corresponden lo decide el backend.

const HITOS = {
  cobrado: { titulo: "Cobrado", marcar: "Marcar cobrado", icono: Banknote },
  entregado: { titulo: "Entregado", marcar: "Marcar entregado", icono: KeyRound },
  transferido: { titulo: "Transferido", marcar: "Marcar transferido", icono: FileCheck2 },
};

const hoy = () => new Date().toLocaleDateString("en-CA");

function MarcarHitoModal({ ingresoId, tipo, onCerrar, onGuardado }) {
  const [fecha, setFecha] = useState(hoy);
  const [foto, setFoto] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { marcar, icono } = HITOS[tipo];

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const fotoUrl = foto ? await subirImagen(foto) : undefined;
      await marcarHito(ingresoId, tipo, { fecha, fotoUrl });
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={marcar} icono={icono} onCerrar={onCerrar}>
      <div className="px-6 py-5 space-y-4 overflow-y-auto">
        {error && <Aviso>{error}</Aviso>}
        <Texto label="¿Qué día?" tipo="date" valor={fecha} onCambio={setFecha} max={hoy()} />
        {tipo === "entregado" && (
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Foto de la entrega (opcional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
            <span className="block text-xs text-muted-foreground">Se publica en la galería de entregas de la web, donde cualquiera la puede ver.</span>
          </label>
        )}
      </div>
      <ModalPie>
        <Boton variante="fantasma" onClick={onCerrar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={guardar} cargando={guardando}>
          {marcar}
        </Boton>
      </ModalPie>
    </Modal>
  );
}

// Es la fecha impresa en el boleto: si se pasó, ya se puede hacer la denuncia de venta.
function AvisoTransferencia({ contrato, hitos }) {
  const vence = contrato?.transferencia?.vence;
  if (!vence || hitos.transferido) return null;
  const vencida = new Date(vence) < new Date();
  return (
    <Aviso tono={vencida ? "alerta" : "info"}>
      {vencida ? `El plazo para transferir venció el ${fechaDeMomento(vence)}.` : `Transferir hasta el ${fechaDeMomento(vence)}.`}
    </Aviso>
  );
}

// `hitoAMarcar` lo elige también la tira de Seguimiento, por eso vive en el legajo.
export function CierreVenta({ ingreso, hitoAMarcar, onElegirHito, onCambio }) {
  const [aDesmarcar, setADesmarcar] = useState(null);
  const [desmarcando, setDesmarcando] = useState(false);
  const [error, setError] = useState(null);

  if (ingreso.estado !== "vendido") return null;
  const pasos = (ingreso.seguimiento?.pasos ?? []).filter((p) => HITOS[p.id]);
  if (!pasos.length) return null;

  async function desmarcar() {
    setDesmarcando(true);
    setError(null);
    try {
      await desmarcarHito(ingreso.id, aDesmarcar);
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setDesmarcando(false);
      setADesmarcar(null);
    }
  }

  return (
    <section aria-label="Cierre de la venta" className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Después de la venta</h3>
      {error && <Aviso>{error}</Aviso>}
      <AvisoTransferencia contrato={ingreso.contrato} hitos={ingreso.hitos} />

      <ul className="divide-y divide-border">
        {pasos.map(({ id }) => {
          const { titulo, marcar, icono: Icono } = HITOS[id];
          const fecha = ingreso.hitos[id];
          return (
            <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="inline-flex items-center gap-2 text-sm text-foreground">
                <Icono className="w-4 h-4 text-muted-foreground" />
                {titulo}
                {fecha && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="w-3 h-3" /> {fechaSinHora(fecha)}
                  </span>
                )}
              </span>
              {fecha ? (
                <Boton variante="fantasma" tamano="sm" onClick={() => setADesmarcar(id)}>
                  Desmarcar
                </Boton>
              ) : (
                <Boton variante="secundario" tamano="sm" onClick={() => onElegirHito(id)}>
                  {marcar}
                </Boton>
              )}
            </li>
          );
        })}
      </ul>

      {ingreso.fotoEntrega && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ingreso.fotoEntrega} alt="Foto de la entrega" className="h-24 w-auto rounded-lg border border-border object-cover" />
      )}

      {hitoAMarcar && (
        <MarcarHitoModal ingresoId={ingreso.id} tipo={hitoAMarcar} onCerrar={() => onElegirHito(null)} onGuardado={onCambio} />
      )}
      <ConfirmarModal
        abierto={Boolean(aDesmarcar)}
        titulo={`¿Desmarcar ${HITOS[aDesmarcar]?.titulo.toLowerCase()}?`}
        mensaje={aDesmarcar === "entregado" ? "También se quita la foto de la galería de la web." : "Se borra la fecha que se había cargado."}
        textoConfirmar="Desmarcar"
        textoCancelar="Volver"
        cargando={desmarcando}
        onConfirmar={desmarcar}
        onCancelar={() => setADesmarcar(null)}
      />
    </section>
  );
}
