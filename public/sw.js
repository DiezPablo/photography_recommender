// Sin conexión (Rasante): las páginas, primero de la red y, si no hay cobertura, de la copia guardada; los ficheros
// estáticos de la web, de la copia. «Guardar sin conexión» guarda de antemano las páginas de un plan.
const PAGINAS = "paginas-v1";
const ESTATICOS = "estaticos-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => ![PAGINAS, ESTATICOS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(ESTATICOS).then((c) =>
        c.match(r).then(
          (x) =>
            x ||
            fetch(r).then((res) => {
              if (res.ok) c.put(r, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then((res) => {
          if (res.ok) caches.open(PAGINAS).then((c) => c.put(r, res.clone()));
          return res;
        })
        .catch(() =>
          caches
            .match(r, { ignoreSearch: false })
            .then(
              (x) =>
                x ||
                new Response(
                  "<!doctype html><meta charset=utf-8><title>Sin conexión</title><p style='font:16px system-ui;padding:24px'>Sin conexión y esta página no está guardada. Las que guardaste con «Guardar sin conexión» sí se abren.</p>",
                  { headers: { "Content-Type": "text/html; charset=utf-8" } },
                ),
            ),
        ),
    );
  }
});

self.addEventListener("message", (e) => {
  const urls = e.data && e.data.guardar;
  if (!Array.isArray(urls)) return;
  e.waitUntil(
    caches.open(PAGINAS).then((c) =>
      Promise.all(
        urls.map((u) =>
          fetch(u, { credentials: "same-origin" })
            .then((res) => (res.ok ? c.put(new Request(u), res) : null))
            .catch(() => null),
        ),
      ),
    ),
  );
});
