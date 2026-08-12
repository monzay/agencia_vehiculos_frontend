"use client";

import { useMemo, useState } from "react";
import { UserPlus, Mail, Phone, Send, Loader2, Pencil, Trash2, KeyRound, ShieldCheck, ShieldOff, Lock, Link2, Check, Copy } from "lucide-react";
import { crearAsesor, actualizarAsesor, eliminarAsesor } from "@/lib/api";
import { Boton } from "../ui/boton";
import { Tabla, FILA, CELDA } from "../ui/tabla";
import { Modal, ModalPie } from "../ui/modal";
import { Campo } from "../ui/campo";
import { Insignia } from "../ui/insignia";
import { ConfirmarModal } from "../ui/confirmar-modal";

const FORM_VACIO = {
  nombre: "",
  telefono: "",
  telegramId: "",
  email: "",
  password: "",
};

const COLUMNAS = [
  { label: "Asesor" },
  { label: "Teléfono" },
  { label: "Correo" },
  { label: "Acceso" },
  { label: "Acciones", alinear: "right" },
];

// Link de captación del asesor: el que publica en sus redes para que las
// consultas que entren por ahí queden atribuidas a él.
//
// Se muestra la ruta corta —legible y dictable por teléfono— pero se copia la
// URL absoluta, que es lo que sirve pegar. El origen se resuelve recién al
// copiar porque en el servidor no hay `window`.
function LinkCaptacion({ slug }) {
  const [copiado, setCopiado] = useState(false);
  if (!slug) return null;

  const copiar = async () => {
    const url = `${window.location.origin}/a/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // La API de portapapeles falla sin permiso o fuera de contexto seguro, y
      // si la excepción sube, el botón no muestra NADA y parece roto. Respaldo
      // con un textarea, que funciona donde la API no.
      const caja = document.createElement("textarea");
      caja.value = url;
      caja.style.position = "fixed";
      caja.style.opacity = "0";
      document.body.appendChild(caja);
      caja.select();
      document.execCommand("copy");
      caja.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <div className="mt-2">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
        Link de captación
      </span>
      <div className="flex items-center gap-1.5">
        <span
          title="Este link identifica al asesor: las consultas que entren por acá son suyas"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-foreground"
        >
          <Link2 className="w-3 h-3 shrink-0 text-accent" />
          /a/{slug}
        </span>
        <Boton
          variante={copiado ? "primario" : "secundario"}
          tamano="sm"
          onClick={copiar}
          title="Copiar el link completo al portapapeles"
        >
          {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? "¡Copiado!" : "Copiar"}
        </Boton>
      </div>
    </div>
  );
}

export function SeccionAsesores({ asesores, busqueda, onRecargar }) {
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState(null); // null = alta, id = edicion
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);

  const filtrados = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    if (!q) return asesores;
    return asesores.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.telefono || "").toLowerCase().includes(q) ||
        (a.telegramId || "").toLowerCase().includes(q)
    );
  }, [asesores, busqueda]);

  const editando = editId != null;

  function abrirAlta() {
    setEditId(null);
    setForm(FORM_VACIO);
    setError(null);
    setAbierto(true);
  }

  function abrirEdicion(a) {
    setEditId(a.id);
    setForm({
      nombre: a.nombre || "",
      telefono: a.telefono || "",
      telegramId: a.telegramId || "",
      email: a.email || "",
      password: "", // vacío = no cambia la contraseña
    });
    setError(null);
    setAbierto(true);
  }

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setError("El email no es válido.");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        await actualizarAsesor(editId, form);
      } else {
        await crearAsesor(form);
      }
      setAbierto(false);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo guardar el asesor.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(asesor) {
    setBorrandoId(asesor.id);
    setError(null);
    try {
      await eliminarAsesor(asesor.id);
      setABorrar(null);
      onRecargar?.();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el asesor.");
    } finally {
      setBorrandoId(null);
    }
  }

  // Insignia de acceso y botones de acción: compartidos por tabla (desktop) y tarjetas (móvil).
  const insigniaAcceso = (a) =>
    a.tieneCuenta ? (
      <Insignia variante={a.cuentaActiva ? "exito" : "neutral"}>
        <ShieldCheck className="w-3 h-3" /> {a.cuentaActiva ? "Con acceso" : "Acceso inactivo"}
      </Insignia>
    ) : (
      <Insignia variante="neutral">
        <ShieldOff className="w-3 h-3" /> Sin acceso
      </Insignia>
    );

  const accionesAsesor = (a) =>
    a.esAdmin ? (
      <span
        title="La cuenta del administrador no se puede editar ni eliminar"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground"
      >
        <Lock className="w-3.5 h-3.5" />
      </span>
    ) : (
      <div className="flex items-center gap-1.5">
        <Boton variante="secundario" tamano="icono" onClick={() => abrirEdicion(a)} title="Editar">
          <Pencil className="w-3.5 h-3.5" />
        </Boton>
        <Boton variante="peligro" tamano="icono" onClick={() => setABorrar(a)} disabled={borrandoId === a.id} title="Eliminar">
          {borrandoId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Boton>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {asesores.length} {asesores.length === 1 ? "asesor" : "asesores"} en total
        </p>
        <Boton variante="primario" onClick={abrirAlta}>
          <UserPlus className="w-4 h-4" /> Nuevo asesor
        </Boton>
      </div>

      {error && !abierto && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <Tabla columnas={COLUMNAS} vacio={filtrados.length === 0} mensajeVacio="No hay asesores que coincidan.">
          {filtrados.map((a) => (
            <tr key={a.id} className={FILA}>
              <td className={CELDA}>
                <p className="font-medium text-foreground">{a.nombre}</p>
                {a.telegramId && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Send className="w-3 h-3" /> {a.telegramId}
                  </p>
                )}
                <LinkCaptacion slug={a.slug} />
              </td>
              <td className={`${CELDA} text-muted-foreground`}>
                {a.telefono ? (
                  <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {a.telefono}</span>
                ) : "—"}
              </td>
              <td className={`${CELDA} text-muted-foreground`}>
                {a.email ? (
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {a.email}</span>
                ) : "—"}
              </td>
              <td className={CELDA}>{insigniaAcceso(a)}</td>
              <td className={CELDA}>
                <div className="flex items-center justify-end gap-1.5">{accionesAsesor(a)}</div>
              </td>
            </tr>
          ))}
        </Tabla>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtrados.length === 0 ? (
          <p className="text-center py-14 text-sm text-muted-foreground rounded-xl border border-border bg-card">No hay asesores que coincidan.</p>
        ) : (
          filtrados.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{a.nombre}</p>
                  {a.telegramId && (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Send className="w-3 h-3" /> {a.telegramId}</p>
                  )}
                  <LinkCaptacion slug={a.slug} />
                </div>
                {insigniaAcceso(a)}
              </div>
              <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                {a.telefono && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {a.telefono}</span>}
                {a.email && <span className="inline-flex items-center gap-1.5 break-all"><Mail className="w-3.5 h-3.5 shrink-0" /> {a.email}</span>}
              </div>
              <div className="flex justify-end mt-2">{accionesAsesor(a)}</div>
            </div>
          ))
        )}
      </div>

      {/* Modal de alta / edicion */}
      {abierto && (
        <Modal
          titulo={editando ? "Editar asesor" : "Nuevo asesor"}
          icono={editando ? Pencil : UserPlus}
          onCerrar={() => setAbierto(false)}
          ancho="max-w-md"
        >
          <form onSubmit={enviar} className="px-6 py-5 space-y-4 overflow-auto">
            <Campo label="Nombre *" valor={form.nombre} onCambio={(v) => cambiar("nombre", v)} placeholder="Ej: Juan Pérez" autoFocus />
            <Campo label="Teléfono / WhatsApp" valor={form.telefono} onCambio={(v) => cambiar("telefono", v)} placeholder="3811234567" />

            {/* Acceso al panel: email (usuario) + contraseña */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-3">
              <p className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Acceso al panel
              </p>
              <Campo
                label="Email (usuario para ingresar)"
                tipo="email"
                valor={form.email}
                onCambio={(v) => cambiar("email", v)}
                placeholder="asesor@agencia.com"
              />
              <Campo
                label={editando ? "Nueva contraseña" : "Contraseña"}
                tipo="password"
                valor={form.password}
                onCambio={(v) => cambiar("password", v)}
                placeholder={editando ? "Dejar vacío para no cambiarla" : "Mínimo 6 caracteres"}
              />
              <p className="text-[11px] text-muted-foreground">
                {editando
                  ? "Escribí una nueva contraseña solo si querés cambiarla. Si el asesor aún no tiene acceso, se le crea al asignarle una."
                  : "Completá email + contraseña para darle acceso al panel. Si lo dejás vacío, el asesor queda sin acceso."}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <ModalPie className="px-0 pb-0 border-t-0">
              <Boton variante="fantasma" onClick={() => setAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" variante="primario" cargando={guardando}>
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear asesor"}
              </Boton>
            </ModalPie>
          </form>
        </Modal>
      )}

      <ConfirmarModal
        abierto={!!aBorrar}
        mensaje={`¿Seguro querés eliminar al asesor "${aBorrar?.nombre}"? Esta acción no se puede deshacer.`}
        cargando={borrandoId === aBorrar?.id}
        onConfirmar={() => borrar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
    </div>
  );
}
