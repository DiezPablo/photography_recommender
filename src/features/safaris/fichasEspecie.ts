// Contexto y consejos de fotografía de las especies principales (T25, T45): estado en la Lista Roja de la UICN,
// tamaño, cuándo está activa, qué fotografiar y a qué distancia suele verse en un safari. Escrito a mano con la
// Lista Roja y las guías de campo; orientativo. Revisión anual con .github/scripts/revision_datos.py.

export const REVISADO_FICHAS = "05-11-2026";

export type Uicn = "LC" | "NT" | "VU" | "EN" | "CR";

export const TEXTO_UICN: Record<Uicn, string> = {
  LC: "Preocupación menor",
  NT: "Casi amenazada",
  VU: "Vulnerable",
  EN: "En peligro",
  CR: "En peligro crítico",
};

export interface FichaEspecie {
  uicn: Uicn;
  tamano: string;
  /** cuándo está más activa */
  actividad: string;
  /** comportamientos que dan buenas fotos */
  fotogenico: string[];
  /** distancia típica en un safari y focal */
  distancia: string;
  /** consejo para verla */
  consejo: string;
}

export const FICHAS: Record<string, FichaEspecie> = {
  "Panthera leo": {
    uicn: "VU",
    tamano: "Macho de 150 a 225 kg; hembra, unos 120 kg.",
    actividad: "Al amanecer, al atardecer y de noche; de día duerme hasta 20 horas.",
    fotogenico: ["Bostezos y saludos entre la manada", "Cachorros jugando", "Machos rugiendo al amanecer"],
    distancia: "A menudo a 20-50 m del vehículo: 100-400 mm basta.",
    consejo: "Sal con la primera luz: es cuando se mueven; a mediodía estarán tumbados a la sombra.",
  },
  "Loxodonta africana": {
    uicn: "EN",
    tamano: "Hasta 6 t y 3,5 m a la cruz.",
    actividad: "Todo el día; bebe y se baña sobre todo de mediodía a media tarde en la época seca.",
    fotogenico: ["Baños de barro y polvo", "Crías junto a la madre", "Manadas cruzando ríos"],
    distancia: "De 30 a 100 m; con angular también, si el guía lo ve tranquilo.",
    consejo: "Respeta las orejas abiertas y los cabeceos: es un aviso; nunca entre la madre y la cría.",
  },
  "Panthera pardus": {
    uicn: "VU",
    tamano: "Macho de 30 a 90 kg.",
    actividad: "Sobre todo de noche y en las horas de penumbra.",
    fotogenico: ["Descansando en una rama", "Bajando del árbol al atardecer", "Con la presa subida al árbol"],
    distancia: "De 20 a 80 m, a menudo entre ramas: 400-600 mm ayuda.",
    consejo: "Busca presas colgadas en los árboles y sigue el aviso de los monos y los impalas.",
  },
  "Syncerus caffer": {
    uicn: "NT",
    tamano: "Hasta 900 kg.",
    actividad: "Pasta en las horas frescas y de noche; descansa al calor.",
    fotogenico: ["Manadas levantando polvo", "Machos viejos en el barro", "Picabueyes posados"],
    distancia: "De 20 a 100 m: 100-400 mm.",
    consejo: "Los machos solitarios («dagga boys») son los más imprevisibles: distancia, sobre todo a pie.",
  },
  "Ceratotherium simum": {
    uicn: "NT",
    tamano: "Hasta 2,3 t.",
    actividad: "Pasta de mañana, al atardecer y de noche; a mediodía descansa o se revuelca.",
    fotogenico: ["Madre y cría pastando", "Revolcones en el barro"],
    distancia: "De 30 a 100 m: 100-400 mm.",
    consejo: "Por su seguridad, no compartas la ubicación de las fotos (desactiva el GPS de la cámara).",
  },
  "Diceros bicornis": {
    uicn: "CR",
    tamano: "Hasta 1,4 t.",
    actividad: "Ramonea al atardecer y de noche; muy discreto de día entre los arbustos.",
    fotogenico: ["Bebiendo de noche en una charca iluminada", "Ramoneando con el labio en punta"],
    distancia: "Suele verse lejos o de noche: 400-600 mm y una cámara que aguante ISO alto.",
    consejo: "Las charcas iluminadas de Etosha son el mejor sitio para verlo. Nunca compartas su ubicación.",
  },
  "Acinonyx jubatus": {
    uicn: "VU",
    tamano: "De 35 a 65 kg.",
    actividad: "De día: caza a primera hora y al final de la tarde, cuando los leones descansan.",
    fotogenico: ["Vigilando desde un termitero o un capó", "Carreras de caza", "Madres con cachorros"],
    distancia: "De 30 a 150 m; en carrera, lejos: 400-600 mm y velocidad alta.",
    consejo: "Ten paciencia con un guepardo que mira fijo a una manada: la carrera dura segundos.",
  },
  "Connochaetes taurinus": {
    uicn: "LC",
    tamano: "De 170 a 270 kg.",
    actividad: "De día, siempre en movimiento detrás de la lluvia y el pasto.",
    fotogenico: ["Cruces de ríos", "Columnas de la migración", "Partos en las llanuras (enero-marzo)"],
    distancia: "De cerca a muy lejos: del angular para la manada al 400 mm para los cruces.",
    consejo: "En los cruces, espera lejos de la orilla y en silencio: si se asustan, dan media vuelta.",
  },
  "Giraffa camelopardalis": {
    uicn: "VU",
    tamano: "Hasta 5,5 m de alto y 1,2 t.",
    actividad: "De día; come muchas horas al día y duerme muy poco.",
    fotogenico: ["Bebiendo con las patas abiertas", "Peleas de cuello entre machos", "Siluetas al atardecer"],
    distancia: "De 20 a 100 m; el formato vertical funciona.",
    consejo: "Las acacias en flor y el atardecer dan las siluetas clásicas.",
  },
  "Lycaon pictus": {
    uicn: "EN",
    tamano: "De 18 a 36 kg.",
    actividad: "Al amanecer y al atardecer, cuando caza en grupo.",
    fotogenico: ["Saludos de la jauría antes de cazar", "Cachorros en la madriguera (junio-agosto)"],
    distancia: "De 20 a 60 m cuando descansan; en caza, imposibles de seguir.",
    consejo: "Pregunta por las madrigueras activas en invierno austral: es cuando se quedan quietos semanas.",
  },
  "Gorilla beringei": {
    uicn: "CR",
    tamano: "Macho de espalda plateada, hasta 200 kg.",
    actividad: "De día; come por la mañana, descansa a mediodía.",
    fotogenico: ["El macho de espalda plateada vigilando", "Crías trepando", "Miradas a pocos metros"],
    distancia: "Entre 7 y 10 m (la norma), a menudo menos: 24-105 o 70-200 mm.",
    consejo:
      "Sin flash y con ISO alto: el bosque es oscuro. La hora con el grupo pasa volando: no la pases mirando la pantalla.",
  },
  "Pan troglodytes": {
    uicn: "EN",
    tamano: "De 40 a 70 kg.",
    actividad: "De día; muy activos a primera hora, cuando bajan de los nidos.",
    fotogenico: ["Acicalamiento", "Crías con la madre", "Llamadas en grupo"],
    distancia: "De 5 a 30 m, a menudo arriba en los árboles: 70-200 o 100-400 mm.",
    consejo: "Ropa de manga larga y pantalón: se camina deprisa por el bosque detrás del grupo.",
  },
  "Panthera tigris": {
    uicn: "EN",
    tamano: "Macho de bengala de 180 a 260 kg.",
    actividad: "Al amanecer, al atardecer y de noche; en la época seca, en las charcas a media mañana.",
    fotogenico: ["Bebiendo en una charca", "Caminando por la pista", "Madres con cachorros"],
    distancia: "De 20 a 100 m: 100-500 mm.",
    consejo:
      "Reserva varios turnos: en ningún parque se ve en todos. Los de marzo a junio, con menos hojas, son los mejores.",
  },
  "Panthera onca": {
    uicn: "NT",
    tamano: "Macho de 60 a 120 kg (los del Pantanal, los más grandes).",
    actividad: "Al amanecer, al atardecer y de noche; en el Pantanal descansa en las orillas a cualquier hora.",
    fotogenico: ["Tumbado en la orilla", "Nadando para cruzar el río", "Cazando caimanes"],
    distancia: "De 20 a 80 m desde la barca: 100-600 mm.",
    consejo: "En la época seca (julio-octubre) los ríos bajan y se concentran en las orillas.",
  },
  "Pongo pygmaeus": {
    uicn: "CR",
    tamano: "Macho de 50 a 90 kg.",
    actividad: "De día, en los árboles; bajan poco al suelo.",
    fotogenico: ["Madre con cría colgada", "Machos con mejillas (bridas)", "Comiendo fruta"],
    distancia: "De 10 a 30 m y siempre arriba: 100-400 mm y compensar el contraluz del cielo.",
    consejo:
      "Las plataformas de alimentación de Tanjung Puting aseguran el avistamiento; en el bosque libre es más difícil.",
  },
  "Ursus maritimus": {
    uicn: "VU",
    tamano: "Macho de 350 a 700 kg.",
    actividad: "Cualquier hora; en Churchill esperan a que se hiele la bahía (octubre-noviembre).",
    fotogenico: ["Machos jugando a pelear", "Madres con oseznos", "Con la luz rasante del otoño ártico"],
    distancia: "Desde vehículos de tundra, a pocos metros: 70-200 y 100-400 mm.",
    consejo: "Funda contra el frío y baterías de repuesto en un bolsillo interior: el frío las vacía.",
  },
  "Ursus arctos": {
    uicn: "LC",
    tamano: "Macho costero de Alaska, hasta 600 kg.",
    actividad: "Al amanecer y al atardecer; en las corrientes de salmón, todo el día.",
    fotogenico: ["Pescando salmón en las cascadas (julio)", "Madres con oseznos", "Peleas por el sitio"],
    distancia: "Desde plataformas, de 10 a 50 m: 100-400 mm.",
    consejo: "En Katmai, la plataforma de Brooks Falls tiene turnos: llega pronto en julio.",
  },
  "Canis lupus": {
    uicn: "LC",
    tamano: "De 30 a 60 kg.",
    actividad: "Al amanecer y al atardecer.",
    fotogenico: ["Manada cruzando un valle nevado", "Aullidos"],
    distancia: "A menudo a cientos de metros: 500-600 mm o más y telescopio para buscarlos.",
    consejo: "Únete a los observadores del valle de Lamar al amanecer: comparten dónde están.",
  },
  "Hippopotamus amphibius": {
    uicn: "VU",
    tamano: "Hasta 3 t.",
    actividad: "En el agua de día; sale a pastar de noche.",
    fotogenico: ["Bostezos (son amenazas)", "Peleas de machos", "Saliendo del agua al atardecer"],
    distancia: "De 20 a 80 m: 100-400 mm.",
    consejo: "Nunca entre un hipopótamo y el agua, sobre todo al anochecer.",
  },
  "Crocuta crocuta": {
    uicn: "LC",
    tamano: "Hembra (más grande que el macho) de 45 a 80 kg.",
    actividad: "Sobre todo de noche; en las madrigueras, de día.",
    fotogenico: ["Cachorros en la madriguera", "Disputas con leones por una presa"],
    distancia: "De 15 a 60 m: 100-400 mm.",
    consejo: "Pregunta al guía por las madrigueras: los cachorros salen a primera y última hora.",
  },
  "Equus quagga": {
    uicn: "NT",
    tamano: "De 175 a 385 kg.",
    actividad: "De día.",
    fotogenico: ["Rayas en patrón (detalles)", "Peleas de machos", "Polvo al atardecer"],
    distancia: "De 20 a 100 m: del angular al 400 mm.",
    consejo: "Las rayas en contraluz o los encuadres cerrados de varias cebras dan fotos gráficas.",
  },
  "Elephas maximus": {
    uicn: "EN",
    tamano: "Hasta 5 t.",
    actividad: "Al amanecer y al atardecer; en la época seca, junto al agua.",
    fotogenico: ["Grandes concentraciones (Minneriya, agosto-septiembre)", "Baños en el río"],
    distancia: "De 30 a 100 m: 100-400 mm.",
    consejo: "Los machos en musth (secreción en la sien) son peligrosos: distancia.",
  },
  "Varanus komodoensis": {
    uicn: "EN",
    tamano: "Hasta 3 m y 90 kg.",
    actividad: "De día; activo por la mañana, al sol, y se refugia en el calor del mediodía.",
    fotogenico: ["Lengua bífida en primer plano", "Caminando por la playa"],
    distancia: "Siempre con guarda y a más de 5 m: 70-200 mm.",
    consejo: "Las visitas son guiadas por los guardas del parque; no te separes del grupo.",
  },
  "Balaeniceps rex": {
    uicn: "VU",
    tamano: "Hasta 1,4 m de alto.",
    actividad: "De día; caza al acecho, inmóvil durante minutos.",
    fotogenico: ["Retrato de perfil", "Lanzándose a por un pez pulmonado"],
    distancia: "Desde la barca, de 10 a 40 m: 100-400 mm.",
    consejo: "En los pantanos de Mabamba (Uganda) se busca en canoa por la mañana.",
  },
  "Chelonoidis porteri": {
    uicn: "CR",
    tamano: "Hasta 250 kg.",
    actividad: "De día; en las horas de calor se refugia en charcas y barro.",
    fotogenico: ["Retrato con el cuello estirado", "Pinzones posados encima", "En las pozas de las tierras altas"],
    distancia: "Por norma, a 2 m como mínimo: angular y 24-105 mm.",
    consejo: "En las tierras altas de Santa Cruz se ven en libertad; no las toques.",
  },
};
