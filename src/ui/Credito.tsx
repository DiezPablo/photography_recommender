// Autor y licencia de una foto (iNaturalist o Wikimedia Commons), siempre accesibles: un «©» sobre la foto con
// enlace a la original. Las fotos con licencia ND (sin obras derivadas) no se recortan: clase foto-nd.
import type { FotoSafari } from "@/features/safaris/modelo";

/** Enlace a la página de la foto: la de iNaturalist sale del número de la URL; la de Commons viene en `web`. */
export function origenFoto(f: Pick<FotoSafari, "url" | "web">): string | null {
  if (f.web) return f.web;
  const m = f.url.match(/photos\/(\d+)\//);
  return m ? `https://www.inaturalist.org/photos/${m[1]}` : null;
}

export function textoCredito(f: Pick<FotoSafari, "autor" | "licencia">): string {
  return [f.autor?.replace(/^\(c\)\s*/i, "© ") ?? "Autor desconocido", f.licencia].filter(Boolean).join(" · ");
}

/** true si la licencia no permite obras derivadas: no se recorta (object-fit: contain). */
export const esNd = (f: Pick<FotoSafari, "licencia"> | null | undefined) =>
  Boolean(f?.licencia?.toUpperCase().includes("ND"));

export default function Credito({ foto }: { foto: FotoSafari }) {
  const href = origenFoto(foto);
  const texto = textoCredito(foto);
  return href ? (
    <a className="credito" href={href} target="_blank" rel="noopener" title={texto} aria-label={`Foto: ${texto}`}>
      ©
    </a>
  ) : (
    <span className="credito" title={texto} aria-label={`Foto: ${texto}`}>
      ©
    </span>
  );
}
