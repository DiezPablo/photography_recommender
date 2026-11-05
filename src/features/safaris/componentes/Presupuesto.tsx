"use client";
// Presupuesto sin sorpresas: calculadora con las tasas oficiales y tus propios precios, una solicitud estándar
// para pedir presupuesto a varios operadores y un comparador de las ofertas que te manden (lo que no incluyen se
// suma para que sean comparables). Los supuestos y las ofertas se guardan solo en este navegador.
import Link from "next/link";
import { useState } from "react";
import { MESES } from "@/lib/fechas";
import { escribirAlmacen, useAlmacen, useParametrosUrl } from "@/lib/almacen";
import { useMesElegido } from "@/lib/mes";
import {
  calcular,
  type ClaveIncluye,
  escribirEtapas,
  faltaEnOferta,
  INCLUYE,
  leerEtapas,
  NIVELES,
  type Oferta,
  SUPUESTOS_INICIALES,
  type Supuestos,
} from "@/features/safaris/presupuesto";
import { TASAS } from "@/features/safaris/tasas";
import { useDatosNavegador } from "@/features/safaris/useDatosNavegador";
import CampoNumero from "@/ui/CampoNumero";
import BuscadorParques from "./BuscadorParques";
import { CLAVE_OFERTAS, CLAVE_SUPUESTOS, EXTERIORES, guardarViaje, leerJson, VISADO } from "@/features/safaris/viaje";

const MAX_OFERTAS = 4;

function usd(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} USD`;
}

function Numero({
  etiqueta,
  valor,
  onCambio,
  ayuda,
  min = 0,
}: {
  etiqueta: string;
  valor: number;
  onCambio: (v: number) => void;
  ayuda?: string;
  min?: number;
}) {
  return (
    <label className="campo">
      <span className="rotulo">{etiqueta}</span>
      <CampoNumero valor={valor} min={min} onCambio={onCambio} />
      {ayuda && <small className="ayuda">{ayuda}</small>}
    </label>
  );
}

export default function Presupuesto({ mesHoy }: { mesHoy: number }) {
  const { indice } = useDatosNavegador(false);
  const [parametros, actualizar] = useParametrosUrl();
  const s = leerJson<Supuestos>(useAlmacen(CLAVE_SUPUESTOS), SUPUESTOS_INICIALES);
  const ofertas = leerJson<{ lista: Oferta[] }>(useAlmacen(CLAVE_OFERTAS), { lista: [] }).lista;
  const [copiado, setCopiado] = useState(false);

  const personas = Math.max(1, Number(parametros.get("personas") ?? 2) || 2);
  const [mes, cambiarMes] = useMesElegido(mesHoy);
  const crudas = leerEtapas(parametros.get("p"));
  // los vuelos que trae el planificador, si no los has cambiado tú
  const vuelosUrl = parametros.has("vuelos") ? Number(parametros.get("vuelos")) : null;
  const supuestos = { ...s, vuelos: s.vuelos || vuelosUrl || 0 };

  const nombre = (id: string) => indice?.get(id)?.n ?? id;
  const etapas = crudas.map((e) => ({ ...e, nombre: nombre(e.id) }));
  const r = calcular(etapas, personas, mes + 1, supuestos);
  const paises = [...new Set(etapas.map((e) => indice?.get(e.id)?.p).filter((p): p is string => !!p))];

  const cambiar = (c: Partial<Supuestos>) => escribirAlmacen(CLAVE_SUPUESTOS, JSON.stringify({ ...s, ...c }));
  const guardarOfertas = (lista: Oferta[]) =>
    escribirAlmacen(CLAVE_OFERTAS, lista.length ? JSON.stringify({ lista }) : null);
  const ponerEtapas = (lista: { id: string; noches: number }[]) => actualizar({ p: escribirEtapas(lista) });

  const solicitud = [
    "Hola:",
    "",
    `Estamos preparando un safari en ${paises.join(" y ") || "…"} y pedimos presupuesto a varios operadores con la misma información:`,
    "",
    `- Fechas: ${MESES[mes]} (${r.dias} días, ${r.dias - 1} noches), flexibles unos días.`,
    `- Viajeros: ${personas} ${personas === 1 ? "adulto" : "adultos"}.`,
    ...etapas.map((e) => `- ${e.nombre}: ${e.noches} ${e.noches === 1 ? "noche" : "noches"}.`),
    `- Alojamiento: ${NIVELES.find(([, v]) => v === s.alojamiento)?.[0].toLowerCase() ?? `unos ${s.alojamiento} USD por persona y noche`}.`,
    "",
    "Para poder comparar, ¿podéis indicar por separado?",
    "1. Precio por persona y qué incluye: tasas de los parques (y si están al precio de este año), alojamiento y comidas, bebidas, vehículo y guía, vuelos internos, traslados al aeropuerto.",
    "2. Si el vehículo es privado o compartido, cuántas plazas lleva y si tiene techo abatible.",
    "3. Alojamientos concretos (nombre) en cada parque.",
    "4. Forma de pago, depósito y recargos (tarjeta, transferencia) y política de cancelación.",
    "5. Número de licencia del operador (TALA, KATO, TATO, SATSA… según el país) y seguro de responsabilidad civil.",
    "",
    "Gracias.",
  ].join("\n");

  if (!indice) return <p className="nota-pie">Cargando parques…</p>;

  return (
    <>
      <section className="seccion">
        <h2>1. Tu viaje</h2>
        <div className="formulario-plan">
          <Numero etiqueta="Personas" valor={personas} min={1} onCambio={(v) => actualizar({ personas: String(v) })} />
          <label className="campo">
            <span className="rotulo">Mes</span>
            <select value={mes} onChange={(e) => cambiarMes(Number(e.target.value))}>
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ol className="etapas-presupuesto">
          {etapas.map((e, i) => (
            <li key={e.id}>
              <Link href={`/parque/${e.id}`}>{e.nombre}</Link>
              <label>
                <CampoNumero
                  valor={e.noches}
                  min={1}
                  max={30}
                  aria-label={`Noches en ${e.nombre}`}
                  onCambio={(v) => ponerEtapas(crudas.map((x, j) => (j === i ? { ...x, noches: v } : x)))}
                />{" "}
                noches
              </label>
              {!TASAS[e.id] && <small>sin tasa en nuestros datos</small>}
              <button type="button" className="quitar" onClick={() => ponerEtapas(crudas.filter((_, j) => j !== i))}>
                Quitar
              </button>
            </li>
          ))}
        </ol>
        {crudas.length > 0 && (
          <p className="enlaces">
            <Link
              href="/viaje"
              className="boton"
              onClick={() => guardarViaje({ nombre: "Mi safari", etapas: crudas, mes, personas, ver: [] })}
            >
              Guardar en Mi viaje →
            </Link>
          </p>
        )}
        <BuscadorParques
          indice={[...indice.values()]}
          excluir={crudas.map((e) => e.id)}
          etiqueta="Añadir un parque"
          onElegir={(f) => ponerEtapas([...crudas, { id: f.id, noches: 2 }])}
        />
        {!etapas.length && (
          <p className="nota-pie">
            Añade parques o empieza desde el <Link href="/planificar">planificador de ruta</Link>. Ejemplo:{" "}
            <Link href="/presupuesto?p=tarangire:2,ngorongoro:1,serengeti:3&personas=2&mes=7">
              norte de Tanzania en agosto
            </Link>
            .
          </p>
        )}
      </section>

      <section className="seccion">
        <h2>2. Tus precios</h2>
        <p className="nota-pie">
          Valores de partida orientativos: cámbialos por los de los lodges y operadores que estés mirando. Se guardan en
          este navegador.
        </p>
        <div className="formulario-plan">
          <label className="campo">
            <span className="rotulo">Alojamiento por persona y noche, en temporada alta</span>
            <select
              value={NIVELES.some(([, v]) => v === s.alojamiento) ? s.alojamiento : ""}
              onChange={(e) => e.target.value && cambiar({ alojamiento: Number(e.target.value) })}
            >
              {NIVELES.map(([t, v]) => (
                <option key={v} value={v}>
                  {t} (~{v} USD)
                </option>
              ))}
              <option value="">Otro (escríbelo)</option>
            </select>
          </label>
          <Numero
            etiqueta="USD por persona y noche"
            valor={s.alojamiento}
            onCambio={(v) => cambiar({ alojamiento: v })}
            ayuda="Fuera de temporada se rebaja en los parques con tarifas de lodges (ver temporada verde)"
          />
          <Numero
            etiqueta="Vehículo con guía, USD por día"
            valor={s.vehiculo}
            onCambio={(v) => cambiar({ vehiculo: v })}
            ayuda="0 si los safaris van incluidos en el lodge"
          />
          <Numero etiqueta="Plazas por vehículo" valor={s.plazas} min={1} onCambio={(v) => cambiar({ plazas: v })} />
          <Numero etiqueta="Vuelos internos" valor={supuestos.vuelos} onCambio={(v) => cambiar({ vuelos: v })} />
          <Numero
            etiqueta="USD por vuelo y persona"
            valor={s.precioVuelo}
            onCambio={(v) => cambiar({ precioVuelo: v })}
          />
          <Numero
            etiqueta="Vuelo internacional por persona"
            valor={s.internacional}
            onCambio={(v) => cambiar({ internacional: v })}
          />
          <Numero etiqueta="Visado por persona" valor={s.visado} onCambio={(v) => cambiar({ visado: v })} />
          <Numero etiqueta="Seguro por persona" valor={s.seguro} onCambio={(v) => cambiar({ seguro: v })} />
          <Numero
            etiqueta="Propinas por persona y día"
            valor={s.propinas}
            onCambio={(v) => cambiar({ propinas: v })}
            ayuda="Guía y personal del campamento"
          />
          <Numero etiqueta="Imprevistos (%)" valor={s.imprevistos} onCambio={(v) => cambiar({ imprevistos: v })} />
        </div>
        {paises.length > 0 && (
          <p className="nota-pie">
            Visado:{" "}
            {paises.map((p, i) => (
              <span key={p}>
                {i > 0 && " · "}
                <a href={VISADO[p] ?? EXTERIORES} target="_blank" rel="noopener">
                  {p} ↗
                </a>
              </span>
            ))}{" "}
            (webs oficiales; desconfía de intermediarios que cobran más).
          </p>
        )}
      </section>

      {etapas.length > 0 && (
        <section className="seccion resumen-presupuesto" aria-live="polite">
          <h2>
            {usd(r.porPersona)} por persona <small>({usd(r.total)} en total)</small>
          </h2>
          <p className="nota-pie">
            {r.dias} días · {usd(r.porPersona / r.dias)} por persona y día
          </p>
          <table className="tabla-presupuesto">
            <tbody>
              {r.lineas.map((l) => (
                <tr key={l.concepto}>
                  <th scope="row">
                    {l.concepto}
                    {l.detalle && <small>{l.detalle}</small>}
                  </th>
                  <td>{usd(l.porPersona)}</td>
                  <td>
                    <span className={`origen ${l.origen}`}>
                      {l.origen === "oficial" ? "tarifa oficial" : "tu estimación"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.sinTasa.length > 0 && (
            <p className="aviso-plan">
              Sin tasa en nuestros datos: {r.sinTasa.join(", ")}. Pregúntala al operador o en la web oficial del parque
              y súmala.
            </p>
          )}
          <p className="nota-pie">
            Tasas por persona y periodo de 24 h, no residente adulto, con su fuente:{" "}
            {etapas
              .filter((e) => TASAS[e.id])
              .map((e, i) => (
                <span key={e.id}>
                  {i > 0 && " · "}
                  <a href={TASAS[e.id].fuente} target="_blank" rel="noopener">
                    {e.nombre} ({TASAS[e.id].vigencia})
                  </a>
                </span>
              ))}
            . Cambian a menudo: confírmalas antes de pagar.
          </p>
        </section>
      )}

      {etapas.length > 0 && (
        <section className="seccion">
          <h2>3. Pide presupuesto a 3 o 4 operadores</h2>
          <p className="nota-pie">
            El mismo texto a todos, para que las respuestas se puedan comparar. Busca operadores en la ficha de cada
            parque o en la <Link href="/guia#operador">guía</Link>.
          </p>
          <textarea className="solicitud" readOnly value={solicitud} rows={18} aria-label="Texto de la solicitud" />
          <button
            type="button"
            className="boton"
            onClick={() =>
              navigator.clipboard.writeText(solicitud).then(
                () => setCopiado(true),
                () => setCopiado(false),
              )
            }
          >
            {copiado ? "Copiado ✓" : "Copiar texto"}
          </button>
        </section>
      )}

      {etapas.length > 0 && (
        <section className="seccion">
          <h2>4. Compara las ofertas</h2>
          <p className="nota-pie">
            Apunta el precio por persona de cada oferta y qué incluye: lo que no incluya se suma con tus precios de
            arriba para que todas sean comparables.
          </p>
          <div className="tabla-desliza">
            <table className="tabla-ofertas">
              <thead>
                <tr>
                  <th scope="col">Operador</th>
                  <th scope="col">USD por persona</th>
                  {INCLUYE.map(([k, t]) => (
                    <th key={k} scope="col">
                      {t}
                    </th>
                  ))}
                  <th scope="col">Vehículo privado</th>
                  <th scope="col">Comparable</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o, i) => {
                  const falta = faltaEnOferta(o, r);
                  const real = o.precio + falta.reduce((a, f) => a + f.usd, 0);
                  const mas = (c: Partial<Oferta>) =>
                    guardarOfertas(ofertas.map((x, j) => (j === i ? { ...x, ...c } : x)));
                  const marcar = (k: ClaveIncluye, si: boolean) =>
                    mas({ incluye: si ? [...o.incluye, k] : o.incluye.filter((x) => x !== k) });
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          value={o.operador}
                          aria-label="Operador"
                          onChange={(e) => mas({ operador: e.target.value })}
                        />
                      </td>
                      <td>
                        <CampoNumero
                          valor={o.precio}
                          aria-label="Precio por persona"
                          onCambio={(v) => mas({ precio: v })}
                        />
                      </td>
                      {INCLUYE.map(([k, t]) => (
                        <td key={k}>
                          <input
                            type="checkbox"
                            checked={o.incluye.includes(k)}
                            aria-label={`${o.operador || "Oferta"}: incluye ${t.toLowerCase()}`}
                            onChange={(e) => marcar(k, e.target.checked)}
                          />
                        </td>
                      ))}
                      <td>
                        <input
                          type="checkbox"
                          checked={o.privado}
                          aria-label="Vehículo privado"
                          onChange={(e) => mas({ privado: e.target.checked })}
                        />
                      </td>
                      <td className="comparable">
                        <b>{usd(real)}</b>
                        {falta.length > 0 && (
                          <small>+ {falta.map((f) => `${f.concepto} ${usd(f.usd)}`).join(", ")}</small>
                        )}
                        <small>{usd(real / r.dias)} por día</small>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="quitar"
                          onClick={() => guardarOfertas(ofertas.filter((_, j) => j !== i))}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ofertas.length < MAX_OFERTAS && (
            <button
              type="button"
              className="boton"
              onClick={() =>
                guardarOfertas([
                  ...ofertas,
                  {
                    operador: `Oferta ${ofertas.length + 1}`,
                    precio: Math.round(r.porPersona),
                    incluye: ["tasas", "alojamiento", "vehiculo"],
                    privado: false,
                  },
                ])
              }
            >
              + Añadir oferta
            </button>
          )}
          <p className="nota-pie">
            Antes de pagar: comprueba la licencia del operador con la asociación del país, pide los nombres de los
            alojamientos y paga el depósito con tarjeta (más protección que una transferencia).
          </p>
        </section>
      )}
    </>
  );
}
