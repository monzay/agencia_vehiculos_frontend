"use client";

// Lo que respondió el cliente en la consulta, para tenerlo a la vista al armar el
// trámite. Es lo que dijo por chat, no un dato confirmado.
export function LoQueDijo({ respuestas = [] }) {
  if (respuestas.length === 0) return null;
  return (
    <details className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Lo que dijo en la consulta ({respuestas.length})
      </summary>
      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {respuestas.map((r) => (
          <div key={r.pregunta} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{r.pregunta}</dt>
            <dd className="font-medium text-foreground break-words">{r.respuesta}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
