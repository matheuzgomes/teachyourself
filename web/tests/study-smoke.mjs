#!/usr/bin/env node
// Smoke final da experiência de estudo do piloto sobre HTML de produção.
// Pré-requisitos (nada é instalado aqui; Playwright é dependência opcional):
//   npm install --no-save playwright            # numa pasta temporária, ex. /tmp/opencode/smoke
//   PLAYWRIGHT_BROWSERS_PATH=<dir> npx playwright install chromium   # ex. /tmp/opencode/browsers
// Uso:
//   BASE_URL=http://127.0.0.1:4333/teachyourself \
//   PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/browsers \
//   PLAYWRIGHT_MODULE=/tmp/opencode/smoke/node_modules/playwright \
//   node web/tests/study-smoke.mjs
// Serve o HTML já construído (sem build aqui):
//   npm --prefix web run preview -- --port 4333 --host 127.0.0.1
// Opcional: SCREENSHOT_DIR=/tmp/opencode/smoke (padrão) para os PNGs de revisão.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:4333/teachyourself").replace(/\/$/, "");
const SHOTS = process.env.SCREENSHOT_DIR ?? "/tmp/opencode/smoke";

let chromium;
const candidates = [
  process.env.PLAYWRIGHT_MODULE ?? null,
  process.env.PLAYWRIGHT_MODULE ? `${process.env.PLAYWRIGHT_MODULE}/index.mjs` : null,
  "playwright",
].filter(Boolean);
let lastError = null;
for (const spec of candidates) {
  try {
    ({ chromium } = await import(spec));
    lastError = null;
    break;
  } catch (err) {
    lastError = err;
  }
}
if (!chromium) {
  console.error(`study-smoke: Playwright não resolvido (${lastError?.message}). Instale sem tocar nas deps do projeto:`);
  console.error(
    "study-smoke: Playwright não resolvido. Instale sem tocar nas deps do projeto:\n" +
      "  mkdir -p /tmp/opencode/smoke && cd /tmp/opencode/smoke && npm init -y && npm install playwright\n" +
      "  PLAYWRIGHT_BROWSERS_PATH=/tmp/opencode/browsers npx playwright install chromium\n" +
      " Rode com NODE_PATH=/tmp/opencode/smoke/node_modules.",
  );
  process.exit(2);
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const curriculum = JSON.parse(
  readFileSync(join(repo, "web", "src", "data", "curriculum.json"), "utf-8"),
);
const curriculumHrefs = [];
for (const m of curriculum.modules) {
  for (const o of m.objectives ?? []) curriculumHrefs.push([`${m.slug} objetivo ${o.id}`, o.href]);
  for (const p of m.prerequisites ?? []) curriculumHrefs.push([`${m.slug} pré ${p.id}`, p.href]);
}
for (const e of curriculum.study_index ?? []) curriculumHrefs.push([`study_index ${e.id}`, e.href]);
const realHrefs = curriculumHrefs.filter(([, href]) => typeof href === "string");

const ANCHORS = [
  ["/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock", ["bit", "soma-binaria", "estado", "clock"]],
  ["/tracks/01-hardware-and-os/01-representacao-informacao-inteiros-ponto-flutuante", ["largura-fixa", "complemento-de-dois", "bytes", "ponto-flutuante"]],
];

const consoleErrors = [];
const pageErrors = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 200)));

  // 1. Home: CTAs e contadores vindos dos dados.
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("home carrega", (await page.locator("#main-content h1").count()) === 1);
  check("CTA Começar a estudar", (await page.getByRole("link", { name: "Começar a estudar" }).count()) >= 1);
  check("CTA Encontrar um mecanismo", (await page.getByRole("link", { name: "Encontrar um mecanismo" }).count()) === 1);
  const hwLinks = await page.locator('article ul li a[href*="01-hardware-and-os/0"]').count();
  check("9 módulos de hardware listados", hwLinks === 9, `${hwLinks}`);

  // 2. Busca: resultado e vazio.
  await page.goto(`${BASE}/#encontrar-mecanismo`);
  await page.fill("#busca-mecanismo", "soma binaria");
  await page.waitForTimeout(300);
  const visibleItems = await page.locator("[data-study-search-list] li:not([hidden])").count();
  check("busca filtra (soma)", visibleItems >= 1, `${visibleItems} visíveis`);
  const firstHref = await page.locator("[data-study-search-list] li:not([hidden]) a").first().getAttribute("href");
  check("resultado aponta para âncora real", !!firstHref && firstHref.includes("#soma-binaria"), firstHref ?? "");
  await page.fill("#busca-mecanismo", "zzzquark");
  await page.waitForTimeout(300);
  check("vazio com recuperação útil", (await page.locator("[data-study-search-empty]:not(.hidden)").count()) === 1);

  // 3. As 8 âncoras resolvem no HTML real.
  for (const [modPath, ids] of ANCHORS) {
    for (const id of ids) {
      await page.goto(`${BASE}${modPath}#${id}`, { waitUntil: "networkidle" });
      check(`âncora #${id}`, (await page.locator(`#${id}`).count()) === 1);
    }
  }

  // 4. Viewports: índice de seção em todas as larguras.
  for (const [w, label] of [[375, "mobile"], [768, "tablet"], [1100, "lg-gap"], [1280, "desktop"]]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto(`${BASE}/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock`, { waitUntil: "networkidle" });
    const mobileIndex = await page.locator("[data-mobile-index]").isVisible();
    const asideVisible = await page.locator("aside").first().isVisible().catch(() => false);
    check(`índice visível em ${label} (${w}px)`, w < 1280 ? mobileIndex : asideVisible, `mobile=${mobileIndex} aside=${asideVisible}`);
  }
  await page.setViewportSize({ width: 1280, height: 800 });

  // 5. Retomada persistente.
  await page.goto(`${BASE}/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock#clock`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  const stored = await page.evaluate(() => {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("teachyourself:reading-position:v1:")) {
        return { key: k, value: window.localStorage.getItem(k) };
      }
    }
    return null;
  });
  check("posição salva com namespace+base", !!stored && stored.key.includes("teachyourself"), stored?.key ?? "ausente");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("Continuar leitura exibido", (await page.locator("[data-continue-reading]:not(.hidden)").count()) === 1);
  const resumeHref = await page.locator("[data-continue-link]").getAttribute("href");
  check("retomada aponta para módulo do catálogo", !!resumeHref && resumeHref.includes("/tracks/01-hardware-and-os/"), resumeHref ?? "");

  // 6. Storage negado: nada quebra.
  const denied = await browser.newPage();
  await denied.addInitScript(() => {
    const fail = () => { throw new Error("denied"); };
    Object.defineProperty(window, "localStorage", { get: fail, configurable: true });
  });
  await denied.goto(`${BASE}/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock`, { waitUntil: "networkidle" });
  check("página ok com storage negado", (await denied.locator("#main-content h1").count()) === 1);
  await denied.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("home ok com storage negado", (await denied.locator("#main-content h1").count()) === 1);
  await denied.close();

  // 7. DeepDive: teclado e hash.
  await page.goto(`${BASE}/tracks/01-hardware-and-os/01-representacao-informacao-inteiros-ponto-flutuante`, { waitUntil: "networkidle" });
  const summary = page.locator("details[data-deepdive] summary").first();
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const opened = await page.locator("details[data-deepdive][open]").count();
  check("DeepDive abre por teclado", focused === "SUMMARY" && opened >= 1, `foco=${focused} abertos=${opened}`);

  // 8. Sem JS: conteúdo, busca e DeepDive.
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("sem JS: home legível", (await nojs.locator("#main-content h1").count()) === 1);
  check("sem JS: perguntas como links", (await nojs.locator("[data-study-search-list] li a").count()) === 8);
  await nojs.goto(`${BASE}/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock#estado`, { waitUntil: "networkidle" });
  check("sem JS: âncora existe", (await nojs.locator("#estado").count()) === 1);
  await nojs.close();

  // 9. Hrefs do currículo contra o HTML real (GET + getElementById com decode).
  let hrefOk = 0;
  for (const [where, href] of realHrefs) {
    const hashIndex = href.indexOf("#");
    const path = hashIndex < 0 ? href : href.slice(0, hashIndex);
    const hash = hashIndex < 0 ? "" : href.slice(hashIndex + 1);
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    if (!resp || !resp.ok()) {
      check(`GET ${where}`, false, `status ${resp?.status()}`);
      continue;
    }
    if (!hash) {
      hrefOk++;
      continue;
    }
    const found = await page.evaluate((frag) => {
      let id = frag;
      try {
        id = decodeURIComponent(frag);
      } catch {
        return false;
      }
      return document.getElementById(id) !== null;
    }, hash);
    if (found) {
      hrefOk++;
    } else {
      check(`href ${where}`, false, href);
    }
  }
  check(`${realHrefs.length} hrefs do currículo resolvem no HTML`, hrefOk === realHrefs.length, `${hrefOk}/${realHrefs.length}`);

  // 10. Piloto sem erro de renderização KaTeX.
  for (const [modPath] of ANCHORS) {
    await page.goto(`${BASE}${modPath}`, { waitUntil: "networkidle" });
    check(`katex sem erro em ${modPath.split("/").pop()?.slice(0, 11)}`, (await page.locator(".katex-error").count()) === 0);
  }

  // 11. Console e erros de página limpos no percurso.
  check("console.error zerado", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  check("pageerror zerado", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

  // 12. Screenshots de revisão.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SHOTS}/home-desktop.png` });
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${BASE}/tracks/01-hardware-and-os/00-logica-digital-transistores-circuitos-clock`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SHOTS}/m00-mobile.png` });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/tracks/01-hardware-and-os/01-representacao-informacao-inteiros-ponto-flutuante`, { waitUntil: "networkidle" });
  const deepdive = page.locator("details[data-deepdive]").first();
  await deepdive.scrollIntoViewIfNeeded();
  if (!(await deepdive.getAttribute("open"))) {
    await deepdive.locator("summary").click();
  }
  await page.waitForTimeout(200);
  check("DeepDive aberto para screenshot", (await page.locator("details[data-deepdive][open]").count()) >= 1);
  await deepdive.screenshot({ path: `${SHOTS}/deepdive-aberto.png` });

  await page.close();
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\nsmoke: ${results.length - failed.length}/${results.length} verdes`);
if (failed.length > 0) process.exit(1);
