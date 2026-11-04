"use client";
// Para fotografiar: por dónde sale y se pone el sol ese día (y hacia dónde mirar para tenerlo a la espalda) y, en
// la costa, las mareas con la mejor ventana para limícolas (Open-Meteo Marine).
import { useEffect, useState } from "react";
import { direccionesSol, rumbo } from "@/lib/sol";
import { leerMareas, urlMareas, type MareasDia } from "@/lib/mareas";

const frente = (g: number) => (g + 180) % 360;

export default function LuzYMar({ lat, lon, fecha }: { lat: number; lon: number; fecha: string }) {
  const d = direccionesSol(fecha, lat, lon);
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

  return (
    <div className="luz-y-mar">
      {d.sale !== null && d.pone !== null && (
        <p>
          <b>Dirección de la luz.</b> El sol sale por el {rumbo(d.sale)} ({d.sale}°) y se pone por el {rumbo(d.pone)} (
          {d.pone}°).
          {d.doradaManana !== null && d.doradaTarde !== null && (
            <>
              {" "}
              Con el sol a la espalda: por la mañana, mira hacia el {rumbo(frente(d.doradaManana))}; por la tarde, hacia
              el {rumbo(frente(d.doradaTarde))}. Mirando al revés, contraluces y siluetas.
            </>
          )}
        </p>
      )}
      {mareas && mareas.mareas.length > 0 && (
        <p>
          <b>Mareas.</b>{" "}
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
      )}
    </div>
  );
}
