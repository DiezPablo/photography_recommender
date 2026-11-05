"use client";
// Selector de especie con búsqueda, miniatura y grupos (T34): el <select> nativo con 87 nombres era incómodo en el
// móvil. Patrón combobox de ARIA: se escribe para filtrar (sin tildes), flechas para moverse, Intro para elegir.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normal, puntuar } from "@/lib/busqueda";
import { GRUPOS_FAUNA, type GrupoFauna } from "@/features/safaris/gruposFauna";

export interface OpcionEspecie {
  clave: number;
  nombre: string;
  cientifico: string;
  grupo: GrupoFauna;
  foto?: string | null;
}

export default function SelectorEspecie({
  opciones,
  valor,
  onCambio,
  etiqueta = "Qué quieres ver",
  vacio = "Cualquier especie",
  nombre,
}: {
  opciones: OpcionEspecie[];
  /** clave elegida (o null) */
  valor: number | null;
  onCambio: (clave: number | null) => void;
  etiqueta?: string;
  vacio?: string;
  /** nombre del campo oculto, para los formularios */
  nombre?: string;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const elegida = opciones.find((o) => o.clave === valor) ?? null;

  const filtradas = useMemo(() => {
    const q = normal(texto);
    // tolerante a tildes y erratas («gepardo»), como el buscador de la cabecera; también por grupo («felinos»)
    return opciones.filter(
      (o) =>
        !q ||
        normal(o.grupo).includes(q) ||
        puntuar(q, { tipo: "especie", t: o.nombre, s: o.cientifico, href: "" }) > 0,
    );
  }, [opciones, texto]);
  // en el orden de los grupos, que es el orden en que se recorren con las flechas
  const grupos = GRUPOS_FAUNA.map((g) => [g, filtradas.filter((o) => o.grupo === g)] as const).filter(
    ([, xs]) => xs.length,
  );
  const plana = grupos.flatMap(([, xs]) => xs);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const elegir = (o: OpcionEspecie | null) => {
    onCambio(o?.clave ?? null);
    setTexto("");
    setAbierto(false);
  };

  return (
    <div className="selector-especie" ref={caja}>
      <label htmlFor={`${id}-q`} className="rotulo">
        {etiqueta}
      </label>
      {nombre && <input type="hidden" name={nombre} value={valor ?? ""} />}
      <div className="selector-especie-campo">
        {elegida?.foto && !abierto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={elegida.foto} alt="" width={28} height={28} />
        )}
        <input
          id={`${id}-q`}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={abierto && plana[activo] ? `${id}-${plana[activo].clave}` : undefined}
          placeholder={elegida ? elegida.nombre : vacio}
          value={abierto ? texto : (elegida?.nombre ?? "")}
          onFocus={() => {
            setAbierto(true);
            setActivo(0);
          }}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setAbierto(true);
              setActivo((a) => Math.min(a + 1, plana.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActivo((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && abierto) {
              e.preventDefault();
              if (plana[activo]) elegir(plana[activo]);
            } else if (e.key === "Escape") {
              setAbierto(false);
            }
          }}
        />
        {elegida && (
          <button
            type="button"
            className="quitar-especie"
            aria-label={`Quitar ${elegida.nombre}`}
            onClick={() => elegir(null)}
          >
            ×
          </button>
        )}
      </div>
      {abierto && (
        <div id={`${id}-lista`} role="listbox" aria-label={etiqueta} className="selector-especie-lista">
          {!plana.length && <p className="buscador-vacio">Ninguna especie con «{texto}».</p>}
          {grupos.map(([g, xs]) => (
            <div key={g} role="group" aria-label={g}>
              <p className="rotulo" aria-hidden>
                {g}
              </p>
              {xs.map((o) => {
                const i = plana.indexOf(o);
                return (
                  <div
                    key={o.clave}
                    id={`${id}-${o.clave}`}
                    role="option"
                    aria-selected={i === activo}
                    className={o.clave === valor ? "elegida" : undefined}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => elegir(o)}
                  >
                    {o.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.foto} alt="" width={32} height={32} loading="lazy" />
                    ) : (
                      <span className="buscador-icono tipo-especie" aria-hidden />
                    )}
                    <span>
                      {o.nombre}
                      <small>
                        <i>{o.cientifico}</i>
                      </small>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
