import { Bricolage_Grotesque, Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Tipografía del sitio.
// La PORTADA usa una sola familia —Geist— en todo: la jerarquía la dan el
// cuerpo y el peso, no mezclar tipografías. Es lo que sostiene el registro
// corporativo (ver la dirección "corporativa mínima" en globals.css).
// El CATÁLOGO conserva Bricolage Grotesque para titulares y JetBrains Mono para
// datos duros. Instrument las usa el panel de administración.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage"
});
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument"
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains"
});
const metadata = {
  title: "Sea Automotores - Tu pr\xF3ximo auto te espera",
  description: "Agencia automotriz con los mejores veh\xEDculos nuevos y usados. Financiamiento, garant\xEDa y servicio de primera calidad.",
  generator: "v0.app"
};
function DisenoRaiz({
  children
}) {
  return <html lang="es" className="bg-background">
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${GeistSans.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>;
}

export {
  DisenoRaiz as default,
  metadata
};
