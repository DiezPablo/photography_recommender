// Piezas de las páginas de respuesta (/safari-en/…): textos de plantilla a partir de los datos y la navegación
// entre meses, países y comparativas. Solo servidor.
import Link from "next/link";
import { MESES } from "@/lib/fechas";
import { especiePorTaxon, nivelFrecuencia, nombreTaxon, paisesDestacados, type Parque } from "@/features/safaris/datos";

/** Comparativas que más se buscan: «Kenia o Tanzania en agosto». Cada pareja, con los 12 meses. */
export const PAREJAS: [string, string][] = [
  ["kenia", "tanzania"],
  ["botsuana", "sudafrica"],
  ["botsuana", "zambia"],
  ["botsuana", "namibia"],
  ["namibia", "sudafrica"],
  ["kenia", "sudafrica"],
  ["tanzania", "sudafrica"],
  ["tanzania", "botsuana"],
  ["uganda", "ruanda"],
  ["zambia", "zimbabue"],
  ["india", "sri-lanka"],
];

/** «kenia-o-tanzania-en-agosto» → ["kenia", "tanzania", 7] */
export function parejaDe(clave: string): [string, string, number] | null {
  for (const [a, b] of PAREJAS) {
    const prefijo = `${a}-o-${b}-en-`;
    if (clave.startsWith(prefijo)) {
      const mes = MESES.indexOf(clave.slice(prefijo.length));
      if (mes >= 0) return [a, b, mes];
    }
  }
  return null;
}

export function clavePareja(a: string, b: string, mes: number): string {
  return `${a}-o-${b}-en-${MESES[mes]}`;
}

/** Especies estrella frecuentes en los registros ese mes (≥ 20 ‰), de más a menos. */
export function probables(p: Parque, mes: number): string[] {
  return Object.entries(p.frecuencia ?? {})
    .map(([t, f]) => ({ e: especiePorTaxon(Number(t)), f: f[mes] ?? 0 }))
    .filter((x) => x.e && nivelFrecuencia(x.f).clave.includes("frecuente"))
    .sort((a, b) => b.f - a.f)
    .map((x) => nombreTaxon(x.e!).toLowerCase());
}

export function lista(nombres: string[]): string {
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}` : (nombres[0] ?? "");
}

export function rango(meses: number[]): string {
  // meses seguidos (también de diciembre a enero) como «julio a octubre»
  const si = new Set(meses);
  if (si.size === 12) return "todo el año";
  const tramos: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!si.has(m) || si.has(m === 1 ? 12 : m - 1)) continue;
    let n = 1;
    while (si.has(((m - 1 + n) % 12) + 1)) n++;
    const fin = ((m - 1 + n - 1) % 12) + 1;
    tramos.push(n === 1 ? MESES[m - 1] : `${MESES[m - 1]} ${n === 2 ? "y" : "a"} ${MESES[fin - 1]}`);
  }
  return lista(tramos);
}

export function NavMeses({ actual }: { actual: number }) {
  return (
    <nav className="nav-respuestas" aria-label="Otros meses">
      {MESES.map((m, i) => (
        <Link key={m} href={`/safari-en/${m}`} aria-current={i === actual ? "page" : undefined}>
          {m}
        </Link>
      ))}
    </nav>
  );
}

export function NavPaises({ actual }: { actual?: string }) {
  return (
    <nav className="nav-respuestas" aria-label="Por países">
      {[...paisesDestacados()].map(([s, n]) => (
        <Link key={s} href={`/safari-en/${s}`} aria-current={s === actual ? "page" : undefined}>
          {n}
        </Link>
      ))}
    </nav>
  );
}
