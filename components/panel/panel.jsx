"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  obtenerMe,
  obtenerResumenLeads,
  obtenerAsesores,
  obtenerVehiculosAdmin,
  obtenerDescuentos,
  obtenerPromociones,
  obtenerConfig,
  obtenerUbicacion,
  obtenerHorarios,
  contarNovedades,
  marcarSeccionVista,
  getToken,
} from "@/lib/api";
import { BarraLateral } from "./barra-lateral";
import { Encabezado } from "./encabezado";
import { SeccionResumen } from "./secciones/resumen";
import { SeccionConsultas } from "./secciones/consultas";
import { SeccionClientes } from "./secciones/clientes";
import { SeccionFinanciacion } from "./secciones/financiacion";
import { SeccionVentas } from "./secciones/ventas";
import { SeccionConsignaciones } from "./secciones/consignaciones";
import { SeccionAsesores } from "./secciones/asesores";
import { SeccionEntregas } from "./secciones/entregas";
import { SeccionVehiculos } from "./secciones/vehiculos";
import { SeccionContabilidad } from "./secciones/contabilidad";
import { SeccionDescuentos } from "./secciones/descuentos";
import { SeccionConfiguracion } from "./secciones/configuracion";

// Secciones con badge de novedades en el sidebar. Deben coincidir con las que
// acepta /api/novedades/:seccion.
const SECCIONES_CON_NOVEDADES = ["consultas", "ventas", "clientes", "financiacion", "descuentos"];

// `consultaId` viene de /admin/<sesionId>, el link de los avisos de lead a
// Telegram: entra directo a Consultas con esa consulta ya abierta.
export function Panel({ consultaId = null }) {
  const router = useRouter();
  const [seccion, setSeccion] = useState(consultaId ? "consultas" : "resumen");
  const [colapsada, setColapsada] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false); // drawer del sidebar en móvil
  const [busqueda, setBusqueda] = useState("");

  const [usuario, setUsuario] = useState(null); // { id, nombre, rol }
  const [verificando, setVerificando] = useState(true);

  const [resumen, setResumen] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [config, setConfig] = useState(null);
  const [ubicacion, setUbicacion] = useState(null); // solo la usa Configuración (admin)
  const [horarios, setHorarios] = useState([]);     // solo los usa Configuración (admin)
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Token para forzar recarga de las secciones self-fetch (Clientes/Ventas/Financiación)
  // al tocar "Actualizar".
  const [refrescar, setRefrescar] = useState(0);

  // Novedades por sección desde la última revisión del usuario (badge del sidebar).
  // Los tres mapas van keyeados por sección: { consultas: …, ventas: … }.
  const [novedades, setNovedades] = useState({});   // cuántas hay ahora
  const [vistoAt, setVistoAt] = useState({});       // marca del server
  const [nuevoDesde, setNuevoDesde] = useState({}); // marca "congelada" al entrar (resalta filas)

  const esAdmin = usuario?.rol === "admin";

  // Guard de sesión: sin token o token inválido → /login.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    obtenerMe()
      .then((u) => {
        setUsuario(u);
        setVerificando(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    // Clientes/Ventas/Financiación se piden solos (paginado) → se refrescan por token.
    setRefrescar((n) => n + 1);
    const peticiones = [
      obtenerResumenLeads(),
      obtenerAsesores(),
      obtenerVehiculosAdmin(),
      obtenerDescuentos(),
      obtenerPromociones(),
      obtenerConfig(),
      esAdmin ? obtenerUbicacion() : Promise.resolve(null),
      esAdmin ? obtenerHorarios() : Promise.resolve([]),
    ];
    Promise.all(peticiones)
      .then(([r, a, v, d, p, c, u, h]) => {
        setResumen(r || null);
        setAsesores(a || []);
        setVehiculos(v || []);
        setDescuentos(d || []);
        setPromociones(p || []);
        setConfig(c || null);
        setUbicacion(u || null);
        setHorarios(h || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [esAdmin]);

  useEffect(() => {
    if (usuario) cargar();
  }, [usuario, cargar]);

  // Contador de novedades: al iniciar sesión y luego cada 60 s.
  const refrescarNovedades = useCallback(() => {
    Promise.all(
      SECCIONES_CON_NOVEDADES.map((s) =>
        contarNovedades(s).then((r) => [s, r]).catch(() => null)
      )
    ).then((res) => {
      const ok = res.filter(Boolean);
      if (!ok.length) return;
      setNovedades((prev) => ({ ...prev, ...Object.fromEntries(ok.map(([s, r]) => [s, r.nuevas])) }));
      setVistoAt((prev) => ({ ...prev, ...Object.fromEntries(ok.map(([s, r]) => [s, r.vistoAt])) }));
    });
  }, []);

  useEffect(() => {
    if (!usuario) return;
    refrescarNovedades();
    const id = setInterval(refrescarNovedades, 60000);
    return () => clearInterval(id);
  }, [usuario, refrescarNovedades]);

  // Al abrir una sección con novedades: congelo la marca previa (para resaltar las
  // filas nuevas de esta visita) y marco "visto ahora" (resetea el contador).
  useEffect(() => {
    if (!usuario || !SECCIONES_CON_NOVEDADES.includes(seccion)) return;
    setNuevoDesde((prev) => ({ ...prev, [seccion]: vistoAt[seccion] ?? null }));
    marcarSeccionVista(seccion)
      .then(() => setNovedades((prev) => ({ ...prev, [seccion]: 0 })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion, usuario]);


  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <BarraLateral
        seccion={seccion}
        onSeccion={(s) => {
          setSeccion(s);
          setMenuMovil(false);
        }}
        colapsada={colapsada}
        onColapsar={setColapsada}
        esAdmin={esAdmin}
        abierta={menuMovil}
        onCerrar={() => setMenuMovil(false)}
        novedades={novedades}
      />

      {/* Backdrop del drawer en móvil */}
      {menuMovil && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuMovil(false)}
          aria-hidden="true"
        />
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${colapsada ? "lg:ml-[72px]" : "lg:ml-[240px]"}`}>
        <Encabezado
          seccion={seccion}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          onActualizar={cargar}
          cargando={cargando}
          usuario={usuario}
          onAbrirMenu={() => setMenuMovil(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
              No se pudieron cargar los datos. ¿Está encendida la API? ({error})
            </div>
          )}

          {!error && (
            <div key={seccion} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {seccion === "resumen" && <SeccionResumen resumen={resumen} />}
              {seccion === "consultas" && (
                <SeccionConsultas busqueda={busqueda} mostrarAsesor={config?.reparticion_equitativa !== false} nuevoDesde={nuevoDesde.consultas} abrirId={consultaId} />
              )}
              {seccion === "clientes" && <SeccionClientes busqueda={busqueda} refrescar={refrescar} nuevoDesde={nuevoDesde.clientes} />}
              {seccion === "financiacion" && esAdmin && (
                <SeccionFinanciacion busqueda={busqueda} refrescar={refrescar} />
              )}
              {seccion === "ventas" && <SeccionVentas busqueda={busqueda} refrescar={refrescar} nuevoDesde={nuevoDesde.ventas} />}
              {seccion === "consignaciones" && (
                <SeccionConsignaciones busqueda={busqueda} esAdmin={esAdmin} vehiculos={vehiculos} />
              )}
              {seccion === "vehiculos" && <SeccionVehiculos vehiculos={vehiculos} busqueda={busqueda} onRecargar={cargar} esAdmin={esAdmin} />}
              {seccion === "contabilidad" && <SeccionContabilidad />}
              {seccion === "descuentos" && (
                <SeccionDescuentos
                  descuentos={descuentos}
                  promociones={promociones}
                  vehiculos={vehiculos}
                  busqueda={busqueda}
                  onRecargar={cargar}
                  esAdmin={esAdmin}
                />
              )}
              {seccion === "asesores" && <SeccionAsesores asesores={asesores} busqueda={busqueda} onRecargar={cargar} esAdmin={esAdmin} />}
              {seccion === "entregas" && esAdmin && <SeccionEntregas />}
              {seccion === "configuracion" && esAdmin && (
                <SeccionConfiguracion
                  usuario={usuario}
                  onUsuario={setUsuario}
                  config={config}
                  onConfig={setConfig}
                  ubicacion={ubicacion}
                  onUbicacion={setUbicacion}
                  horarios={horarios}
                  onHorarios={setHorarios}
                  asesores={asesores}
                  onRecargar={cargar}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
