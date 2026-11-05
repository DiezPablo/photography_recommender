// Las reglas de nombres comunes, leídas en el servidor de los mismos ficheros que usa el pipeline.
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { nombreComunCon, type FotoSafari, type ReglasNombres } from "@/features/safaris/modelo";

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

/** Una línea de CSV con campos entre comillas (el autor lleva comas). */
function camposCsv(l: string): string[] {
  const salida: string[] = [];
  let actual = "";
  let comillas = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (c === '"' && comillas && l[i + 1] === '"') {
      actual += '"';
      i++;
    } else if (c === '"') comillas = !comillas;
    else if (c === "," && !comillas) {
      salida.push(actual);
      actual = "";
    } else actual += c;
  }
  salida.push(actual);
  return salida;
}

let elegidas: Record<string, FotoSafari> | undefined;
/** Fotos elegidas a mano para las especies principales (safari/recursos/fotos_especies.csv, T19); la misma lista
 * que aplica el pipeline, aquí también para los datos publicados antes. */
export function fotosElegidas(): Record<string, FotoSafari> {
  if (!elegidas) {
    const lineas = readFileSync(path.join(process.cwd(), "safari", "recursos", "fotos_especies.csv"), "utf8")
      .trim()
      .split("\n")
      .slice(1);
    elegidas = Object.fromEntries(
      lineas.map((l) => {
        const [cientifico, url, autor, licencia, web, posicion] = camposCsv(l);
        return [cientifico, { url, autor, licencia, web, ...(posicion ? { posicion } : {}) }];
      }),
    );
  }
  return elegidas;
}
