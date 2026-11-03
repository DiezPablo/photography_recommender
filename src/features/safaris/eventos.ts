// Calendario de fenómenos: lo que los recuentos de observaciones no capturan (la «reunión» de elefantes de
// Minneriya, el desove de las tortugas, la crecida del Okavango…), escrito a mano con su fuente (consultadas el
// 03-11-2026), más los partos y los cruces de la gran migración (migracion.ts). Meses 1-12; las fechas exactas
// cambian de un año a otro.
import { MIGRACION } from "@/features/safaris/migracion";

/** Fecha de la última revisión (la comprueba .github/scripts/revision_datos.py). */
export const REVISADO_EVENTOS = "03-11-2026";

export interface Evento {
  id: string;
  /** parque del catálogo */
  parque: string;
  /** especie (nombre científico), si el fenómeno es de una */
  especie?: string;
  meses: number[];
  /** meses de más intensidad, si se conocen */
  pico?: number[];
  titulo: string;
  descripcion: string;
  fuente: string;
}

const CURADOS: Evento[] = [
  {
    id: "minneriya-reunion",
    parque: "minneriya",
    especie: "Elephas maximus",
    meses: [7, 8, 9, 10],
    pico: [8, 9],
    titulo: "La «reunión» de elefantes",
    descripcion:
      "Al bajar el embalse brota hierba en las orillas y se juntan cientos de elefantes asiáticos: una de las mayores concentraciones de Asia.",
    fuente: "https://www.timeout.com/sri-lanka/attractions/minneriya-gathering",
  },
  {
    id: "tortuguero-tortugas",
    parque: "tortuguero",
    especie: "Chelonia mydas",
    meses: [7, 8, 9, 10],
    pico: [8],
    titulo: "Desove de la tortuga verde",
    descripcion:
      "Miles de tortugas verdes suben a poner en la playa de noche; las crías nacen de septiembre a diciembre. De noche solo con guía.",
    fuente:
      "https://wwf.panda.org/discover/our_focus/wildlife_practice/profiles/fish_marine/marine_turtles/lac_marine_turtle_programme/nesting_costarica/parque_nacional_tortuguero",
  },
  {
    id: "valdes-ballenas",
    parque: "valdes",
    especie: "Eubalaena australis",
    meses: [6, 7, 8, 9, 10, 11, 12],
    pico: [9, 10],
    titulo: "Ballenas francas australes",
    descripcion: "Llegan a los golfos a parir y criar; en septiembre y octubre se ven cientos, muchas con su cría.",
    fuente:
      "https://www.argentina.travel/en/news/southern-right-whale-in-argentina-when-and-where-to-see-them-in-their-natural-habitat",
  },
  {
    id: "churchill-osos",
    parque: "churchill",
    especie: "Ursus maritimus",
    meses: [10, 11],
    titulo: "Osos polares esperando el hielo",
    descripcion:
      "Se concentran en la costa a la espera de que se hiele la bahía de Hudson para volver a cazar focas; el pico, a finales de octubre.",
    fuente: "https://travelmanitoba.com/blog/20-polar-bear-photos-that-will-inspire-and-amaze-you",
  },
  {
    id: "okavango-crecida",
    parque: "moremi",
    meses: [6, 7, 8],
    titulo: "La crecida del Okavango",
    descripcion:
      "El agua de las lluvias de Angola llega meses después y en plena estación seca: canales llenos, mokoro y fauna concentrada en las islas.",
    fuente: "https://en.wikipedia.org/wiki/Okavango_Delta",
  },
  {
    id: "liuwa-nus",
    parque: "liuwa",
    especie: "Connochaetes taurinus",
    meses: [11],
    titulo: "Migración de ñus de Liuwa",
    descripcion:
      "La segunda mayor migración de ñus de África llega a las llanuras con las primeras lluvias (octubre-noviembre), seguida por las hienas.",
    fuente: "https://www.africanparks.org/the-parks/liuwa-plain",
  },
  {
    id: "katmai-salmon",
    parque: "katmai",
    especie: "Ursus arctos",
    meses: [7, 9],
    titulo: "Osos pescando salmón",
    descripcion:
      "En julio, en las cascadas de Brooks, a la subida del salmón; en septiembre, a lo largo del río, engordando antes del invierno.",
    fuente: "https://www.nps.gov/katm/planyourvisit/bear-watching.htm",
  },
  {
    id: "pantanal-jaguares",
    parque: "pantanal",
    especie: "Panthera onca",
    meses: [7, 8, 9, 10],
    pico: [8, 9],
    titulo: "Jaguares en las orillas",
    descripcion:
      "Con el agua baja, los jaguares cazan a lo largo de los ríos y se ven desde la barca (Porto Jofre); de noviembre a marzo, muy difícil.",
    fuente: "https://www.lorenzoexpeditions.com/porto-jofre-or-pocone-the-best-place-for-jaguar-safaris/",
  },
  {
    id: "chobe-elefantes",
    parque: "chobe",
    especie: "Loxodonta africana",
    meses: [9, 10],
    titulo: "Elefantes en el río Chobe",
    descripcion:
      "Al final de la estación seca miles de elefantes bajan a beber y a cruzar el río: se ven mejor desde la barca.",
    fuente: "https://www.chobe.com/best-time-to-visit-chobe.php",
  },
];

/** Partos y cruces de la gran migración, a partir del calendario mes a mes. */
function deMigracion(): Evento[] {
  const salida: Evento[] = [];
  const grupos: [string, (z: (typeof MIGRACION)[number]) => boolean, string, string][] = [
    ["partos", (z) => !!z.partos, "Partos de los ñus", "Miles de crías al día y, con ellas, grandes felinos e hienas."],
    ["cruces", (z) => !!z.cruces, "Cruces de ríos", "Las manadas cruzan el Grumeti y el Mara, con cocodrilos."],
  ];
  for (const [clave, filtro, titulo, descripcion] of grupos) {
    const porParque = new Map<string, number[]>();
    for (const z of MIGRACION.filter(filtro)) porParque.set(z.parque, [...(porParque.get(z.parque) ?? []), z.mes]);
    for (const [parque, meses] of porParque)
      salida.push({
        id: `migracion-${clave}-${parque}`,
        parque,
        especie: "Connochaetes taurinus",
        meses,
        titulo,
        descripcion,
        fuente: "/migracion",
      });
  }
  return salida;
}

export const EVENTOS: Evento[] = [...CURADOS, ...deMigracion()];

export function eventosDe(parque: string): Evento[] {
  return EVENTOS.filter((e) => e.parque === parque);
}

export function eventosEn(mes: number): Evento[] {
  return EVENTOS.filter((e) => e.meses.includes(mes));
}

export function eventosDeEspecie(cientifico: string): Evento[] {
  return EVENTOS.filter((e) => e.especie === cientifico);
}
