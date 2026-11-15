"use client";
// Conmutador de modo noche (spec 004): por defecto sigue al sistema; al pulsarlo se fija claro u oscuro y se
// recuerda en este navegador. El script del <head> (layout.tsx) lo aplica antes de pintar, sin parpadeo.
import { useEffect } from "react";
import { useHidratado, usePreferenciaTexto } from "@/lib/almacen";

export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("tema");if(t==="claro"||t==="oscuro")document.documentElement.dataset.tema=t}catch(e){}})()`;

export default function ModoNoche() {
  const hidratado = useHidratado();
  const [tema, cambiar] = usePreferenciaTexto("tema", "");
  const sistemaOscuro = hidratado && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const oscuro = tema === "oscuro" || (tema === "" && sistemaOscuro);
  useEffect(() => {
    if (tema === "claro" || tema === "oscuro") document.documentElement.dataset.tema = tema;
    else delete document.documentElement.dataset.tema;
  }, [tema]);
  if (!hidratado) return null;
  return (
    <button
      type="button"
      className="modo-noche"
      aria-pressed={oscuro}
      aria-label={oscuro ? "Pasar a modo día" : "Pasar a modo noche"}
      title={oscuro ? "Modo día" : "Modo noche"}
      onClick={() => cambiar(oscuro ? "claro" : "oscuro")}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {oscuro ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </g>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />
        )}
      </svg>
    </button>
  );
}
