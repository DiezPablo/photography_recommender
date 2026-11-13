// Tabla de fuentes de un modo (o de los dos): para qué se usa cada una, de quién es y con qué licencia.
import { FUENTES, type ModoFuente, fuentesDe } from "@/lib/fuentes";

export default function TablaFuentes({ modo }: { modo?: ModoFuente }) {
  const fuentes = modo ? fuentesDe(modo) : FUENTES;
  return (
    <table className="tabla-fuentes">
      <tbody>
        {fuentes.map((f) => (
          <tr key={f.nombre}>
            <th>{f.uso}</th>
            <td>
              <a href={f.url} rel="noopener">
                {f.nombre}
              </a>
              {f.licencia !== "—" && <small> · {f.licencia}</small>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
