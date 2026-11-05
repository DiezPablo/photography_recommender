// Las reglas de nombres comunes, leídas en el servidor de los mismos ficheros que usa el pipeline.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { nombreComunCon, type ReglasNombres } from "@/features/safaris/modelo";

let reglas: ReglasNombres | undefined;
export function reglasNombres(): ReglasNombres {
  if (!reglas) {
    const dir = path.join(process.cwd(), "safari", "recursos");
    const csv = readFileSync(path.join(dir, "nombres_safari.csv"), "utf8").trim().split("\n").slice(1);
    const propios = readFileSync(path.join(dir, "nombres_propios.txt"), "utf8")
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x && !x.startsWith("#"));
    reglas = {
      diccionario: Object.fromEntries(
        csv.map((l) => {
          const i = l.indexOf(",");
          return [l.slice(0, i), l.slice(i + 1)];
        }),
      ),
      propios,
    };
  }
  return reglas;
}

/** Nombre común con las reglas (en el servidor). */
export function nombreComun(cientifico: string | null | undefined, bruto: string | null | undefined): string | null {
  return nombreComunCon(cientifico, bruto, reglasNombres());
}
