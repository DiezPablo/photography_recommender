// Mar en los spots de costa (Open-Meteo Marine): pleamares y bajamares del día y la marea en el pico de luz.
// Informativo: no entra en la nota. El oleaje viene en los datos pero no se enseña (spec 022).

export interface MarMomento {
  olas_m: number | null;
  periodo_s: number | null;
  /** 0 = bajamar del día, 1 = pleamar (sin él, la marea apenas se nota: Mediterráneo) */
  marea?: number;
  sube?: boolean;
}

export interface Mar {
  rango_m: number;
  mareas: { t: string; tipo: "alta" | "baja"; m: number }[];
  amanecer?: MarMomento;
  atardecer?: MarMomento;
}

/** «Bajamar, subiendo», «media marea, bajando»… */
export function textoMarea(m: MarMomento): string | null {
  if (m.marea === undefined) return null;
  const nivel = m.marea <= 0.2 ? "Bajamar" : m.marea >= 0.8 ? "Pleamar" : m.marea < 0.5 ? "Marea baja" : "Marea alta";
  return m.sube === undefined ? nivel : `${nivel}, ${m.sube ? "subiendo" : "bajando"}`;
}
