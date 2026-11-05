"use client";
// Bloque «Fotografía» de la ficha (T23): normas y condiciones que deciden la foto, con el amanecer y el atardecer
// del mes elegido en hora local, para compararlos con el horario de las pistas.
import { MESES } from "@/lib/fechas";
import { useMesElegido } from "@/lib/mes";
import { horaSol } from "@/lib/sol";
import {
  REVISADO_FOTOGRAFIA,
  TEXTO_NIVEL,
  TEXTO_SI_NO,
  type FotografiaParque,
} from "@/features/safaris/fotografiaParques";

function hora(d: Date | null, tz: string): string {
  return d ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: tz }) : "–";
}

export default function Fotografia({
  f,
  lat,
  lon,
  mesHoy,
}: {
  f: FotografiaParque;
  lat: number;
  lon: number;
  mesHoy: number;
}) {
  const [mes] = useMesElegido(mesHoy);
  const fecha = `${new Date().getFullYear()}-${String(mes + 1).padStart(2, "0")}-15`;
  const sale = horaSol(fecha, lat, lon, -0.833, true);
  const pone = horaSol(fecha, lat, lon, -0.833, false);
  const filas: [string, string, string?][] = [
    ["Salir de pista", TEXTO_SI_NO[f.fueraPista], f.fueraPistaNota],
    ["Vehículo", f.vehiculo],
    [
      "Horario",
      f.horario,
      `A mediados de ${MESES[mes]}, el sol sale hacia las ${hora(sale, f.tz)} y se pone hacia las ${hora(pone, f.tz)} (hora local).`,
    ],
    ["Salidas nocturnas", TEXTO_SI_NO[f.nocturnos], f.nocturnosNota],
    ["Vehículos por avistamiento", TEXTO_NIVEL[f.aglomeracion], f.aglomeracionNota],
    ...(f.especial ? ([["Hides, barcas y más", f.especial]] as [string, string][]) : []),
    ["Focal orientativa", f.focal],
  ];
  return (
    <section className="seccion fotografia-parque" id="fotografia" aria-labelledby="fotografia-titulo">
      <h2 className="titulo-capa" id="fotografia-titulo">
        Fotografía
      </h2>
      <dl className="datos-foto">
        {filas.map(([dt, dd, nota]) => (
          <div key={dt}>
            <dt>{dt}</dt>
            <dd>
              {dd}
              {nota && <small>{nota}</small>}
            </dd>
          </div>
        ))}
      </dl>
      {f.notas.length > 0 && (
        <ul className="notas-foto">
          {f.notas.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <p className="nota-pie">
        Escrito a mano con las normas del parque y la experiencia de guías y fotógrafos (revisado el{" "}
        {REVISADO_FOTOGRAFIA}). Los horarios cambian: confírmalos con el parque o tu operador.
      </p>
    </section>
  );
}
