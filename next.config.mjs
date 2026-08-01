/** @type {import('next').NextConfig} */

// CSP ESTRICTA para toda la app (panel, catálogo, financiación).
const cspEstricta = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: http://localhost:4000",
  // El mapa de la portada es un iframe de Google Maps. Sin frame-src explícito
  // caería en default-src 'self' y quedaría bloqueado. Se listan solo los dos
  // orígenes que sirven el embed, no un https: abierto.
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const headersComunes = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      // CSP estricta y headers de seguridad para todo el sitio.
      { source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: cspEstricta }, ...headersComunes] },
    ];
  },
};

export default nextConfig;
