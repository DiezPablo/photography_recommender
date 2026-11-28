// El formulario de «La luna o la Vía Láctea sobre un objeto» (specs 025 y 026): un GET a /luz/alinear, así que funciona
// sin JavaScript.
import type { ConsultaAlinear } from "@/features/alinear/alinear";

export default function FormularioAlinear({ c }: { c: ConsultaAlinear }) {
  return (
    <form action="/luz/alinear" method="get" className="consulta" aria-label="La luna o la Vía Láctea sobre un objeto">
      <label>
        <span>Sobre el objeto</span>
        <select name="astro" defaultValue={c.astro}>
          <option value="luna">La luna llena</option>
          <option value="via">El núcleo de la Vía Láctea</option>
        </select>
      </label>
      <label>
        <span>Qué (opcional)</span>
        <input name="nombre" defaultValue={c.nombre} placeholder="Castillo, torre, pico…" maxLength={80} />
      </label>
      <label>
        <span>Dónde está (latitud, longitud)</span>
        <input name="punto" defaultValue={c.punto} placeholder="40.4773, -3.6874" required inputMode="decimal" />
      </label>
      <label>
        <span>Altura del objeto (m)</span>
        <input
          name="altura"
          type="number"
          min={5}
          max={1000}
          defaultValue={c.altura ?? ""}
          placeholder="249"
          required
        />
      </label>
      <label>
        <span>Su base, más alta que tú (m)</span>
        <input name="desnivel" type="number" min={-500} max={1500} defaultValue={c.desnivel || ""} placeholder="0" />
      </label>
      <label>
        <span>Desde</span>
        <input name="desde" type="date" defaultValue={c.desde} />
      </label>
      <p className="consulta-acciones">
        <button type="submit" className="boton boton-principal">
          Buscar fechas
        </button>
      </p>
    </form>
  );
}
