// La gran migración del Serengeti y el Masái Mara (≈1,3 millones de ñus, cebras y gacelas) mes a mes: dónde
// suele estar la mayor parte de las manadas en un año normal. Sigue a la lluvia y al pasto, así que se adelanta o
// se retrasa varias semanas según el año: por eso la página la contrasta con lo visto en el último mes.
// Fuente: el ciclo descrito por el Serengeti National Park (TANAPA), el Mara Triangle y la literatura (Boone et al.
// 2006, «Serengeti wildebeest migratory patterns modeled from rainfall and new vegetation growth»).

export interface ZonaMigracion {
  /** mes 1-12 */
  mes: number;
  zona: string;
  lat: number;
  lon: number;
  radio_km: number;
  que: string;
  /** dónde dormir para estar cerca */
  base: string;
  /** parque del catálogo donde está */
  parque: string;
  cruces?: boolean;
  partos?: boolean;
  /** lluvias largas: hay migración, pero el parque está en temporada verde (fuera de su mejor época) */
  lluvias?: boolean;
}

export const MIGRACION: ZonaMigracion[] = [
  {
    mes: 1,
    zona: "Sur del Serengeti y Ndutu",
    lat: -3.0,
    lon: 34.95,
    radio_km: 45,
    que: "Las manadas pastan en las llanuras de hierba corta del sur, ricas en minerales tras las lluvias cortas.",
    base: "Ndutu y campamentos móviles del sur del Serengeti",
    parque: "serengeti",
  },
  {
    mes: 2,
    zona: "Ndutu y llanuras del sur",
    lat: -3.0,
    lon: 34.95,
    radio_km: 40,
    que: "Época de partos: unas 8.000 crías al día durante dos o tres semanas, y con ellas leones, guepardos y hienas.",
    base: "Ndutu (área de conservación del Ngorongoro) y sur del Serengeti",
    parque: "ngorongoro",
    partos: true,
  },
  {
    mes: 3,
    zona: "Sur del Serengeti y Ndutu",
    lat: -2.95,
    lon: 34.9,
    radio_km: 45,
    que: "Las crías ya corren con la manada; siguen en el sur mientras haya pasto.",
    base: "Ndutu y sur del Serengeti",
    parque: "serengeti",
  },
  {
    mes: 4,
    zona: "Centro del Serengeti (Moru, Seronera)",
    lat: -2.6,
    lon: 34.8,
    radio_km: 50,
    que: "Llegan las lluvias largas y las manadas suben hacia el centro y el oeste en columnas de kilómetros.",
    base: "Seronera y Moru (temporada baja: muchos campamentos cierran)",
    parque: "serengeti",
    lluvias: true,
  },
  {
    mes: 5,
    zona: "Centro y oeste del Serengeti",
    lat: -2.4,
    lon: 34.6,
    radio_km: 55,
    que: "Época de celo: los machos defienden territorios y las manadas avanzan hacia el corredor occidental.",
    base: "Seronera y corredor occidental",
    parque: "serengeti",
    lluvias: true,
  },
  {
    mes: 6,
    zona: "Corredor occidental (Grumeti)",
    lat: -2.15,
    lon: 34.3,
    radio_km: 45,
    que: "Primeros cruces de ríos: el Grumeti, con sus cocodrilos enormes.",
    base: "Corredor occidental y reservas de Grumeti",
    parque: "serengeti",
    cruces: true,
  },
  {
    mes: 7,
    zona: "Norte del Serengeti y Masái Mara",
    lat: -1.6,
    lon: 34.95,
    radio_km: 40,
    que: "Empiezan los cruces del río Mara, el momento más buscado. Dónde y cuándo cruzan no se puede prever: hay que esperar en la orilla.",
    base: "Kogatende (norte del Serengeti) o el Mara Triangle",
    parque: "masai-mara",
    cruces: true,
  },
  {
    mes: 8,
    zona: "Río Mara (Kogatende y Masái Mara)",
    lat: -1.5,
    lon: 35.0,
    radio_km: 40,
    que: "Cruces del Mara casi a diario y el grueso de las manadas en el Masái Mara: el pico de la temporada (y de precios).",
    base: "Masái Mara (reserva o conservancies) o Kogatende",
    parque: "masai-mara",
    cruces: true,
  },
  {
    mes: 9,
    zona: "Masái Mara y norte del Serengeti",
    lat: -1.45,
    lon: 35.05,
    radio_km: 45,
    que: "Siguen los cruces, en ambos sentidos; el Mara está lleno de manadas y depredadores.",
    base: "Masái Mara o Kogatende",
    parque: "masai-mara",
    cruces: true,
  },
  {
    mes: 10,
    zona: "Masái Mara y norte del Serengeti",
    lat: -1.55,
    lon: 35.05,
    radio_km: 50,
    que: "Últimos cruces; con las primeras lluvias cortas las manadas empiezan a bajar hacia el sur.",
    base: "Kogatende, Lobo o Masái Mara",
    parque: "serengeti",
    cruces: true,
  },
  {
    mes: 11,
    zona: "Este del Serengeti (Lobo, Seronera)",
    lat: -2.1,
    lon: 35.1,
    radio_km: 55,
    que: "Bajada por el este del parque con las lluvias cortas: manadas en movimiento y menos visitantes.",
    base: "Lobo y Seronera",
    parque: "serengeti",
  },
  {
    mes: 12,
    zona: "Centro y sur del Serengeti",
    lat: -2.75,
    lon: 34.95,
    radio_km: 55,
    que: "Llegada a las llanuras del sur, donde pasarán la época de lluvias y los partos.",
    base: "Seronera, Ndutu y sur del Serengeti",
    parque: "serengeti",
  },
];

/** Ñus residentes del cráter del Ngorongoro (no migran): se muestran aparte. */
export const CRATER = { lat: -3.18, lon: 35.57, radio_km: 12 };
