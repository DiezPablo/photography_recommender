"use client";
// Buscador de todos los parques del mundo (public/datos/safaris_indice.json, unos miles): texto, mes,
// continente y especie, con los filtros en la URL. Primero los que están en buena época ese mes y, dentro,
// los de más fauna observada.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MapaEventos from "@/ui/mapa/MapaEventos";
import { MESES } from "@/lib/fechas";
import { buscarZonas } from "@/features/safaris/zonas";
import { POR_TU_CUENTA } from "@/features/safaris/paises";
import { EDAD_MINIMA, SIN_MALARIA } from "@/features/safaris/familias";
import { esDestino, buenaEpoca, confianza, CONTINENTES, type FilaIndice } from "@/features/safaris/modelo";
import { useParametrosUrl } from "@/lib/almacen";
import { FOTOGRAFIA, type FotografiaParque } from "@/features/safaris/fotografiaParques";
import SelectorEspecie, { type OpcionEspecie } from "@/ui/SelectorEspecie";
import { useMesElegido } from "@/lib/mes";
import { fuenteImagen } from "@/lib/imagenes";

const POR_PAGINA = 30;
// filtros para fotografía (T26): clave en la URL, texto y si un parque lo cumple
const FILTROS_FOTO: [string, string, (x: FotografiaParque) => boolean][] = [
  ["pista", "Se puede salir de pista", (x) => x.fueraPista !== "no"],
  ["pocos", "Pocos vehículos", (x) => x.aglomeracion === "baja"],
  ["hides", "Hides o barcas", (x) => !!x.especial],
];
const EN_MAPA = 300;

function normal(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ExploradorSafaris({
  especies,
  mesHoy,
  fotos,
  iniciales = [],
}: {
  /** especies estrella: clave de GBIF, nombre, grupo y miniatura */
  especies: OpcionEspecie[];
  mesHoy: number;
  /** fotos de los destacados (del catálogo curado), por id */
  fotos: Record<string, string>;
  /** la primera página sin filtros, pintada en el servidor (se ve sin JavaScript y mientras carga el índice) */
  iniciales?: FilaIndice[];
}) {
  const [filas, setFilas] = useState<FilaIndice[] | null>(null);
  const [error, setError] = useState(false);
  const [limite, setLimite] = useState(POR_PAGINA);
  const [parametros, actualizar] = useParametrosUrl();
  const texto = parametros.get("q") ?? "";
  const continente = parametros.get("continente") ?? "";
  const especie = parametros.get("especie") ?? "";
  const soloEpoca = parametros.get("epoca") === "1";
  // por defecto solo destinos de fauna (niveles A y B); buscando por nombre, todos
  const todos = parametros.get("todos") === "1";
  // por tu cuenta: «turismo» (coche normal) o «4x4» (también los de 4×4); solo destacados tienen el dato
  const cuenta = parametros.get("cuenta") ?? "";
  // con niños: solo destacados sin malaria y sin edad mínima
  const ninos = parametros.get("ninos") === "1";
  const [mes, cambiarMes] = useMesElegido(mesHoy);

  useEffect(() => {
    fetch("/datos/safaris_indice.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setFilas(d.parques))
      .catch(() => setError(true));
  }, []);

  // filtros para fotografía (T26), con los datos escritos a mano de fotografiaParques.ts
  const fotoTexto = parametros.get("foto") ?? "";
  const foto = useMemo(() => fotoTexto.split(",").filter(Boolean), [fotoTexto]);
  // cada filtro activo: su nombre (para sugerir quitarlo si no hay resultados) y si un parque lo cumple
  const filtros = useMemo(() => {
    const clave = especie ? Number(especie) : null;
    const xs: { id: string; nombre: string; pasa: (f: FilaIndice, epoca: boolean) => boolean }[] = [];
    if (continente) xs.push({ id: "continente", nombre: continente, pasa: (f) => f.c === continente });
    if (clave !== null)
      xs.push({
        id: "especie",
        nombre: especies.find((e) => e.clave === clave)?.nombre ?? "la especie",
        pasa: (f) => f.e.includes(clave),
      });
    if (soloEpoca) xs.push({ id: "epoca", nombre: "solo buena época", pasa: (_, epoca) => epoca });
    if (ninos)
      xs.push({ id: "ninos", nombre: "sin malaria", pasa: (f) => SIN_MALARIA.has(f.id) && !EDAD_MINIMA[f.id] });
    if (cuenta)
      xs.push({
        id: "cuenta",
        nombre: cuenta === "4x4" ? "por mi cuenta (4×4)" : "por mi cuenta (turismo)",
        pasa: (f) =>
          POR_TU_CUENTA[f.id]?.nivel === "turismo" || (cuenta === "4x4" && POR_TU_CUENTA[f.id]?.nivel === "4x4"),
      });
    for (const c of foto) {
      const d = FILTROS_FOTO.find((x) => x[0] === c);
      if (d)
        xs.push({
          id: `foto:${c}`,
          nombre: d[1].toLowerCase(),
          pasa: (f) => !!FOTOGRAFIA[f.id] && d[2](FOTOGRAFIA[f.id]),
        });
    }
    return xs;
  }, [continente, especie, especies, soloEpoca, ninos, cuenta, foto]);

  const filtrar = useMemo(() => {
    const q = normal(texto.trim());
    const deZonas = new Set(buscarZonas(texto).map((z) => z.parque));
    return (sin?: string) =>
      (filas ?? [])
        .map((f) => ({ f, epoca: buenaEpoca(f)?.includes(mes + 1) ?? false }))
        .filter(
          ({ f, epoca }) =>
            filtros.every((x) => x.id === sin || x.pasa(f, epoca)) &&
            (todos || !!q || esDestino(f)) &&
            (!q || deZonas.has(f.id) || normal(`${f.n} ${f.p ?? ""}`).includes(q)),
        );
  }, [filas, texto, mes, todos, filtros]);

  const lista = useMemo(() => {
    if (!filas) return iniciales.map((f) => ({ f, epoca: buenaEpoca(f)?.includes(mes + 1) ?? false }));
    return filtrar().sort(
      (a, b) => Number(b.epoca) - Number(a.epoca) || Number(b.f.d) - Number(a.f.d) || b.f.s - a.f.s,
    );
  }, [filas, iniciales, mes, filtrar]);
  // sin resultados: cuántos habría quitando cada filtro (T35)
  const sugerencias =
    filas && !lista.length
      ? filtros
          .map((x) => ({ x, n: filtrar(x.id).length }))
          .filter((s) => s.n > 0)
          .sort((a, b) => b.n - a.n)
      : [];
  const quitar = (id: string) => {
    if (id.startsWith("foto:")) actualizar({ foto: foto.filter((c) => `foto:${c}` !== id).join(",") || null });
    else actualizar({ [id]: null });
  };
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const ocultos = (filas ?? []).filter((f) => !esDestino(f)).length;

  const zonas = buscarZonas(texto);
  const nombres = new Map((filas ?? []).map((f) => [f.id, f.n]));

  const puntos = useMemo(
    () =>
      lista.slice(0, EN_MAPA).map(({ f }) => ({
        id: f.id,
        nombre: `${f.n}${f.p ? ` (${f.p})` : ""}`,
        lat: f.la,
        lon: f.lo,
        radio_km: f.r,
        categoria: "fauna",
      })),
    [lista],
  );

  return (
    <div className="explorador-safaris" id="explorar">
      <div className="seccion filtros-fauna" role="search">
        <label className="campo">
          <span className="rotulo">Buscar</span>
          <input
            type="search"
            value={texto}
            onChange={(e) => {
              actualizar({ q: e.target.value });
              setLimite(POR_PAGINA);
            }}
            placeholder="Parque o país: Serengeti, Botsuana, Borneo, Yellowstone…"
          />
        </label>
        <div className="campos">
          <label className="campo">
            <span className="rotulo">Cuándo vas</span>
            <select value={mes} onChange={(e) => cambiarMes(Number(e.target.value))}>
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                  {i === mesHoy ? " (este mes)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="rotulo">Continente</span>
            <select value={continente} onChange={(e) => actualizar({ continente: e.target.value })}>
              <option value="">Todo el mundo</option>
              {CONTINENTES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="campo">
            <SelectorEspecie
              opciones={especies}
              valor={especie ? Number(especie) : null}
              onCambio={(c) => actualizar({ especie: c === null ? null : String(c) })}
            />
          </div>
          <div className="campo" role="group" aria-labelledby="como-ir">
            <span className="rotulo" id="como-ir">
              Cómo quieres ir
            </span>
            <span className="botones-opcion">
              {(
                [
                  ["", "Con guía"],
                  ["turismo", "Por mi cuenta (turismo)"],
                  ["4x4", "Por mi cuenta (4×4)"],
                ] as const
              ).map(([v, texto]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={cuenta === v}
                  onClick={() => actualizar({ cuenta: v || null })}
                >
                  {texto}
                </button>
              ))}
            </span>
          </div>
          <div className="campo" role="group" aria-labelledby="para-foto">
            <span className="rotulo" id="para-foto">
              Para fotografía
            </span>
            <span className="botones-opcion">
              {FILTROS_FOTO.map(([c, texto]) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={foto.includes(c)}
                  onClick={() =>
                    actualizar({
                      foto: (foto.includes(c) ? foto.filter((x) => x !== c) : [...foto, c]).join(",") || null,
                    })
                  }
                >
                  {texto}
                </button>
              ))}
            </span>
          </div>
          <label className="campo campo-casilla">
            <input
              type="checkbox"
              checked={soloEpoca}
              onChange={(e) => actualizar({ epoca: e.target.checked ? "1" : null })}
            />
            <span>Solo los que están en buena época</span>
          </label>
          <label className="campo campo-casilla">
            <input
              type="checkbox"
              checked={ninos}
              onChange={(e) => actualizar({ ninos: e.target.checked ? "1" : null })}
            />
            <span>Con niños pequeños (sin malaria)</span>
          </label>
          {ocultos > 0 && (
            <label className="campo campo-casilla">
              <input
                type="checkbox"
                checked={todos}
                onChange={(e) => actualizar({ todos: e.target.checked ? "1" : null })}
              />
              <span>
                Incluir {ocultos.toLocaleString("es-ES")} espacios protegidos más, con poca fauna emblemática registrada
              </span>
            </label>
          )}
        </div>
      </div>

      {zonas.length > 0 && (
        <ul className="zonas-busqueda">
          {zonas.map((z) => (
            <li key={z.nombre}>
              <b>{z.nombre}</b> está en <Link href={`/parque/${z.parque}`}>{nombres.get(z.parque) ?? z.parque}</Link>.{" "}
              {z.nota}
            </li>
          ))}
        </ul>
      )}

      <p className="vista-resultados" role="group" aria-label="Ver como">
        <button type="button" aria-pressed={vista === "lista"} onClick={() => setVista("lista")}>
          Lista
        </button>
        <button type="button" aria-pressed={vista === "mapa"} onClick={() => setVista("mapa")}>
          Mapa
        </button>
      </p>
      <div className={`fauna-grid vista-${vista}`}>
        <section className="seccion resultados-lista">
          <h2 className="rotulo" aria-live="polite">
            {filas
              ? `${lista.length.toLocaleString("es-ES")} parques · primero los que están en buena época en ${MESES[mes]}`
              : error
                ? "No se pudieron cargar los parques"
                : `Primero los que están en buena época en ${MESES[mes]}`}
          </h2>
          {sugerencias.length > 0 && (
            <div className="sin-resultados">
              <p>Ningún parque cumple todo a la vez.</p>
              <ul>
                {sugerencias.slice(0, 3).map(({ x, n }) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => quitar(x.id)}>
                      Quitando «{x.nombre}» hay {n.toLocaleString("es-ES")} {n === 1 ? "parque" : "parques"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="rejilla-especies rejilla-safaris">
            {lista.slice(0, limite).map(({ f, epoca }) => (
              <li key={f.id} className="tarjeta-especie">
                {(f.f ?? fotos[f.id]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    {...fuenteImagen((f.f ?? fotos[f.id])!, "(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 240px")}
                    alt=""
                    width={500}
                    height={333}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="sin-foto" aria-hidden />
                )}
                <div>
                  <h3>
                    <Link href={`/parque/${f.id}`}>{f.n}</Link>
                  </h3>
                  <p className="meta">
                    {f.p ? `${f.p} · ` : ""}
                    {f.m >= 200 ? "200+" : f.m} especies de mamíferos
                    {f.d && " · destacado"}
                    {f.o !== undefined && (
                      <span className="confianza-parque">
                        {" "}
                        · {f.o.toLocaleString("es-ES")} registros ({confianza(f.o)?.texto ?? "muy poca muestra"})
                      </span>
                    )}
                  </p>
                  <p className={epoca ? "en-temporada" : "fuera-temporada"}>
                    {epoca
                      ? `Buena época en ${MESES[mes]}`
                      : buenaEpoca(f)
                        ? "Mejor en otra época"
                        : "Sin datos de temporada"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {lista.length > limite && (
            <button type="button" className="boton" onClick={() => setLimite(limite + POR_PAGINA)}>
              Ver más ({(lista.length - limite).toLocaleString("es-ES")})
            </button>
          )}
        </section>
        <div className="seccion mapa-mes resultados-mapa">
          <MapaEventos eventos={puntos} enlace="/parque" etiqueta="Mapa de parques de safari" mundo />
          {lista.length > EN_MAPA && <p className="nota-pie">En el mapa, los {EN_MAPA} primeros de la lista.</p>}
        </div>
      </div>
    </div>
  );
}
