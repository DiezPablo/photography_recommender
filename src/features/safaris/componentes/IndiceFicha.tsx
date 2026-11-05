"use client";
// Índice fijo de la ficha de un parque: la ficha es larga y cada viajero busca una cosa (qué se ve, cuándo,
// cómo organizarlo, dónde dormir). Enlaces a anclas: funciona sin JavaScript; con él, marca la sección en la que
// estás y la desplaza a la vista en el móvil.
import { useEffect, useRef, useState } from "react";

export default function IndiceFicha({ secciones }: { secciones: [string, string][] }) {
  const [activa, setActiva] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const ids = secciones.map(([id]) => id).join(",");

  useEffect(() => {
    const elementos = ids
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    if (!elementos.length || !("IntersectionObserver" in window)) return;
    const visibles = new Set<string>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.add(e.target.id);
          else visibles.delete(e.target.id);
        }
        // la primera, en el orden de la página, de las que están en la franja superior
        const primera = elementos.find((x) => visibles.has(x.id));
        if (primera) setActiva(primera.id);
      },
      { rootMargin: "-130px 0px -55% 0px" },
    );
    elementos.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [ids]);

  useEffect(() => {
    const a = activa && nav.current?.querySelector<HTMLElement>(`a[href="#${activa}"]`);
    if (a && nav.current) nav.current.scrollTo({ left: a.offsetLeft - 20, behavior: "smooth" });
  }, [activa]);

  return (
    <nav className="indice-ficha" aria-label="En esta página" ref={nav}>
      {secciones.map(([id, texto]) => (
        <a key={id} href={`#${id}`} aria-current={activa === id ? "location" : undefined}>
          {texto}
        </a>
      ))}
    </nav>
  );
}
