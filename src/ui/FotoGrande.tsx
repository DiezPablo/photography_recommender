"use client";
// Foto de Wikimedia Commons a 1280 px para las cabeceras a sangre (la de 960 se ve borrosa a pantalla completa).
// Si el original es más pequeño, Commons no da la de 1280: se vuelve a la de 960.
import { useState } from "react";

export default function FotoGrande({ src, alt = "", posicion }: { src: string; alt?: string; posicion?: string }) {
  const grande = src.replace(/\/960px-/, "/1280px-");
  const [url, setUrl] = useState(grande);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      fetchPriority="high"
      style={posicion ? { objectPosition: posicion } : undefined}
      onError={() => url !== src && setUrl(src)}
    />
  );
}
