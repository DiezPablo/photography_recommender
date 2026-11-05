import type { Metadata } from "next";
import Link from "next/link";
import { cargarSafaris } from "@/features/safaris/datos";
import {
  EXTERIORES,
  POR_TU_CUENTA,
  PRACTICO,
  REVISADO,
  SANIDAD,
  TEXTO_POR_TU_CUENTA,
  type PorTuCuenta,
} from "@/features/safaris/paises";

export const metadata: Metadata = {
  title: "Cómo organizar un safari",
  description:
    "Tipos de safari, cuándo ir, presupuesto, cómo elegir operador y lodge, salud, ética y equipo de fotografía.",
};

const NIVELES: PorTuCuenta[] = ["turismo", "4x4", "guia"];

export default function PaginaGuiaSafari() {
  const nombre = new Map((cargarSafaris()?.parques ?? []).map((p) => [p.id, p.nombre]));
  return (
    <main className="calendario safaris guia-safari">
      <header className="titular">
        <p className="rotulo">Guía</p>
        <h1>Cómo organizar un safari</h1>
        <p className="entradilla">
          Lo que conviene decidir antes de reservar. Esta web no vende viajes ni cobra comisiones: los enlaces llevan a
          webs oficiales, lodges y operadores, para reservar directamente con ellos.
        </p>
      </header>

      <div className="guia-cuerpo">
        <nav className="guia-indice" aria-label="En esta guía">
          <p>En esta guía</p>
          <a href="#elegir">Elige qué quieres ver y cuándo</a>
          <a href="#tipos">Tipos de safari</a>
          <a href="#presupuesto">Presupuesto: de qué se compone</a>
          <a href="#operador">Cómo elegir un operador o un lodge</a>
          <a href="#salud">Salud y seguridad</a>
          <a href="#etica">Ética</a>
          <a href="#fotografia">Para la fotografía</a>
          <a href="#paises">País a país</a>
          <a href="#por-tu-cuenta">Safari por tu cuenta</a>
        </nav>
        <div className="guia-texto">
          <section className="seccion" id="elegir">
            <h2>1. Elige qué quieres ver y cuándo</h2>
            <p>
              Empieza por el animal o la experiencia: la gran migración, gorilas, tigres, jaguares, osos… En{" "}
              <Link href="/especies">especies</Link> están los parques donde más se ve cada uno, y en cada parque, su
              mejor época, el clima de cada mes y lo que se ha visto en los últimos 30 días.
            </p>
            <ul>
              <li>
                <b>Estación seca</b> (en gran parte de África austral, de mayo a octubre; en la oriental, de junio a
                octubre y de enero a febrero): la hierba es baja y los animales se concentran en el agua. Es la
                temporada alta: más caro y más vehículos.
              </li>
              <li>
                <b>Estación de lluvias o «verde»</b>: paisaje verde, crías, aves migratorias y precios más bajos, pero
                animales más dispersos y algunas pistas cortadas.
              </li>
              <li>
                <b>No intentes ver demasiados parques</b>: en el mapa parecen cerca, pero por pista se tarda mucho más.
                En cada ficha, «Combínalo con» da distancias y tiempos aproximados; mejor 3-4 noches por parque.
              </li>
              <li>
                En la <b>India</b> muchos parques de tigres cierran con el monzón (julio-septiembre); en marzo-mayo, con
                el calor, los tigres se ven más junto al agua.
              </li>
            </ul>
          </section>

          <section className="seccion" id="tipos">
            <h2>2. Tipos de safari</h2>
            <dl className="tipos-safari">
              <dt>En coche propio</dt>
              <dd>
                Lo más barato y libre: Kruger, Etosha, Kgalagadi, Pilanesberg o Yellowstone tienen pistas y campamentos
                pensados para ir por tu cuenta. Respeta horarios de puertas y no bajes del coche.
              </dd>
              <dt>En 4x4 con guía</dt>
              <dd>
                Lo habitual en África oriental, Botsuana o la India. Pregunta cuántas personas van por vehículo y si
                todas tienen ventana; un vehículo privado permite quedarse esperando en un avistamiento.
              </dd>
              <dt>A pie</dt>
              <dd>
                Con guía y guarda armado: se ven menos animales grandes pero se aprende muchísimo (huellas, plantas,
                insectos). Luangwa Sur es el sitio clásico.
              </dd>
              <dt>En barco o canoa</dt>
              <dd>Chobe, el Okavango (mokoro), el Zambeze, el Pantanal o Borneo: otra perspectiva y muy fotogénica.</dd>
              <dt>Seguimiento de primates</dt>
              <dd>
                Gorilas y chimpancés con permisos limitados por día (en Uganda y Ruanda se agotan con meses de
                antelación). Una hora con el grupo, a varios metros y con mascarilla.
              </dd>
              <dt>Nocturno</dt>
              <dd>Solo en reservas privadas y algunos parques: leopardos, hienas y pequeños carnívoros.</dd>
            </dl>
          </section>

          <section className="seccion" id="presupuesto">
            <h2>3. Presupuesto: de qué se compone</h2>
            <ul>
              <li>
                <b>Tasas del parque</b>, por persona y día (en Tanzania o Kenia, una parte grande del coste). Cada ficha
                indica la tasa cuando es conocida, con su año.
              </li>
              <li>
                <b>Alojamiento</b>: desde campings y bandas (alojamientos del propio parque) hasta lodges de lujo con
                todo incluido. Dormir dentro del parque ahorra horas de pista.
              </li>
              <li>
                <b>Vehículo y guía</b> (o alquiler de 4x4 equipado), combustible y vuelos internos en avioneta, que
                tienen límite de equipaje de unos 15-20 kg en bolsa blanda.
              </li>
              <li>
                <b>Visados, vacunas, seguro y propinas</b> (habituales para guías y personal en África).
              </li>
            </ul>
            <h3>Cifras orientativas</h3>
            <ul>
              <li>
                Safari de gama media en África oriental o austral, todo incluido: unos 350-750 USD por persona y día; el
                lujo pasa de 1000 USD por noche.
              </li>
              <li>
                Vuelo en avioneta entre parques (unos 45 min): 400-800 USD ida y vuelta. Equipaje de 15-20 kg en bolsa
                blanda, sin ruedas.
              </li>
              <li>
                Propinas (se dan en efectivo al final de cada estancia): unos 10-20 USD por persona y día al guía y otro
                tanto al personal del campamento, en el bote común.
              </li>
              <li>Vacunas y profilaxis de la malaria: 50-200 € por persona según el país.</li>
            </ul>
            <p className="nota-pie">
              Fuentes: guías de viaje y operadores (Winetraveler, Discover Africa, Aardvark Safaris, Yellow Zebra
              Safaris). Cambian con la temporada y el país: úsalas para comparar presupuestos, no como precio.
            </p>
            <p>
              Para ahorrar: viajar en temporada intermedia, combinar parques cercanos para reducir traslados, ir en
              coche propio donde se pueda y reservar el alojamiento directamente.
            </p>
          </section>

          <section className="seccion" id="operador">
            <h2>4. Cómo elegir un operador o un lodge</h2>
            <ul>
              <li>
                <b>Licencia y asociación</b>: que tenga licencia de turismo del país y, mejor, que pertenezca a la
                asociación local de operadores (por ejemplo{" "}
                <a href="https://www.katokenya.org/" target="_blank" rel="noopener">
                  KATO
                </a>{" "}
                en Kenia, TATO en Tanzania, AUTO en Uganda o{" "}
                <a href="https://www.satsa.com/" target="_blank" rel="noopener">
                  SATSA
                </a>{" "}
                en Sudáfrica). En Sudáfrica los guías se certifican con FGASA.
              </li>
              <li>
                <b>Pide por escrito</b> qué incluye (tasas, comidas, agua, traslados), cuántas personas van por
                vehículo, horas de safari al día, si el vehículo es exclusivo y la política de cancelación.
              </li>
              <li>
                <b>Reseñas recientes</b> en varias plataformas (los enlaces de «Reseñas» abren Google Maps). Desconfía
                de precios muy por debajo del resto: suelen recortar en tasas, vehículos o salarios.
              </li>
              <li>
                <b>Paga con garantías</b>: tarjeta o transferencia con contrato y factura, nunca todo por adelantado a
                alguien sin dirección ni licencia verificable.
              </li>
              <li>
                <b>Turismo responsable</b>: operadores que contratan guías locales y apoyan a las comunidades y
                conservancias vecinas.
              </li>
            </ul>
          </section>

          <section className="seccion" id="salud">
            <h2>5. Salud y seguridad</h2>
            <ul>
              <li>
                Pide cita en un Centro de Vacunación Internacional (
                <a href="https://www.sanidad.gob.es/" target="_blank" rel="noopener">
                  Ministerio de Sanidad
                </a>
                ) con 6-8 semanas de antelación: fiebre amarilla (obligatoria para entrar en algunos países) y
                prevención de la malaria según la zona y la época.
              </li>
              <li>Seguro de viaje con evacuación médica: muchos parques están a horas de un hospital.</li>
              <li>Sigue siempre las instrucciones del guía y no bajes del vehículo salvo en zonas permitidas.</li>
            </ul>
          </section>

          <section className="seccion" id="etica">
            <h2>6. Ética</h2>
            <ul>
              <li>
                Nada de actividades con fauna en cautividad: paseos con leones, montar en elefante, fotos con cachorros.
              </li>
              <li>
                No pidas al guía salirse de las pistas, acercarse demasiado o acosar a un animal para la foto; menos
                vehículos y más distancia también son mejores fotos.
              </li>
              <li>Los drones están prohibidos en la mayoría de parques nacionales del mundo sin permiso.</li>
            </ul>
          </section>

          <section className="seccion" id="fotografia">
            <h2>7. Para la fotografía</h2>
            <ul>
              <li>
                Un teleobjetivo de 100-400 o 150-600 mm cubre casi todo; un angular para paisaje y animales cerca.
              </li>
              <li>Un saco de apoyo (bolsa de arroz o «beanbag») en la ventanilla sustituye al trípode.</li>
              <li>Ropa de colores neutros, prismáticos y baterías y tarjetas de sobra (no siempre hay enchufe).</li>
              <li>
                Las mejores horas son las primeras y últimas del día: coinciden con la luz y con la actividad animal.
              </li>
            </ul>
          </section>
          <section className="seccion" id="paises">
            <h2>8. País a país</h2>
            <p className="nota-pie">
              Para pasaporte español, revisado el {REVISADO}. Visados y requisitos sanitarios cambian a menudo:
              confírmalo en la web oficial,{" "}
              <a href={EXTERIORES} target="_blank" rel="noopener">
                Exteriores ↗
              </a>{" "}
              y un{" "}
              <a href={SANIDAD} target="_blank" rel="noopener">
                centro de vacunación internacional ↗
              </a>
              .
            </p>
            <div className="tabla-desliza">
              <table className="tabla-comparar tabla-paises">
                <thead>
                  <tr>
                    <th scope="col">País</th>
                    <th scope="col">Visado</th>
                    <th scope="col">Fiebre amarilla</th>
                    <th scope="col">Malaria</th>
                    <th scope="col">Enchufes</th>
                    <th scope="col">Conducción</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PRACTICO).map(([pais, x]) => (
                    <tr key={pais}>
                      <th scope="row">{pais}</th>
                      <td>
                        {x.visado.texto}{" "}
                        <a href={x.visado.url} target="_blank" rel="noopener">
                          ↗
                        </a>
                      </td>
                      <td>{x.fiebreAmarilla}</td>
                      <td>{x.malaria}</td>
                      <td>{x.enchufes.join(", ")}</td>
                      <td>por la {x.conduce}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="seccion" id="por-tu-cuenta">
            <h2>9. Safari por tu cuenta</h2>
            <p>
              En el sur de África se puede alquilar un coche e ir por libre: más barato y a tu ritmo, pero sin guía que
              encuentre los animales (los tablones de avistamientos de los campamentos ayudan). Respeta los horarios de
              puertas, no salgas del coche fuera de las zonas señaladas y reserva los campamentos con antelación. En
              África oriental lo normal es ir con guía-conductor.
            </p>
            {NIVELES.map((n) => (
              <p key={n}>
                <b>{TEXTO_POR_TU_CUENTA[n]}:</b>{" "}
                {Object.entries(POR_TU_CUENTA)
                  .filter(([, t]) => t.nivel === n)
                  .map(([id], i) => (
                    <span key={id}>
                      {i > 0 && ", "}
                      <Link href={`/parque/${id}#organiza`}>{nombre.get(id) ?? id}</Link>
                    </span>
                  ))}
                .
              </p>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
