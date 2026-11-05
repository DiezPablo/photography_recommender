// Imágenes responsive (T03): `srcset` para que las tarjetas no se vean borrosas en pantallas retina ni descarguen
// de más. iNaturalist sirve square (75), small (240), medium (500), large (1024); Commons, miniaturas de tamaños
// estándar (120, 250, 330, 500, 960, 1280…), y el original cuando mide menos de 960 px (entonces no hay más).

export interface FuenteImagen {
  src: string;
  srcSet?: string;
  sizes?: string;
}

const INAT = /\/(square|small|medium|large|original)\.(jpe?g|png|gif)$/i;
const COMMONS = /\/(\d+)px-/;

/** `sizes`: lo que ocupa la imagen en la página (p. ej. «(max-width: 600px) 50vw, 240px»). */
export function fuenteImagen(url: string, sizes: string): FuenteImagen {
  if (INAT.test(url)) {
    const de = (t: string) => url.replace(INAT, `/${t}.$2`);
    return { src: de("medium"), srcSet: `${de("medium")} 500w, ${de("large")} 1024w`, sizes };
  }
  if (COMMONS.test(url)) {
    const de = (w: number) => url.replace(COMMONS, `/${w}px-`);
    return { src: de(500), srcSet: `${de(330)} 330w, ${de(500)} 500w, ${de(960)} 960w`, sizes };
  }
  return { src: url };
}
