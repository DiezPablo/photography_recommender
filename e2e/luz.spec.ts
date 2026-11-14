import { type APIRequestContext, expect, type Page, test } from "@playwright/test";

const CAPTURAS = process.env.CAPTURAS ?? "capturas";

/** Falla si hay errores de consola o peticiones que fallen (salvo teselas del mapa, que son externas). */
function vigilar(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(`consola: ${m.text()}`);
  });
  page.on("pageerror", (e) => errores.push(`excepción: ${e.message}`));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !u.includes("tile.openstreetmap.org") && !u.includes("upload.wikimedia.org"))
      errores.push(`HTTP ${r.status()} ${u}`);
  });
  return errores;
}

/** Espera (sin fallar) a que el mapa tenga teselas, para que las capturas lo muestren. */
async function esperarTeselas(page: Page) {
  await page
    .waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 3, null, { timeout: 8000 })
    .catch(() => {});
}

/** Qué datos hay publicados (resumen que escribe scripts/descargar-datos.mjs: los datos ya no son estáticos). */
async function resumen(request: APIRequestContext): Promise<{ ficheros: string[]; spot_costa: string | null }> {
  const r = await request.get("/datos/resumen.json");
  return r.ok() ? r.json() : { ficheros: [], spot_costa: null };
}
async function hay(request: APIRequestContext, fichero: string) {
  return (await resumen(request)).ficheros.includes(fichero);
}

test("portada: ranking, mapa con marcadores y filtros", async ({ page }, info) => {
  const errores = vigilar(page);
  const r = await page.goto("/luz");
  expect(r?.status()).toBe(200);
  const filas = page.locator(".ranking .fila");
  await expect(filas.first()).toBeVisible();
  const n = await filas.count();
  expect(n).toBeGreaterThan(0);

  // notas ordenadas de mayor a menor
  const notas = (await page.locator(".ranking .cifra").allInnerTexts()).map(Number);
  expect([...notas].sort((a, b) => b - a)).toEqual(notas);

  // mapa con un marcador por spot
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible();
  expect(await page.locator(".leaflet-marker-icon").count()).toBe(n);
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-portada-claro.png`, fullPage: false });

  // «Nubes ahora»: la última imagen del satélite sobre el mapa
  const satelite = page.getByRole("button", { name: "Nubes ahora" });
  await satelite.click();
  await expect(satelite).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".capa-satelite img").first()).toHaveAttribute("src", /view\.eumetsat\.int/);
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll<HTMLImageElement>(".capa-satelite img")].some(
          (i) => i.complete && i.naturalWidth > 0,
        ),
      null,
      { timeout: 20_000 },
    )
    .catch(() => {});
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-satelite.png`, fullPage: false });
  await satelite.click();
  await expect(page.locator(".capa-satelite")).toHaveCount(0);

  // «Esta temporada» lleva al planificador
  // filtro de tipo: atardecer
  await page.getByRole("link", { name: "Atardecer" }).first().click();
  await expect(page).toHaveURL(/\/luz\/dia\/0\/atardecer$/);
  await expect(page.locator("h1")).toContainText("Atardecer");
  // filtro de día: mañana
  await page
    .locator(".filtros")
    .getByRole("link", { name: /Mañana/ })
    .click();
  await expect(page).toHaveURL(/\/luz\/dia\/1\/atardecer$/);
  await expect(page.locator(".ranking .fila").first()).toBeVisible();
  expect(errores).toEqual([]);
});

test("ficha de un spot: notas con desglose, sol, luna, Vía Láctea, fotos y cómo llegar", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/luz");
  const primera = page.locator(".ranking .fila").first();
  const nombre = (await primera.locator("h3").innerText()).trim();
  await primera.click();
  await expect(page).toHaveURL(/\/luz\/spot\//);
  await expect(page.locator("h1")).toHaveText(nombre);
  const hoy = page.locator("details.dia").first();
  await expect(hoy).toHaveAttribute("open", "");
  await expect(hoy.locator(".nota-tarjeta")).toHaveCount(5);
  await expect(hoy.locator(".desglose li").first()).toBeVisible();
  for (const t of [
    "Salida del sol",
    "Puesta del sol",
    "Hora dorada",
    "Azimut del sol",
    "Noche astronómica",
    "Fase",
    "Núcleo sobre 10°",
    "Contaminación lumínica",
  ])
    await expect(hoy.getByText(t, { exact: true }).first()).toBeVisible();
  await expect(page.locator(".ficha-cab .enlaces").getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
    "href",
    /google\.com\/maps\/dir/,
  );
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible(); // líneas de azimut
  const fotos = page.locator(".galeria figure");
  if (await fotos.count()) await expect(fotos.first().locator("figcaption")).toContainText("©");
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-ficha-claro.png`, fullPage: true });
  expect(errores).toEqual([]);
});

test("funciona sin JavaScript: ranking y filtros son enlaces", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await ctx.newPage();
  await page.goto("/luz");
  await expect(page.locator(".ranking .fila").first()).toBeVisible();
  await page.getByRole("link", { name: "Noche" }).first().click();
  await expect(page).toHaveURL(/\/luz\/dia\/0\/astro$/);
  await page.locator(".ranking .fila").first().click();
  await expect(page.locator("details.dia").first()).toBeVisible();
  await ctx.close();
});

test("cerca de mí: distancia y filtro por radio", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 40.4168, longitude: -3.7038 }); // Madrid, Sol
  await page.goto("/luz");
  if (await page.evaluate(() => window.isSecureContext)) {
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    // lo que ve el usuario: filtrado a 100 km y dicho en claro
    await expect(page.locator(".resumen-cerca")).toContainText("a menos de 100 km de ti");
    const kms = (await page.locator(".fila .dist").allInnerTexts()).map((t) => parseFloat(t));
    expect(kms.length).toBeGreaterThan(0);
    expect(Math.max(...kms)).toBeLessThanOrEqual(100);
  } else {
    // http://IP no es contexto seguro y el navegador no da la ubicación: la dejamos guardada como haría el botón
    await page.evaluate(() => localStorage.setItem("ubicacion", JSON.stringify({ lat: 40.4168, lon: -3.7038 })));
    await page.reload();
  }
  await expect(page.locator(".fila .dist").first()).toBeVisible();
  const total = await page.locator(".ranking .fila").count();
  await page.getByLabel("Distancia máxima").selectOption("25");
  const cerca = await page
    .locator(".ranking .fila")
    .count()
    .catch(() => 0);
  expect(cerca).toBeLessThanOrEqual(total);
  await page.getByLabel("Ordenar por").selectOption("distancia");
});

test("calendario: el cielo del mes, eventos de naturaleza y ficha de evento", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/luz/calendario");
  await expect(page.locator("h1")).toContainText("Qué fotografiar este mes");
  await expect(page.locator(".meses a[aria-current=page]")).toHaveCount(1);
  await expect(page.locator(".lista-cielo li").first()).toBeVisible();
  // otro mes por enlace: octubre trae berrea y otoño
  await page.locator(".meses").getByRole("link", { name: "oct" }).click();
  await expect(page).toHaveURL(/\/luz\/calendario\/octubre$/);
  // paisaje y fauna van separados: la berrea no está en el calendario del paisaje, que enlaza al de fauna
  await expect(page.locator(".tarjeta-evento", { hasText: "Otoño en Ordesa" })).toBeVisible();
  await expect(page.locator(".tarjeta-evento", { hasText: "Berrea" })).toHaveCount(0);
  await expect(page.locator(".aviso-fauna")).toContainText("Fauna en octubre");
  // sol y luna llena por los picos del horizonte de los spots (si ya se han publicado las alineaciones)
  if (await hay(page.request, "alineaciones.json"))
    await expect(page.locator(".alineaciones-mes li").first()).toBeVisible();
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible();
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-calendario.png`, fullPage: true });
  // ficha de un evento: temporada, barra del año, mapa, spots y rutas de la zona
  await page.getByRole("link", { name: "Otoño en la Selva de Irati" }).click();
  await expect(page).toHaveURL(/\/luz\/evento\/otono-irati$/);
  await expect(page.locator("h1")).toHaveText("Otoño en la Selva de Irati");
  await expect(page.locator(".temporada")).toContainText(/temporada|Ahora mismo/);
  await expect(page.locator(".barra-anual .pico")).toHaveCount(1);
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  await expect(page.locator(".lista-cercanos li").first()).toBeVisible();
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-evento.png`, fullPage: true });
  expect(errores).toEqual([]);
});

test("calendario sin JavaScript: meses y eventos son enlaces", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await ctx.newPage();
  await page.goto("/luz/calendario/abril");
  await expect(page.locator(".tarjeta-evento", { hasText: "Cerezos en flor del Valle del Jerte" })).toBeVisible();
  await page.getByRole("link", { name: "Cerezos en flor del Valle del Jerte" }).click();
  await expect(page).toHaveURL(/\/luz\/evento\/cerezo-jerte$/);
  await expect(page.locator(".entradilla")).toBeVisible();
  await ctx.close();
});

test("avisos: zonas para suscribirse y calendario .ics válido", async ({ page, request }) => {
  await page.goto("/luz/alertas");
  await expect(page.locator(".lista-zonas li")).not.toHaveCount(0);
  await expect(page.locator(".lista-zonas a.boton").first()).toHaveAttribute(
    "href",
    /^webcal:\/\/.+\/alertas\/espana\.ics$/,
  );
  const r = await request.get("/luz/alertas/espana.ics");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("text/calendar");
  const ics = await r.text();
  expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  expect(ics).toContain("BEGIN:VEVENT");
  // ninguna línea pasa de 75 octetos (RFC 5545)
  for (const l of ics.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
});

test("spot de costa: mareas, oleaje y si se puede volar un dron", async ({ page, request }, info) => {
  const { spot_costa: costa, ficheros } = await resumen(request);
  test.skip(!costa, "el informe publicado aún no trae el mar");
  const errores = vigilar(page);
  await page.goto(`/luz/spot/${costa}`);
  await expect(page.locator(".mareas").first()).toContainText("Mareas");
  if (ficheros.includes("dron.json")) {
    await page.locator(".sello-dron").first().click();
    await expect(page).toHaveURL(/#dron$/);
    await expect(page.locator("#dron")).toContainText("ENAIRE");
  }
  await page
    .locator("#dron")
    .screenshot({ path: `${CAPTURAS}/dron-${info.project.name}.png` })
    .catch(() => {});
  expect(errores).toEqual([]);
});

test("fuentes y licencias: una página para los dos modos, enlazada desde el pie y desde Método", async ({ page }) => {
  await page.goto("/luz/metodo");
  await expect(page.locator(".tabla-fuentes")).toContainText("Iowa Environmental Mesonet");
  await expect(page.locator(".tabla-fuentes")).toContainText("NOAA Space Weather Prediction Center");
  await page.locator(".pie").getByRole("link", { name: "Fuentes y licencias" }).click();
  await expect(page).toHaveURL(/\/fuentes$/);
  await expect(page.locator("h1")).toHaveText("Fuentes y licencias");
  const tablas = page.locator(".tabla-fuentes");
  await expect(tablas).toHaveCount(2);
  await expect(tablas.first()).toContainText("Open-Meteo");
  await expect(tablas.last()).toContainText("eBird");
  await expect(tablas.last()).toContainText("Agencia Europea de Medio Ambiente");
  // no es de ningún modo: el conmutador no marca ninguno
  await expect(page.locator(".mundos a[aria-current=page]")).toHaveCount(0);
});

test("lo habitual: ranking de un mes sin previsión, por clima y por lugar (spec 013)", async ({
  page,
  request,
}, info) => {
  const errores = vigilar(page);
  await page.goto("/luz/habitual/octubre/atardecer");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Atardecer en octubre");
  // mes y momento se eligen con enlaces: marcados los dos actuales
  await expect(page.locator('.selector-habitual a[aria-current="page"]')).toHaveText(["Atardecer", "oct"]);
  const filas = (await (await request.get("/luz/datos-habitual/octubre/atardecer")).json()) as {
    nota: number;
    cifra: string;
  }[];
  if (filas.length === 0) {
    // la idoneidad aún no se ha publicado (llega con el siguiente cálculo de la previsión): la página lo dice
    await expect(page.locator(".vacio")).toContainText("Aún no hay datos");
    return;
  }
  // de más a menos días buenos, y como porcentaje, no como nota
  expect(filas.map((f) => f.nota)).toEqual(filas.map((f) => f.nota).sort((a, b) => b - a));
  const primera = page.locator("ol.ranking li").first();
  await expect(primera.locator(".cifra-habitual")).toHaveText(filas[0].cifra);
  await expect(primera.locator(".por-que")).toContainText(/El \d+ % de los atardeceres de octubre salen buenos/);
  await expect(primera.locator(".por-que")).toContainText(/Lugar: [\d,]+ de 10/);
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/habitual-${info.project.name}.png`, fullPage: true });
  // cambiar de momento y de mes
  await page.locator(".selector-habitual").getByRole("link", { name: "Noche" }).click();
  await expect(page).toHaveURL(/\/luz\/habitual\/octubre\/noche$/);
  await expect(page.locator("ol.ranking li").first().locator(".por-que")).toContainText("mag/arcsec²");
  await page.locator(".selector-habitual.meses").getByRole("link", { name: "jul" }).click();
  await expect(page).toHaveURL(/\/luz\/habitual\/julio\/noche$/);
  // se llega desde el ranking del día y desde el índice
  await page.goto("/luz");
  await page.getByRole("link", { name: /Lo habitual de cada mes/ }).click();
  await expect(page).toHaveURL(/\/luz\/habitual\/[a-z]+\/atardecer$/);
  await page.goto("/luz/habitual");
  await expect(page.locator(".lista-habitual li")).toHaveCount(12);
  expect(errores).toEqual([]);
});

test("eventos de cielo: del calendario a dónde verlos, con la luna y la Vía Láctea del mes (spec 015)", async ({
  page,
}) => {
  await page.goto("/luz/calendario/agosto");
  const perseidas = page.locator(".lista-cielo li", { hasText: "Perseidas" });
  await perseidas.getByRole("link", { name: /Dónde verlas/ }).click();
  await expect(page).toHaveURL(/\/luz\/habitual\/agosto\/noche$/);
  const cielo = page.locator(".cielo-noche-mes");
  await expect(cielo).toContainText("Perseidas");
  await expect(cielo).toContainText(/luna al \d+ %/);
  await expect(cielo).toContainText("Luna nueva");
  await expect(cielo).toContainText("Vía Láctea");
  await cielo.getByRole("link", { name: "calendario de agosto" }).click();
  await expect(page).toHaveURL(/\/luz\/calendario\/agosto$/);
  // el bloque es de la noche: en el atardecer no sale
  await page.goto("/luz/habitual/agosto/atardecer");
  await expect(page.locator(".cielo-noche-mes")).toHaveCount(0);
});
