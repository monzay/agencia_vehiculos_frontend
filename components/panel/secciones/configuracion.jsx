"use client";

import { useState } from "react";
import { UserCog, Lock, Scale, Users } from "lucide-react";
import { actualizarMiPerfil, actualizarConfig, actualizarAsesor } from "@/lib/api";
import { TarjetaUbicacion } from "./configuracion-ubicacion";
import { TarjetaHorarios } from "./configuracion-horarios";
import { TarjetaCredito } from "./configuracion-credito";
import { GrupoConfig, CabeceraTarjeta } from "./configuracion-ui";
import { Card, CardContent, CardFooter } from "@/components/interfaz/tarjeta";
import { Boton } from "@/components/interfaz/boton";
import { Input } from "@/components/interfaz/entrada";
import { Label } from "@/components/interfaz/etiqueta";
import { Switch } from "@/components/interfaz/interruptor";
import { Separator } from "@/components/interfaz/separador";
import { Badge } from "@/components/interfaz/insignia";
import { Alert, AlertDescription } from "@/components/interfaz/alerta";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function SeccionConfiguracion({ usuario, onUsuario, config, onConfig, ubicacion, onUbicacion, horarios, onHorarios, asesores = [], onRecargar }) {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const [guardandoReparto, setGuardandoReparto] = useState(false);
  const [guardandoAsesorId, setGuardandoAsesorId] = useState(null);
  const [errorReparto, setErrorReparto] = useState(null);

  const sinCambios = nombre.trim() === (usuario?.nombre || "") && email.trim() === (usuario?.email || "");
  const repartoActivo = config?.reparticion_equitativa !== false;
  // Se excluye la cuenta del admin: es el fallback, no entra al round-robin.
  const asesoresReparto = asesores.filter((a) => !a.esAdmin);
  const activosEnReparto = asesoresReparto.filter((a) => a.activo && a.recibeConsultas).length;

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!EMAIL_RE.test(email.trim())) return setError("El email no es válido.");
    setGuardando(true);
    try {
      const actualizado = await actualizarMiPerfil({ nombre: nombre.trim(), email: email.trim() });
      onUsuario?.(actualizado);
      setOk(true);
    } catch (err) {
      setError(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleReparto() {
    setGuardandoReparto(true);
    setErrorReparto(null);
    try {
      const nueva = await actualizarConfig({ reparticion_equitativa: !repartoActivo });
      onConfig?.(nueva);
    } catch (err) {
      setErrorReparto(err.message || "No se pudo actualizar la repartición.");
    } finally {
      setGuardandoReparto(false);
    }
  }

  async function toggleAsesor(a) {
    setGuardandoAsesorId(a.id);
    setErrorReparto(null);
    try {
      await actualizarAsesor(a.id, { recibeConsultas: !a.recibeConsultas });
      await onRecargar?.();
    } catch (err) {
      setErrorReparto(err.message || "No se pudo actualizar el asesor.");
    } finally {
      setGuardandoAsesorId(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Cuenta */}
      <GrupoConfig titulo="Cuenta" descripcion="Tus datos de acceso al panel.">
        <Card>
          <CabeceraTarjeta
            icon={UserCog}
            titulo="Mis datos"
            descripcion="Editá tu nombre y tu email de acceso."
            accion={<Badge variant="secondary" className="uppercase text-[10px] tracking-wide">{usuario?.rol}</Badge>}
          />
          <form onSubmit={enviar}>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="cfg-nombre">Nombre</Label>
                <Input id="cfg-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-email">Email (usuario para ingresar)</Label>
                <Input id="cfg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@agencia.com" />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {ok && (
                <Alert>
                  <AlertDescription>Datos actualizados.</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="justify-between gap-3 border-t pt-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">La contraseña no se edita desde acá.</span>
              </p>
              <Boton type="submit" disabled={sinCambios || guardando}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </Boton>
            </CardFooter>
          </form>
        </Card>
      </GrupoConfig>

      {/* La agencia */}
      <GrupoConfig titulo="La agencia" descripcion="Datos que el bot comparte con los clientes.">
        <TarjetaUbicacion ubicacion={ubicacion} onUbicacion={onUbicacion} />
        <TarjetaHorarios horarios={horarios} onHorarios={onHorarios} />
      </GrupoConfig>

      {/* Automatización */}
      <GrupoConfig titulo="Automatización" descripcion="Cómo el bot reparte las consultas entre asesores.">
        <Card>
          <CabeceraTarjeta
            icon={Scale}
            titulo="Repartición de consultas"
            descripcion="Controlá cómo se reparten las consultas entre asesores."
          />
          <CardContent className="space-y-6">
            {/* Toggle global */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 p-4">
              <div className="space-y-1 min-w-0">
                <Label htmlFor="cfg-reparto">Repartición equitativa</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {repartoActivo
                    ? "Activada: se muestra qué asesor atiende cada consulta."
                    : "Desactivada: se sigue asignando, pero no se muestra quién atiende."}
                </p>
              </div>
              <Switch id="cfg-reparto" checked={repartoActivo} onCheckedChange={toggleReparto} disabled={guardandoReparto} />
            </div>

            <Separator />

            {/* Asesores en la repartición */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> Asesores en la repartición
                </span>
                <Badge variant="secondary">{activosEnReparto} activos</Badge>
              </div>

              {asesoresReparto.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay asesores cargados.</p>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {asesoresReparto.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm text-foreground truncate">{a.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {!a.activo ? "Inactivo" : a.recibeConsultas ? "Recibe consultas" : "Excluido del reparto"}
                        </p>
                      </div>
                      <Switch
                        checked={a.recibeConsultas}
                        onCheckedChange={() => toggleAsesor(a)}
                        disabled={!a.activo || guardandoAsesorId === a.id}
                      />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">
                Los asesores excluidos no reciben consultas nuevas. Si ninguno participa, las consultas van al administrador.
              </p>
            </div>

            {errorReparto && (
              <Alert variant="destructive">
                <AlertDescription>{errorReparto}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </GrupoConfig>

      {/* Verificación crediticia */}
      <GrupoConfig titulo="Verificación crediticia" descripcion="Consulta a la Central de Deudores del BCRA para quien financia, con su permiso.">
        <TarjetaCredito config={config} onConfig={onConfig} />
      </GrupoConfig>
    </div>
  );
}
