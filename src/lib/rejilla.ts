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

/** Inversa (Snyder, p. 189): de [este, norte] de EPSG:3035 a [lat, lon]. */
export function laeaInversa(este: number, norte: number): [number, number] {
  const x = este - FE;
  const y = norte - FN;
  const rho = Math.hypot(x / D, D * y);
  if (rho < 1e-9) return [52, 10];
  const c = 2 * Math.asin(rho / (2 * RQ));
  const qv = QP * (Math.cos(c) * Math.sin(B0) + (D * y * Math.sin(c) * Math.cos(B0)) / rho);
  const lon =
    LON0 + Math.atan2(x * Math.sin(c), D * rho * Math.cos(B0) * Math.cos(c) - D * D * y * Math.sin(B0) * Math.sin(c));
  const beta = Math.asin(qv / QP);
  const e4 = E2 * E2;
  const e6 = e4 * E2;
  const lat =
    beta +
    (E2 / 3 + (31 * e4) / 180 + (517 * e6) / 5040) * Math.sin(2 * beta) +
    ((23 * e4) / 360 + (251 * e6) / 3780) * Math.sin(4 * beta) +
    ((761 * e6) / 45360) * Math.sin(6 * beta);
  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
}

/** Centro de una celda («10kmE315N202») en [lat, lon]. */
export function centroCelda(codigo: string): [number, number] {
  const m = codigo.match(/^(\d+)(km|m)E(\d+)N(\d+)$/);
  if (!m) throw new Error(`Celda no válida: ${codigo}`);
  const metros = Number(m[1]) * (m[2] === "km" ? 1000 : 1);
  return laeaInversa((Number(m[3]) + 0.5) * metros, (Number(m[4]) + 0.5) * metros);
}
