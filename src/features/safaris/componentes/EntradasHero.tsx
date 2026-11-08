"use client";
// Las tres entradas de la portada (T33): «Tengo un animal» (lo añade a «¿Qué quieres ver?»), «Tengo unas fechas»
// (el mes del viaje, el de toda la web) y «Tengo un destino» (filtra el buscador de parques). Sin JavaScript es un
// formulario que lleva al buscador con el mes y el texto.
import Link from "next/link";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { useParametrosUrl } from "@/lib/almacen";
import { useMesElegido } from "@/lib/mes";
import SelectorEspecie, { type OpcionEspecie } from "@/ui/SelectorEspecie";

function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function EntradasHero({ opciones, mesHoy }: { opciones: OpcionEspecie[]; mesHoy: number }) {
  const [parametros, actualizar] = useParametrosUrl();
  const [mes, cambiarMes] = useMesElegido(mesHoy);
  const [destino, setDestino] = useState(parametros.get("q") ?? "");
  return (
    <form
      className="entradas-hero"
      action="/safaris#explorar"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        actualizar({ q: destino.trim() || null });
        irA("explorar");
      }}
    >
      <div className="entrada-hero">
        <SelectorEspecie
          opciones={opciones}
          valor={null}
          etiqueta="Tengo un animal"
          vacio="León, gorila, oso polar…"
          onCambio={(clave) => {
            if (clave === null) return;
            const ver = (parametros.get("ver") ?? "").split(",").filter(Boolean);
            actualizar({ ver: [...ver.filter((c) => c !== String(clave)), String(clave)].slice(-4).join(",") });
            setTimeout(() => irA("que-ver"), 50);
          }}
        />
      </div>
      <label className="entrada-hero">
        <span className="rotulo">Tengo unas fechas</span>
        <select
          name="mes"
          value={mes}
          onChange={(e) => {
            cambiarMes(Number(e.target.value));
            irA("explorar");
          }}
        >
          {MESES.map((m, i) => (
            <option key={m} value={i}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
              {i === mesHoy ? " (este mes)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="entrada-hero">
        <span className="rotulo">Tengo un destino</span>
        <span className="entrada-destino">
          <input
            type="search"
            name="q"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="Kenia, Borneo, Pantanal…"
          />
          <button type="submit" aria-label="Buscar destino">
            →
          </button>
        </span>
      </label>
      <p className="entrada-espana">
        ¿Más cerca? <Link href="/">Fauna en España →</Link>
      </p>
    </form>
  );
}
