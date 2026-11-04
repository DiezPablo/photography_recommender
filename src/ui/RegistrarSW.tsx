"use client";
// Registra el service worker (public/sw.js) para poder abrir sin conexión las páginas visitadas o guardadas.
import { useEffect } from "react";

export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
