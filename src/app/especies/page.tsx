import type { Metadata } from "next";
import ListaEspecies from "@/features/safaris/componentes/ListaEspecies";
import { grupoFauna } from "@/features/safaris/gruposFauna";
import { fechaLocal } from "@/lib/sol";
import { cifras, cargarSafaris, getParque, nombreTaxon, slugEspecie } from "@/features/safaris/datos";

export const metadata: Metadata = {
  title: "Especies de safari",
  description: "Dónde ver león, leopardo, gorila, tigre, jaguar, oso polar y otras especies en los parques del mundo.",
};

export default function PaginaEspeciesSafari() {
  const especies = cargarSafaris()?.especies ?? [];
  return (
    <main className="calendario fauna safaris">
      <header className="titular">
        <p className="rotulo">{cifras().especies} especies con ficha · iNaturalist</p>
        <h1>Animales y dónde verlos</h1>
        <p className="entradilla">
          Para cada especie, los parques donde más se ha observado. Elige el animal y luego la época.
        </p>
      </header>
      <ListaEspecies
        mesHoy={Number(fechaLocal(new Date()).slice(5, 7)) - 1}
        especies={especies.map((e) => ({
          taxon: e.taxon,
          nombre: nombreTaxon(e),
          cientifico: e.cientifico,
          grupo: grupoFauna(e.cientifico, e.grupo),
          // continentes y meses de buena época de sus parques (T44)
          continentes: [...new Set(e.parques.map((x) => getParque(x.id)?.continente).filter((c): c is string => !!c))],
          meses: [...new Set(e.parques.flatMap((x) => getParque(x.id)?.meses ?? []))],
          foto: e.foto ?? null,
          href: `/especie/${slugEspecie(e)}`,
          parques: e.parques
            .slice(0, 3)
            .map((x) => getParque(x.id)?.nombre)
            .filter(Boolean)
            .join(", "),
        }))}
      />
    </main>
  );
}
