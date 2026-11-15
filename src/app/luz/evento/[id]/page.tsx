import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import FichaEvento from "@/features/eventos/componentes/FichaEvento";
import { ambito, cargarEventos, fechaCorta, getEvento, rutaEvento } from "@/features/eventos/datos";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  // los de fauna también, para que sus direcciones antiguas redirijan a /fauna/evento/…
  return (cargarEventos()?.naturaleza ?? []).map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getEvento((await params).id);
  if (!e) return {};
  return {
    title: e.nombre,
    description: `${e.descripcion} Habitualmente del ${fechaCorta(e.desde)} al ${fechaCorta(e.hasta)}.`,
  };
}

export default async function PaginaEvento({ params }: Props) {
  const e = getEvento((await params).id);
  if (!e) notFound();
  // los eventos de fauna viven en el modo Fauna (spec 014)
  if (ambito(e) === "fauna") permanentRedirect(rutaEvento(e));
  return <FichaEvento e={e} />;
}
