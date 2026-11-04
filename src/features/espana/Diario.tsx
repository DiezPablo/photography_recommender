"use client";
// Diario de salidas: fecha, lugar, especies vistas, notas y enlace a las fotos. Solo en este navegador
// (localStorage), con resumen, descarga en CSV y copia en JSON para pasarlo a otro dispositivo.
import { useMemo, useState } from "react";
import { escribirAlmacen, leerAlmacen, useAlmacen, useHidratado } from "@/lib/almacen";
import { MESES } from "@/lib/fechas";
import { useUbicacionGuardada } from "@/features/espana/ubicacion";

const CLAVE = "espana-diario";

interface Salida {
  id: string;
  /** aaaa-mm-dd */
  f: string;
  lugar: string;
  especies: string;
  notas: string;
  foto: string;
}

function leer(bruto: string | null): Salida[] {
  try {
    const d = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(d) ? (d as Salida[]) : [];
  } catch {
    return [];
  }
}

const descargar = (nombre: string, texto: string, tipo: string) => {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Diario({ hoy }: { hoy: string }) {
  const hidratado = useHidratado();
  const bruto = useAlmacen(CLAVE);
  const salidas = useMemo(() => leer(bruto).sort((a, b) => b.f.localeCompare(a.f)), [bruto]);
  const guardada = useUbicacionGuardada();
  const [form, setForm] = useState<Omit<Salida, "id">>({ f: hoy, lugar: "", especies: "", notas: "", foto: "" });
  const [error, setError] = useState<string | null>(null);

  if (!hidratado) return <p className="nota-pie">Cargando tu diario…</p>;

  const guardar = (xs: Salida[]) => escribirAlmacen(CLAVE, JSON.stringify(xs));
  const anadir = (e: React.FormEvent) => {
    e.preventDefault();
    const lugar = form.lugar.trim() || guardada?.nombre || "";
    if (!lugar) return setError("Pon el lugar de la salida.");
    setError(null);
    guardar([...leer(leerAlmacen(CLAVE)), { ...form, lugar, id: `${Date.now()}` }]);
    setForm({ f: hoy, lugar: "", especies: "", notas: "", foto: "" });
  };
  const anio = hoy.slice(0, 4);
  const esteAnio = salidas.filter((x) => x.f.startsWith(anio));
  const porLugar = new Map<string, number>();
  for (const x of salidas) porLugar.set(x.lugar, (porLugar.get(x.lugar) ?? 0) + 1);
  const repetidos = [...porLugar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const especies = new Set(
    salidas.flatMap((x) =>
      x.especies
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const csv = () =>
    descargar(
      "diario-de-salidas.csv",
      [
        "fecha,lugar,especies,notas,fotos",
        ...salidas.map((x) =>
          [x.f, x.lugar, x.especies, x.notas, x.foto].map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n"),
      "text/csv",
    );
  const importar = (fichero: File) =>
    fichero.text().then((t) => {
      const nuevas = leer(t).filter((x) => x && x.id && x.f && x.lugar);
      if (!nuevas.length) return setError("El fichero no tiene salidas válidas.");
      const ya = new Set(salidas.map((x) => x.id));
      guardar([...salidas, ...nuevas.filter((x) => !ya.has(x.id))]);
      setError(null);
    });

  return (
    <>
      <form className="seccion formulario-plan" onSubmit={anadir}>
        <label className="campo">
          <span className="rotulo">Fecha</span>
          <input type="date" value={form.f} onChange={(e) => setForm({ ...form, f: e.target.value })} required />
        </label>
        <label className="campo">
          <span className="rotulo">Lugar</span>
          <input
            value={form.lugar}
            placeholder={guardada?.nombre ?? "Laguna de Gallocanta"}
            onChange={(e) => setForm({ ...form, lugar: e.target.value })}
          />
        </label>
        <label className="campo campo-ancho">
          <span className="rotulo">Especies (separadas por comas)</span>
          <input
            value={form.especies}
            placeholder="grulla, aguilucho lagunero, corzo"
            onChange={(e) => setForm({ ...form, especies: e.target.value })}
          />
        </label>
        <label className="campo campo-ancho">
          <span className="rotulo">Notas</span>
          <textarea value={form.notas} rows={2} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
        </label>
        <label className="campo campo-ancho">
          <span className="rotulo">Enlace a las fotos (opcional)</span>
          <input
            type="url"
            value={form.foto}
            placeholder="https://…"
            onChange={(e) => setForm({ ...form, foto: e.target.value })}
          />
        </label>
        <p>
          <button type="submit" className="boton">
            Añadir salida
          </button>
          {error && <small className="rareza-sin-revisar"> {error}</small>}
        </p>
      </form>

      {salidas.length > 0 && (
        <section className="seccion">
          <h2 className="rotulo">Resumen</h2>
          <p>
            {salidas.length} salidas ({esteAnio.length} en {anio}), {especies.size} especies distintas anotadas.
            {repetidos.length > 0 && <> Donde más vuelves: {repetidos.map(([l, n]) => `${l} (${n})`).join(", ")}.</>}
          </p>
        </section>
      )}

      <section className="seccion">
        <h2 className="rotulo">Salidas</h2>
        {!salidas.length && <p className="nota-pie">Aún no hay salidas. Se guardan solo en este navegador.</p>}
        <ul className="lista-hides">
          {salidas.map((x) => (
            <li key={x.id} className="tarjeta-hide">
              <b>
                {Number(x.f.slice(8, 10))} de {MESES[Number(x.f.slice(5, 7)) - 1]} de {x.f.slice(0, 4)} · {x.lugar}
              </b>
              {x.especies && <p className="especies-hide">{x.especies}</p>}
              {x.notas && <p className="nota-pie">{x.notas}</p>}
              <small>
                {x.foto && (
                  <>
                    <a href={x.foto} target="_blank" rel="noopener">
                      Fotos ↗
                    </a>{" "}
                    ·{" "}
                  </>
                )}
                <button
                  type="button"
                  className="quitar"
                  onClick={() =>
                    window.confirm("¿Borrar esta salida?") && guardar(salidas.filter((y) => y.id !== x.id))
                  }
                >
                  borrar
                </button>
              </small>
            </li>
          ))}
        </ul>
        <p>
          <button type="button" className="quitar" onClick={csv} disabled={!salidas.length}>
            Descargar en CSV
          </button>{" "}
          <button
            type="button"
            className="quitar"
            onClick={() => descargar("diario-de-salidas.json", JSON.stringify(salidas), "application/json")}
            disabled={!salidas.length}
          >
            Copia (JSON)
          </button>{" "}
          <label className="quitar">
            Restaurar copia{" "}
            <input
              type="file"
              accept="application/json"
              onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>
        </p>
      </section>
    </>
  );
}
