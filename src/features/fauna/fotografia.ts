// Lo fotografiable que es cada especie (escrito a mano para las más buscadas; el resto, por su grupo): tamaño
// aproximado, dificultad (1 fácil: grande o confiada y en abierto; 2 media; 3 difícil: pequeña, esquiva o en
// espesura) y un consejo de campo. Entra en la nota «fotografiarla» y en la ficha de la especie.
// Revisión anual con .github/scripts/revision_datos.py.

export const REVISADO_FOTOGRAFIA = "04-11-2026";

export interface Fotografia {
  /** longitud aproximada en cm (aves, de pico a cola; mamíferos, cabeza y cuerpo) */
  cm: number;
  dificultad: 1 | 2 | 3;
  consejo: string;
}

const T: Record<string, [number, 1 | 2 | 3, string]> = {
  // aves grandes y en abierto
  "Grus grus": [
    115,
    2,
    "Muy desconfiada: desde el coche o un hide en sus dormideros y comederos; al amanecer y al atardecer, en vuelo.",
  ],
  "Otis tarda": [
    100,
    3,
    "Huye a cientos de metros: hide en primavera (exhibición) o desde el coche sin bajarse; 600 mm o más.",
  ],
  "Tetrax tetrax": [43, 3, "Machos en celo en primavera, desde hide o coche; muy sensible a las molestias."],
  "Gyps fulvus": [100, 1, "En comederos desde hide o en vuelo en cortados con térmicas (media mañana)."],
  "Aegypius monachus": [105, 2, "Comederos con hide; en vuelo sobre la dehesa. No te acerques a las zonas de cría."],
  "Gypaetus barbatus": [110, 2, "Comederos del Pirineo con hide; en vuelo por los cortados con luz lateral."],
  "Neophron percnopterus": [62, 2, "De marzo a septiembre en comederos y cortados."],
  "Aquila adalberti": [80, 3, "Hides autorizados o a mucha distancia desde pistas; nunca cerca de nidos."],
  "Aquila chrysaetos": [85, 3, "Hides de comedero en invierno o vuelos en cresterías."],
  "Ciconia ciconia": [100, 1, "Confiada en pueblos y campos arados; buena con luz rasante."],
  "Ciconia nigra": [97, 3, "Muy esquiva: en ríos y charcas en paso de otoño, a distancia."],
  "Phoenicopterus roseus": [135, 1, "Lagunas y salinas: con teleobjetivo largo, reflejos al amanecer."],
  "Platalea leucorodia": [85, 2, "Marismas y salinas, sobre todo en paso; desde observatorios."],
  "Ardea cinerea": [95, 1, "Confiada en ríos urbanos; en el campo, desde el coche."],
  "Ardea alba": [90, 2, "Arrozales y lagunas en invierno."],
  "Egretta garzetta": [60, 1, "Marismas y arrozales; con la marea en la costa."],
  "Bubulcus ibis": [50, 1, "Junto al ganado, muy confiada."],
  "Phalacrocorax carbo": [90, 1, "Embalses y puertos; dormideros al atardecer."],
  "Tadorna tadorna": [62, 2, "Salinas y lagunas saladas; desde observatorios."],
  "Anas platyrhynchos": [57, 1, "Confiado en parques; en el campo, más esquivo."],
  "Fulica atra": [38, 1, "Confiada en lagunas y parques."],
  "Porphyrio porphyrio": [45, 2, "Carrizales al amanecer, desde observatorios de lagunas."],
  "Himantopus himantopus": [37, 1, "Salinas y lagunas en primavera; muy fotogénica con reflejos."],
  "Recurvirostra avosetta": [44, 2, "Salinas y marismas, mejor con la marea subiendo."],
  "Calidris alpina": [18, 2, "Limícola de costa: con marea subiendo se acerca; tumbado y a ras de suelo."],
  "Vanellus vanellus": [30, 2, "Invierno en campos encharcados, desde el coche."],
  "Burhinus oedicnemus": [42, 3, "Crepuscular y mimética: hide de charca o desde el coche al atardecer."],
  "Pterocles alchata": [33, 3, "Bebederos de verano en la estepa, desde hide."],
  "Pterocles orientalis": [35, 3, "Bebederos de verano en la estepa, desde hide."],
  "Circus aeruginosus": [52, 2, "Vuelos sobre carrizales; desde observatorios."],
  "Circus pygargus": [45, 3, "Cereal en primavera, en vuelo; no te acerques a los nidos (en el suelo)."],
  "Milvus milvus": [65, 1, "Comederos y vertederos en invierno; vuelo bajo."],
  "Milvus migrans": [55, 1, "Muy común en primavera y verano, en vuelo."],
  "Buteo buteo": [53, 2, "Posado en postes de carretera; desde el coche."],
  "Elanus caeruleus": [33, 2, "Dehesas y campiña, posado en tendidos; hide o desde el coche."],
  "Falco tinnunculus": [35, 1, "Cernido sobre cunetas; desde el coche."],
  "Falco naumanni": [32, 2, "Colonias en pueblos: desde la calle y sin molestar la cría."],
  "Accipiter gentilis": [55, 3, "Muy esquivo: hides de comedero."],
  "Bubo bubo": [65, 3, "Nocturno: hides con luz o escuchas al atardecer en cortados; nunca en nidos."],
  "Strix aluco": [38, 3, "Nocturno de bosque; hides nocturnos."],
  "Athene noctua": [22, 1, "Posado de día en majanos y tejados; desde el coche."],
  "Tyto alba": [34, 3, "Nocturna; mejor desde hides autorizados."],
  // aves pequeñas
  "Alcedo atthis": [17, 2, "Hides con posadero sobre el agua; mucha velocidad de obturación."],
  "Merops apiaster": [
    28,
    1,
    "Taludes y tendidos de mayo a agosto; desde el coche o hide, sin acercarse a los taludes de cría.",
  ],
  "Coracias garrulus": [31, 2, "Postes y tendidos en verano; hide o desde el coche."],
  "Upupa epops": [27, 1, "Confiada en campos y parques; búscala comiendo en el suelo."],
  "Cyanopica cooki": [34, 2, "Bandos ruidosos en dehesas y pinares; bebederos con hide."],
  "Erithacus rubecula": [14, 1, "Confiado en invierno; hides de comedero y parques."],
  "Sylvia undata": [13, 3, "Matorral: cantando en lo alto de las matas en primavera."],
  "Oenanthe leucura": [18, 2, "Roquedos áridos; posado en piedras."],
  "Lanius meridionalis": [25, 2, "Posado en arbustos y tendidos en llanuras."],
  "Dendrocoptes medius": [21, 3, "Robledales maduros del norte; en invierno con el bosque sin hojas."],
  // mamíferos
  "Cervus elaphus": [
    210,
    1,
    "Berrea en septiembre y octubre al amanecer y atardecer; desde pistas, sin entrar en fincas.",
  ],
  "Capra pyrenaica": [130, 1, "Muy confiada en Gredos; el celo, en noviembre y diciembre."],
  "Rupicapra pyrenaica": [110, 2, "Pastos altos en verano; en otoño, el celo."],
  "Capreolus capreolus": [110, 2, "Bordes de bosque al amanecer y al atardecer; desde el coche."],
  "Sus scrofa": [140, 2, "Crepuscular y nocturno; en parques periurbanos se acerca."],
  "Vulpes vulpes": [70, 2, "Al amanecer; en comederos de buitres a veces aparece."],
  "Lynx pardinus": [85, 3, "Sierra de Andújar y Montes de Toledo, desde pistas públicas y a distancia; celo en enero."],
  "Canis lupus": [110, 3, "Esperas guiadas en la Sierra de la Culebra, a kilómetros con telescopio."],
  "Ursus arctos": [200, 3, "Somiedo y alto Sil desde miradores, a mucha distancia; primavera y otoño."],
  "Lutra lutra": [70, 3, "Ríos limpios al amanecer; mucha paciencia."],
  "Herpestes ichneumon": [55, 3, "Diurno pero esquivo; Doñana y Sierra Morena."],
  "Genetta genetta": [50, 3, "Nocturna; hides nocturnos."],
  "Meles meles": [75, 3, "Nocturno; hides en tejoneras autorizados."],
  "Sciurus vulgaris": [22, 1, "Confiada en parques y pinares; comederos con hide."],
  "Oryctolagus cuniculus": [40, 1, "Al amanecer en praderas; buen cebo para fotografiar rapaces que lo cazan."],
  // reptiles y anfibios
  "Testudo graeca": [20, 1, "Primavera, a media mañana; no la cojas ni la muevas."],
  "Timon lepidus": [60, 2, "Al sol en piedras en primavera; acércate despacio."],
  "Salamandra salamandra": [20, 1, "Noches de lluvia en bosques húmedos; con linterna y cuidado en carreteras."],
};

export function fotografiaDe(cientifico: string | null | undefined): Fotografia | null {
  if (!cientifico) return null;
  const x = T[cientifico.split(" ").slice(0, 2).join(" ")];
  return x ? { cm: x[0], dificultad: x[1], consejo: x[2] } : null;
}

const POR_GRUPO: Record<string, number> = { Aves: 0.8, Mammalia: 0.7, Reptilia: 0.85, Amphibia: 0.85 };

/** Factor 0-1 para «fotografiarla»: 1 fácil, 0,8 media, 0,6 difícil; sin dato, el de su grupo. */
export function factorFotografia(
  cientifico: string | null | undefined,
  clase: string,
): { valor: number; detalle: string } {
  const f = fotografiaDe(cientifico);
  if (!f) return { valor: POR_GRUPO[clase] ?? 0.8, detalle: "sin dato de la especie: valor de su grupo" };
  const valor = f.dificultad === 1 ? 1 : f.dificultad === 2 ? 0.8 : 0.6;
  const texto = f.dificultad === 1 ? "fácil" : f.dificultad === 2 ? "media" : "difícil";
  return { valor, detalle: `${texto} (unos ${f.cm} cm)` };
}
