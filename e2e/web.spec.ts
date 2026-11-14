import { expect, type Page, test } from "@playwright/test";

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

test("los datos no se publican como estáticos: solo el resumen para las pruebas", async ({ request }) => {
  const r = await request.get("/datos/resumen.json");
  expect(r.status()).toBe(200);
  const texto = await r.text();
  expect(texto).not.toMatch(/\bNaN\b|Infinity/);
  expect(Array.isArray(JSON.parse(texto).ficheros)).toBe(true);
  // los datos van comprimidos fuera de public/ (solo los lee el servidor)
  for (const f of ["espana.json", "informe.json", "espana_lugares.json"])
    expect((await request.get(`/datos/${f}`)).status()).toBe(404);
});

test("sin errores en las páginas principales", async ({ page }) => {
  const errores = vigilar(page);
  for (const ruta of ["/", "/luz", "/luz/metodo", "/fauna/hides", "/fauna/normas", "/fuentes"]) {
    await page.goto(ruta);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errores).toEqual([]);
});

test("fauna en España: luz, tiempo y especies (o aviso sin datos)", async ({ page }) => {
  await page.goto("/fauna?zona=gallocanta&fecha=2026-11-08");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cerca de mí");
  await expect(page.locator(".resumen-dia")).toContainText("Mejor momento");
  // la luz y el tiempo por horas van plegados debajo
  await page.getByText("Luz, mar y tiempo hora a hora").click();
  await expect(page.locator(".luz-dia")).toContainText("Hora dorada");
  await expect(page.locator(".luz-dia")).toContainText(/\d{2}:\d{2}/);
  const especies = page.locator("section", { hasText: "Qué se registra más en noviembre" });
  await expect(especies.locator(".lista-especies-espana li, .nota-pie").first()).toBeVisible({ timeout: 15000 });
});

test("«Buscar especie» de España lleva a la carta con la especie y el mes (D8)", async ({ page }) => {
  await page.goto("/fauna?modo=donde&k=2474950&mes=10");
  await expect(page).toHaveURL(/\/fauna\?especie=2474950&mes=noviembre$/);
});

test("fauna en España: buscar un lugar y lugares cerca", async ({ page, request }) => {
  const cerca = (await (await request.get("/fauna/cerca?lat=40.42&lon=-3.70&mes=10")).json()) as {
    lugares: { n: string; km: number; listas7?: number }[];
  };
  // de más cerca a más lejos; la actividad de eBird (spec 021) elige el punto de cada cuadrícula, no el orden
  expect(cerca.lugares.map((l) => l.km)).toEqual(cerca.lugares.map((l) => l.km).sort((x, y) => x - y));
  for (const l of cerca.lugares) if (l.listas7 !== undefined) expect(l.listas7).toBeGreaterThan(0);
  await page.goto("/fauna?lat=40.420&lon=-3.700&radio=10&fecha=2026-11-08");
  if (!cerca.lugares.length) return; // sin lugares publicados aún
  await expect(page.locator(".cerca-de-aqui summary")).toContainText("lugares para ver fauna");
  const nombre = cerca.lugares[0].n;
  await page.getByLabel("Dónde").fill(nombre.slice(0, 8));
  await page.locator(".elegir-lugar .opciones-especie button").first().click();
  await expect(page).toHaveURL(/lugar=/);
  await expect(page.getByLabel("Dónde")).toHaveAttribute("placeholder", /\S/);
});

test("fauna en España: ficha de un lugar", async ({ page, request }) => {
  const r = await request.get("/fauna/lugares?q=gallocanta");
  const { lugares } = (await r.json()) as { lugares: { id: string; n: string }[] };
  if (!lugares.length) return; // sin lugares publicados aún
  await page.goto(`/fauna/lugar/${encodeURIComponent(lugares[0].id)}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(lugares[0].n);
  await expect(page.getByRole("link", { name: /Qué veo aquí un día concreto/ })).toHaveAttribute("href", /lat=/);
  await expect(page.locator(".fenomenos")).toContainText("Grullas en Gallocanta");
});

test("fauna en España: lugar que no existe da 404", async ({ request }) => {
  expect((await request.get("/fauna/lugar/no-existe")).status()).toBe(404);
});

test("fauna en España: este finde cerca", async ({ page }) => {
  await page.goto("/fauna?modo=finde&lat=37.390&lon=-5.990&lugar=Sevilla&km=50");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Este finde");
  await expect(page.locator(".lista-finde li, .nota-pie").first()).toBeVisible({ timeout: 20000 });
});

test("fauna en España: rarezas de la semana", async ({ page }) => {
  await page.goto("/fauna/rarezas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rarezas esta semana");
});

test("fauna en España: hides y salidas guiadas, con filtros", async ({ page }) => {
  await page.goto("/fauna/hides");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hides y salidas guiadas");
  const todos = await page.locator(".tarjeta-hide").count();
  expect(todos).toBeGreaterThan(20);
  await page.getByLabel("Especie, zona u operador").fill("quebrantahuesos");
  await expect(page.locator(".tarjeta-hide").first()).toContainText(/[Qq]uebrantahuesos/);
  expect(await page.locator(".tarjeta-hide").count()).toBeLessThan(todos);
  await expect(page.getByRole("link", { name: "Propón un hide o una salida" })).toHaveAttribute("href", /issues\/new/);
});

test("fauna en España: ficha de una especie", async ({ page, request }) => {
  const { especies } = (await (await request.get("/fauna/especies.json")).json()) as {
    especies: { k: string; c: string | null }[];
  };
  const grulla = especies.find((e) => e.c === "Grus grus");
  if (!grulla) return; // sin datos de especies
  await page.goto(`/fauna/especie/${grulla.k}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/[Gg]rulla/);
  // en el móvil, un mes cada vez en vez de la tabla (T40)
  await expect(page.locator(".tabla-frecuencia:visible, .frecuencia-mes:visible").first()).toBeVisible();
  await expect(page.locator(".fenomenos")).toContainText("Gallocanta");
  await expect(page.locator("section", { hasText: "Para fotografiarla" })).toContainText("cm");
});

test("fauna en España: normas y código ético", async ({ page }) => {
  await page.goto("/fauna/normas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Normas y código ético");
  await expect(page.locator("blockquote").first()).toContainText("molestar o inquietar");
  expect(await page.locator("a[href*='miteco.gob.es']").count()).toBe(17);
});

test("navegación por modos: el conmutador y el menú cambian con la sección", async ({ page }) => {
  await page.goto("/");
  // en la portada no hay modo elegido: el conmutador ofrece los dos y ninguno está marcado
  await expect(page.locator(".mundos a")).toHaveText(["Luz", "Fauna"]);
  await expect(page.locator(".mundos a[aria-current=page]")).toHaveCount(0);
  await page.locator(".mundos a", { hasText: "Fauna" }).click();
  await expect(page).toHaveURL(/\/fauna$/);
  await expect(page.locator(".mundos a", { hasText: "Fauna" })).toHaveAttribute("aria-current", "page");
  // la barra del móvil o el menú de escritorio enseñan las secciones de Fauna
  await expect(
    page
      .locator(".barra-inferior a, .menu a")
      .filter({ hasText: /Finde|Este finde/ })
      .first(),
  ).toBeAttached();
  await page.locator(".mundos a", { hasText: "Luz" }).click();
  await expect(page).toHaveURL(/\/luz$/);
  await expect(page.locator(".mundos a", { hasText: "Luz" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".barra-inferior a, .menu a").filter({ hasText: "Calendario" }).first()).toBeAttached();
});

test("secciones retiradas: «Mis especies» y «Diario» llevan al mapa de fauna", async ({ page }) => {
  await page.goto("/fauna/mis-especies");
  await expect(page).toHaveURL(/\/fauna$/);
  await page.goto("/espana/diario");
  await expect(page).toHaveURL(/\/fauna$/);
});

test("safaris retirados de esta versión: sus páginas llevan a la portada y sus ficheros ya no existen", async ({
  page,
  request,
}) => {
  for (const ruta of ["/safaris", "/parque/serengeti", "/especie/panthera-leo", "/planificar?pais=Kenia", "/mapa"]) {
    await page.goto(ruta);
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/(\?.*)?$/);
    await expect(page.locator("h1")).toHaveText("¿Dónde voy a fotografiar?");
  }
  // la carta de fauna tuvo /fauna/mapa y /fauna/especie: no se confunden con las de safaris
  await page.goto("/fauna/mapa");
  await expect(page).toHaveURL(/\/fauna$/);
  for (const f of ["/migracion.ics", "/recientes.xml", "/buscar.json", "/datos/safaris_indice.json"])
    expect((await request.get(f)).status()).toBe(404);
  // ni la cabecera ni el pie enlazan ya a los safaris
  await page.goto("/");
  await expect(page.locator('a[href^="/safaris"], a[href^="/parque"], a[href="/planificar"]')).toHaveCount(0);
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("se ven los hides de fauna y el ranking de luz", async ({ page }) => {
    await page.goto("/fauna/hides");
    expect(await page.locator(".tarjeta-hide").count()).toBeGreaterThan(5);
    await page.goto("/luz");
    await expect(page.locator(".ranking .fila").first()).toBeVisible();
  });
});

test("la berrea: un evento de fauna con sus lugares, fechas, franja y fiabilidad (spec 014)", async ({ page }) => {
  const r = await page.goto("/fauna/evento/berrea");
  // los fenómenos llegan con el siguiente cálculo de eventos: hasta entonces la página no existe ni se enlaza
  if (r?.status() === 404) {
    await page.goto("/luz/evento/berrea-monfrague");
    await expect(page.locator(".enlace-fenomeno")).toHaveCount(0);
    return;
  }
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Berrea del ciervo");
  await expect(page.locator(".temporada")).toContainText("amanecer y atardecer");
  const lugares = page.locator(".lugares-fenomeno li");
  expect(await lugares.count()).toBeGreaterThanOrEqual(8);
  // de al menos cuatro comunidades, cada uno con sus fechas y su fiabilidad
  const texto = (await lugares.allTextContents()).join(" ");
  for (const ccaa of ["Extremadura", "Castilla-La Mancha", "Andalucía", "Castilla y León", "Cantabria", "Aragón"])
    expect(texto).toContain(ccaa);
  await expect(lugares.first().locator(".meta")).toContainText(/del \d+ sep al \d+ oct · mejor hacia el \d+/);
  await expect(lugares.first().locator(".fiabilidad")).toContainText(/‰|sin registros suficientes/);
  // ida y vuelta con la ficha de cada lugar
  await lugares.filter({ hasText: "Monfragüe" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/luz\/evento\/berrea-monfrague$/);
  await page.locator(".enlace-fenomeno a").click();
  await expect(page).toHaveURL(/\/fauna\/evento\/berrea$/);
});
