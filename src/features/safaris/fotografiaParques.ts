// Fotografía en cada parque (T23): lo que decide una foto antes que la cámara. Escrito a mano para los parques más
// visitados, con las normas de cada autoridad y lo que cuentan guías y fotógrafos; los horarios son aproximados y
// cambian: confírmalos con el parque o tu operador. En el resto de parques el bloque no sale.

export const REVISADO_FOTOGRAFIA = "05-11-2026";

export type SiNo = "si" | "no" | "concesiones";
export type Nivel = "baja" | "media" | "alta";

export interface FotografiaParque {
  /** ¿se puede salir de pista para acercarse? «concesiones»: solo en las privadas de alrededor */
  fueraPista: SiNo;
  fueraPistaNota?: string;
  /** vehículo habitual */
  vehiculo: string;
  /** horario de las pistas o de las puertas */
  horario: string;
  /** zona horaria, para dar el amanecer y el atardecer en hora local */
  tz: string;
  nocturnos: SiNo;
  nocturnosNota?: string;
  /** vehículos en los avistamientos */
  aglomeracion: Nivel;
  aglomeracionNota?: string;
  /** hides, barcas, charcas iluminadas, globos… */
  especial?: string;
  /** focal orientativa */
  focal: string;
  notas: string[];
}

export const FOTOGRAFIA: Record<string, FotografiaParque> = {
  serengeti: {
    fueraPista: "no",
    fueraPistaNota: "Prohibido en el parque nacional; sí en las reservas privadas de Grumeti y en Loliondo.",
    vehiculo: "Land Cruiser cerrado con techo elevable (se fotografía de pie, desde el techo).",
    horario:
      "Se puede circular de 6:00 a 18:00 aprox.; dormir dentro es lo que permite estar en la pista con la primera y la última luz.",
    tz: "Africa/Dar_es_Salaam",
    nocturnos: "no",
    nocturnosNota: "Prohibidos en el parque nacional.",
    aglomeracion: "media",
    aglomeracionNota:
      "Alta en Seronera y en los cruces del Mara; baja en el sur fuera de la época de partos y en el oeste.",
    especial: "Globo al amanecer (Seronera, centro y sur).",
    focal: "100-400 mm basta para casi todo; 500-600 mm para aves y felinos lejanos.",
    notas: [
      "Polvo fino en la época seca: cambia de objetivo dentro del vehículo y lleva funda.",
      "Lleva un saco de arroz o beanbag para apoyar en el techo o la ventanilla.",
    ],
  },
  "masai-mara": {
    fueraPista: "concesiones",
    fueraPistaNota: "Prohibido en la reserva nacional; sí en las conservancies que la rodean, con límites.",
    vehiculo: "Techo elevable en la reserva; Land Cruiser abierto por los lados en las conservancies.",
    horario: "De 6:00 a 18:30 aprox. en la reserva.",
    tz: "Africa/Nairobi",
    nocturnos: "concesiones",
    nocturnosNota: "Solo en las conservancies.",
    aglomeracion: "alta",
    aglomeracionNota:
      "En los cruces del Mara y con los grandes felinos de la reserva se juntan decenas de vehículos; las conservancies limitan a unos cinco por avistamiento.",
    especial: "Globo al amanecer.",
    focal: "100-400 mm; en las conservancies, a veces basta un 70-200 mm.",
    notas: [
      "En los cruces, llega pronto y espera: dónde y cuándo cruzan no se puede prever.",
      "Las conservancies valen la diferencia de precio para fotografiar con poca gente.",
    ],
  },
  ngorongoro: {
    fueraPista: "no",
    vehiculo: "Techo elevable.",
    horario:
      "Se baja al cráter desde primera hora y hay un máximo de unas seis horas dentro; hay que salir antes del anochecer.",
    tz: "Africa/Dar_es_Salaam",
    nocturnos: "no",
    aglomeracion: "alta",
    aglomeracionNota: "Muchos vehículos en un espacio cerrado, sobre todo con los rinocerontes y los leones.",
    focal: "100-400 mm; los rinocerontes suelen quedar lejos: 500-600 mm ayuda.",
    notas: [
      "Baja con la primera tanda: la luz y la calma duran poco.",
      "Neblina en el borde del cráter por la mañana.",
    ],
  },
  tarangire: {
    fueraPista: "no",
    vehiculo: "Techo elevable.",
    horario: "De 6:00 a 18:00 aprox.",
    tz: "Africa/Dar_es_Salaam",
    nocturnos: "no",
    nocturnosNota: "No en el parque; algunas reservas vecinas sí las hacen.",
    aglomeracion: "media",
    focal: "100-400 mm; los baobabs piden también un angular.",
    notas: ["En la época seca los elefantes se concentran en el río Tarangire: mejor al atardecer."],
  },
  kruger: {
    fueraPista: "no",
    vehiculo: "Coche propio (cerrado) o vehículos abiertos de las salidas de SANParks.",
    horario:
      "Las puertas abren y cierran según el mes: en el verano austral, hacia las 4:30-5:30 y las 18:30; en invierno, hacia las 6:00 y las 17:30. Multa si llegas tarde.",
    tz: "Africa/Johannesburg",
    nocturnos: "si",
    nocturnosNota: "Salidas guiadas al atardecer y de noche desde los campamentos (no por tu cuenta).",
    aglomeracion: "media",
    aglomeracionNota: "Atascos en el sur con leones y leopardos; mucho más tranquilo en el centro y el norte.",
    especial: "Hides junto al agua (Lake Panic, cerca de Skukuza, entre otros).",
    focal: "100-400 mm; 500-600 mm para aves y para lo que queda lejos de la carretera.",
    notas: [
      "No se puede salir de la carretera ni asomarse por la ventanilla: un beanbag en la ventanilla es imprescindible.",
      "Sal por la puerta en cuanto abra: la primera hora es la mejor.",
    ],
  },
  "sabi-sand": {
    fueraPista: "si",
    fueraPistaNota: "Reserva privada: los vehículos siguen a los animales campo a través.",
    vehiculo: "Land Cruiser abierto, con guía y rastreador.",
    horario: "Salida al amanecer y otra por la tarde que vuelve ya de noche.",
    tz: "Africa/Johannesburg",
    nocturnos: "si",
    nocturnosNota: "La salida de la tarde vuelve de noche con foco.",
    aglomeracion: "baja",
    aglomeracionNota: "Dos o tres vehículos por avistamiento, por turnos.",
    focal: "70-200 mm suele bastar: los leopardos están acostumbrados a los vehículos y se acercan mucho.",
    notas: ["Pide al guía la posición del sol antes de colocar el vehículo."],
  },
  "hluhluwe-imfolozi": {
    fueraPista: "no",
    vehiculo: "Coche propio o vehículos abiertos de las salidas guiadas.",
    horario: "Puertas de 5:00 a 19:00 en verano y de 6:00 a 18:00 en invierno, aprox.",
    tz: "Africa/Johannesburg",
    nocturnos: "si",
    nocturnosNota: "Salidas guiadas desde los campamentos.",
    aglomeracion: "baja",
    especial: "Hides junto a charcas (Mphafa, entre otros).",
    focal: "100-400 mm.",
    notas: ["Uno de los mejores sitios para fotografiar rinocerontes blancos sin mucha gente."],
  },
  etosha: {
    fueraPista: "no",
    vehiculo: "Coche propio (cerrado) o vehículos abiertos de los campamentos.",
    horario: "Las puertas abren al amanecer y cierran al anochecer.",
    tz: "Africa/Windhoek",
    nocturnos: "si",
    nocturnosNota: "Salidas guiadas desde los campamentos del parque.",
    aglomeracion: "media",
    especial:
      "Charcas iluminadas de noche junto a los campamentos (Okaukuejo y Halali, entre otros): rinocerontes y leones bebiendo.",
    focal: "100-400 mm; algo luminoso o una cámara que aguante ISO alto para las charcas de noche.",
    notas: [
      "El polvo blanco de la salina se mete en todo y quema la exposición a mediodía: fotografía temprano y tarde.",
      "Espera en las charcas en vez de recorrer kilómetros.",
    ],
  },
  chobe: {
    fueraPista: "no",
    vehiculo: "Vehículos abiertos; barcas en el río.",
    horario: "En la ribera, de 6:00 a 18:30 aprox.",
    tz: "Africa/Gaborone",
    nocturnos: "no",
    aglomeracion: "alta",
    aglomeracionNota: "Muchos vehículos y barcas en la ribera por la tarde.",
    especial:
      "Barcas fotográficas en el río Chobe, con soportes para objetivos largos: elefantes y aves a ras de agua.",
    focal: "100-400 mm; 500-600 mm para aves desde la barca.",
    notas: ["La barca de la tarde da la luz más bonita sobre los elefantes cruzando."],
  },
  moremi: {
    fueraPista: "concesiones",
    fueraPistaNota: "Prohibido en la reserva de Moremi; sí en las concesiones privadas del delta.",
    vehiculo: "Land Cruiser abierto; mokoro (canoa) en los canales.",
    horario: "De 6:00 a 18:30 aprox. en la reserva.",
    tz: "Africa/Gaborone",
    nocturnos: "concesiones",
    nocturnosNota: "Solo en las concesiones privadas.",
    aglomeracion: "media",
    especial: "Mokoro por los canales: perspectiva a ras de agua.",
    focal: "100-400 mm; 500 mm para aves.",
    notas: ["Desde el mokoro no se puede llevar trípode: estabilizador y velocidad alta."],
  },
  "luangwa-sur": {
    fueraPista: "no",
    vehiculo: "Land Cruiser abierto.",
    horario: "Salida al amanecer y otra por la tarde que sigue de noche.",
    tz: "Africa/Lusaka",
    nocturnos: "si",
    nocturnosNota: "Las salidas nocturnas con foco son de lo mejor del parque (leopardos).",
    aglomeracion: "baja",
    especial: "Safaris a pie con guía armado.",
    focal: "100-400 mm; ISO alto para los leopardos de noche.",
    notas: ["Con foco de noche, pide al guía que no ilumine directamente los ojos del animal."],
  },
  "mana-pools": {
    fueraPista: "no",
    vehiculo: "Vehículos abiertos; canoa en el Zambeze.",
    horario: "De sol a sol.",
    tz: "Africa/Harare",
    nocturnos: "no",
    aglomeracion: "baja",
    especial: "Se puede caminar por las llanuras junto al río (lo habitual, con guía) y bajar el Zambeze en canoa.",
    focal: "70-200 y 100-400 mm: a pie se fotografía cerca y a la altura del animal.",
    notas: ["Los elefantes de pie sobre dos patas comiendo de las acacias, en la época seca (septiembre-octubre)."],
  },
  bwindi: {
    fueraPista: "si",
    fueraPistaNota: "Se camina por el bosque con los rastreadores hasta el grupo de gorilas.",
    vehiculo: "A pie.",
    horario: "Reunión hacia las 7:00; una hora con el grupo, como máximo ocho visitantes.",
    tz: "Africa/Kampala",
    nocturnos: "no",
    aglomeracion: "baja",
    focal: "24-105 o 70-200 mm, luminoso: bosque oscuro y a pocos metros. Nada de flash.",
    notas: [
      "ISO alto y velocidad de al menos 1/250 s.",
      "Guantes para agarrarse a la vegetación y funda para la lluvia.",
    ],
  },
  volcanes: {
    fueraPista: "si",
    fueraPistaNota: "Se camina por el bosque de bambú con los rastreadores.",
    vehiculo: "A pie.",
    horario: "Reunión a las 7:00 en Kinigi; una hora con el grupo, como máximo ocho visitantes.",
    tz: "Africa/Kigali",
    nocturnos: "no",
    aglomeracion: "baja",
    focal: "24-105 o 70-200 mm, luminoso. Nada de flash.",
    notas: ["Más luz que en Bwindi: bambú y claros.", "Puedes pedir un grupo más fácil o más difícil de alcanzar."],
  },
  yala: {
    fueraPista: "no",
    vehiculo: "Jeep abierto con conductor.",
    horario: "De 6:00 a 18:00; mejor salida de mañana o de día entero.",
    tz: "Asia/Colombo",
    nocturnos: "no",
    aglomeracion: "alta",
    aglomeracionNota: "Con un leopardo se juntan decenas de jeeps en el bloque 1.",
    focal: "100-400 mm; 500-600 mm para leopardos sobre las rocas y aves.",
    notas: ["Los bloques menos visitados (5 y otros) dan menos leopardos pero más calma."],
  },
  ranthambore: {
    fueraPista: "no",
    vehiculo: "Gypsy abierta (6 plazas) o canter (unas 20): para fotografiar, gypsy.",
    horario: "Dos turnos al día, de mañana y de tarde, de unas tres horas y media; la zona se asigna al reservar.",
    tz: "Asia/Kolkata",
    nocturnos: "no",
    aglomeracion: "alta",
    aglomeracionNota: "Con un tigre a la vista se juntan muchos vehículos.",
    focal: "100-400 mm; 500-600 mm para tigres lejos y aves.",
    notas: ["Reserva varios turnos: el tigre no sale en todos.", "Polvo en la época seca."],
  },
  pantanal: {
    fueraPista: "no",
    vehiculo: "Barca por los ríos (jaguares en Porto Jofre); vehículo abierto por la Transpantaneira.",
    horario: "De sol a sol en las barcas.",
    tz: "America/Cuiaba",
    nocturnos: "si",
    nocturnosNota: "Salidas nocturnas desde las pousadas de la Transpantaneira.",
    aglomeracion: "media",
    aglomeracionNota: "Varias barcas con cada jaguar en temporada alta.",
    especial: "Barcas para ver jaguares en las orillas de los ríos.",
    focal: "100-400 mm; 500-600 mm para jaguares en la orilla de enfrente y aves.",
    notas: ["La barca se mueve: velocidad alta y estabilizador."],
  },
  galapagos: {
    fueraPista: "no",
    fueraPistaNota: "Siempre por los senderos marcados y con guía naturalista.",
    vehiculo: "Barco y panga (lancha) para desembarcar.",
    horario: "Los lugares de visita abren de 6:00 a 18:00, con turnos asignados.",
    tz: "Pacific/Galapagos",
    nocturnos: "no",
    aglomeracion: "baja",
    focal: "24-105 mm para casi todo (los animales no huyen); 100-400 mm para aves.",
    notas: [
      "Mantén dos metros de distancia aunque el animal se acerque.",
      "Funda estanca para los desembarcos húmedos.",
    ],
  },
  yellowstone: {
    fueraPista: "no",
    vehiculo: "Coche propio.",
    horario: "Las carreteras abiertas se pueden recorrer de día y de noche; algunas cierran en invierno.",
    tz: "America/Denver",
    nocturnos: "no",
    aglomeracion: "alta",
    aglomeracionNota: "«Atascos de osos» en verano en cuanto alguien para.",
    focal: "500-600 mm o más: los lobos del valle de Lamar suelen estar a cientos de metros.",
    notas: ["Al amanecer en el valle de Lamar, con telescopio, como los observadores de lobos."],
  },
};

export const TEXTO_SI_NO: Record<SiNo, string> = {
  si: "Sí",
  no: "No",
  concesiones: "Solo en las concesiones privadas",
};
export const TEXTO_NIVEL: Record<Nivel, string> = { baja: "Baja", media: "Media", alta: "Alta" };
