// Cuadrícula europea de referencia (EEA, EPSG:3035) en el navegador: en qué celda de 10 km cae un punto, para
// pedir los datos de su bloque de 100 km. Mismas fórmulas que safari/espana/rejilla.py (Snyder, LAEA sobre GRS80).

const A = 6378137;
const F = 1 / 298.257222101;
const E2 = 2 * F - F * F;
const E = Math.sqrt(E2);
const LAT0 = (52 * Math.PI) / 180;
const LON0 = (10 * Math.PI) / 180;
const FE = 4321000;
const FN = 3210000;

function q(phi: number): number {
  const s = Math.sin(phi);
  return (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * E)) * Math.log((1 - E * s) / (1 + E * s)));
}

const QP = q(Math.PI / 2);
const RQ = A * Math.sqrt(QP / 2);
const B0 = Math.asin(q(LAT0) / QP);
const D = (A * (Math.cos(LAT0) / Math.sqrt(1 - E2 * Math.sin(LAT0) ** 2))) / (RQ * Math.cos(B0));

/** [este, norte] en metros de EPSG:3035. */
export function laea(lat: number, lon: number): [number, number] {
  const beta = Math.asin(q((lat * Math.PI) / 180) / QP);
  const dl = (lon * Math.PI) / 180 - LON0;
  const b = RQ * Math.sqrt(2 / (1 + Math.sin(B0) * Math.sin(beta) + Math.cos(B0) * Math.cos(beta) * Math.cos(dl)));
  return [
    FE + b * D * Math.cos(beta) * Math.sin(dl),
    FN + (b / D) * (Math.cos(B0) * Math.sin(beta) - Math.sin(B0) * Math.cos(beta) * Math.cos(dl)),
  ];
}

/** «10kmE315N202» para Madrid (el formato de GBIF_EEARGCode). */
export function celda(lat: number, lon: number, metros = 10000): string {
  const [e, n] = laea(lat, lon);
  return `${metros / 1000}kmE${Math.floor(e / metros)}N${Math.floor(n / metros)}`;
}

/** Celdas de 10 km que tocan el círculo de radio alrededor del punto. */
export function celdasEnRadio(lat: number, lon: number, radioKm: number, metros = 10000): string[] {
  const [e, n] = laea(lat, lon);
  const r = radioKm * 1000;
  const ie = Math.floor(e / metros);
  const jn = Math.floor(n / metros);
  const paso = Math.ceil(r / metros) + 1;
  const salida: string[] = [];
  for (let i = ie - paso; i <= ie + paso; i++)
    for (let j = jn - paso; j <= jn + paso; j++) {
      const dx = Math.max(i * metros - e, 0, e - (i + 1) * metros);
      const dy = Math.max(j * metros - n, 0, n - (j + 1) * metros);
      if (Math.hypot(dx, dy) <= r) salida.push(`${metros / 1000}kmE${i}N${j}`);
    }
  return salida;
}

/** «10kmE315N202» → «100kmE31N20»: el trozo de datos publicado que la contiene. */
export function bloque(codigo: string): string {
  const [e, n] = codigo.split("E")[1].split("N").map(Number);
  return `100kmE${Math.floor(e / 10)}N${Math.floor(n / 10)}`;
}
