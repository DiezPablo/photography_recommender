import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VistaHabitual from "@/features/clima/componentes/VistaHabitual";
import { NOMBRE_HABITUAL, type TipoHabitual, TIPOS_HABITUAL } from "@/features/clima/habitual";
import { MESES } from "@/lib/fechas";

export const dynamicParams = false;

export function generateStaticParams() {
  return MESES.flatMap((mes) => TIPOS_HABITUAL.map((tipo) => ({ mes, tipo })));
}

type Props = { params: Promise<{ mes: string; tipo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mes, tipo } = await params;
  const nombre = NOMBRE_HABITUAL[tipo as TipoHabitual] ?? "";
  return {
    title: `${nombre} en ${mes}: dónde suele ir mejor`,
    description: `Los spots de España donde mejor suele ir el ${nombre.toLowerCase()} en ${mes}, por clima y por lugar.`,
  };
}

export default async function Pagina({ params }: Props) {
  const { mes, tipo } = await params;
  const m = MESES.indexOf(mes);
  if (m < 0 || !TIPOS_HABITUAL.includes(tipo as TipoHabitual)) notFound();
  return <VistaHabitual mes={m} tipo={tipo as TipoHabitual} />;
}
