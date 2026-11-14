// El cielo de noche de un mes, en corto (spec 015): luna nueva, Vía Láctea y lluvias de meteoros. Acompaña a
// «lo habitual» de noche, para que quien llega desde un evento de cielo vea a la vez cuándo y dónde.
import Link from "next/link";
import { cargarEventos } from "@/features/eventos/datos";
import { anoDelMes, fechaCorta, fechaLarga, MESES, rutaCalendario, TEXTO_CALIDAD } from "@/features/eventos/modelo";

export default function CieloNocheMes({ mes }: { mes: number }) {
  const eventos = cargarEventos();
  if (!eventos) return null;
  const ano = anoDelMes(eventos, mes);
  const prefijo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  const finMes = `${prefijo}-31`;
  const nuevas = eventos.luna.filter((l) => l.fase === "nueva" && l.fecha.startsWith(prefijo));
  const ventanas = eventos.via_lactea.ventanas.filter((v) => v.desde <= finMes && v.hasta >= `${prefijo}-01`);
  const horasVl = eventos.via_lactea.horas_por_mes[mes];
  const meteoros = eventos.meteoros.filter((m) => m.fecha.startsWith(prefijo));
  return (
    <section className="seccion cielo-noche-mes" aria-labelledby="cielo-noche">
      <h2 className="rotulo" id="cielo-noche">
        Qué noches · {MESES[mes]} de {ano}
      </h2>
      <ul className="lista-cielo">
        {nuevas.map((l) => (
          <li key={l.fecha}>
            <span className="icono-luna nueva" aria-hidden />
            <div>
              <b>Luna nueva</b> · {fechaLarga(l.fecha, false)}
              <small>Las noches de alrededor son las más oscuras del mes.</small>
            </div>
          </li>
        ))}
        <li>
          <span className={`icono-vl${ventanas.length ? "" : " apagado"}`} aria-hidden />
          <div>
            <b>Vía Láctea</b>
            {ventanas.map((v) => (
              <span key={v.luna_nueva}>
                {" "}
                · sin luna del {fechaCorta(v.desde)} al {fechaCorta(v.hasta)}
              </span>
            ))}
            <small>
              {ventanas.length
                ? `Hasta ${Math.max(...ventanas.map((v) => v.horas_max)).toLocaleString("es-ES")} h de núcleo alto en noche cerrada.`
                : horasVl < 0.5
                  ? "El núcleo no se ve de noche este mes: temporada de marzo a septiembre."
                  : `El núcleo asoma unas ${horasVl.toLocaleString("es-ES")} h por noche, sin ventana sin luna.`}
            </small>
          </div>
        </li>
        {meteoros.map((m) => (
          <li key={m.id}>
            <span className={`icono-meteoro ${m.calidad}`} aria-hidden />
            <div>
              <b>{m.nombre}</b> · noche del {fechaCorta(m.noche)} al {fechaCorta(m.fecha)}
              <small>
                {TEXTO_CALIDAD[m.calidad]} (luna al {m.luna.iluminacion} %).
              </small>
            </div>
          </li>
        ))}
      </ul>
      <p className="nota-pie">
        Más en el <Link href={rutaCalendario("paisaje", mes)}>calendario de {MESES[mes]}</Link>.
      </p>
    </section>
  );
}
