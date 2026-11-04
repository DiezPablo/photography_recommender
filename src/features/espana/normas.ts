// Normas y código ético para la fotografía de fauna en España, con enlaces a la fuente oficial (consultadas el
// 04-11-2026). Revisión anual con .github/scripts/revision_datos.py.

export const REVISADO_NORMAS = "04-11-2026";

export const LEY = {
  nombre: "Ley 42/2007, del Patrimonio Natural y de la Biodiversidad",
  url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-21490",
  art54:
    "Queda prohibido dar muerte, dañar, molestar o inquietar intencionadamente a los animales silvestres, sea cual fuere el método empleado o la fase de su ciclo biológico. Esta prohibición incluye su retención y captura en vivo, la destrucción, daño, recolección y retención de sus nidos, de sus crías o de sus huevos…",
  art57:
    "Tratándose de animales, incluidas sus larvas, crías, o huevos, la de cualquier actuación hecha con el propósito de darles muerte, capturarlos, perseguirlos o molestarlos, así como la destrucción o deterioro de sus nidos, vivares y lugares de reproducción, invernada o reposo.",
};

export const DRONES = [
  { nombre: "AESA: drones (normativa y registro)", url: "https://www.seguridadaerea.gob.es/es/ambitos/drones" },
  { nombre: "ENAIRE Drones: mapa de zonas donde se puede volar", url: "https://drones.enaire.es/" },
];

const PN = "https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/";
export const PARQUES_NACIONALES: [string, string][] = [
  ["Aigüestortes i Estany de Sant Maurici", "aiguestortes"],
  ["Cabañeros", "cabaneros"],
  ["Archipiélago de Cabrera", "cabrera"],
  ["Tablas de Daimiel", "daimiel"],
  ["Doñana", "donana"],
  ["Garajonay", "garajonay"],
  ["Sierra de Guadarrama", "guadarrama"],
  ["Islas Atlánticas de Galicia", "islas-atlanticas"],
  ["Mar de las Calmas", "mardelascalmas"],
  ["Monfragüe", "monfrague"],
  ["Ordesa y Monte Perdido", "ordesa"],
  ["Picos de Europa", "picos-europa"],
  ["Sierra de las Nieves", "sierra-de-las-nieves"],
  ["Sierra Nevada", "sierra-nevada"],
  ["Caldera de Taburiente", "taburiente"],
  ["Teide", "teide"],
  ["Timanfaya", "timanfaya"],
].map(([n, s]) => [n, `${PN}${s}.html`]);
