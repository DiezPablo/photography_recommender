// Descarga los datos publicados por GitHub Actions (release "datos") antes de compilar la web.
// - Se guardan comprimidos en datos/*.gz, fuera de public/: el servidor los lee con gunzip (src/lib/datos.ts).
//   Así no se publican como estáticos ni pesan sin comprimir en cada función: con todo en public/ cada despliegue
//   ocupaba cientos de MB y Vercel guarda 30 días de despliegues.
// - En public/datos solo va lo que pide el navegador (PUBLICOS) y un resumen para las pruebas.
// Si no hay red o la release aún no existe, se usa lo que ya haya. Con SIN_DESCARGA, los de public/datos.
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";

// Release «datos» de este repositorio; mientras no tenga datos propios, los de Rasante (donde nació el proyecto)
const REPOS = [process.env.DATOS_REPO ?? "DiezPablo/safari_recommender", "DiezPablo/photo_recommender"];
const FICHEROS = [
  "safaris.json",
  "safaris_recientes.json",
  "safaris_mundo.json",
  "safaris_indice.json",
  "espana.json",
  "espana_recientes.json",
  "espana_lugares.json",
];
// el único que se pide desde el navegador (fetch en ExploradorSafaris)
const PUBLICOS = ["safaris_indice.json"];
const COMPRIMIDOS = path.join(process.cwd(), "datos");
const PUBLICO = path.join(process.cwd(), "public", "datos");

async function existe(f) {
  try {
    return (await stat(f)).size > 0;
  } catch {
    return false;
  }
}

async function descargar(nombre) {
  for (const repo of REPOS) {
    const gz = await descargarDe(repo, nombre);
    if (gz) return gz;
  }
  return null;
}

async function descargarDe(repo, nombre) {
  const url = `https://github.com/${repo}/releases/download/datos/${nombre}.gz`;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const gz = Buffer.from(await r.arrayBuffer());
      JSON.parse(gunzipSync(gz).toString("utf8")); // que sea JSON válido antes de sustituir nada
      return gz;
    } catch (e) {
      console.warn(`  ${nombre}: intento ${intento} fallido (${e.message})`);
      await new Promise((ok) => setTimeout(ok, 2000 * intento));
    }
  }
  return null;
}

await mkdir(COMPRIMIDOS, { recursive: true });
await mkdir(PUBLICO, { recursive: true });
if (process.env.SIN_DESCARGA) {
  console.log("Datos: SIN_DESCARGA, se usan los de public/datos");
} else {
  for (const f of FICHEROS) {
    const gz = await descargar(f);
    const destino = path.join(COMPRIMIDOS, `${f}.gz`);
    if (gz) {
      await writeFile(destino, gz);
      console.log(`Datos: ${f} descargado (${(gz.length / 1e6).toFixed(1)} MB comprimido)`);
    } else if (await existe(destino)) {
      console.log(`Datos: ${f} no disponible en la release; se usa el local`);
    } else {
      console.warn(`Datos: ${f} no disponible: la web saldrá sin datos`);
    }
  }
}
// los que pide el navegador, descomprimidos en public/datos (también con SIN_DESCARGA si hay .gz)
for (const f of PUBLICOS) {
  const gz = path.join(COMPRIMIDOS, `${f}.gz`);
  if (await existe(gz)) await writeFile(path.join(PUBLICO, f), gunzipSync(await readFile(gz)));
}

// Resumen para las pruebas (que también corren contra producción, sin acceso a los ficheros): qué datos hay.
const disponibles = [];
for (const f of FICHEROS)
  if ((await existe(path.join(COMPRIMIDOS, `${f}.gz`))) || (await existe(path.join(PUBLICO, f)))) disponibles.push(f);
await writeFile(path.join(PUBLICO, "resumen.json"), JSON.stringify({ ficheros: disponibles }));
