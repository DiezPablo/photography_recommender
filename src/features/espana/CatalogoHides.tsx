"use client";
// Catálogo de hides y salidas guiadas con filtros (especie, tipo, mes) y mapa por zonas.
import { useParametrosUrl } from "@/lib/almacen";
import { MESES } from "@/lib/fechas";
import MapaEventos from "@/ui/mapa/MapaEventos";
import TarjetaHide from "@/features/espana/TarjetaHide";
import { HIDES, TEXTO_TIPO, type Hide } from "@/features/espana/hides";
import { useUbicacionGuardada } from "@/features/espana/ubicacion";

function distancia(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const x =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function CatalogoHides({ claves }: { claves: Record<string, string | null> }) {
  const [p, actualizar] = useParametrosUrl();
  const q = p.get("q") ?? "";
  const tipo = p.get("tipo") ?? "";
  const mes = p.get("mes") ? Number(p.get("mes")) : null;
  const clase = p.get("clase") ?? "";
  const tipos = [...new Set(HIDES.map((h) => h.tipo))];
  const guardada = useUbicacionGuardada();
  const t = sinTildes(q.trim());
  const lista = HIDES.filter(
    (h: Hide) =>
      (!t ||
        sinTildes(`${h.nombre} ${h.zona} ${h.operador} ${h.especies.map((e) => `${e.n} ${e.c}`).join(" ")}`).includes(
          t,
        )) &&
      (!tipo || h.tipo === tipo) &&
      (!clase || h.clase === clase) &&
      (mes === null || !h.meses.length || h.meses.includes(mes)),
  )
    // con tu ubicación guardada, de más cerca a más lejos
    .map((h) => ({ h, km: guardada ? Math.round(distancia(guardada, h)) : undefined }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  return (
    <>
      <section className="seccion formulario-plan">
        <label className="campo">
          <span className="rotulo">Especie, zona u operador</span>
          <input
            type="search"
            value={q}
            placeholder="Avutarda, Toledo, quebrantahuesos…"
            onChange={(e) => actualizar({ q: e.target.value })}
          />
        </label>
        <label className="campo">
          <span className="rotulo">Qué</span>
          <select value={clase} onChange={(e) => actualizar({ clase: e.target.value })}>
            <option value="">Hides y salidas</option>
            <option value="hide">Solo hides</option>
            <option value="salida">Solo salidas guiadas</option>
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Tipo</span>
          <select value={tipo} onChange={(e) => actualizar({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {tipos.map((x) => (
              <option key={x} value={x}>
                {TEXTO_TIPO[x]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Cuándo</span>
          <select value={mes ?? ""} onChange={(e) => actualizar({ mes: e.target.value })}>
            <option value="">Cualquier mes</option>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </section>
      <MapaEventos
        etiqueta="Zonas de los hides y salidas"
        eventos={lista.map(({ h }) => ({
          id: h.id,
          nombre: `${h.nombre} (${h.operador})`,
          lat: h.lat,
          lon: h.lon,
          radio_km: 8,
          categoria: "fauna",
          href: h.web,
        }))}
      />
      <p className="nota-pie">
        {lista.length} resultados{guardada ? `, de más cerca a más lejos de ${guardada.nombre ?? "tu punto"}` : ""}. Los
        círculos marcan la zona (municipio o comarca), no el hide.
      </p>
      <ul className="lista-hides">
        {lista.map(({ h, km }) => (
          <TarjetaHide key={h.id} h={h} km={km} claves={claves} />
        ))}
      </ul>
    </>
  );
}
