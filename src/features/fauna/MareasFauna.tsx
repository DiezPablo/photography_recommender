"use client";
// En la costa, las mareas del día con la mejor ventana para limícolas (Open-Meteo Marine). Tierra adentro no sale.
// La dirección del sol se quitó (spec 022): es de planificar la toma, no de decidir adónde ir.
import { useEffect, useState } from "react";
import { leerMareas, urlMareas, type MareasDia } from "@/lib/mareas";

export default function MareasFauna({ lat, lon, fecha }: { lat: number; lon: number; fecha: string }) {
  const clave = `${lat.toFixed(3)},${lon.toFixed(3)},${fecha}`;
  const [res, setRes] = useState<{ clave: string; m: MareasDia | null }>();
  useEffect(() => {
    let vivo = true;
    fetch(urlMareas(lat, lon, fecha))
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => vivo && setRes({ clave, m: x ? leerMareas(x, fecha, lat, lon) : null }))
      .catch(() => vivo && setRes({ clave, m: null }));
    return () => {
      vivo = false;
    };
  }, [lat, lon, fecha, clave]);
  const mareas = res?.clave === clave ? res.m : null;

  if (!mareas || !mareas.mareas.length) return null;
  return (
    <details className="seccion plegable mareas-fauna">
      <summary className="rotulo">Mareas hoy</summary>
      <p>
        {mareas.mareas.map((m) => `${m.tipo === "alta" ? "pleamar" : "bajamar"} ${m.hora} (${m.m} m)`).join(" · ")}.{" "}
        {mareas.limicolas.length > 0 ? (
          <>
            Rango de {mareas.rango} m: con la marea subiendo las limícolas se acercan a la orilla; mejor{" "}
            {mareas.limicolas.join(" y ")}.
          </>
        ) : (
          <>Rango de {mareas.rango} m: la marea apenas se nota aquí.</>
        )}{" "}
        <small>(Open-Meteo Marine, modelo a ~8 km de la costa: orientativo.)</small>
      </p>
    </details>
  );
}
