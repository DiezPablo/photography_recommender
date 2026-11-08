"use client";
// Las 24 horas de un día en un punto: el color del cielo según la altura del sol (noche, hora azul, hora dorada,
// día), con la salida y la puesta, y encima la previsión de Open-Meteo (nubes por hora y rachas) o, más allá de
// 16 días, lo normal en esos días del año. El dibujo es SVG estirado; las cifras van en HTML para que se lean
// igual en el móvil.
import { useEffect, useState } from "react";
import { horaLocal, horaSol, zonaHoraria } from "@/lib/sol";
import { tiempoPara, type Climatologia, type Prevision } from "@/lib/tiempo";

/** Hora local decimal (7:30 → 7,5) de un instante en el punto. */
function decimal(d: Date, lon: number): number {
  const [h, m] = d
    .toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zonaHoraria(lon) })
    .split(":")
    .map(Number);
  return (h % 24) + m / 60;
}

interface Tramo {
  desde: number;
  hasta: number;
  clase: "noche" | "azul" | "dorada" | "dia";
}

/** Tramos del cielo de un día: noche, hora azul (sol entre −6° y la salida), dorada (de la salida a 6°) y día. */
export function tramosCielo(fecha: string, lat: number, lon: number) {
  const h = (alt: number, manana: boolean) => {
    const d = horaSol(fecha, lat, lon, alt, manana);
    return d ? { d, x: decimal(d, lon) } : null;
  };
  const az1 = h(-6, true);
  const sale = h(-0.833, true);
  const do1 = h(6, true);
  const do2 = h(6, false);
  const pone = h(-0.833, false);
  const az2 = h(-6, false);
  if (!az1 || !sale || !do1 || !do2 || !pone || !az2) return null;
  const tramos: Tramo[] = [
    { desde: 0, hasta: az1.x, clase: "noche" },
    { desde: az1.x, hasta: sale.x, clase: "azul" },
    { desde: sale.x, hasta: do1.x, clase: "dorada" },
    { desde: do1.x, hasta: do2.x, clase: "dia" },
    { desde: do2.x, hasta: pone.x, clase: "dorada" },
    { desde: pone.x, hasta: az2.x, clase: "azul" },
    { desde: az2.x, hasta: 24, clase: "noche" },
  ];
  return { tramos, sale, pone, do1, do2 };
}

type Tiempo = Prevision | Climatologia;

export default function FranjaDia({ lat, lon, fecha }: { lat: number; lon: number; fecha: string }) {
  const clave = `${lat.toFixed(2)},${lon.toFixed(2)},${fecha}`;
  const [tiempo, setTiempo] = useState<{ clave: string; t: Tiempo | null; error?: boolean }>();
  useEffect(() => {
    let vivo = true;
    tiempoPara(lat, lon, fecha)
      .then((t) => vivo && setTiempo({ clave, t }))
      .catch(() => vivo && setTiempo({ clave, t: null, error: true }));
    return () => {
      vivo = false;
    };
  }, [lat, lon, fecha, clave]);
  const t = tiempo?.clave === clave ? tiempo : undefined;
  const cielo = tramosCielo(fecha, lat, lon);
  if (!cielo) return null;
  const pct = (x: number) => `${((x / 24) * 100).toFixed(2)}%`;
  const prev = t?.t?.tipo === "prevision" ? t.t : null;
  const clima = t?.t?.tipo === "climatologia" ? t.t : null;
  const rachaMax = prev ? Math.max(...prev.horas.map((h) => h.rachas)) : 0;
  const horaRacha = prev?.horas.find((h) => h.rachas === rachaMax);
  return (
    <figure className="franja-dia">
      <figcaption className="franja-titulo">
        Luz y tiempo,{" "}
        {new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </figcaption>
      {prev && (
        <div className="franja-prevision" aria-hidden="true">
          <svg viewBox="0 0 240 40" preserveAspectRatio="none">
            {prev.horas.slice(0, 24).map((h, i) => {
              const total = Math.max(h.nubesBajas, h.nubesMedias, h.nubesAltas);
              return (
                <g key={h.hora}>
                  <rect className="nube" x={i * 10 + 1} y={40 - total * 0.4} width={8} height={total * 0.4} />
                  <rect
                    className="nube-baja"
                    x={i * 10 + 1}
                    y={40 - h.nubesBajas * 0.4}
                    width={8}
                    height={h.nubesBajas * 0.4}
                  />
                  {(h.probLluvia ?? 0) >= 50 && <rect className="lluvia" x={i * 10 + 1} y={0} width={8} height={3} />}
                </g>
              );
            })}
            <polyline
              className="racha"
              points={prev.horas
                .slice(0, 24)
                .map((h, i) => `${i * 10 + 5},${40 - Math.min(60, h.rachas) * (40 / 60)}`)
                .join(" ")}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      )}
      <div className="franja-cielo" aria-hidden="true">
        {cielo.tramos.map((x) => (
          <span
            key={`${x.clase}-${x.desde}`}
            className={`cielo-${x.clase}`}
            style={{ left: pct(x.desde), width: pct(x.hasta - x.desde) }}
          />
        ))}
        <span className="marca-sol" style={{ left: pct(cielo.sale.x) }} />
        <span className="marca-sol" style={{ left: pct(cielo.pone.x) }} />
      </div>
      <div className="franja-horas" aria-hidden="true">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h} style={{ left: pct(h) }}>
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>
      <dl className="franja-datos">
        <div>
          <dt>Sale el sol</dt>
          <dd className="cifra">{horaLocal(cielo.sale.d, lon)}</dd>
        </div>
        <div>
          <dt>Luz dorada</dt>
          <dd className="cifra">
            hasta {horaLocal(cielo.do1.d, lon)} y desde {horaLocal(cielo.do2.d, lon)}
          </dd>
        </div>
        <div>
          <dt>Se pone</dt>
          <dd className="cifra">{horaLocal(cielo.pone.d, lon)}</dd>
        </div>
      </dl>
      <p className="franja-nota">
        {prev ? (
          <>
            Barras: nubes por hora (oscuro, las bajas, que apagan la luz). Línea: rachas
            {horaRacha ? `, la más fuerte de ${Math.round(rachaMax)} km/h a las ${horaRacha.hora.slice(11, 16)}` : ""}.
            {prev.horas.some((h) => (h.probLluvia ?? 0) >= 50) ? " Raya arriba: lluvia probable (50 % o más)." : ""}{" "}
            Previsión de Open-Meteo.
          </>
        ) : clima ? (
          <>
            Más allá de 16 días no hay previsión: en esas fechas, de {clima.desde} a {clima.hasta}, llovió más de 1 mm
            el {clima.diasLluvia} % de los días, con nubes de media del {clima.nubes} % (archivo de Open-Meteo).
          </>
        ) : t?.error ? (
          "No se pudo cargar el tiempo de Open-Meteo."
        ) : (
          "Cargando el tiempo…"
        )}
      </p>
    </figure>
  );
}
