// Lo práctico de cada país de safari para un viajero con pasaporte español: visado, salud, enchufes, dinero,
// conducción y propinas. Revisado el 27-10-2026 con fuentes que se citan en docs/archivo/safaris-decisiones-hasta-2026-11.md; los visados y los
// requisitos sanitarios cambian a menudo, así que la web siempre enlaza la web oficial y Exteriores para
// confirmarlo. Solo lo que coincidía en varias fuentes: si no, se dice que hay que comprobarlo.

export interface PracticoPais {
  visado: { texto: string; url: string };
  fiebreAmarilla: string;
  malaria: string;
  /** tipos de enchufe (IEC); en España se usan C y F */
  enchufes: string[];
  dinero: string;
  conduce: "izquierda" | "derecha";
  /** zona horaria (IANA) para las horas de sol; sin ella si el país tiene varias */
  zona?: string;
  /** fecha de revisión, si no es la general (REVISADO) */
  revisado?: string;
  propinas: string;
}

export const REVISADO = "27-10-2026";
export const EXTERIORES = "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Recomendaciones-de-viaje.aspx";
export const SANIDAD = "https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/home.htm";

const PROPINAS_ESTE =
  "Guía-conductor: unos 10-20 USD por persona y día; personal del campamento, una caja común. En dólares.";
const PROPINAS_SUR = "Guía: unos 10-15 USD (o su equivalente) por persona y día; rastreador y personal, aparte.";
const FA_DESDE_RIESGO =
  "Solo te piden el certificado si llegas desde un país con riesgo (p. ej. después de Kenia o Uganda) o con escala de más de 12 h en uno.";
const MALARIA_TODO = "Riesgo en casi todo el país por debajo de unos 1800 m: consulta la profilaxis.";

export const PRACTICO: Record<string, PracticoPais> = {
  Kenia: {
    visado: {
      texto: "eTA (autorización electrónica) antes de viajar, unos 30 USD.",
      url: "https://www.etakenya.go.ke/",
    },
    fiebreAmarilla: "Vacuna recomendada en buena parte del país; certificado si llegas desde un país con riesgo.",
    malaria: `${MALARIA_TODO} Nairobi y las tierras altas, bajo.`,
    enchufes: ["G"],
    dinero: "Chelín keniano; tasas de parques con tarjeta o pago móvil (sin efectivo en las puertas).",
    conduce: "izquierda",
    zona: "Africa/Nairobi",
    propinas: PROPINAS_ESTE,
  },
  Tanzania: {
    visado: { texto: "Visado electrónico antes de viajar, unos 50 USD.", url: "https://visa.immigration.go.tz/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: MALARIA_TODO,
    enchufes: ["D", "G"],
    dinero: "Chelín tanzano; dólares muy usados. Las tasas de parques se pagan sin efectivo.",
    conduce: "izquierda",
    zona: "Africa/Dar_es_Salaam",
    propinas: PROPINAS_ESTE,
  },
  Uganda: {
    visado: { texto: "Visado electrónico antes de viajar, unos 50 USD.", url: "https://visas.immigration.go.ug/" },
    fiebreAmarilla: "Certificado obligatorio para todos los viajeros (desde 2024).",
    malaria: MALARIA_TODO,
    enchufes: ["G"],
    dinero: "Chelín ugandés; dólares en billetes recientes.",
    conduce: "izquierda",
    zona: "Africa/Kampala",
    propinas: PROPINAS_ESTE,
  },
  Ruanda: {
    visado: { texto: "Visado a la llegada u online, unos 50 USD.", url: "https://irembo.gov.rw/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en las zonas bajas (Akagera); bajo en los Volcanes y Kigali.",
    enchufes: ["C", "J"],
    dinero: "Franco ruandés; tarjeta en Kigali.",
    conduce: "derecha",
    zona: "Africa/Kigali",
    propinas: PROPINAS_ESTE,
  },
  Sudáfrica: {
    visado: { texto: "Sin visado hasta 90 días.", url: "https://www.dha.gov.za/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria:
      "Solo en el noreste (Kruger y norte de KwaZulu-Natal), sobre todo de septiembre a mayo. El Cabo, Addo y Pilanesberg, sin riesgo.",
    enchufes: ["C", "D", "M", "N"],
    dinero: "Rand; tarjeta en casi todo (también gasolineras de los parques).",
    conduce: "izquierda",
    zona: "Africa/Johannesburg",
    propinas: PROPINAS_SUR,
  },
  Botsuana: {
    visado: { texto: "Sin visado hasta 90 días.", url: "https://evisa.gov.bw/" },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Norte (Okavango, Chobe, Moremi), sobre todo de noviembre a junio; el sur, sin riesgo.",
    enchufes: ["D", "G", "M"],
    dinero: "Pula; dólares en los campamentos del delta.",
    conduce: "izquierda",
    zona: "Africa/Gaborone",
    propinas: PROPINAS_SUR,
  },
  Namibia: {
    visado: {
      texto:
        "Desde abril de 2025 muchos países europeos necesitan visado (a la llegada o electrónico, 1600 NAD): compruébalo para tu pasaporte.",
      url: "https://eservices.mhaiss.gov.na/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria:
      "Norte (norte de Etosha, Caprivi/Zambeze), sobre todo de noviembre a junio; Windhoek, la costa y el sur, sin riesgo.",
    enchufes: ["D", "M"],
    dinero: "Dólar namibio (vale lo mismo que el rand, que también se acepta).",
    conduce: "izquierda",
    zona: "Africa/Windhoek",
    propinas: PROPINAS_SUR,
  },
  Zambia: {
    visado: {
      texto:
        "Muchos pasaportes están exentos; si no, 50 USD o la KAZA UniVisa (50 USD, Zambia y Zimbabue): compruébalo.",
      url: "https://www.zambiaimmigration.gov.zm/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: MALARIA_TODO,
    enchufes: ["C", "D", "G"],
    dinero: "Kuacha; dólares en los lodges.",
    conduce: "izquierda",
    zona: "Africa/Lusaka",
    propinas: PROPINAS_SUR,
  },
  Zimbabue: {
    visado: {
      texto: "Visado a la llegada o la KAZA UniVisa (50 USD, Zimbabue y Zambia, con excursiones de un día a Botsuana).",
      url: "https://www.evisa.gov.zw/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en las zonas bajas (Hwange, Mana Pools, cataratas Victoria), sobre todo de noviembre a junio.",
    enchufes: ["D", "G"],
    dinero: "Se paga sobre todo en dólares; lleva billetes pequeños.",
    conduce: "izquierda",
    zona: "Africa/Harare",
    propinas: PROPINAS_SUR,
  },

  // ---- Fuera de África (revisado el 28-10-2026)
  India: {
    visado: {
      texto: "Visado electrónico (e-Tourist) antes de viajar: unos 25 USD por 30 días o 40 USD por un año.",
      url: "https://indianvisaonline.gov.in/evisa/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en buena parte del país, también en los parques de tigres: consulta la profilaxis.",
    enchufes: ["C", "D", "M"],
    dinero: "Rupia india; los safaris de los parques de tigres se reservan en las webs oficiales de cada estado.",
    conduce: "izquierda",
    zona: "Asia/Kolkata",
    propinas: "Al guía (naturalista) y al conductor del safari, unos cientos de rupias por salida.",
    revisado: "28-10-2026",
  },
  Nepal: {
    visado: {
      texto: "Visado a la llegada o en línea antes: 30 USD por 15 días, 50 USD por 30.",
      url: "https://nepaliport.immigration.gov.np/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo bajo en el Terai (Chitwan, Bardia); ninguno en Katmandú ni en la montaña.",
    enchufes: ["C", "D", "M"],
    dinero: "Rupia nepalí; efectivo fuera de Katmandú.",
    conduce: "izquierda",
    zona: "Asia/Kathmandu",
    propinas: "Al guía y al conductor, unos cientos de rupias por día.",
    revisado: "28-10-2026",
  },
  "Sri Lanka": {
    visado: {
      texto: "ETA gratuita para españoles desde el 25-5-2026 (30 días), pero hay que pedirla antes de llegar.",
      url: "https://eta.gov.lk/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Sin malaria (eliminada en 2016).",
    enchufes: ["D", "G", "M"],
    dinero: "Rupia esrilanquesa; los jeeps de safari se pagan en efectivo.",
    conduce: "izquierda",
    zona: "Asia/Colombo",
    propinas: "Al conductor del jeep, unos 1000-2000 rupias por salida.",
    revisado: "28-10-2026",
  },
  Indonesia: {
    visado: {
      texto:
        "Visado a la llegada (e-VOA, mejor en línea antes): 500.000 rupias; en Bali, además, una tasa turística de 150.000.",
      url: "https://evisa.imigrasi.go.id/",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria:
      "Riesgo en Borneo (Tanjung Puting), Flores y Komodo y Papúa; no en Bali ni Yakarta: consulta la profilaxis.",
    enchufes: ["C", "F"],
    dinero: "Rupia indonesia; efectivo en Labuan Bajo y Kumai.",
    conduce: "izquierda",
    propinas: "A la tripulación del klotok o del barco, una caja común al final.",
    revisado: "28-10-2026",
  },
  Malasia: {
    visado: {
      texto: "Sin visado hasta 90 días; tarjeta de llegada digital (MDAC) en línea antes de viajar.",
      url: "https://imigresen-online.imi.gov.my/mdac/main",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo en zonas de selva de Sabah y Sarawak (Kinabatangan): consulta.",
    enchufes: ["G"],
    dinero: "Ringgit; tarjeta en las ciudades, efectivo en el río.",
    conduce: "izquierda",
    zona: "Asia/Kuching",
    propinas: "No es costumbre; al guía del río, si quieres.",
    revisado: "28-10-2026",
  },
  Brasil: {
    visado: { texto: "Sin visado hasta 90 días.", url: EXTERIORES },
    fiebreAmarilla: "Vacuna recomendada para el Pantanal y la Amazonía (no te piden el certificado).",
    malaria: "Riesgo en la Amazonía; en el Pantanal es muy bajo: consulta.",
    enchufes: ["C", "N"],
    dinero: "Real; tarjeta casi en todas partes.",
    conduce: "derecha",
    zona: "America/Cuiaba",
    propinas: "En las pousadas del Pantanal, una caja común para el personal y algo al guía.",
    revisado: "28-10-2026",
  },
  Ecuador: {
    visado: {
      texto:
        "Sin visado hasta 90 días. Galápagos: tarjeta de control de tránsito (20 USD) y entrada al parque (200 USD, en efectivo).",
      url: "https://www.gobiernogalapagos.gob.ec/",
    },
    fiebreAmarilla: "Recomendada si vas a la Amazonía; no hace falta para Galápagos ni Quito.",
    malaria: "Riesgo en la Amazonía y la costa norte; ninguno en Galápagos ni en Quito.",
    enchufes: ["A", "B"],
    dinero: "Dólar estadounidense; lleva efectivo para Galápagos.",
    conduce: "derecha",
    zona: "Pacific/Galapagos",
    propinas: "Al guía naturalista y a la tripulación del barco, una caja común al final del crucero.",
    revisado: "28-10-2026",
  },
  Perú: {
    visado: { texto: "Sin visado hasta 90 días.", url: EXTERIORES },
    fiebreAmarilla: "Vacuna recomendada para la selva (Manu, Tambopata).",
    malaria: "Riesgo en la Amazonía (más en Loreto; bajo en Madre de Dios): consulta.",
    enchufes: ["A", "C"],
    dinero: "Sol; efectivo en Puerto Maldonado y los lodges.",
    conduce: "derecha",
    zona: "America/Lima",
    propinas: "Al guía del lodge y al barquero, una caja común.",
    revisado: "28-10-2026",
  },
  "Costa Rica": {
    visado: { texto: "Sin visado hasta 90 días.", url: EXTERIORES },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Riesgo muy bajo.",
    enchufes: ["A", "B"],
    dinero: "Colón; dólares aceptados casi en todas partes.",
    conduce: "derecha",
    zona: "America/Costa_Rica",
    propinas: "Al guía naturalista, unos 10-20 USD por persona y salida.",
    revisado: "28-10-2026",
  },
  "Estados Unidos": {
    visado: { texto: "ESTA en línea antes de viajar, unos 40 USD.", url: "https://esta.cbp.dhs.gov/" },
    fiebreAmarilla: "No hace falta.",
    malaria: "Sin malaria.",
    enchufes: ["A", "B"],
    dinero: "Dólar; tarjeta en todas partes.",
    conduce: "derecha",
    propinas: "A los guías, un 10-20 % de la excursión.",
    revisado: "28-10-2026",
  },
  Canadá: {
    visado: {
      texto: "eTA en línea antes de viajar en avión, 7 CAD.",
      url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html",
    },
    fiebreAmarilla: "No hace falta.",
    malaria: "Sin malaria.",
    enchufes: ["A", "B"],
    dinero: "Dólar canadiense; tarjeta en todas partes.",
    conduce: "derecha",
    zona: "America/Winnipeg",
    propinas: "A los guías y conductores del tundra buggy, un 10-15 %.",
    revisado: "28-10-2026",
  },
  Chile: {
    visado: { texto: "Sin visado hasta 90 días.", url: EXTERIORES },
    fiebreAmarilla: "No hace falta.",
    malaria: "Sin malaria.",
    enchufes: ["C", "L"],
    dinero: "Peso chileno; tarjeta casi en todas partes.",
    conduce: "derecha",
    zona: "America/Punta_Arenas",
    propinas: "Al guía (pumas, trekking), unos 10 % o una cantidad por día.",
    revisado: "28-10-2026",
  },
  Argentina: {
    visado: { texto: "Sin visado hasta 90 días.", url: EXTERIORES },
    fiebreAmarilla: "Solo recomendada en el noreste (Misiones, Iguazú).",
    malaria: "Sin malaria.",
    enchufes: ["C", "I"],
    dinero: "Peso argentino; con tarjeta extranjera el cambio suele ser mejor que en efectivo.",
    conduce: "derecha",
    propinas: "Al guía de avistamiento de ballenas o del safari, un 10 %.",
    revisado: "28-10-2026",
  },
  Australia: {
    visado: {
      texto: "eVisitor gratuito en línea antes de viajar.",
      url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/evisitor-651",
    },
    fiebreAmarilla: FA_DESDE_RIESGO,
    malaria: "Sin malaria.",
    enchufes: ["I"],
    dinero: "Dólar australiano; tarjeta en todas partes.",
    conduce: "izquierda",
    propinas: "No es costumbre; a los guías, si quieres.",
    revisado: "28-10-2026",
  },
};

export function practicoDe(pais: string | null | undefined): PracticoPais | undefined {
  if (!pais) return undefined;
  return PRACTICO[pais] ?? PRACTICO[pais.split(" y ")[0]];
}

// ---- Safari por tu cuenta (en coche de alquiler) en los destacados

export type PorTuCuenta = "turismo" | "4x4" | "guia";

export const POR_TU_CUENTA: Record<string, { nivel: PorTuCuenta; nota: string }> = {
  kruger: { nivel: "turismo", nota: "Carreteras asfaltadas y de tierra; campamentos del parque (SANParks)." },
  pilanesberg: { nivel: "turismo", nota: "A dos horas de Johannesburgo, sin malaria." },
  addo: { nivel: "turismo", nota: "Pistas buenas; sin malaria." },
  "hluhluwe-imfolozi": { nivel: "turismo", nota: "Carreteras asfaltadas; uno de los mejores para rinocerontes." },
  etosha: { nivel: "turismo", nota: "Pistas de grava para turismo; charcas con campamentos del parque (NWR)." },
  kgalagadi: { nivel: "turismo", nota: "Pistas principales para turismo; 4×4 para el lado de Botsuana." },
  chobe: { nivel: "4x4", nota: "Arena profunda: 4×4 y experiencia; campings reservados de antemano." },
  moremi: { nivel: "4x4", nota: "4×4 equipado, campings reservados y experiencia en arena y agua." },
  makgadikgadi: { nivel: "4x4", nota: "4×4; salares intransitables con lluvia." },
  "kalahari-central": { nivel: "4x4", nota: "Remoto: dos vehículos, agua y combustible para días." },
  hwange: { nivel: "4x4", nota: "Pistas principales practicables; 4×4 recomendado." },
  "mana-pools": { nivel: "4x4", nota: "4×4 y reserva de campings con ZimParks." },
  akagera: { nivel: "4x4", nota: "Se puede entrar con vehículo propio; guía opcional." },
  murchison: { nivel: "4x4", nota: "Posible con 4×4 de alquiler; ferri para cruzar el Nilo." },
  "reina-isabel": { nivel: "4x4", nota: "Posible con 4×4 de alquiler." },
  "sabi-sand": { nivel: "guia", nota: "Reserva privada: solo con los safaris de los lodges." },
  madikwe: { nivel: "guia", nota: "Solo con los safaris de los lodges." },
  "masai-mara": { nivel: "guia", nota: "Lo normal es ir con guía-conductor; con coche propio, solo con experiencia." },
  serengeti: { nivel: "guia", nota: "Lo normal es ir con guía-conductor (distancias enormes y pistas difíciles)." },
  ngorongoro: { nivel: "guia", nota: "Lo normal es ir con guía-conductor." },
};

export const TEXTO_POR_TU_CUENTA: Record<PorTuCuenta, string> = {
  turismo: "Por tu cuenta en coche normal",
  "4x4": "Por tu cuenta en 4×4 (con experiencia)",
  guia: "Con guía (lo habitual)",
};
