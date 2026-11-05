"use client";
// «Mi viaje»: el plan en una sola página (itinerario con traslados, qué verás en cada parque el mes del viaje,
// presupuesto y lista de cosas por hacer), guardado en este navegador, compartible por enlace e imprimible.
import Link from "next/link";
import { IconoAvion, IconoCoche } from "@/ui/Iconos";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { escribirAlmacen, useAlmacen, useParametrosUrl } from "@/lib/almacen";
import CampoNumero from "@/ui/CampoNumero";
import { nivelFrecuencia } from "@/features/safaris/modelo";
import { trasladoEn } from "@/features/safaris/planificar";
import { calcular, SUPUESTOS_INICIALES, type Supuestos } from "@/features/safaris/presupuesto";
import { useDatosNavegador } from "@/features/safaris/useDatosNavegador";
import ListaVistos from "@/features/safaris/componentes/ListaVistos";
import { fechaValida, sumarDias } from "@/features/safaris/calendario";
import { Suscribir } from "@/ui/Suscribir";
import {
  CLAVE_LISTA,
  CLAVE_SUPUESTOS,
  EXTERIORES,
  guardarViaje,
  leerJson,
  urlDeViaje,
  useViajeGuardado,
  type Viaje,
  viajeDeUrl,
  VISADO,
} from "@/features/safaris/viaje";
import { practicoDe, SANIDAD } from "@/features/safaris/paises";
import BuscadorParques from "./BuscadorParques";
import Esqueleto from "@/ui/Esqueleto";

const MAX_ESPECIES = 8;
const GORILAS = new Set(["bwindi", "volcanes"]);

function usd(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} USD`;
}

export default function MiViaje({ mesHoy }: { mesHoy: number }) {
  const router = useRouter();
  const { especies: datos, indice } = useDatosNavegador();
  const [parametros] = useParametrosUrl();
  const guardado = useViajeGuardado();
  const compartido = viajeDeUrl(parametros, mesHoy);
  const v = compartido ?? guardado;
  const s = leerJson<Supuestos>(useAlmacen(CLAVE_SUPUESTOS), SUPUESTOS_INICIALES);
  const hechas = leerJson<{ ids: string[] }>(useAlmacen(CLAVE_LISTA), { ids: [] }).ids;
  const [copiado, setCopiado] = useState(false);

  if (!v)
    return (
      <section className="seccion">
        <h2>Aún no tienes un viaje</h2>
        <p>
          Empieza en el <Link href="/planificar">planificador de ruta</Link> o en el{" "}
          <Link href="/presupuesto">presupuesto</Link> y pulsa «Guardar en Mi viaje». Se guarda solo en este navegador.
        </p>
        <p className="enlaces">
          <Link
            href={urlDeViaje({
              nombre: "Norte de Tanzania",
              etapas: [
                { id: "tarangire", noches: 2 },
                { id: "ngorongoro", noches: 1 },
                { id: "serengeti", noches: 3 },
              ],
              mes: 7,
              personas: 2,
              ver: [],
            })}
          >
            Ver un ejemplo: norte de Tanzania en agosto →
          </Link>
        </p>
      </section>
    );
  if (!indice || !datos) return <Esqueleto alto={600} texto="Cargando tu viaje…" />;

  // editar un plan compartido lo guarda como propio
  const cambiar = (c: Partial<Viaje>) => {
    guardarViaje({ ...v, ...c });
    if (compartido) router.replace("/viaje");
  };
  const filas = v.etapas.map((e) => ({ ...e, f: indice.get(e.id) }));
  const tramos = filas.map((e, i) => (i && e.f && filas[i - 1].f ? trasladoEn(e.f.p, filas[i - 1].f!, e.f) : null));
  const vuelos = tramos.filter((t) => t?.volar).length;
  const noches = v.etapas.reduce((a, e) => a + e.noches, 0);
  const r = calcular(
    filas.map((e) => ({ id: e.id, nombre: e.f?.n ?? e.id, noches: e.noches })),
    v.personas,
    v.mes + 1,
    { ...s, vuelos: s.vuelos || vuelos },
  );
  // con fecha de llegada, los días de cada etapa: «3-5 ago»
  const corta = (d: string) =>
    new Date(`${d}T12:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short", weekday: "short" });
  const fechas = filas.map((_, i) => {
    if (!v.salida) return null;
    const desde = sumarDias(
      v.salida,
      filas.slice(0, i).reduce((a, x) => a + x.noches, 0),
    );
    return `${corta(desde)} → ${corta(sumarDias(desde, filas[i].noches))}`;
  });
  const paises = [...new Set(filas.map((e) => e.f?.p).filter((p): p is string => !!p))];

  // qué verás: lo elegido o, si no, las especies estrella que más se ven en estos parques
  const facil = (clave: number, id: string) => (datos.parques[String(clave)] ?? []).find(([p]) => p === id)?.[1] ?? 0;
  const candidatas = v.ver.length
    ? v.ver
    : datos.especies
        .map((e) => e.clave)
        .filter((k) => v.etapas.some((e) => facil(k, e.id) > 0))
        .sort(
          (a, b) => Math.max(...v.etapas.map((e) => facil(b, e.id))) - Math.max(...v.etapas.map((e) => facil(a, e.id))),
        )
        .slice(0, MAX_ESPECIES);
  const nombre = new Map(datos.especies.map((e) => [e.clave, e.nombre]));
  // para la lista de vistos, todas las especies estrella de estos parques
  const maxFacil = (k: number) => Math.max(...v.etapas.map((e) => facil(k, e.id)));
  const delViaje = datos.especies
    .filter((e) => maxFacil(e.clave) > 0 || filas.some((f) => f.f?.e.includes(e.clave)))
    .sort((a, b) => maxFacil(b.clave) - maxFacil(a.clave));

  const lista: [string, React.ReactNode][] = [
    ["pasaporte", "Pasaporte con al menos 6 meses de validez y dos páginas en blanco."],
    ...paises.map(
      (p) =>
        [
          `visado-${p}`,
          <>
            Visado de {p}: {practicoDe(p)?.visado.texto ?? "consulta los requisitos."}{" "}
            <a href={practicoDe(p)?.visado.url ?? VISADO[p] ?? EXTERIORES} target="_blank" rel="noopener">
              Web oficial ↗
            </a>
          </>,
        ] as [string, React.ReactNode],
    ),
    [
      "salud",
      <>
        Vacunas y malaria: cita en un{" "}
        <a href={SANIDAD} target="_blank" rel="noopener">
          centro de vacunación internacional ↗
        </a>{" "}
        4-8 semanas antes.
        {paises
          .filter((p) => practicoDe(p))
          .map((p) => (
            <small key={p} className="detalle-lista">
              <b>{p}.</b> Fiebre amarilla: {practicoDe(p)!.fiebreAmarilla} Malaria: {practicoDe(p)!.malaria}
            </small>
          ))}
      </>,
    ],
    ...(() => {
      const tipos = [...new Set(paises.flatMap((p) => practicoDe(p)?.enchufes ?? []))];
      return tipos.length && !paises.every((p) => practicoDe(p)?.enchufes.includes("C"))
        ? [["enchufe", `Adaptador de enchufe (tipo ${tipos.join(", ")}).`] as [string, React.ReactNode]]
        : [];
    })(),
    ["seguro", "Seguro de viaje con evacuación médica (en los parques el hospital puede estar a horas)."],
    [
      "presupuestos",
      <>
        Pedir presupuesto a 3-4 operadores con el mismo texto (
        <Link href={urlDeViaje(v, "/presupuesto")}>presupuesto</Link>).
      </>,
    ],
    ...(v.etapas.some((e) => GORILAS.has(e.id))
      ? [["gorilas", "Permisos de gorilas: se agotan meses antes en temporada alta."] as [string, React.ReactNode]]
      : []),
    ["alojamiento", "Reservar alojamientos (los campamentos buenos del Mara o el Okavango se llenan con un año)."],
    ...(vuelos
      ? [
          ["equipaje", "Avioneta: unos 15 kg por persona en bolsa blanda, sin ruedas ni estructura rígida."] as [
            string,
            React.ReactNode,
          ],
        ]
      : []),
    ["efectivo", "Dólares en billetes recientes y pequeños para propinas."],
    ["prismaticos", "Prismáticos (uno por persona), linterna frontal y ropa de colores neutros."],
  ];
  const marcar = (id: string, si: boolean) =>
    escribirAlmacen(CLAVE_LISTA, JSON.stringify({ ids: si ? [...hechas, id] : hechas.filter((x) => x !== id) }));

  return (
    <>
      {compartido && (
        <p className="aviso-plan no-imprimir">
          Es un plan compartido.{" "}
          <button type="button" className="boton" onClick={() => cambiar({})}>
            Guardar como mi viaje
          </button>
        </p>
      )}
      <section className="seccion">
        <div className="formulario-plan">
          <label className="campo">
            <span className="rotulo">Nombre</span>
            <input value={v.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} />
          </label>
          <label className="campo">
            <span className="rotulo">Mes</span>
            <select value={v.mes} onChange={(e) => cambiar({ mes: Number(e.target.value), salida: undefined })}>
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="rotulo">Llegada (opcional)</span>
            <input
              type="date"
              value={v.salida ?? ""}
              onChange={(e) => {
                const salida = fechaValida(e.target.value);
                cambiar(salida ? { salida, mes: Number(salida.slice(5, 7)) - 1 } : { salida: undefined });
              }}
            />
          </label>
          <label className="campo">
            <span className="rotulo">Personas</span>
            <CampoNumero valor={v.personas} min={1} onCambio={(n) => cambiar({ personas: n })} />
          </label>
        </div>
        <p className="resumen-viaje">
          <b>
            {noches + 1} días, {noches} noches
          </b>{" "}
          · {paises.join(" y ")} · {MESES[v.mes]} · <b>{usd(r.porPersona)}</b> por persona (
          <Link href={urlDeViaje(v, "/presupuesto")}>desglose</Link>)
        </p>
      </section>

      <section className="seccion">
        <h2>Itinerario</h2>
        <ol className="etapas-plan">
          {filas.map((e, i) => (
            <li key={e.id}>
              {tramos[i] && (
                <p className={`traslado ${tramos[i]!.volar ? "volar" : ""}`}>
                  {tramos[i]!.volar ? <IconoAvion /> : <IconoCoche />}
                  {tramos[i]!.volar
                    ? `Vuelo interno o avioneta (por carretera serían ~${tramos[i]!.km.toLocaleString("es-ES")} km)`
                    : `~${tramos[i]!.km.toLocaleString("es-ES")} km por carretera, unas ${tramos[i]!.horas} h`}
                </p>
              )}
              <div className="etapa">
                {e.f?.f && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.f.f} alt="" loading="lazy" />
                )}
                <div>
                  <h3>
                    <Link href={`/parque/${e.id}`}>{e.f?.n ?? e.id}</Link>
                  </h3>
                  {fechas[i] && <p className="fechas-etapa">{fechas[i]}</p>}
                  <p className="noches-etapa">
                    <CampoNumero
                      valor={e.noches}
                      min={1}
                      max={30}
                      aria-label={`Noches en ${e.f?.n ?? e.id}`}
                      onCambio={(n) => cambiar({ etapas: v.etapas.map((x, j) => (j === i ? { ...x, noches: n } : x)) })}
                    />{" "}
                    noches
                    <button
                      type="button"
                      className="quitar no-imprimir"
                      onClick={() => cambiar({ etapas: v.etapas.filter((_, j) => j !== i) })}
                    >
                      Quitar
                    </button>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        {v.salida ? (
          <Suscribir
            ruta={urlDeViaje(v, "/viaje.ics")}
            texto="El viaje en tu calendario: cada parque en sus días y los avisos de antes (reservas, vacunas, visados). Si cambias el viaje, vuelve a añadirlo."
          />
        ) : (
          <p className="nota-pie">
            Pon la fecha de llegada para ver los días de cada parque y llevarte el viaje al calendario.
          </p>
        )}
        <div className="no-imprimir">
          <BuscadorParques
            indice={[...indice.values()]}
            excluir={v.etapas.map((e) => e.id)}
            etiqueta="Añadir un parque"
            onElegir={(f) => cambiar({ etapas: [...v.etapas, { id: f.id, noches: 2 }] })}
          />
        </div>
      </section>

      {candidatas.length > 0 && (
        <section className="seccion">
          <h2>Qué verás en {MESES[v.mes]}</h2>
          <div className="tabla-desliza">
            <table className="tabla-comparar tabla-ver">
              <thead>
                <tr>
                  <td />
                  {filas.map((e) => (
                    <th key={e.id} scope="col">
                      {e.f?.n ?? e.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidatas.map((k) => (
                  <tr key={k}>
                    <th scope="row">{nombre.get(k) ?? k}</th>
                    {filas.map((e) => {
                      const f = datos.frecuencia?.[e.id]?.[String(k)];
                      const n = f ? nivelFrecuencia(f[v.mes]) : null;
                      const visto = facil(k, e.id) > 0 || e.f?.e.includes(k);
                      return (
                        <td key={e.id} className={n ? `f-texto-${n.clave}` : visto ? "si" : "no"}>
                          {n && n.clave !== "sin-datos" ? n.texto : visto ? "se ve" : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nota-pie">
            Nivel del mes en los parques destacados (frecuencia en las fotos de los visitantes); «se ve» en el resto
            (observaciones de GBIF, sin desglose por mes).
          </p>
        </section>
      )}

      {delViaje.length > 0 && <ListaVistos especies={delViaje} total={datos.especies.length} />}

      <section className="seccion">
        <h2>Antes de ir</h2>
        <ul className="lista-viaje">
          {lista.map(([id, texto]) => (
            <li key={id}>
              <label>
                <input type="checkbox" checked={hechas.includes(id)} onChange={(e) => marcar(id, e.target.checked)} />{" "}
                <span>{texto}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <p className="enlaces no-imprimir">
        <button
          type="button"
          className="boton"
          onClick={() =>
            navigator.clipboard.writeText(location.origin + urlDeViaje(v)).then(
              () => setCopiado(true),
              () => setCopiado(false),
            )
          }
        >
          {copiado ? "Enlace copiado ✓" : "Copiar enlace para compartir"}
        </button>
        <button type="button" className="boton" onClick={() => window.print()}>
          Imprimir
        </button>
        <Link
          href={`/comparar?p=${v.etapas
            .slice(0, 4)
            .map((e) => e.id)
            .join(",")}`}
        >
          Comparar sus parques
        </Link>
      </p>
    </>
  );
}
