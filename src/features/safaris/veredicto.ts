// Veredicto de cada mes en la ficha de un parque (T37): una frase hecha con los datos que ya hay (temporada
// escrita a mano, frecuencia de las especies estrella, migración, cierres, precio de los lodges y lluvia).
// «Noviembre: buen mes. Muy frecuente en los registros: león y guepardo; frecuente: leopardo. Migración: este del parque. Lodges un
// 35 % más baratos que en temporada alta. Lluvias cortas (95 mm).» Puro: servidor y navegador.
import { MESES } from "@/lib/fechas";
import { cierreEn, TEXTO_TIPO_CIERRE } from "@/features/safaris/cierres";
import { MIGRACION } from "@/features/safaris/migracion";
import { indicePrecios } from "@/features/safaris/temporadaVerde";
import { nivelFrecuencia, type Parque } from "@/features/safaris/modelo";

export type Nota = "excelente" | "bueno" | "regular" | "malo" | "cerrado";

export interface VeredictoMes {
  nota: Nota;
  /** «Muy buen mes», «Cerrado»… */
  titulo: string;
  /** frases cortas, en orden de importancia */
  detalles: string[];
}

const TITULO: Record<Nota, string> = {
  excelente: "Muy buen mes",
  bueno: "Buen mes",
  regular: "Mes regular",
  malo: "Mal mes para ir",
  cerrado: "Cerrado",
};

// «Sur del Serengeti» → «sur del Serengeti», pero «Masái Mara» se queda
function minusculaComun(t: string): string {
  return /^(Sur|Norte|Este|Oeste|Centro|Corredor|Río|Llanuras|Zona)\b/.test(t)
    ? t.charAt(0).toLowerCase() + t.slice(1)
    : t;
}

function lista(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

/** El veredicto de los 12 meses (índice 0-11). `especies`: nombre de cada especie estrella y su frecuencia (‰)
 * por mes, como en la tabla de probabilidad. */
export function veredictos(p: Parque, especies: { nombre: string; meses: (number | null)[] }[]): VeredictoMes[] {
  const precios = indicePrecios(p.id);
  const lluvias = p.clima?.lluvia_mm ?? [];
  const maxLluvia = Math.max(0, ...lluvias);
  return MESES.map((_, i) => {
    const mes = i + 1;
    const detalles: string[] = [];
    const cierre = cierreEn(p.id, mes);
    if (cierre) detalles.push(`${TEXTO_TIPO_CIERRE[cierre.tipo]}: ${cierre.texto}`);

    const porNivel = new Map<string, string[]>();
    for (const e of especies) {
      const n = nivelFrecuencia(e.meses[i]);
      if (n.clave === "muy-frecuente" || n.clave === "frecuente")
        porNivel.set(n.texto, [...(porNivel.get(n.texto) ?? []), e.nombre.toLowerCase()]);
    }
    const muy = porNivel.get("muy frecuente") ?? [];
    const prob = porNivel.get("frecuente") ?? [];
    const especiesTexto = [
      muy.length ? `Muy frecuente en los registros: ${lista(muy.slice(0, 4))}` : "",
      prob.length ? `${muy.length ? "frecuente" : "Frecuente en los registros"}: ${lista(prob.slice(0, 3))}` : "",
    ].filter(Boolean);
    if (especiesTexto.length) detalles.push(especiesTexto.join("; "));

    for (const z of MIGRACION.filter((z) => z.mes === mes && (z.parque === p.id || z.tambien?.includes(p.id))))
      detalles.push(
        `Migración: ${minusculaComun(z.zona)}${z.cruces ? ", con cruces de ríos" : ""}${z.partos ? ", época de partos" : ""}`,
      );

    const precio = precios?.meses[i];
    if (precio != null && precio < 0.9)
      detalles.push(`Lodges un ${Math.round((1 - precio) * 100)} % más baratos que en su mes más caro`);
    else if (precio != null && precio >= 0.97) detalles.push("Precios de temporada alta en los lodges");

    const lluvia = lluvias[i];
    const lluvioso = lluvia != null && maxLluvia > 0 && lluvia >= 100 && lluvia >= maxLluvia * 0.5;
    if (lluvia != null && lluvioso) detalles.push(`Mes de lluvias (${Math.round(lluvia)} mm de media)`);
    else if (lluvia != null && lluvia < 20) detalles.push(`Seco (${Math.round(lluvia)} mm de media)`);

    const enTemporada = p.meses.includes(mes);
    const nota: Nota = cierre
      ? cierre.tipo === "parque" || cierre.tipo === "zona"
        ? "cerrado"
        : "malo"
      : enTemporada
        ? muy.length >= 2 || (muy.length && !lluvioso)
          ? "excelente"
          : "bueno"
        : muy.length || prob.length
          ? "regular"
          : "malo";
    if (!enTemporada && !cierre) detalles.push("Fuera de la mejor época del parque");
    return { nota, titulo: TITULO[nota], detalles };
  });
}
