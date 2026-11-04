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
async function resumen(request: APIRequestContext): Promise<{ ficheros: string[] }> {
  const r = await request.get("/datos/resumen.json");
  return r.ok() ? r.json() : { ficheros: [] };
}
async function hay(request: APIRequestContext, fichero: string) {
  return (await resumen(request)).ficheros.includes(fichero);
}

test("los datos públicos responden y son JSON válido; los demás no se publican", async ({ request }) => {
  const { ficheros } = await resumen(request);
  test.skip(!ficheros.includes("safaris_indice.json"), "aún no hay datos");
  const r = await request.get("/datos/safaris_indice.json");
  expect(r.status()).toBe(200);
  const texto = await r.text();
  expect(texto).not.toMatch(/\bNaN\b|Infinity/);
  JSON.parse(texto);
  // los grandes van comprimidos fuera de public/ (solo los lee el servidor)
  expect((await request.get("/datos/safaris_mundo.json")).status()).toBe(404);
});

test("sin errores en las páginas principales", async ({ page }) => {
  const errores = vigilar(page);
  for (const ruta of ["/", "/especies", "/guia"]) {
    await page.goto(ruta);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errores).toEqual([]);
});

test("safaris: buscar por mes y especie, ficha de parque y especie", async ({ page, request }, info) => {
  test.skip(
    !(await hay(request, "safaris.json")) || !(await hay(request, "safaris_indice.json")),
    "aún no se han publicado los safaris",
  );
  const errores = vigilar(page);
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Dónde y cuándo ver cada animal");
  await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  // en agosto, el Masái Mara (la migración) está en temporada
  await page.getByLabel("Cuándo vas").selectOption("7");
  await page.getByLabel("Continente").selectOption("África");
  const mara = page.locator(".rejilla-safaris li", { hasText: "Masái Mara" });
  await expect(mara).toContainText("Buena época en agosto");
  await page.screenshot({ path: `${CAPTURAS}/safaris-${info.project.name}.png` });
  await mara.getByRole("link").click();
  await expect(page).toHaveURL(/\/parque\/masai-mara$/);
  await expect(page.locator(".ano-safari").first()).toBeVisible();
  await expect(page.locator(".visto-ahora")).toBeVisible();
  await expect(page.locator(".mapa-caja[data-listo=si]").first()).toBeVisible();
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/safari-parque-${info.project.name}.png`, fullPage: true });
  // de una especie estrella a su página con los parques donde se ve
  await page.locator(".tarjeta-especie h3 a", { hasText: "León" }).first().click();
  await expect(page).toHaveURL(/\/especie\/panthera-leo$/);
  await expect(page.locator(".zonas-especie li").first()).toBeVisible();
  await page.goto("/guia");
  await expect(page.locator("#operador")).toBeVisible();
  expect(errores).toEqual([]);
});

test("safaris del mundo: ficha de un parque fuera del catálogo con cómo llegar", async ({ page, request }, info) => {
  const r = await request.get("/datos/safaris_indice.json");
  test.skip(!r.ok(), "aún no se ha publicado el índice mundial");
  const { parques } = await r.json();
  const otro = parques.find((p: { d: boolean }) => !p.d);
  const errores = vigilar(page);
  await page.goto(`/parque/${otro.id}`);
  await expect(page.locator("h1")).toHaveText(otro.n);
  await expect(page.locator("#organiza")).toContainText("Cómo llegar");
  await expect(page.locator("#organiza")).toContainText(/km en línea recta/);
  await expect(page.locator("#empresas")).toContainText("Antes de pagar");
  // los enlaces de reseñas abren la búsqueda de Google Maps centrada en el sitio
  for (const a of await page.locator("#organiza a", { hasText: "Reseñas" }).all())
    expect(await a.getAttribute("href")).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/.+\/@-?\d/);
  // y ninguna web de la lista es un enlace relativo
  for (const a of await page.locator("#organiza a", { hasText: "Web" }).all())
    expect(await a.getAttribute("href")).toMatch(/^https?:\/\//);
  await expect(page.locator(".ano-safari")).toBeVisible();
  await page.screenshot({ path: `${CAPTURAS}/safari-mundo-${info.project.name}.png`, fullPage: true });
  // y el buscador encuentra parques fuera del catálogo
  await page.goto(`/?q=${encodeURIComponent(otro.n.slice(0, 12))}`);
  await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  expect(errores).toEqual([]);
});

test("qué ver y cuándo: elegir especies y mes da parques con esas especies", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/");
  const grupo = page.getByRole("group", { name: "Animales" });
  const visible = await grupo
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!visible, "sin datos de safaris");
  await grupo.getByRole("button", { name: "León", exact: true }).click();
  await grupo.getByRole("button", { name: "Guepardo", exact: true }).click();
  await page.locator(".campo-mes select").selectOption("7");
  await expect(page).toHaveURL(/ver=.*mes=7|mes=7.*ver=/);
  const primero = page.locator(".resultados-que-ver li").first();
  await expect(primero).toContainText("✓ León");
  await expect(primero).toContainText("✓ Guepardo");
  await primero.screenshot({ path: `${CAPTURAS}/${info.project.name}-que-ver.png` });
  // el enlace lleva a la ficha del parque
  await primero.getByRole("link").click();
  await expect(page.locator("h1")).toBeVisible();
  expect(errores).toEqual([]);
});

test("comparador: dos parques lado a lado, añadir otro desde el buscador y quitarlo", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/comparar?p=serengeti,kruger");
  const cabeceras = page.locator(".tabla-comparar thead th");
  test.skip(!(await cabeceras.count()), "sin datos de safaris");
  await expect(cabeceras).toHaveCount(2);
  await expect(page.locator(".tabla-comparar tbody th", { hasText: "León" })).toBeVisible();
  await page.getByLabel("Añadir un parque").fill("masai");
  await page.locator(".opciones-comparar button", { hasText: "Masái Mara" }).first().click();
  await expect(cabeceras).toHaveCount(3);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-comparar.png`, fullPage: true });
  await cabeceras.nth(0).getByRole("link", { name: "Quitar" }).click();
  await expect(cabeceras).toHaveCount(2);
  // desde la ficha, «+ Comparar» lo guarda
  await page.goto("/parque/etosha");
  await page.getByRole("button", { name: "+ Comparar" }).click();
  await expect(page.getByRole("button", { name: "✓ En el comparador" })).toBeVisible();
  expect(errores).toEqual([]);
});

test("migración: zona del mes, cambiar de mes y lo visto en iNaturalist", async ({ page }, info) => {
  await page.goto("/migracion");
  await expect(page.locator("h1")).toHaveText("La gran migración, mes a mes");
  await page.getByRole("group", { name: "Mes" }).getByRole("button", { name: /^ago/ }).click();
  await expect(page.locator(".tarjeta-mes h2")).toContainText("Río Mara");
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  // la consulta en directo termina (con datos o con el aviso de error), nunca se queda cargando
  await expect(page.locator(".visto-migracion")).not.toContainText("Cargando", { timeout: 20000 });
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-migracion.png`, fullPage: true });
});

test("planificador: noches repartidas como un operador (4 noches en Tanzania no son 4 en el Ngorongoro)", async ({
  page,
}, info) => {
  const errores = vigilar(page);
  await page.goto("/planificar?pais=Tanzania&noches=4&mes=7&ritmo=normal");
  const etapas = page.locator(".etapas-plan .etapa");
  const hay = await etapas
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await expect(page.locator(".plan h2")).toContainText("4 noches en Tanzania: 2 parques");
  const serengeti = etapas.filter({ hasText: "Serengeti" });
  await expect(serengeti.locator(".rotulo")).toContainText("3 noches");
  const crater = etapas.filter({ hasText: "Ngorongoro" });
  await expect(crater.locator(".rotulo")).toContainText("1 noche");
  // ciudad de entrada, migración del mes y qué cambia con más noches
  await expect(page.locator(".traslado").first()).toContainText("Desde Arusha");
  await expect(serengeti).toContainText("La migración en agosto");
  await expect(page.locator(".aviso-plan", { hasText: "Con 2 noches más" })).toBeVisible();
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-planificar.png`, fullPage: true });
  // con 7 noches entra Tarangire, y ningún parque pasa de las noches que merece
  await page.getByLabel("Noches de safari").selectOption("7");
  await expect(page.locator(".plan h2")).toContainText("7 noches en Tanzania: 3 parques");
  await expect(etapas.filter({ hasText: "Tarangire" })).toHaveCount(1);
  await expect(page.locator(".avisos-plan")).not.toContainText("más de las que suele merecer");
  // los enlaces antiguos con días siguen funcionando
  await page.goto("/planificar?pais=Kenia&dias=8&mes=8");
  await expect(page.locator(".plan h2")).toContainText("7 noches en Kenia");
  expect(errores).toEqual([]);
});

test("buscar zonas que no son parques: Ndutu lleva al Ngorongoro", async ({ page }) => {
  await page.goto("/?q=ndutu");
  const zona = page.locator(".zonas-busqueda li").first();
  const hay = await zona
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await expect(zona).toContainText("Ndutu está en");
  await expect(page.locator(".rejilla-safaris li", { hasText: "Ngorongoro" }).first()).toBeVisible();
  await page.goto("/comparar");
  await page.getByLabel("Añadir un parque").fill("Ndutu");
  await expect(page.locator(".opciones-comparar button", { hasText: "Ngorongoro" })).toBeVisible();
});

test("presupuesto: tasas oficiales del plan, tus precios, solicitud y comparar ofertas", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/presupuesto?p=tarangire:2,ngorongoro:1,serengeti:3&personas=2&mes=7");
  const tabla = page.locator(".tabla-presupuesto");
  const hay = await tabla
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  // tasas: Tarangire 2 × 59, Ngorongoro 70,8 + cráter 295/2, Serengeti 3 × (82,6 + 70,8)
  await expect(tabla.locator("tr", { hasText: "Tasas: Tarangire" })).toContainText("118 USD");
  await expect(tabla.locator("tr", { hasText: "Tasas: Serengeti" })).toContainText("460 USD");
  await expect(tabla.locator("tr", { hasText: "Tasas: Cráter del Ngorongoro" })).toContainText("218 USD");
  // vaciar un campo y escribir otro número (en el móvil saltaba a otro valor al borrar)
  const personas = page.getByLabel("Personas");
  await personas.fill("");
  await expect(personas).toHaveValue("");
  await personas.pressSequentially("4");
  await expect(personas).toHaveValue("4");
  await expect(page).toHaveURL(/personas=4/);
  // cambiar el alojamiento cambia el total
  const antes = await page.locator(".resumen-presupuesto h2").innerText();
  await page.getByLabel("USD por persona y noche").fill("120");
  await expect(page.locator(".resumen-presupuesto h2")).not.toHaveText(antes);
  await expect(page.locator("textarea.solicitud")).toHaveValue(/Serengeti: 3 noches/);
  // una oferta sin tasas suma las tasas para compararla (4 personas: el cráter, 295 USD por vehículo, entre 4)
  await page.getByRole("button", { name: "+ Añadir oferta" }).click();
  await page.getByLabel("Oferta 1: incluye tasas de los parques").uncheck();
  await expect(page.locator(".comparable").first()).toContainText("+ Tasas 723 USD");
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-presupuesto.png`, fullPage: true });
  expect(errores).toEqual([]);
});

test("ficha de parque: resumen arriba con época, especies, entrada, cómo llegar y con quién", async ({
  page,
}, info) => {
  await page.goto("/parque/serengeti");
  const resumen = page.getByRole("region", { name: "Resumen" });
  await expect(resumen).toContainText("Cuándo ir");
  await expect(resumen).toContainText("82,6 USD/día");
  await expect(resumen).toContainText("Con licencia: TATO");
  await expect(resumen.getByRole("link", { name: /operador/ })).toBeVisible();
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-resumen-parque.png` });
});

test("buscador: por defecto solo destinos de fauna; los demás espacios, a petición o buscándolos", async ({ page }) => {
  await page.goto("/");
  const casilla = page.getByLabel(/espacios protegidos más/);
  const hay = await casilla
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "datos sin niveles");
  const total = page.locator(".explorador-safaris h2.rotulo").first();
  const antes = parseInt((await total.innerText()).replace(/\D/g, ""));
  await casilla.check();
  await expect(page).toHaveURL(/todos=1/);
  await expect.poll(async () => parseInt((await total.innerText()).replace(/\D/g, ""))).toBeGreaterThan(antes);
});

test("frecuencia de avistamientos por mes en un destacado y en «qué ver»", async ({ page }, info) => {
  await page.goto("/parque/masai-mara");
  const tabla = page.locator(".tabla-frecuencia");
  test.skip(!(await tabla.count()), "datos sin frecuencia por mes");
  // la migración: ñus muy probables en agosto
  await expect(tabla.locator('td[title^="Ñu en agosto: muy probable"]')).toHaveCount(1);
  await page.locator(".frecuencia").screenshot({ path: `${CAPTURAS}/${info.project.name}-frecuencia.png` });
  await page.goto("/?ver=5219404&mes=7");
  const mara = page.locator(".resultados-que-ver li", { hasText: "Masái Mara" });
  await expect(mara).toContainText("muy probable");
});

test("mi viaje: guardar desde el planificador, lista que se recuerda y enlace compartido", async ({
  page,
  browser,
}, info) => {
  const errores = vigilar(page);
  await page.goto("/planificar?pais=Tanzania&noches=7&mes=7");
  const guardar = page.getByRole("link", { name: "Guardar en Mi viaje →" });
  const hay = await guardar
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await guardar.click();
  await expect(page).toHaveURL(/\/viaje$/);
  await expect(page.locator("h1")).toHaveText("Mi viaje");
  await expect(page.locator(".etapas-plan > li")).toHaveCount(3);
  await expect(page.locator(".resumen-viaje")).toContainText("8 días, 7 noches");
  await expect(page.getByRole("heading", { name: "Qué verás en agosto" })).toBeVisible();
  // la lista se recuerda al volver
  await page.getByLabel(/Pasaporte/).check();
  await page.reload();
  await expect(page.getByLabel(/Pasaporte/)).toBeChecked();
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-viaje.png`, fullPage: true });
  // el enlace compartido se abre en otro navegador sin nada guardado
  const url = await page.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("safaris.viaje")!);
    return `/viaje?p=${v.etapas.map((e: { id: string; noches: number }) => `${e.id}:${e.noches}`).join(",")}&mes=${v.mes}&personas=2`;
  });
  const otro = await browser.newPage();
  await otro.goto(new URL(url, page.url()).toString());
  await expect(otro.getByText("Es un plan compartido")).toBeVisible();
  await expect(otro.locator(".etapas-plan > li")).toHaveCount(3);
  await otro.close();
  expect(errores).toEqual([]);
});

test("lo práctico del país y safari por tu cuenta", async ({ page }) => {
  await page.goto("/parque/etosha");
  const organiza = page.locator("#organiza");
  await expect(organiza).toContainText("Visado");
  await expect(organiza).toContainText("Enchufes: tipo D, M (lleva adaptador)");
  await expect(organiza).toContainText("Por tu cuenta en coche normal");
  await expect(organiza).toContainText(/amanece hacia las \d\d:\d\d/);
  await page.goto("/guia#paises");
  await expect(page.locator(".tabla-paises tbody tr")).toHaveCount(23);
  await page.goto("/?cuenta=turismo");
  const lista = page.locator(".rejilla-safaris li");
  const hay = await lista
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin índice");
  await expect(page.locator(".rejilla-safaris li", { hasText: "Kruger" })).toBeVisible();
  await expect(page.locator(".rejilla-safaris li", { hasText: "Serengeti" })).toHaveCount(0);
});

test("con niños: parques sin malaria y sin edad mínima", async ({ page }) => {
  await page.goto("/planificar?pais=Uganda&noches=6&mes=6");
  const etapas = page.locator(".etapas-plan .etapa");
  const hay = await etapas
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await expect(etapas.filter({ hasText: "Bwindi" })).toHaveCount(1);
  await page.getByLabel("Viajo con niños").check();
  await expect(page).toHaveURL(/ninos=1/);
  await expect(etapas.filter({ hasText: "Bwindi" })).toHaveCount(0);
  await expect(page.locator(".avisos-plan")).toContainText("Con niños");
  await page.goto("/parque/addo");
  await expect(page.getByRole("region", { name: "Resumen" })).toContainText("Sin malaria");
});

test("avisos sin cuenta: calendarios .ics y RSS", async ({ page, request }) => {
  const ics = await request.get("/parque/masai-mara/calendario.ics");
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const texto = await ics.text();
  expect(texto).toContain("BEGIN:VCALENDAR");
  expect(texto).toContain("RRULE:FREQ=YEARLY");
  expect(texto).toContain("Reserva ya: Masái Mara");
  const migracion = await (await request.get("/migracion.ics")).text();
  expect(migracion.match(/BEGIN:VEVENT/g)).toHaveLength(12);
  const rss = await request.get("/recientes.xml");
  expect(rss.status()).toBe(200);
  expect(await rss.text()).toContain("<rss");
  await page.goto("/parque/masai-mara");
  await expect(page.locator("#cuando .suscribir a", { hasText: "Añadir a mi calendario" })).toHaveAttribute(
    "href",
    /^webcal:\/\/.*\/parque\/masai-mara\/calendario\.ics$/,
  );
});

test("lista de animales vistos en Mi viaje", async ({ page }) => {
  await page.goto("/viaje?p=tarangire:2,ngorongoro:1,serengeti:3&mes=7&personas=2");
  const botones = page.locator(".lista-vistos button");
  const hay = await botones
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de especies");
  await botones.first().click();
  await expect(botones.first()).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".lista-vistos button").first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#vistos")).toContainText("1 de");
});

test("páginas de respuesta por mes y país, y mapa del sitio", async ({ page, request }) => {
  await page.goto("/safari-en/agosto");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Safari en agosto: dónde ir");
  await expect(page.locator(".lista-respuesta h3", { hasText: "Masái Mara" })).toBeVisible();
  await expect(page).toHaveTitle(/Safari en agosto/);
  await page.goto("/safari-en/tanzania");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Safari en Tanzania");
  await expect(page.getByRole("link", { name: "Serengeti" }).first()).toBeVisible();
  const mapa = await (await request.get("/sitemap.xml")).text();
  expect(mapa).toContain("/safari-en/agosto");
  expect(mapa).toContain("/parque/serengeti");
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("calendario de un viaje con fecha de llegada", async ({ page, request }) => {
  const r = await request.get("/viaje.ics?p=tarangire:2,serengeti:3&salida=2030-08-03&nombre=Prueba");
  expect(r.status()).toBe(200);
  const t = await r.text();
  expect(t).toContain("DTSTART;VALUE=DATE:20300803");
  expect(t).toContain("DTSTART;VALUE=DATE:20300805");
  expect(t).toContain("Prueba: visado de Tanzania");
  expect((await request.get("/viaje.ics?p=tarangire:2")).status()).toBe(400);
  await page.goto("/viaje?p=tarangire:2,serengeti:3&mes=7&personas=2&salida=2030-08-03");
  await expect(page.locator(".fechas-etapa").first()).toContainText("3 ago");
  await expect(page.locator(".suscribir a", { hasText: "Descargar .ics" })).toHaveAttribute(
    "href",
    /viaje\.ics\?.*salida=2030-08-03/,
  );
});

test("comparativa de países en un mes y frescura de los datos", async ({ page }) => {
  await page.goto("/safari-en/kenia-o-tanzania-en-agosto");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kenia o Tanzania en agosto");
  await expect(page.locator(".entradilla")).toContainText("migración está en Kenia");
  await expect(page.locator(".tabla-paises-mes tbody tr")).toHaveCount(8);
  await page.goto("/parque/serengeti");
  await page.getByText("De cuándo es cada dato").click();
  await expect(page.locator(".frescura")).toContainText("Lo visto en el último mes");
});

test("temporada verde: ahorro por parque y en la ficha", async ({ page }) => {
  await page.goto("/temporada-verde");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Temporada verde");
  const mara = page.locator(".tabla-verde tr", { hasText: "Masái Mara" });
  await expect(mara.locator(".ahorro")).toContainText("%");
  await expect(page.locator(".tabla-verde tr", { hasText: "Sabi Sand" })).toContainText("Mismo precio");
  await page.goto("/parque/masai-mara");
  await expect(page.locator(".temporada-verde")).toContainText("menos");
  await page.locator(".temporada-verde summary").click();
  await expect(page.locator(".lista-tarifas li", { hasText: "Governors' Camp" })).toBeVisible();
});

test("presupuesto: el alojamiento baja en temporada verde", async ({ page }) => {
  const alojamiento = async (mes: number) => {
    await page.goto(`/presupuesto?p=serengeti:3,tarangire:2&personas=2&mes=${mes}`);
    const fila = page.locator(".tabla-presupuesto tr", { hasText: "Alojamiento" });
    await fila.waitFor({ timeout: 10000 });
    return {
      texto: await fila.innerText(),
      usd: Number((await fila.locator("td").first().innerText()).replace(/\D/g, "")),
    };
  };
  const agosto = await alojamiento(7);
  const abril = await alojamiento(3);
  expect(abril.usd).toBeLessThan(agosto.usd);
  expect(abril.texto).toContain("respecto a la temporada alta");
});

test("planificador: avioneta en tramos largos y salida por otra ciudad en rutas largas", async ({ page }) => {
  await page.goto("/planificar?pais=Tanzania&noches=5&mes=7");
  const etapas = page.locator(".etapas-plan .etapa");
  const hay = await etapas
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await expect(page.locator(".aviso-plan", { hasText: "En avioneta" })).toBeVisible();
  await page.locator(".aviso-plan", { hasText: "En avioneta" }).getByRole("button", { name: "Probar" }).click();
  await expect(page).toHaveURL(/volar=1/);
  await expect(page.getByLabel("Avioneta en los tramos de más de 5 h")).toBeChecked();
  await page.goto("/planificar?pais=Tanzania&noches=14&mes=7");
  await expect(etapas.last()).toContainText("Ruaha");
  await expect(page.locator(".plan")).toContainText("salida por Dar es Salaam");
});

test("comparador por mes: quién gana en cada cosa y nivel de las especies", async ({ page }) => {
  await page.goto("/comparar?p=serengeti,masai-mara,kruger&mes=7");
  const cabeceras = page.locator(".tabla-comparar thead th");
  test.skip(!(await cabeceras.count()), "sin datos de safaris");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Comparar parques en agosto");
  await expect(page.locator(".ganador", { hasText: "En su mejor época en agosto" })).toContainText("Masái Mara");
  await expect(page.locator(".ganador", { hasText: "Entrada más barata" })).toBeVisible();
  const leon = page.locator(".comparador tbody tr", { hasText: "León" });
  await expect(leon).toContainText("probable");
  await page.getByRole("navigation", { name: "Mes del viaje" }).getByRole("link", { name: "marzo" }).click();
  await expect(page).toHaveURL(/mes=2/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Comparar parques en marzo");
});

test("cierres: los parques de tigres en el monzón no se proponen y lo dicen", async ({ page }) => {
  await page.goto("/planificar?pais=India&noches=6&mes=7");
  const etapas = page.locator(".etapas-plan .etapa");
  const hay = await page
    .locator(".plan")
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!hay, "sin datos de safaris");
  await expect(etapas.filter({ hasText: "Kanha" })).toHaveCount(0);
  await expect(etapas.filter({ hasText: "Ranthambore" })).toHaveCount(0);
  await expect(page.locator(".avisos-plan")).toContainText("Cerrados ese mes");
  await page.goto("/parque/kaziranga");
  await expect(page.locator("#cuando .aviso-cierre")).toContainText("mayo a septiembre");
  await page.goto("/safari-en/agosto");
  await expect(page.locator("section", { hasText: "Cerrados en agosto" })).toContainText("Kaziranga");
});

test("calendario de fenómenos: ficha, página del mes, especie y .ics", async ({ page, request }) => {
  await page.goto("/parque/minneriya");
  await expect(page.locator(".fenomenos")).toContainText("La «reunión» de elefantes");
  await page.goto("/safari-en/septiembre");
  await expect(page.locator("section", { hasText: "Qué pasa en septiembre" })).toContainText("Minneriya");
  // los partos (Ndutu) son en el área del Ngorongoro
  await page.goto("/parque/ngorongoro");
  await expect(page.locator(".fenomenos")).toContainText("Partos de los ñus");
  const ics = await (await request.get("/parque/valdes/calendario.ics")).text();
  expect(ics).toContain("Ballenas francas australes");
});

test("fauna en España: luz, tiempo y especies (o aviso sin datos)", async ({ page }) => {
  await page.goto("/espana?zona=gallocanta&fecha=2026-11-08");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fauna en España");
  await expect(page.locator(".luz-dia")).toContainText("Hora dorada");
  await expect(page.locator(".luz-dia")).toContainText(/\d{2}:\d{2}/);
  const especies = page.locator("section", { hasText: "Qué es probable ver en noviembre" });
  await expect(especies.locator(".lista-especies-espana li, .nota-pie").first()).toBeVisible({ timeout: 15000 });
});

test("fauna en España al revés: dónde veo una especie (o aviso sin datos)", async ({ page, request }) => {
  await page.goto("/espana?modo=donde");
  await expect(page.getByRole("link", { name: "¿Dónde veo…?" })).toHaveAttribute("aria-current", "page");
  const lista = (await (await request.get("/espana/especies.json")).json()) as { especies: { k: string; n: string }[] };
  if (!lista.especies.length) {
    await expect(page.getByText("Aún no hay datos de especies para España")).toBeVisible();
    return;
  }
  await page.getByLabel("Especie").fill(lista.especies[0].n.slice(0, 4));
  await page.locator(".opciones-especie button").first().click();
  await expect(page).toHaveURL(/k=\d+/);
  await page.getByLabel("Cuándo").selectOption("todo");
  await expect(page.locator(".lista-lugares li").first()).toBeVisible();
  await expect(
    page
      .locator(".lista-lugares li")
      .first()
      .getByRole("link", { name: /Qué más se ve aquí/ }),
  ).toHaveAttribute("href", /\/espana\?lat=/);
});

test("fauna en España: buscar un lugar y lugares cerca", async ({ page, request }) => {
  const cerca = (await (await request.get("/espana/cerca?lat=40.42&lon=-3.70&mes=10")).json()) as {
    lugares: { n: string }[];
  };
  await page.goto("/espana?lat=40.420&lon=-3.700&radio=10&fecha=2026-11-08");
  if (!cerca.lugares.length) return; // sin lugares publicados aún
  await expect(page.locator(".cerca-de-aqui summary")).toContainText("lugares para ver fauna");
  const nombre = cerca.lugares[0].n;
  await page.getByLabel("Dónde").fill(nombre.slice(0, 8));
  await page.locator(".elegir-lugar .opciones-especie button").first().click();
  await expect(page).toHaveURL(/lugar=/);
  await expect(page.getByLabel("Dónde")).toHaveAttribute("placeholder", /\S/);
});

test("fauna en España: ficha de un lugar", async ({ page, request }) => {
  const r = await request.get("/espana/lugares?q=gallocanta");
  const { lugares } = (await r.json()) as { lugares: { id: string; n: string }[] };
  if (!lugares.length) return; // sin lugares publicados aún
  await page.goto(`/espana/lugar/${encodeURIComponent(lugares[0].id)}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(lugares[0].n);
  await expect(page.getByRole("link", { name: /Qué veo aquí un día concreto/ })).toHaveAttribute("href", /lat=/);
  await expect(page.locator(".fenomenos")).toContainText("Grullas en Gallocanta");
});

test("fauna en España: lugar que no existe da 404", async ({ request }) => {
  expect((await request.get("/espana/lugar/no-existe")).status()).toBe(404);
});

test("fauna en España: este finde cerca", async ({ page }) => {
  await page.goto("/espana?modo=finde&lat=37.390&lon=-5.990&lugar=Sevilla&km=50");
  await expect(page.getByRole("link", { name: "Este finde" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lista-finde li, .nota-pie").first()).toBeVisible({ timeout: 20000 });
});
