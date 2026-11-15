// El formulario del plan de varios días (spec 016): dónde, desde cuándo y cuántos días. Un GET a /plan, así que
// funciona sin JavaScript; con JavaScript, además, «Cerca de mí».
import { comunidades } from "@/features/consulta/resultados";
import { RADIOS } from "@/features/consulta/consulta";
import CercaDeMi from "@/features/consulta/CercaDeMi";
import { cargar, etiquetaDia } from "@/features/spots/datos";
import { DIAS_PLAN, type Plan } from "@/features/plan/plan";
import { MESES } from "@/lib/fechas";

/** Los próximos 21 días como primer día posible del plan (más allá de la previsión, con lo habitual). */
function primerosDias(): { valor: string; texto: string }[] {
  const hoy = cargar().informe?.fechas?.[0] ?? new Date().toISOString().slice(0, 10);
  const t0 = Date.parse(`${hoy}T12:00:00Z`);
  return Array.from({ length: 21 }, (_, i) => {
    const f = new Date(t0 + i * 86400000).toISOString().slice(0, 10);
    return { valor: f, texto: i === 0 ? "Hoy" : i === 1 ? "Mañana" : etiquetaDia(f, 2).largo };
  });
}

export default function FormularioPlan({ p }: { p?: Plan }) {
  const conPunto = p?.lat != null && p?.lon != null;
  return (
    <form action="/plan" method="get" className="consulta" aria-label="Plan de varios días">
      <label>
        <span>Dónde</span>
        {conPunto ? (
          <>
            <input type="hidden" name="lat" value={p!.lat!} />
            <input type="hidden" name="lon" value={p!.lon!} />
            <select name="km" defaultValue={p!.km}>
              {RADIOS.map((r) => (
                <option key={r} value={r}>
                  A menos de {r} km de ti
                </option>
              ))}
            </select>
          </>
        ) : (
          <select name="ccaa" defaultValue={p?.ccaa ?? ""}>
            <option value="">Toda España</option>
            {comunidades().map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        )}
      </label>
      <label>
        <span>Desde</span>
        <select name="cuando" defaultValue={p?.cuando}>
          <optgroup label="Un día concreto">
            {primerosDias().map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.texto}
              </option>
            ))}
          </optgroup>
          <optgroup label="Un mes (lo habitual)">
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label>
        <span>Días</span>
        <select name="dias" defaultValue={p?.dias ?? 3}>
          {DIAS_PLAN.map((n) => (
            <option key={n} value={n}>
              {n} días
            </option>
          ))}
        </select>
      </label>
      <p className="consulta-acciones">
        <button type="submit" className="boton boton-principal">
          Hacer el plan
        </button>
        {!conPunto && <CercaDeMi />}
      </p>
    </form>
  );
}
