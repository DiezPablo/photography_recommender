"use client";
// Guarda esta página (y las del plan) para abrirlas sin cobertura: en el campo es lo normal.
import { useState } from "react";
import { useHidratado } from "@/lib/almacen";

export default function GuardarSinConexion({ urls = [] }: { urls?: string[] }) {
  const hidratado = useHidratado();
  const [hecho, setHecho] = useState(false);
  if (!hidratado || !("serviceWorker" in navigator)) return null;
  const guardar = () =>
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ guardar: [location.pathname + location.search, ...urls] });
      setHecho(true);
    });
  return hecho ? (
    <small className="guardado">Guardado: ábrelo desde el historial aunque no tengas cobertura.</small>
  ) : (
    <button type="button" className="quitar" onClick={guardar}>
      Guardar sin conexión
    </button>
  );
}
