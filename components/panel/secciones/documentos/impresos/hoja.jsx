import { fechaLarga, nombreCompleto } from "./etiquetas";

// Las piezas con las que se arma cada impreso.
//
// `Hoja` es la unidad de todo esto: un documento es una hoja. El salto de
// página lo decide esta pieza mirando a su hermana anterior, así que agregar,
// sacar o reordenar impresos no obliga a acordarse del salto a mano.
//
// El alto disponible, para el que se calibró la densidad de cada documento, es
// A4 menos los 16 mm de margen del `@page`: 178 × 265 mm (≈ 673 × 1002 px).

// `pagina` estira la hoja al alto útil de una A4 (265 mm) y la vuelve una
// columna flex: lo que lleve `mt-auto` (las firmas) baja al pie del papel en
// vez de quedar colgando a media carilla. La vista previa muestra el mismo
// alto, así que en pantalla se ve dónde termina la hoja.
export function Hoja({ children, pagina = false }) {
  return <article className={pagina ? "hoja hoja-pagina relative" : "hoja relative"}>{children}</article>;
}

// La marca de agua se escribe en la vista previa, no se guarda: la misma
// consignación puede salir hoy como borrador y mañana limpia.
//
// Va como texto y no como `background` porque el navegador no imprime fondos
// salvo que el usuario tilde "gráficos de fondo" en el diálogo. El color no se
// pone acá: lo pone `.marca-agua` en globals.css, que es la única excepción a
// la regla que pinta de negro todo lo que se imprime.
//
// El tamaño no se elige: se dibuja en un SVG cuyo viewBox es el rectángulo que
// ocupa el texto ya rotado, y el navegador lo escala para que entre en la hoja.
// Así no hay que medir la tipografía ni adivinar, y una palabra de letras
// anchas ("WWWW") entra igual que una angosta.
const ANCHO_CARACTER = 115; // el carácter más ancho (una "W") a cuerpo 100, con su espaciado
const ALTO_LINEA = 140;
const GRADOS = 30;
const RADIANES = (GRADOS * Math.PI) / 180;

export function MarcaAgua({ texto }) {
  const limpio = texto?.trim();
  if (!limpio) return null;

  const largo = limpio.length * ANCHO_CARACTER;
  const ancho = largo * Math.cos(RADIANES) + ALTO_LINEA * Math.sin(RADIANES);
  const alto = largo * Math.sin(RADIANES) + ALTO_LINEA * Math.cos(RADIANES);
  const centro = `${ancho / 2} ${alto / 2}`;

  return (
    <svg
      aria-hidden
      className="marca-agua absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x={ancho / 2}
        y={alto / 2}
        fontSize="100"
        fontWeight="700"
        letterSpacing="5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        transform={`rotate(-${GRADOS} ${centro})`}
      >
        {limpio}
      </text>
    </svg>
  );
}

// Lo que el papel es, primero y grande; de quién es y de cuándo, al costado.
// `bajada` es la línea chica debajo del título (qué copia es, por ejemplo).
export function Encabezado({ agencia, titulo, bajada, generado }) {
  return (
    <header className="flex items-end justify-between gap-6 border-b border-current/40 pb-2 mb-5">
      <div>
        <h2 className="text-[19px] font-semibold leading-tight tracking-tight">{titulo}</h2>
        <p className="text-[11px] opacity-60 mt-0.5">{[bajada, fechaLarga(generado)].filter(Boolean).join(" - ")}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-semibold">{agencia?.nombre ?? "Agencia"}</p>
        {agencia?.direccion && <p className="text-[11px] opacity-60">{agencia.direccion}</p>}
      </div>
    </header>
  );
}

// Etiqueta arriba y valor abajo: para los recibos, donde sobra lugar.
export function Dato({ etiqueta, children }) {
  return (
    <div className="py-1">
      <span className="text-[11px] uppercase tracking-wide opacity-60">{etiqueta}</span>
      <div className="text-sm">{children ?? "—"}</div>
    </div>
  );
}

// Un dato de las partes: rótulo chico arriba y los valores en renglones, sin
// repetir "NOMBRE:" / "DNI:" delante de cada uno. Se lee de un saque y ocupa
// menos que una grilla de etiquetas.
export function Bloque({ rotulo, principal, lineas = [] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-50 mb-1">{rotulo}</p>
      <p className="text-[14px] font-medium leading-snug">{principal ?? "—"}</p>
      {lineas.filter(Boolean).map((l) => (
        <p key={l} className="text-[11.5px] leading-snug opacity-75">
          {l}
        </p>
      ))}
    </div>
  );
}

// Cláusula numerada con sangría francesa: el número queda en su columna y el
// texto arranca siempre en la misma línea vertical, que es lo que hace que una
// lista de once puntos se pueda recorrer con el dedo.
//
// `compacto` baja un punto el cuerpo: lo usa el boleto, que lleva más cláusulas
// que el contrato de consignación y tiene que entrar igual en una carilla.
export function Clausula({ n, titulo, children, compacto = false }) {
  return (
    <li className={compacto ? "grid grid-cols-[1.6rem_1fr] text-[12px] leading-[1.5]" : "grid grid-cols-[1.6rem_1fr] text-[13px] leading-[1.55]"}>
      <span className="font-semibold tabular-nums opacity-60">{n}</span>
      <p>
        <span className="font-semibold">{titulo}. </span>
        {children}
      </p>
    </li>
  );
}

// Las cláusulas juntas, con aire parejo entre una y otra.
export function Clausulas({ children, compacto = false }) {
  return <ol className={compacto ? "space-y-1.5" : "space-y-2.5"}>{children}</ol>;
}

// Firma el titular y la agencia. Los contratos firmados antes de sacar al
// cónyuge (migración 044) pueden traerlo en su copia congelada: no se muestra.
export function Firmas({ titular }) {
  const lineas = [`${nombreCompleto(titular)} — DNI ${titular?.dni ?? "—"}`, "Por la agencia"];

  return (
    <div className="grid grid-cols-2 gap-16 mt-auto pt-14">
      {lineas.map((l) => (
        <div key={l} className="text-center">
          <div className="border-t border-current/50 pt-1.5 text-[11.5px]">{l}</div>
        </div>
      ))}
    </div>
  );
}
