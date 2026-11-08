"use client";
// Buscador de la cabecera: parques, animales y países, con autocompletado tolerante a tildes y erratas. El índice
// (/buscar.json) se pide la primera vez que se enfoca. Sin JavaScript es un formulario que lleva a /buscar.
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buscar, TIPO_TEXTO, type EntradaBusqueda } from "@/lib/busqueda";

let promesa: Promise<EntradaBusqueda[]> | null = null;
function cargar(): Promise<EntradaBusqueda[]> {
  promesa ??= fetch("/buscar.json")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .catch(() => {
      promesa = null;
      return [];
    });
  return promesa;
}

export default function BuscadorGlobal() {
  const router = useRouter();
  const id = useId();
  const [entradas, setEntradas] = useState<EntradaBusqueda[] | null>(null);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const caja = useRef<HTMLFormElement>(null);

  const resultados = useMemo(() => (entradas ? buscar(entradas, texto) : []), [entradas, texto]);

  // cerrar al tocar fuera
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const ir = (href: string) => {
    setAbierto(false);
    setTexto("");
    setActivo(-1);
    router.push(href);
  };

  const mostrar = abierto && texto.trim().length >= 2;
  return (
    <form
      ref={caja}
      className="buscador-global"
      role="search"
      action="/buscar"
      onSubmit={(e) => {
        e.preventDefault();
        const elegido = resultados[activo] ?? resultados[0];
        if (elegido) ir(elegido.href);
        else if (texto.trim()) ir(`/buscar?q=${encodeURIComponent(texto.trim())}`);
      }}
    >
      <label htmlFor={`${id}-q`} className="sr">
        Buscar parque, animal o país
      </label>
      <input
        id={`${id}-q`}
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Buscar parque, animal o país"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={mostrar && activo >= 0 ? `${id}-${activo}` : undefined}
        value={texto}
        onFocus={() => {
          setAbierto(true);
          if (!entradas) cargar().then(setEntradas);
        }}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          setActivo(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActivo((a) => Math.min(a + 1, resultados.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActivo((a) => Math.max(a - 1, -1));
          } else if (e.key === "Escape") {
            setAbierto(false);
          }
        }}
      />
      {mostrar && (
        <ul id={`${id}-lista`} role="listbox" className="buscador-resultados" aria-label="Resultados">
          {!entradas && <li className="buscador-vacio">Cargando…</li>}
          {entradas && !resultados.length && (
            <li className="buscador-vacio">Nada con «{texto.trim()}». Prueba con otro nombre o en inglés.</li>
          )}
          {resultados.map((r, i) => (
            <li
              key={r.href}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === activo}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => ir(r.href)}
            >
              {r.f ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.f} alt="" width={32} height={32} loading="lazy" />
              ) : (
                <span className="buscador-icono" aria-hidden />
              )}
              <span>
                <b>{r.t}</b>
                <small>
                  {TIPO_TEXTO[r.tipo]}
                  {r.s ? ` · ${r.s}` : ""}
                  {r.d ? ` · ${r.d}` : ""}
                </small>
              </span>
            </li>
          ))}
          {entradas && (
            <li
              id={`${id}-todos`}
              role="option"
              aria-selected={false}
              className="buscador-todos"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => ir(`/buscar?q=${encodeURIComponent(texto.trim())}`)}
            >
              Ver todos los resultados de «{texto.trim()}», también espacios protegidos con poca fauna →
            </li>
          )}
        </ul>
      )}
    </form>
  );
}
