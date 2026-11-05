// «Organiza tu viaje»: datos reales de cada parque para planificarlo. Cómo llegar (aeropuertos y pistas de
// OurAirports), puertas de entrada, pueblos, operadores y alojamientos (OpenStreetMap), y enlaces oficiales.
import Link from "next/link";
import { asociacionDe } from "@/features/safaris/asociaciones";
import { practicoDe } from "@/features/safaris/paises";
import { ItemsPais, PorTuCuenta } from "./PracticoPais";
import { enlaceResenas, type LugarOsm, type Pais, type ParqueMundo, urlWeb } from "@/features/safaris/modelo";

const EXTERIORES = "https://www.exteriores.gob.es/";

function Contacto({ l }: { l: LugarOsm }) {
  const web = urlWeb(l.web);
  return (
    <span className="enlaces">
      {web && (
        <a href={web} target="_blank" rel="noopener">
          Web ↗
        </a>
      )}
      {l.telefono && <a href={`tel:${l.telefono}`}>{l.telefono}</a>}
      {l.email && <a href={`mailto:${l.email}`}>Correo</a>}
      <a href={enlaceResenas(l)} target="_blank" rel="noopener">
        Reseñas ↗
      </a>
    </span>
  );
}

export default function OrganizaViaje({
  p,
  pais,
  nombre,
  conAlojamientos = true,
}: {
  p: ParqueMundo;
  pais?: Pais;
  nombre: string;
  /** en los parques del catálogo los alojamientos ya salen en su propia sección */
  conAlojamientos?: boolean;
}) {
  const o = p.osm;
  const { aeropuertos, pistas, n_pistas } = p.llegar;
  return (
    <section className="seccion organiza" id="organiza">
      <h2 className="rotulo">Organiza tu viaje a {nombre}</h2>
      <div className="organiza-grid">
        <div>
          <h3>Cómo llegar</h3>
          <ul className="lista-organiza">
            {aeropuertos.map((a) => (
              <li key={a.iata}>
                <b>
                  {a.nombre} ({a.iata})
                </b>
                <small>
                  {a.internacional ? "gran aeropuerto internacional" : "vuelos regulares"}
                  {a.ciudad ? ` · ${a.ciudad}` : ""} · a {a.km} km en línea recta
                </small>
              </li>
            ))}
            {n_pistas > 0 && (
              <li>
                <b>
                  {n_pistas} {n_pistas === 1 ? "pista de aterrizaje" : "pistas de aterrizaje"} en la zona del parque (a
                  menos de {Math.round(p.radio_km + 5)} km del centro)
                </b>
                <small>
                  Para llegar en avioneta (vuelos chárter o regulares de safari); confirma con el lodge cuál le queda
                  cerca: {pistas.map((x) => `${x.nombre} (${x.km} km)`).join(", ")}
                </small>
              </li>
            )}
          </ul>
          {o && o.puertas.length > 0 && (
            <>
              <h3>Puertas de entrada</h3>
              <ul className="lista-organiza">
                {o.puertas.map((x) => (
                  <li key={`${x.lat},${x.lon}`}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {x.nombre} ↗
                    </a>{" "}
                    <small>a {x.km} km del centro</small>
                  </li>
                ))}
              </ul>
            </>
          )}
          {o && o.pueblos.length > 0 && (
            <>
              <h3>Pueblos y ciudades cerca</h3>
              <p>{o.pueblos.map((x) => `${x.nombre} (${x.km} km)`).join(" · ")}</p>
            </>
          )}
        </div>
        <div>
          <h3>Antes de ir</h3>
          <ul className="lista-organiza">
            {pais?.nombre && practicoDe(pais.nombre) && <ItemsPais pais={pais.nombre} x={practicoDe(pais.nombre)!} />}
            {pais?.nombre && !practicoDe(pais.nombre) && (
              <li>
                <b>Visado, salud y seguridad:</b>{" "}
                <a href={EXTERIORES} target="_blank" rel="noopener">
                  Ministerio de Asuntos Exteriores ↗
                </a>{" "}
                (en «Recomendaciones de viaje», busca {pais.nombre})
              </li>
            )}
            {(pais?.moneda || pais?.idiomas.length) && (
              <li>
                {pais?.moneda && (
                  <>
                    <b>Moneda:</b> {pais.moneda}.{" "}
                  </>
                )}
                {pais?.idiomas.length ? (
                  <>
                    <b>Idiomas:</b> {pais.idiomas.join(", ")}.
                  </>
                ) : null}
              </li>
            )}
            {p.web && (
              <li>
                <b>Entradas y normas:</b>{" "}
                <a href={p.web} target="_blank" rel="noopener">
                  web oficial ↗
                </a>
              </li>
            )}
            {p.wdpa && (
              <li>
                <b>Ficha del espacio protegido:</b>{" "}
                <a href={`https://www.protectedplanet.net/${p.wdpa}`} target="_blank" rel="noopener">
                  Protected Planet ↗
                </a>
              </li>
            )}
            {p.wiki && (
              <li>
                <a href={p.wiki} target="_blank" rel="noopener">
                  Artículo en Wikipedia ↗
                </a>
              </li>
            )}
          </ul>
          <PorTuCuenta id={p.id} lat={p.lat} lon={p.lon} zona={practicoDe(pais?.nombre)?.zona} />
        </div>
      </div>
      <EmpresasParaOrganizarlo p={p} pais={pais} />
      {conAlojamientos && o && o.alojamientos.length > 0 && (
        <>
          <h3>Dónde dormir</h3>
          <ul className="lista-alojamientos">
            {o.alojamientos.map((a) => (
              <li key={a.osm}>
                <b>{a.nombre}</b>{" "}
                <small>
                  {a.tipo} · a {a.km} km del centro
                </small>
                <Contacto l={a} />
              </li>
            ))}
          </ul>
        </>
      )}
      {!o && <p className="nota-pie">Los alojamientos, operadores y puertas de este parque se están recopilando.</p>}
      <p className="nota-pie">
        Aeropuertos de OurAirports; puertas, pueblos, operadores y alojamientos de OpenStreetMap: datos abiertos que
        pueden estar incompletos. Sin comisiones ni anuncios: reserva directamente y lee reseñas recientes.
      </p>
    </section>
  );
}

const VISIBLES = 5;

/** Los cinco primeros a la vista; el resto, plegado. */
function ListaPlegable({ lista, conKm = false }: { lista: LugarOsm[]; conKm?: boolean }) {
  const fila = (x: LugarOsm) => (
    <li key={x.osm ?? x.nombre}>
      <b>{x.nombre}</b>
      {conKm && <small> a {x.km} km</small>}
      <Contacto l={x} />
    </li>
  );
  return (
    <>
      <ul className="lista-organiza">{lista.slice(0, VISIBLES).map(fila)}</ul>
      {lista.length > VISIBLES && (
        <details className="mas-organiza">
          <summary>Ver {lista.length - VISIBLES} más</summary>
          <ul className="lista-organiza">{lista.slice(VISIBLES).map(fila)}</ul>
        </details>
      )}
    </>
  );
}

/** Empresas para organizar el safari: operadores de la ciudad de acceso y de la zona (OSM), la asociación
 * oficial del país y lo que hay que comprobar antes de pagar. */
function EmpresasParaOrganizarlo({ p, pais }: { p: ParqueMundo; pais?: Pais }) {
  const asociacion = asociacionDe(pais?.nombre);
  const ciudad = p.operadores_ciudad;
  const zona = (p.osm?.operadores ?? []).filter((x) => !ciudad?.lista.some((c) => c.nombre === x.nombre));
  return (
    <div className="empresas-safari" id="empresas">
      <h3>Empresas para organizarlo</h3>
      <div className="organiza-grid">
        <div>
          {ciudad && ciudad.lista.length > 0 && (
            <>
              <p>
                <b>Operadores y agencias en {ciudad.ciudad}</b>, desde donde se organizan los safaris de este parque:
              </p>
              <ListaPlegable lista={ciudad.lista} />
            </>
          )}
          {zona.length > 0 && (
            <>
              <p>
                <b>En la zona del parque:</b>
              </p>
              <ListaPlegable lista={zona} conKm />
            </>
          )}
          {(ciudad?.lista.length || zona.length) > 0 && (
            <p className="nota-pie">
              Sacados de OpenStreetMap: no es una recomendación ni sabemos si tienen licencia. Antes de pagar,
              compruébalo{asociacion ? ` en el directorio de ${asociacion.sigla}` : ""} y mira sus reseñas.
            </p>
          )}
          {!ciudad?.lista.length && !zona.length && (
            <>
              <p>
                OpenStreetMap aún no tiene operadores de esta zona con web o teléfono.
                {asociacion && (
                  <>
                    {" "}
                    Lo más fiable: el{" "}
                    <a href={asociacion.url} target="_blank" rel="noopener">
                      directorio de socios de {asociacion.sigla} ↗
                    </a>
                    .
                  </>
                )}
              </p>
              {p.acceso && (
                <p>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent("safari tour operator")}/@${p.acceso.lat},${p.acceso.lon},12z`}
                    target="_blank"
                    rel="noopener"
                  >
                    Operadores de safari en {p.acceso.ciudad} (Google Maps) ↗
                  </a>
                  , con reseñas: es desde donde se suelen organizar los safaris de este parque.
                </p>
              )}
              <p>Los lodges suelen organizar también los safaris de sus huéspedes (vehículo, guía y traslados).</p>
            </>
          )}
        </div>
        <div>
          {asociacion && (
            <p>
              <b>Operadores con licencia:</b> busca en el directorio de{" "}
              <a href={asociacion.url} target="_blank" rel="noopener">
                {asociacion.sigla} ({asociacion.nombre}) ↗
              </a>
              . Sus miembros tienen licencia del país y un código de conducta.
            </p>
          )}
          <p>
            <b>Antes de pagar, pide por escrito:</b>
          </p>
          <ul className="lista-checks">
            <li>Licencia de turismo del país (y, mejor, socio de la asociación local).</li>
            <li>Qué incluye: tasas del parque, alojamiento, comidas, agua, traslados y vuelos internos.</li>
            <li>Vehículo: cuántas personas, si todas van con ventana y si es exclusivo.</li>
            <li>Horas de safari al día y si se puede salir al amanecer.</li>
            <li>Política de cancelación y forma de pago con factura (nunca todo por adelantado sin contrato).</li>
          </ul>
          <p className="nota-pie">
            Lee reseñas recientes en varias webs y desconfía de precios muy por debajo del resto. Más en{" "}
            <Link href="/guia#operador">cómo elegir un operador</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
