"use client";
// «Cerca de mí» en el formulario de la consulta (spec 012): pide la ubicación y la pone en el formulario como
// lat y lon. Sin JavaScript no sale: queda elegir comunidad.
import { useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { pedirUbicacion } from "@/lib/ubicacion";

export default function CercaDeMi() {
  const hidratado = useHidratado();
  const [estado, setEstado] = useState("");
  if (!hidratado) return null;
  async function buscar(boton: HTMLButtonElement) {
    setEstado("Buscando tu ubicación…");
    const r = await pedirUbicacion();
    if (!r.ok) return setEstado(r.error);
    const form = boton.form;
    if (!form) return;
    for (const [k, v] of [
      ["lat", String(r.ubic.lat)],
      ["lon", String(r.ubic.lon)],
    ]) {
      let campo = form.elements.namedItem(k) as HTMLInputElement | null;
      if (!campo) {
        campo = document.createElement("input");
        campo.type = "hidden";
        campo.name = k;
        form.appendChild(campo);
      }
      campo.value = v;
    }
    const ccaa = form.elements.namedItem("ccaa") as HTMLSelectElement | null;
    if (ccaa) ccaa.value = "";
    form.requestSubmit();
  }
  return (
    <>
      <button type="button" className="boton" onClick={(e) => buscar(e.currentTarget)}>
        Cerca de mí
      </button>
      {estado && (
        <span role="status" className="estado-ubic">
          {estado}
        </span>
      )}
    </>
  );
}
