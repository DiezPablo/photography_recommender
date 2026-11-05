"use client";
// Planificador de ruta: país, noches, mes, ritmo y animales → circuito con noches, traslados y avisos (la lógica,
// en planificar.ts). El estado va en la URL para poder compartir el plan.
import Link from "next/link";
import { IconoAvion, IconoCoche } from "@/ui/Iconos";
import { MESES } from "@/lib/fechas";
import { escribirAlmacen, useParametrosUrl } from "@/lib/almacen";
import { useMesElegido } from "@/lib/mes";
import { esDestino, MAX_COMPARAR, nivelFrecuencia } from "@/features/safaris/modelo";
import { MIGRACION } from "@/features/safaris/migracion";
import { facilidades, planificar, type Plan, type Ritmo, RITMOS, type Tramo } from "@/features/safaris/planificar";
import { useDatosNavegador } from "@/features/safaris/useDatosNavegador";
import { guardarViaje } from "@/features/safaris/viaje";

const TEXTO_RITMO: Record<Ritmo, string> = {
  tranquilo: "Tranquilo: menos parques, más noches en cada uno",
  normal: "Normal",
  intenso: "Intenso: más parques",
};
const PAIS_INICIAL = "Tanzania";
const MAX_NOCHES = 21;
/** parques donde la zona buena cambia con la migración (el Ngorongoro, solo cuando está en Ndutu) */
const CON_MIGRACION = new Set(["serengeti", "masai-mara"]);

function textoTramo(t: Tramo, desde?: string): string {
  const origen = desde ? `Desde ${desde}: ` : "";
  return t.volar
    ? `${origen}vuelo interno o avioneta (por carretera serían ~${t.km.toLocaleString("es-ES")} km)`
    : `${origen}~${t.km.toLocaleString("es-ES")} km por carretera, unas ${t.horas.toLocaleString("es-ES")} h`;
}

/** Qué cambia con dos noches más: noches añadidas a parques del plan y parques nuevos. */
/** «Arusha ✈ Serengeti 3 → Cráter del Ngorongoro 1 → Arusha»: ✈ en los tramos en avioneta. */
function rutaCorta(p: Plan): string {
  const flecha = (t: { volar: boolean } | null | undefined) => (t?.volar ? " ✈ " : " → ");
  const partes = p.etapas.map((e, i) => `${i || p.entrada ? flecha(e.traslado) : ""}${e.f.n} ${e.noches}`);
  return `${p.entrada?.nombre ?? ""}${partes.join("")}${p.entrada ? `${flecha(p.entrada.vuelta)}${p.entrada.salida}` : ""}`.trim();
}

function conMasNoches(plan: Plan, otro: Plan): string | null {
  const antes = new Map(plan.etapas.map((e) => [e.f.id, e.noches]));
  const cambios = otro.etapas
    .map((e) => {
      const n = e.noches - (antes.get(e.f.id) ?? 0);
      if (n <= 0) return null;
      return antes.has(e.f.id) ? `+${n} en ${e.f.n}` : `${e.f.n} (${n} ${n === 1 ? "noche" : "noches"})`;
    })
    .filter(Boolean);
  return cambios.length ? cambios.join(", ") : null;
}

export default function Planificador({ mesHoy, paisesIniciales = [] }: { mesHoy: number; paisesIniciales?: string[] }) {
  const { especies: datos, indice } = useDatosNavegador();
  const [parametros, actualizar] = useParametrosUrl();
  const pais = parametros.get("pais") ?? PAIS_INICIAL;
  // «dias» en enlaces antiguos: noches = días - 1
  const crudo = parametros.get("noches") ?? (parametros.has("dias") ? String(Number(parametros.get("dias")) - 1) : "6");
  const noches = Math.min(MAX_NOCHES, Math.max(1, Number(crudo) || 6));
  const [mes, cambiarMes] = useMesElegido(mesHoy);
  const ritmo = RITMOS.includes(parametros.get("ritmo") as Ritmo) ? (parametros.get("ritmo") as Ritmo) : "normal";
  const elegidas = (parametros.get("ver") ?? "").split(",").filter(Boolean).map(Number);
  const conNinos = parametros.get("ninos") === "1";
  const volar = parametros.get("volar") === "1";

  // sin los datos aún (o sin JavaScript): el formulario básico, ya con su valor, y el hueco del resultado
  if (!datos || !indice)
    return (
      <>
        <section className="seccion formulario-plan">
          <label className="campo">
            <span className="rotulo">País</span>
            <select value={pais} onChange={(e) => actualizar({ pais: e.target.value, ver: null })}>
              {(paisesIniciales.length ? paisesIniciales : [pais]).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="rotulo">Noches de safari</span>
            <select value={noches} onChange={(e) => actualizar({ noches: e.target.value, dias: null })}>
              {Array.from({ length: MAX_NOCHES }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "noche" : "noches"}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="rotulo">Mes del viaje</span>
            <select value={mes} onChange={(e) => cambiarMes(Number(e.target.value))}>
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </section>
        <div className="esqueleto esqueleto-plan" aria-busy="true" aria-label="Calculando la ruta" />
      </>
    );

  const filas = [...indice.values()].filter(esDestino);
  // países ordenados por interés total de sus parques (los de safari primero)
  const interes = new Map<string, number>();
  for (const f of filas) if (f.p) interes.set(f.p, (interes.get(f.p) ?? 0) + f.s);
  const paises = [...interes.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
  const entrada = {
    indice: filas,
    observaciones: facilidades(datos.parques),
    frecuencia: datos.frecuencia,
    pais,
    mes,
    especies: elegidas,
    ritmo,
    conNinos,
    volar,
  };
  const plan = planificar({ ...entrada, noches });
  // con tramos largos por carretera, la misma ruta (o otra) volando en avioneta los tramos de más de 5 h
  const largos = [...plan.etapas.map((e) => e.traslado), plan.entrada?.vuelta].some(
    (t) => t && !t.volar && t.horas >= 5,
  );
  const enAvioneta = !volar && largos ? planificar({ ...entrada, noches, volar: true }) : null;
  const ahorroHoras = enAvioneta ? Math.round(plan.horasCarretera - enAvioneta.horasCarretera) : 0;
  const masNoches =
    noches + 2 <= MAX_NOCHES ? conMasNoches(plan, planificar({ ...entrada, noches: noches + 2 })) : null;
  const nombre = new Map(datos.especies.map((e) => [e.clave, e.nombre]));
  // en el selector, las especies que se ven en algún parque del país
  const delPais = new Set(filas.filter((f) => f.p === pais).flatMap((f) => f.e));
  const opcionesEspecies = datos.especies.filter((e) => delPais.has(e.clave));
  const vuelos = [...plan.etapas.map((e) => e.traslado), plan.entrada?.vuelta].filter((t) => t?.volar).length;
  const zonaMigracion = MIGRACION[mes];

  /** Las especies estrella muy probables o probables ese mes en el parque (frecuencia de los destacados). */
  function destacadasMes(id: string): string[] {
    return Object.entries(datos!.frecuencia?.[id] ?? {})
      .map(([k, meses]) => ({ k: Number(k), v: meses[mes] }))
      .filter((x) => x.v !== null && x.v >= 20 && nombre.has(x.k))
      .sort((a, b) => b.v! - a.v!)
      .slice(0, 4)
      .map((x) => `${nombre.get(x.k)} (${nivelFrecuencia(x.v).texto})`);
  }

  function alternar(clave: number) {
    const nuevas = elegidas.includes(clave) ? elegidas.filter((c) => c !== clave) : [...elegidas, clave];
    actualizar({ ver: nuevas.join(",") || null });
  }

  return (
    <>
      <section className="seccion formulario-plan">
        <label className="campo">
          <span className="rotulo">País</span>
          <select value={pais} onChange={(e) => actualizar({ pais: e.target.value, ver: null })}>
            {paises.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Noches de safari</span>
          <select value={noches} onChange={(e) => actualizar({ noches: e.target.value, dias: null })}>
            {Array.from({ length: MAX_NOCHES }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "noche" : "noches"}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Mes del viaje</span>
          <select value={mes} onChange={(e) => cambiarMes(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Ritmo</span>
          <select value={ritmo} onChange={(e) => actualizar({ ritmo: e.target.value })}>
            {RITMOS.map((r) => (
              <option key={r} value={r}>
                {TEXTO_RITMO[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo campo-casilla">
          <input
            type="checkbox"
            checked={conNinos}
            onChange={(e) => actualizar({ ninos: e.target.checked ? "1" : null })}
          />
          <span>Viajo con niños</span>
        </label>
        <label className="campo campo-casilla">
          <input
            type="checkbox"
            checked={volar}
            onChange={(e) => actualizar({ volar: e.target.checked ? "1" : null })}
          />
          <span>Avioneta en los tramos de más de 5 h</span>
        </label>
      </section>
      {opcionesEspecies.length > 0 && (
        <section className="seccion">
          <p className="rotulo">Qué quieres ver (opcional)</p>
          <div className="chips-especies" role="group" aria-label="Animales">
            {opcionesEspecies.map((e) => (
              <button
                key={e.clave}
                type="button"
                className="chip-especie"
                aria-pressed={elegidas.includes(e.clave)}
                onClick={() => alternar(e.clave)}
              >
                {e.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto} alt="" width={28} height={28} loading="lazy" />
                )}
                {e.nombre}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="seccion plan" aria-live="polite">
        <h2>
          {noches} {noches === 1 ? "noche" : "noches"} en {pais}: {plan.etapas.length}{" "}
          {plan.etapas.length === 1 ? "parque" : "parques"}
        </h2>
        {plan.entrada && (
          <p className="nota-pie">
            {plan.entrada.salida === plan.entrada.nombre
              ? `Entrada y salida por ${plan.entrada.nombre}`
              : `Entrada por ${plan.entrada.nombre} y salida por ${plan.entrada.salida}`}
            ; si llegas tarde o te vas temprano, suma una noche allí.
          </p>
        )}
        {plan.avisos.length > 0 && (
          <ul className="avisos-plan">
            {plan.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        {plan.sinCubrir.length > 0 && (
          <p className="aviso-plan">
            Sin cubrir en {pais}: {plan.sinCubrir.map((k) => nombre.get(k)).join(", ")}. Prueba con más noches o mira en{" "}
            <Link href={`/?ver=${plan.sinCubrir.join(",")}&mes=${mes}`}>qué parques del mundo se ven</Link>.
          </p>
        )}
        <ol className="etapas-plan">
          {plan.etapas.map((e, i) => {
            const destacadas = destacadasMes(e.f.id);
            return (
              <li key={e.f.id}>
                {e.traslado && (
                  <p className={`traslado ${e.traslado.volar ? "volar" : ""}`}>
                    {e.traslado.volar ? <IconoAvion /> : <IconoCoche />}
                    {textoTramo(e.traslado, i === 0 ? plan.entrada?.nombre : undefined)}
                  </p>
                )}
                <div className="etapa">
                  {e.f.f && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.f.f} alt="" loading="lazy" />
                  )}
                  <div>
                    <p className="rotulo">
                      {e.noches} {e.noches === 1 ? "noche" : "noches"}
                      {e.f.d &&
                        ` · lo normal: ${e.estancia.min === e.estancia.ideal ? "" : `${e.estancia.min}-`}${e.estancia.ideal}`}
                    </p>
                    <h3>
                      <Link href={`/parque/${e.f.id}`}>{e.f.n}</Link>
                    </h3>
                    {e.estancia.nota && <p className="nota-etapa">{e.estancia.nota}</p>}
                    {(CON_MIGRACION.has(e.f.id) || zonaMigracion.parque === e.f.id) && (
                      <p className="nota-etapa">
                        <b>La migración en {MESES[mes]}:</b> {zonaMigracion.zona}. Alójate cerca: {zonaMigracion.base}.{" "}
                        <Link href="/migracion">Más →</Link>
                      </p>
                    )}
                    {destacadas.length > 0 && (
                      <p className="nota-etapa">
                        <b>En {MESES[mes]}:</b> {destacadas.join(", ")}.
                      </p>
                    )}
                    {e.especies.length > 0 && (
                      <p className="especies-ok">
                        {e.especies.map((k) => (
                          <span key={k} className="si">
                            ✓ {nombre.get(k)}
                          </span>
                        ))}
                      </p>
                    )}
                    <p className={e.enEpoca === false ? "fuera-temporada" : "en-temporada"}>
                      {e.enEpoca === null
                        ? "Sin datos de temporada"
                        : e.enEpoca
                          ? `Buena época en ${MESES[mes]}`
                          : `${MESES[mes]} no es su mejor época`}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
          {plan.entrada && plan.etapas.length > 0 && (
            <li>
              <p className={`traslado ${plan.entrada.vuelta.volar ? "volar" : ""}`}>
                {plan.entrada.vuelta.volar ? <IconoAvion /> : <IconoCoche />}
                {plan.entrada.vuelta.volar
                  ? `Vuelta a ${plan.entrada.salida} en avioneta o vuelo interno`
                  : `Vuelta a ${plan.entrada.salida}: unas ${plan.entrada.vuelta.horas.toLocaleString("es-ES")} h por carretera`}
              </p>
            </li>
          )}
        </ol>
        {enAvioneta && ahorroHoras >= 3 && (
          <p className="aviso-plan">
            <b>En avioneta:</b> {rutaCorta(enAvioneta)}, con unas {ahorroHoras} h menos de carretera (y vuelos que
            encarecen el viaje).{" "}
            <button type="button" className="quitar" onClick={() => actualizar({ volar: "1" })}>
              Probar
            </button>
          </p>
        )}
        {masNoches && (
          <p className="aviso-plan">
            <b>Con 2 noches más:</b> {masNoches}.{" "}
            <button
              type="button"
              className="quitar"
              onClick={() => actualizar({ noches: String(noches + 2), dias: null })}
            >
              Probar
            </button>
          </p>
        )}
        {plan.etapas.length > 0 && (
          <p className="enlaces">
            {plan.etapas.length > 1 && (
              <Link
                href={`/comparar?p=${plan.etapas
                  .slice(0, MAX_COMPARAR)
                  .map((e) => e.f.id)
                  .join(",")}`}
                onClick={() =>
                  escribirAlmacen(
                    "safaris.comparar",
                    plan.etapas
                      .slice(0, MAX_COMPARAR)
                      .map((e) => e.f.id)
                      .join(","),
                  )
                }
              >
                Comparar estos parques →
              </Link>
            )}
            <Link
              href="/viaje"
              className="boton"
              onClick={() =>
                guardarViaje({
                  nombre: `Safari en ${pais}`,
                  etapas: plan.etapas.map((e) => ({ id: e.f.id, noches: e.noches })),
                  mes,
                  personas: 2,
                  ver: elegidas,
                })
              }
            >
              Guardar en Mi viaje →
            </Link>
            <Link
              href={`/presupuesto?p=${plan.etapas.map((e) => `${e.f.id}:${e.noches}`).join(",")}&mes=${mes}&vuelos=${vuelos}`}
            >
              Calcular el presupuesto →
            </Link>
          </p>
        )}
        <p className="nota-pie">
          Cómo se decide: cada noche vale según el parque (escrito a mano en los destacados), su temporada y lo que se
          ve ese mes, hasta las noches que suele merecer; añadir un parque cuesta el traslado y medio día de cambio, y
          la ruta sale y vuelve a la ciudad de entrada. Distancias en línea recta ×1,3 a la velocidad de las carreteras
          de cada país. Es una primera aproximación: revísala con un operador local antes de reservar.
        </p>
      </section>
    </>
  );
}
