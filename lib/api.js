// Cliente HTTP del front hacia la API de la agencia (backend Express + Prisma).
// La URL base se configura con NEXT_PUBLIC_API_URL (ver .env.local).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "agencia_token";

// ── Sesion (JWT en localStorage) ──

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/login";
}

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

// Si el backend responde 401 y HABÍA sesión, venció: limpiamos y mandamos a /login.
// Si no había token (visitante anónimo en una página pública), no se redirige:
// las páginas públicas pueden pegarle a endpoints protegidos sin expulsar al login.
function manejar401(status) {
  if (status !== 401 || typeof window === "undefined") return;
  const teniaToken = !!getToken();
  window.localStorage.removeItem(TOKEN_KEY);
  if (teniaToken && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}


async function pedir(ruta) {
  const res = await fetch(`${API_URL}${ruta}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) {
    manejar401(res.status);
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Error ${res.status} al pedir ${ruta}`);
  }
  const json = await res.json();
  return json.data;
}

// Helper para mutaciones (POST/PUT/PATCH/DELETE). Propaga el mensaje de error del backend.
async function enviar(ruta, metodo, cuerpo) {
  const res = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(cuerpo ?? {}),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    manejar401(res.status);
    throw new Error(json.error || `Error ${res.status} en ${ruta}`);
  }
  return json.data;
}

// ── Auth ──

// Login: guarda el token y devuelve el usuario { id, nombre, email, rol }.
export async function login(email, password) {
  const data = await enviar("/api/auth/login", "POST", { email, password });
  if (data?.token) setToken(data.token);
  return data?.usuario ?? null;
}

// Devuelve el usuario logueado segun el token (valida la sesion).
export function obtenerMe() {
  return pedir("/api/auth/me");
}

// Edita los datos del propio usuario logueado (nombre y email; nunca la contraseña).
export function actualizarMiPerfil(datos) {
  return enviar("/api/auth/me", "PATCH", datos);
}

// ── Catalogo publico de vehiculos ──
export function obtenerVehiculos() {
  return pedir("/api/vehiculos");
}
export function obtenerVehiculo(ref) {
  return pedir(`/api/vehiculos/${ref}`);
}
export function obtenerMarcas() {
  return pedir("/api/vehiculos/marcas");
}

// Avisa que se abrió la ficha de un vehículo (interés por vehículo, para el panel).
//
// Fire-and-forget y silenciosa: es telemetría, no puede romper ni demorar la
// ficha, así que no usa `enviar` (que lanza y puede redirigir al login).
// `keepalive` la deja terminar aunque el visitante navegue enseguida.
//
// Manda el token si lo hay: el backend lo lee para NO contar las visitas de
// asesores y admin. La decisión vive allá, en un solo lugar.
export function registrarVistaVehiculo(ref) {
  return fetch(`${API_URL}/api/vehiculos/${encodeURIComponent(ref)}/vista`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

// ── Vehiculos (gestion en el panel) ──
// `vendidos`: "no" (por defecto, solo stock a la venta) | "si" | "todos".
export function obtenerVehiculosAdmin(vendidos = "no") {
  return pedir(`/api/vehiculos/admin/todos?vendidos=${vendidos}`);
}

// Cierre comercial del vehículo (solo admin).
export function marcarVehiculoVendido(ref, { precioVenta, vendidoAt } = {}) {
  return enviar(`/api/vehiculos/${ref}/venta`, "POST", {
    precio_venta: precioVenta,
    vendido_at: vendidoAt,
  });
}
export function deshacerVentaVehiculo(ref) {
  return enviar(`/api/vehiculos/${ref}/venta`, "DELETE");
}
// Cierra la consignación desde la ficha del auto: "vendido" | "retirado".
export function cerrarConsignacionVehiculo(ref, estado) {
  return enviar(`/api/vehiculos/${ref}/consignacion`, "POST", { estado });
}
export function crearVehiculo(datos) {
  return enviar("/api/vehiculos", "POST", datos);
}
export function actualizarVehiculo(ref, datos) {
  return enviar(`/api/vehiculos/${ref}`, "PATCH", datos);
}
export function eliminarVehiculo(ref) {
  return enviar(`/api/vehiculos/${ref}`, "DELETE");
}

// ── Descuentos (solo admin) ──
export function obtenerDescuentos() {
  return pedir("/api/descuentos");
}
export function crearDescuento(datos) {
  return enviar("/api/descuentos", "POST", datos);
}
export function actualizarDescuento(id, datos) {
  return enviar(`/api/descuentos/${id}`, "PATCH", datos);
}
export function eliminarDescuento(id) {
  return enviar(`/api/descuentos/${id}`, "DELETE");
}
// Aplica un descuento a uno o varios vehiculos (por su `ref`).
export function aplicarDescuentoVehiculos(id, refs) {
  return enviar(`/api/descuentos/${id}/aplicar`, "POST", { refs });
}
// Quita el descuento de uno o varios vehiculos (por su `ref`).
export function quitarDescuentoVehiculos(refs) {
  return enviar("/api/descuentos/quitar", "POST", { refs });
}

// ── Promociones (solo admin) ──
export function obtenerPromociones() {
  return pedir("/api/promociones");
}
export function crearPromocion(datos) {
  return enviar("/api/promociones", "POST", datos);
}
export function actualizarPromocion(id, datos) {
  return enviar(`/api/promociones/${id}`, "PATCH", datos);
}
export function eliminarPromocion(id) {
  return enviar(`/api/promociones/${id}`, "DELETE");
}
// Aplica / quita una promoción a uno o varios vehiculos (por su `ref`).
export function aplicarPromocionVehiculos(id, refs) {
  return enviar(`/api/promociones/${id}/aplicar`, "POST", { refs });
}
export function quitarPromocionVehiculos(id, refs) {
  return enviar(`/api/promociones/${id}/quitar`, "POST", { refs });
}

// ── Dashboard de administracion (leads / clientes) ──
export function obtenerLeads() {
  return pedir("/api/leads");
}
// Leads paginados con filtro/búsqueda en el server. Devuelve { items, hayMas, total }.
export function obtenerLeadsPagina({ tipo, clasif, q = "", offset = 0, limite = 10 } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (tipo) p.set("tipo", tipo);
  if (clasif && clasif !== "TODOS") p.set("clasif", clasif);
  if (q) p.set("q", q);
  return pedir(`/api/leads?${p.toString()}`);
}
export function obtenerResumenLeads() {
  return pedir("/api/leads/resumen");
}
// Métricas del día + fluctuación (día/semana/mes/año) + top autos.
// ── Contabilidad (solo admin) ──
export function obtenerContabilidad() {
  return pedir("/api/contabilidad");
}

export function obtenerMetricas() {
  return pedir("/api/leads/metricas");
}
export function obtenerLead(id) {
  return pedir(`/api/leads/${id}`);
}

// ── Consultas (lazy loading paginado; el detalle con los mensajes se pide al abrir) ──
// `q` busca por coincidencia en toda la base (cliente/vehículo/asesor).
// Devuelve { items, hayMas, total }.
// `clasif` = CALIENTE|TIBIO|FRIO. Vacío = sin filtrar por clasificación.
// Las consultas de venta/consignación no se listan acá (tienen su propia sección).
export function obtenerConsultas({ q = "", offset = 0, limite = 20, clasif = "" } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (q) p.set("q", q);
  if (clasif) p.set("clasif", clasif);
  return pedir(`/api/consultas?${p.toString()}`);
}
// Consultas de venta/consignación (una por sesión) para la sección homónima.
// `q` busca por cliente y por el vehículo ofrecido. Devuelve { items, hayMas, total }.
export function obtenerConsultasVenta({ q = "", offset = 0, limite = 10 } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (q) p.set("q", q);
  return pedir(`/api/consultas/venta?${p.toString()}`);
}
export function obtenerConsulta(id) {
  return pedir(`/api/consultas/${id}`);
}
// Marca/desmarca una consulta como atendida. Devuelve { sesionId, atendido }.
export function marcarConsultaAtendida(id, atendido = true) {
  return enviar(`/api/consultas/${id}/atendido`, "PATCH", { atendido });
}

// ── Novedades por sección del panel ("consultas" | "ventas") ──
// Cuántas hay desde la última revisión del usuario. Devuelve { nuevas, vistoAt }.
export function contarNovedades(seccion) {
  return pedir(`/api/novedades/${seccion}`);
}
// Marca la sección como revisada ahora (resetea el contador).
export function marcarSeccionVista(seccion) {
  return enviar(`/api/novedades/${seccion}/visto`, "POST");
}

// ── Asesores (roster del bot — equipo de ventas) ──
export function obtenerAsesores() {
  return pedir("/api/asesores");
}
export function crearAsesor(datos) {
  return enviar("/api/asesores", "POST", datos);
}
export function actualizarAsesor(id, datos) {
  return enviar(`/api/asesores/${id}`, "PATCH", datos);
}
export function eliminarAsesor(id) {
  return enviar(`/api/asesores/${id}`, "DELETE");
}

// ── Configuración global del panel ──
export function obtenerConfig() {
  return pedir("/api/config");
}
export function actualizarConfig(datos) {
  return enviar("/api/config", "PATCH", datos);
}

// ── Consignaciones (lectura para todos, escritura solo admin) ──
// `estado` = en_venta|vendido|retirado. `q` busca vehículo, patente o dueño.
// Devuelve { items, hayMas, total }.
export function obtenerConsignaciones({ estado = "", q = "", offset = 0, limite = 10 } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (estado) p.set("estado", estado);
  if (q) p.set("q", q);
  return pedir(`/api/consignaciones?${p.toString()}`);
}
export function crearConsignacion(datos) {
  return enviar("/api/consignaciones", "POST", datos);
}
export function actualizarConsignacion(id, datos) {
  return enviar(`/api/consignaciones/${id}`, "PATCH", datos);
}
export function eliminarConsignacion(id) {
  return enviar(`/api/consignaciones/${id}`, "DELETE");
}

// ── Entregas (galería del home: lectura pública, escritura solo admin) ──
// Cada entrega es { id, url }. La URL sale de subir la foto a /api/blob/upload.
export function obtenerEntregas() {
  return pedir("/api/entregas");
}
export function crearEntrega(url) {
  return enviar("/api/entregas", "POST", { url });
}
export function eliminarEntrega(id) {
  return enviar(`/api/entregas/${id}`, "DELETE");
}

// ── Ubicación de la agencia (lectura para todos, escritura solo admin) ──
export function obtenerUbicacion() {
  return pedir("/api/ubicacion");
}
export function guardarUbicacion({ nombre, direccion, mapsUrl, latitud, longitud }) {
  return enviar("/api/ubicacion", "PUT", { nombre, direccion, mapsUrl, latitud, longitud });
}

// ── Horarios de atención (lectura para todos, escritura solo admin) ──
// Cada día: { dia: 0..6 (0=Domingo), abierto, apertura, cierre } ("HH:MM" o null).
export function obtenerHorarios() {
  return pedir("/api/horarios");
}
export function guardarHorarios(dias) {
  return enviar("/api/horarios", "PUT", { dias });
}

// ── Financiación (clientes que accedieron a financiación) ──
export function obtenerFinanciaciones() {
  return pedir("/api/financiaciones");
}
// Financiaciones paginadas con búsqueda en el server. Devuelve { items, hayMas, total }.
export function obtenerFinanciacionesPagina({ q = "", offset = 0, limite = 10 } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (q) p.set("q", q);
  return pedir(`/api/financiaciones?${p.toString()}`);
}
export function crearFinanciacion(datos) {
  return enviar("/api/financiaciones", "POST", datos);
}
export function actualizarFinanciacion(id, datos) {
  return enviar(`/api/financiaciones/${id}`, "PATCH", datos);
}
export function eliminarFinanciacion(id) {
  return enviar(`/api/financiaciones/${id}`, "DELETE");
}
// Marca (pagado=true) o desmarca (false) una cuota. Devuelve la financiación actualizada.
export function marcarCuotaPagada(id, numero, pagado) {
  return enviar(`/api/financiaciones/${id}/cuotas/${numero}`, "PUT", { pagado });
}

// Consulta PÚBLICA (sin sesión): el cliente ve su financiación ingresando su DNI.
export async function consultarFinanciacionPorDni(dni) {
  const res = await fetch(`${API_URL}/api/financiaciones/consulta?dni=${encodeURIComponent(dni)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Error ${res.status} al consultar la financiación`);
  }
  return json.data;
}

// ── Ingresos: la toma de un vehículo en consignación ──
// Un ingreso es el auto ya recibido en el playón, antes de publicarlo. Lleva el
// titular, los papeles y las condiciones del contrato.
// Lectura: admin o asesor. Escritura: solo admin.

// Qué campos pide cada papel. Lo define el backend; el panel dibuja los
// formularios leyendo esto, para no tener dos copias de la misma definición.
export function obtenerCatalogoDocumentos() {
  return pedir("/api/ingresos/catalogo");
}

// Busca una persona ya cargada (por nombre, DNI o teléfono) para reusarla en
// vez de duplicarla. Devuelve [] con menos de 3 caracteres.
export function buscarPersonas(q) {
  return pedir(`/api/ingresos/personas?q=${encodeURIComponent(q)}`);
}

// `estado` = recepcion|publicado|retirado. Devuelve { items, hayMas, total }.
export function obtenerIngresos({ estado = "", q = "", offset = 0, limite = 10 } = {}) {
  const p = new URLSearchParams({ offset: String(offset), limite: String(limite) });
  if (estado) p.set("estado", estado);
  if (q) p.set("q", q);
  return pedir(`/api/ingresos?${p.toString()}`);
}
export function obtenerIngreso(id) {
  return pedir(`/api/ingresos/${id}`);
}
export function crearIngreso(datos) {
  return enviar("/api/ingresos", "POST", datos);
}
export function actualizarIngreso(id, datos) {
  return enviar(`/api/ingresos/${id}`, "PATCH", datos);
}
export function eliminarIngreso(id) {
  return enviar(`/api/ingresos/${id}`, "DELETE");
}

// Papeles. `guardar` es por tipo: si ese papel ya estaba cargado, lo actualiza.
export function obtenerDocumentosIngreso(id) {
  return pedir(`/api/ingresos/${id}/documentos`);
}
export function guardarDocumentoIngreso(id, datos) {
  return enviar(`/api/ingresos/${id}/documentos`, "PUT", datos);
}
export function eliminarDocumentoIngreso(id, documentoId) {
  return enviar(`/api/ingresos/${id}/documentos/${documentoId}`, "DELETE");
}

// Condiciones del contrato. Firmar congela una copia: desde ahí lo que se
// imprime deja de recalcularse.
export function obtenerContratoIngreso(id) {
  return pedir(`/api/ingresos/${id}/contrato`);
}
export function guardarContratoIngreso(id, datos) {
  return enviar(`/api/ingresos/${id}/contrato`, "PUT", datos);
}
export function firmarContratoIngreso(id) {
  return enviar(`/api/ingresos/${id}/contrato/firma`, "POST");
}
export function desfirmarContratoIngreso(id) {
  return enviar(`/api/ingresos/${id}/contrato/firma`, "DELETE");
}

// Datos de los tres impresos: contrato, recibo de documentación y recibo de
// recepción de la unidad.
export function obtenerImpresosIngreso(id) {
  return pedir(`/api/ingresos/${id}/impresos`);
}

// Lee las fotos de un papel con IA y propone sus datos. NO guarda nada: la
// respuesta precarga el formulario para que una persona la revise y confirme.
// Devuelve { datos, fechaVencimiento, dudosos: [claves leídas con dudas] }.
export function extraerDatosDocumento(id, { tipo, imagenes }) {
  return enviar(`/api/ingresos/${id}/documentos/extraer`, "POST", { tipo, imagenes });
}

// Los documentos viven en un store privado: el pathname guardado no abre nada
// por sí solo. Esto devuelve URLs firmadas que sirven unos minutos, para mostrar
// las imágenes. No se guardan ni se cachean: vencen.
export function firmarImagenesDocumento(id, imagenes) {
  return enviar(`/api/ingresos/${id}/documentos/firmar`, "POST", { imagenes });
}
