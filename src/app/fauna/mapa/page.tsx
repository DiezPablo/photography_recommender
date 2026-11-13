// El explorador en mapa se unió a la carta (en la portada desde el 08-11-2026) (rediseño B, 11-2026): los enlaces antiguos llevan allí con la
// especie (?k=) y el mes (?mes=0-11).
import { permanentRedirect } from "next/navigation";
import { MESES } from "@/lib/fechas";

type Props = { searchParams: Promise<{ k?: string; mes?: string }> };

export default async function PaginaMapa({ searchParams }: Props) {
  const q = await searchParams;
  const p = new URLSearchParams();
  if (q.k && /^\d+$/.test(q.k)) p.set("especie", q.k);
  const mes = Number(q.mes);
  if (q.mes && Number.isInteger(mes) && mes >= 0 && mes < 12) p.set("mes", MESES[mes]);
  permanentRedirect(p.size ? `/fauna?${p}` : "/fauna");
}
