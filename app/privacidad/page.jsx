import { Navegacion } from "@/components/inicio/navegacion";
import { SeccionPie } from "@/components/inicio/seccion-pie";

// Página pública a la que el bot manda al cliente antes de pedirle permiso para
// consultar al BCRA. El texto lo publica la agencia desde el panel (por versiones)
// y se muestra como texto plano: React lo escapa, nunca se interpreta como HTML.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";

const metadata = {
  title: "Política de privacidad",
  description: "Cómo usamos tus datos personales.",
};

async function politicaVigente() {
  try {
    const res = await fetch(`${API_URL}/api/privacidad`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).data ?? null;
  } catch {
    return null;
  }
}

async function PaginaPrivacidad() {
  const politica = await politicaVigente();
  const publicada = politica && new Date(politica.publicado).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="inicio relative min-h-screen overflow-x-clip noise-overlay">
      <Navegacion />
      <article className="mx-auto max-w-2xl px-4 pt-32 pb-20">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Privacidad</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Cómo usamos tus datos</h1>
        {politica ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Versión {politica.version} · publicada el {publicada}
            </p>
            <div className="mt-10 whitespace-pre-line text-base leading-relaxed text-foreground/90">{politica.texto}</div>
          </>
        ) : (
          <p className="mt-10 text-base text-muted-foreground">La política de privacidad todavía no está publicada.</p>
        )}
      </article>
      <SeccionPie />
    </main>
  );
}

export { PaginaPrivacidad as default, metadata };
