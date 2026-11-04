"use client";
// Mi lista de especies vistas en España: por grupo, con la fecha en que las marqué; descargar en CSV o borrar.
import Link from "next/link";
import { useHidratado } from "@/lib/almacen";
import { useVistas } from "@/features/espana/vistas";

const GRUPOS: [string, string][] = [
  ["Aves", "Aves"],
  ["Mammalia", "Mamíferos"],
  ["Reptilia", "Reptiles"],
  ["Amphibia", "Anfibios"],
];

export default function MisEspecies() {
  const { vistas, alternar, borrarTodo } = useVistas();
  const hidratado = useHidratado();
  if (!hidratado) return <p className="nota-pie">Cargando tu lista…</p>;
  const todas = Object.entries(vistas).sort((a, b) => a[1].n.localeCompare(b[1].n, "es"));
  if (!todas.length)
    return (
      <p>
        Aún no has marcado ninguna. En <Link href="/espana?modo=aqui">¿Qué veo aquí?</Link> y en{" "}
        <Link href="/espana?modo=donde">¿Dónde veo…?</Link> cada especie tiene un botón «+ la he visto». La lista se
        guarda solo en este navegador.
      </p>
    );
  const csv = () => {
    const filas = [
      "especie,cientifico,grupo,fecha",
      ...todas.map(([, v]) => [v.n, v.c ?? "", v.clase ?? "", v.f].map((x) => `"${x.replace(/"/g, '""')}"`).join(",")),
    ];
    const url = URL.createObjectURL(new Blob([filas.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-especies.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <p className="entradilla">
        {todas.length} especies:{" "}
        {GRUPOS.map(([c, t]) => [t, todas.filter(([, v]) => v.clase === c).length] as const)
          .filter(([, n]) => n)
          .map(([t, n]) => `${n} ${t.toLowerCase()}`)
          .join(", ")}
        .
      </p>
      {GRUPOS.map(([c, t]) => {
        const xs = todas.filter(([, v]) => v.clase === c);
        if (!xs.length) return null;
        return (
          <section key={c} className="seccion">
            <h2 className="rotulo">{t}</h2>
            <ul className="lista-vistas">
              {xs.map(([k, v]) => (
                <li key={k}>
                  <Link href={`/espana/especie/${k}`}>{v.n}</Link> <i>{v.c}</i> <small>{v.f}</small>{" "}
                  <button type="button" className="quitar" onClick={() => alternar(k, v)}>
                    quitar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p>
        <button type="button" className="boton" onClick={csv}>
          Descargar en CSV
        </button>{" "}
        <button
          type="button"
          className="quitar"
          onClick={() => window.confirm("¿Borrar toda la lista de este navegador?") && borrarTodo()}
        >
          Borrar la lista
        </button>
      </p>
    </>
  );
}
