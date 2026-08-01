"use client";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Clock, Phone, Mail, ArrowUpRight } from "lucide-react";
import { Boton } from "@/components/interfaz/boton";
import { usarEnVista } from "@/hooks/usar-en-vista";
import { INFO_NEGOCIO, ENLACES_SOCIALES, obtenerUrlWhatsAppBot } from "@/lib/constantes";
import { obtenerUbicacion, obtenerHorarios } from "@/lib/api";

// Dirección, horarios y coordenadas salen ÚNICAMENTE de la base (los edita el
// admin en Configuración). Si no hay registro cargado, la fila no se muestra:
// antes había un respaldo hardcodeado en INFO_NEGOCIO y el sitio publicaba una
// dirección y unos horarios que podían no ser los vigentes.
//
// La tabla de horarios guarda 0=domingo (getDay()), pero se muestra de lunes a
// domingo, que es como lo lee una persona.
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
// El CTA salta derecho al bot, igual que el botón flotante: sin paso intermedio.
const MENSAJE_WHATSAPP = `Hola ${INFO_NEGOCIO.name}! Me gustaría coordinar una visita al showroom.`;
const NOMBRE_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function lineasDeHorarios(horarios) {
  if (!horarios.length) return [];
  const porDia = new Map(horarios.map((h) => [h.dia, h]));
  return ORDEN.map((dia) => {
    const h = porDia.get(dia);
    const detalle = h?.abierto && h.apertura && h.cierre ? `${h.apertura} - ${h.cierre}` : "Cerrado";
    return `${NOMBRE_DIA[dia]}: ${detalle}`;
  });
}

// "5493884726067" → "+54 9 388 472-6067"
function telefonoLegible(numero) {
  const m = numero.match(/^(\d{2})(\d)(\d{3})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}-${m[5]}` : `+${numero}`;
}

function Dato({ icono: Icono, titulo, children }) {
  return (
    <div className="flex items-start gap-3 border-t border-border pt-5">
      <Icono className="mt-0.5 w-4 h-4 shrink-0 text-brand" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
          {titulo}
        </p>
        <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </div>
  );
}

function SeccionContacto() {
  const { ref, estaVisible } = usarEnVista();
  const [ubicacion, setUbicacion] = useState(null);
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    obtenerUbicacion()
      .then(setUbicacion)
      .catch(() => {});
    obtenerHorarios()
      .then((d) => setHorarios(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const direccion = ubicacion?.direccion?.trim() || null;
  const { latitud, longitud, mapsUrl } = ubicacion ?? {};
  const mapaEmbebido =
    latitud && longitud
      ? `https://www.google.com/maps?q=${latitud},${longitud}&z=16&output=embed`
      : null;
  const comoLlegar =
    mapsUrl ||
    (direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : null);
  const lineasHorarios = lineasDeHorarios(horarios);
  // Sin dirección ni horarios no queda nada que poner en esa columna, y el mapa
  // sin coordenadas es un enlace a ninguna parte.
  const hayUbicacion = Boolean(direccion || mapaEmbebido);

  return (
    <section id="contacto" className="relative py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12 lg:mb-16 max-w-3xl">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-brand" />
            Contacto
          </span>

          <h2
            ref={ref}
            className={`text-4xl md:text-5xl lg:text-6xl font-display tracking-tight leading-[1.05] transition-all duration-700 ${
              estaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-brand">Visitanos hoy</span>
            <br />y encontrá tu auto.
          </h2>

          <p className="mt-6 max-w-xl text-base lg:text-lg text-muted-foreground leading-relaxed">
            Escribinos y coordinamos el día para que veas el vehículo en el showroom.
          </p>

          <div className="mt-8">
            <Boton
              size="lg"
              className="bg-brand hover:bg-brand-light text-white h-12 lg:h-14 px-8 rounded-full text-sm lg:text-base group"
              asChild
            >
              <a href={obtenerUrlWhatsAppBot(MENSAJE_WHATSAPP)} target="_blank" rel="noopener noreferrer">
                Escribinos por WhatsApp
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </Boton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Datos. Ocupan todo el ancho cuando no hay ubicación cargada: sin
              mapa al lado, media fila vacía se lee como si faltara algo. */}
          <div className={`flex flex-col gap-6 ${hayUbicacion ? "lg:col-span-5" : "lg:col-span-12"}`}>
            {direccion && (
              <Dato icono={MapPin} titulo="Dirección">
                <p>{direccion}</p>
                {comoLlegar && (
                  <a
                    href={comoLlegar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-brand hover:underline group"
                  >
                    Cómo llegar
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </Dato>
            )}

            {lineasHorarios.length > 0 && (
              <Dato icono={Clock} titulo="Horarios">
                {lineasHorarios.map((linea) => (
                  <p key={linea} className="text-muted-foreground">
                    {linea}
                  </p>
                ))}
              </Dato>
            )}

            <Dato icono={Phone} titulo="Teléfono">
              <a href={`tel:+${INFO_NEGOCIO.phone}`} className="hover:text-brand transition-colors">
                {telefonoLegible(INFO_NEGOCIO.phone)}
              </a>
            </Dato>

            {/* El email solo aparece si está cargado: mostrar uno inventado es
                peor que no mostrar ninguno. Se completa en lib/constantes.js. */}
            {INFO_NEGOCIO.email && (
              <Dato icono={Mail} titulo="Email">
                <a
                  href={`mailto:${INFO_NEGOCIO.email}`}
                  className="hover:text-brand transition-colors"
                >
                  {INFO_NEGOCIO.email}
                </a>
              </Dato>
            )}

            <div className="border-t border-border pt-5">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
                Redes
              </p>
              <div className="mt-3 flex flex-wrap gap-5">
                {ENLACES_SOCIALES.map((enlace) => (
                  <a
                    key={enlace.name}
                    href={enlace.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-sm text-foreground hover:text-brand transition-colors"
                  >
                    {enlace.name}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Mapa. Entra en gris y toma color al apuntarlo: el bloque de
              colores de Google es lo único que rompería la paleta. Solo se
              dibuja si hay ubicación cargada. */}
          {hayUbicacion && (
            <div className="lg:col-span-7">
              <div className="relative h-[320px] lg:h-full min-h-[320px] overflow-hidden border border-border bg-secondary">
                {mapaEmbebido ? (
                  <iframe
                    src={mapaEmbebido}
                    title={`Ubicación de ${INFO_NEGOCIO.name} en el mapa`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full grayscale transition-all duration-[1200ms] ease-[var(--curva)] hover:grayscale-0"
                  />
                ) : (
                  <a
                    href={comoLlegar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MapPin className="w-6 h-6" strokeWidth={1.5} />
                    <span className="font-mono text-[11px] tracking-[0.22em] uppercase">
                      Abrir en Google Maps
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export { SeccionContacto };
