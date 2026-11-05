"use client";
// Copia de lo que solo se guarda en este navegador (T47): avisarlo y dejar exportarlo e importarlo en JSON, para
// pasarlo a otro dispositivo o no perderlo al borrar los datos del navegador.
import { useState } from "react";
import { escribirAlmacen, leerAlmacen } from "@/lib/almacen";

const APP = "atlas-de-fauna";

export default function CopiaLocal({ claves, nombre }: { claves: string[]; nombre: string }) {
  const [aviso, setAviso] = useState<string | null>(null);

  const exportar = () => {
    const datos = Object.fromEntries(claves.map((k) => [k, leerAlmacen(k)]).filter(([, v]) => v !== null));
    const texto = JSON.stringify(
      { app: APP, version: 1, fecha: new Date().toISOString().slice(0, 10), datos },
      null,
      1,
    );
    const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async (f: File | undefined) => {
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d?.app !== APP || typeof d.datos !== "object") throw new Error("no es una copia de esta web");
      const validas = Object.entries(d.datos as Record<string, unknown>).filter(
        ([k, v]) => claves.includes(k) && typeof v === "string",
      ) as [string, string][];
      if (!validas.length) throw new Error("la copia no trae datos de esta sección");
      if (!window.confirm("Se sustituirá lo que hay guardado en este navegador por la copia. ¿Seguir?")) return;
      for (const [k, v] of validas) escribirAlmacen(k, v);
      setAviso(`Copia del ${d.fecha ?? "archivo"} recuperada.`);
    } catch (e) {
      setAviso(`No se pudo leer: ${(e as Error).message}.`);
    }
  };

  return (
    <div className="copia-local">
      <p className="nota-pie">
        Se guarda solo en este navegador, sin cuentas: si borras sus datos o cambias de dispositivo, se pierde. Haz una
        copia y recupérala donde quieras.
      </p>
      <p className="copia-local-botones">
        <button type="button" className="quitar" onClick={exportar}>
          Descargar copia (JSON)
        </button>
        <label className="quitar">
          Recuperar una copia
          <input
            type="file"
            accept="application/json,.json"
            className="sr"
            onChange={(e) => importar(e.target.files?.[0])}
          />
        </label>
      </p>
      {aviso && (
        <p className="nota-pie" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}
