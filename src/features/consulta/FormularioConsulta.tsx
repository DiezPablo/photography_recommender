// El formulario de la consulta (spec 012): cuándo, dónde y qué. Un GET a /buscar, así que funciona sin JavaScript;
// con JavaScript, además, «Cerca de mí». Lo usan la portada y la página de resultados.
import { comunidades, diasPrevision } from "@/features/consulta/resultados";
import { type Consulta, MOMENTOS, RADIOS } from "@/features/consulta/consulta";
import CercaDeMi from "@/features/consulta/CercaDeMi";
import { MESES } from "@/lib/fechas";

export default function FormularioConsulta({ c }: { c?: Consulta }) {
  const dias = diasPrevision();
  const conPunto = c?.lat != null && c?.lon != null;
  return (
    <form action="/buscar" method="get" className="consulta" aria-label="¿Cuándo, dónde y qué?">
      <label>
        <span>Cuándo</span>
        <select name="cuando" defaultValue={c?.cuando ?? "hoy"}>
          <option value="hoy">Hoy</option>
          <option value="manana">Mañana</option>
          <option value="finde">Este finde</option>
          <optgroup label="Próximos días">
            {dias.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.texto}
              </option>
            ))}
          </optgroup>
          <optgroup label="Más adelante (lo habitual)">
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label>
        <span>Dónde</span>
        {conPunto ? (
          <>
            <input type="hidden" name="lat" value={c!.lat!} />
            <input type="hidden" name="lon" value={c!.lon!} />
            <select name="km" defaultValue={c!.km}>
              {RADIOS.map((r) => (
                <option key={r} value={r}>
                  A menos de {r} km de ti
                </option>
              ))}
            </select>
          </>
        ) : (
          <select name="ccaa" defaultValue={c?.ccaa ?? ""}>
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
        <span>Qué</span>
        <select name="que" defaultValue={c?.que ?? "luz"}>
          <option value="luz">Luz y cielo</option>
          <option value="fauna">Fauna</option>
        </select>
      </label>
      <label>
        <span>Momento</span>
        <select name="momento" defaultValue={c?.momento ?? "todos"}>
          {MOMENTOS.map(([m, t]) => (
            <option key={m} value={m}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <p className="consulta-acciones">
        <button type="submit" className="boton boton-principal">
          Buscar
        </button>
        {!conPunto && <CercaDeMi />}
      </p>
    </form>
  );
}
