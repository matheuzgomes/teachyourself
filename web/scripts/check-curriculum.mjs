#!/usr/bin/env node
/**
 * Validação real do currículo contra as aulas publicadas.
 * Uso: node web/scripts/check-curriculum.mjs [--repo <dir>]
 *
 * Verifica links e âncoras de verdade (não frases do JSON):
 * unicidade track+slug, fontes e referências existentes, href+hash de
 * objetivos/pré-requisitos/study_index resolvendo para arquivos e IDs
 * efetivos (headings via github-slugger real + ids explícitos), ausência
 * de links antigos, ciclos de pré-requisitos e acumulação requires/provides
 * das sections na ordem (optional fora do caminho principal).
 *
 * Ao final, delega a verificação de artefatos MDX ao script do pipeline:
 *   python3 tests/pilot/verify_pilot_artifacts.py --repo <repo>
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
let repo = join(here, "..", "..");
if (process.argv.includes("--repo")) {
  repo = process.argv[process.argv.indexOf("--repo") + 1];
}
const web = join(repo, "web");
const errors = [];
const fail = (msg) => errors.push(msg);

// --- slugger real (o mesmo que o Astro usa nos cabeçalhos) ---
let slugger = null;
try {
  const req = createRequire(join(web, "package.json"));
  const mod = req("github-slugger");
  const Slugger = mod.GithubSlugger ?? mod.default ?? mod;
  slugger = new Slugger();
} catch {
  fail("github-slugger indisponível em web/node_modules; âncoras de cabeçalho não conferíveis");
}

function headingIds(markdown) {
  const ids = new Set();
  if (!slugger) return ids;
  slugger.reset();
  const body = markdown.replace(/\A---\n.*?\n---\n/s, "");
  for (const line of body.split("\n")) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (!m) continue;
    const text = m[2].replace(/<[^>]+>/g, "").replace(/[#*`_~[\]()]/g, "").trim();
    if (text) ids.add(slugger.slug(text));
  }
  return ids;
}

function explicitIds(markdown) {
  const ids = new Set();
  const body = markdown.replace(/\A---\n.*?\n---\n/s, "");
  for (const m of body.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

// --- carrega contrato ---
let data;
try {
  data = JSON.parse(readFileSync(join(web, "src", "data", "curriculum.json"), "utf-8"));
} catch (err) {
  console.error(`check-curriculum: contrato ilegível: ${err.message}`);
  process.exit(1);
}

const blob = JSON.stringify(data);
if (!blob.includes("ç") && !blob.includes("ã")) fail("curriculum.json deve usar UTF-8 com acentos");

const modules = data.modules ?? [];
const sources = data.sources ?? [];
const sourceIds = new Set(sources.map((s) => s.id));
const bySlug = new Map();
for (const m of modules) {
  const key = `${m.track} ${m.slug}`;
  if (bySlug.has(key)) fail(`módulo duplicado: ${key}`);
  bySlug.set(key, m);
}
const slugs = new Set(modules.map((m) => m.slug));

// --- fontes e referências existem ---
for (const m of modules) {
  for (const s of m.sources ?? []) {
    if (!sourceIds.has(s)) fail(`${m.slug} cita fonte inexistente: ${s}`);
  }
  if (m.primary_source && !sourceIds.has(m.primary_source)) {
    fail(`${m.slug} tem primary_source inexistente: ${m.primary_source}`);
  }
  if (m.primary_source && !(m.sources ?? []).includes(m.primary_source)) {
    fail(`${m.slug}: primary_source fora de sources`);
  }
}
for (const s of sources) {
  if (s.url && !s.url.startsWith("https://")) fail(`fonte ${s.id} com URL não https`);
  for (const slug of s.used_by ?? []) {
    if (!slugs.has(slug)) fail(`fonte ${s.id} usada por slug inexistente: ${slug}`);
  }
}
for (const [id, claim] of Object.entries(data.claims_registry?.claims ?? {})) {
  for (const s of claim.sources ?? []) {
    if (!sourceIds.has(s)) fail(`claim ${id} cita fonte inexistente: ${s}`);
  }
}

// --- resolve href interno para arquivo + ids efetivos ---
const OLD_FRAGMENTS = [
  "05-o-meio-somador",
  "09-o-dilema",
  "010-sincroniza",
  "1-o-problema-das-caixinhas",
  "2-números-negativos",
  "3-a-memória-ram-como",
  "6-ponto-flutuante-ieee",
  "caixinhas-finitas-convers",
];

function resolveTarget(href) {
  const hashIndex = href.indexOf("#");
  const path = hashIndex < 0 ? href : href.slice(0, hashIndex);
  const hash = hashIndex < 0 ? "" : href.slice(hashIndex + 1);
  let file = null;
  if (path === "/") {
    file = join(web, "src", "pages", "index.astro");
  } else {
    const mt = /^\/tracks\/([^/]+)(?:\/([^/#?]+))?\/?$/.exec(path);
    if (!mt) return { file: null, hash, reason: "caminho fora do padrão /tracks" };
    if (!mt[2]) {
      file = join(web, "src", "pages", "tracks", mt[1], "index.astro");
    } else {
      file = join(web, "src", "pages", "tracks", mt[1], `${mt[2]}.mdx`);
    }
  }
  return { file, hash, reason: file && !existsSync(file) ? "arquivo inexistente" : null };
}

function moduleSlugForPath(path) {
  const mt = /^\/tracks\/([^/]+)\/([^/#?]+)\/?$/.exec(path);
  return mt ? mt[2] : null;
}

const linkFields = [];
for (const m of modules) {
  for (const o of m.objectives ?? []) linkFields.push([`${m.slug} objetivo ${o.id}`, o.href]);
  for (const p of m.prerequisites ?? []) linkFields.push([`${m.slug} pré-requisito ${p.id}`, p.href]);
}
for (const e of data.study_index ?? []) linkFields.push([`study_index ${e.id}`, e.href]);

const idCache = new Map();
function idsForFile(file) {
  if (!idCache.has(file)) {
    const text = readFileSync(file, "utf-8");
    idCache.set(file, new Set([...explicitIds(text), ...headingIds(text)]));
  }
  return idCache.get(file);
}

for (const [where, href] of linkFields) {
  if (href === null || href === undefined) continue;
  if (typeof href !== "string") {
    fail(`${where}: href não textual`);
    continue;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
    fail(`${where}: link externo em currículo (${href})`);
    continue;
  }
  for (const old of OLD_FRAGMENTS) {
    if (href.includes(old)) fail(`${where}: link antigo rejeitado (${href})`);
  }
  const { file, hash, reason } = resolveTarget(href);
  if (!file || reason) {
    fail(`${where}: alvo inválido (${href}): ${reason ?? "?"}`);
    continue;
  }
  if (hash) {
    let decoded = hash;
    try {
      decoded = decodeURIComponent(hash);
    } catch {
      fail(`${where}: hash malformado (${href})`);
      continue;
    }
    if (!idsForFile(file).has(decoded)) {
      fail(`${where}: âncora #${hash} inexistente em ${file}`);
    }
  }
}

// --- ciclos de pré-requisitos entre módulos ---
const edges = new Map(modules.map((m) => [m.slug, new Set()]));
for (const m of modules) {
  for (const item of [...(m.objectives ?? []), ...(m.prerequisites ?? [])]) {
    if (typeof item.href !== "string") continue;
    const target = moduleSlugForPath(item.href.split("#")[0]);
    if (target && target !== m.slug && slugs.has(target)) edges.get(m.slug).add(target);
  }
}
const visiting = new Set();
const visited = new Set();
function hasCycle(node, stack) {
  if (visiting.has(node)) return [...stack, node];
  if (visited.has(node)) return null;
  visiting.add(node);
  for (const next of edges.get(node) ?? []) {
    const found = hasCycle(next, [...stack, node]);
    if (found) return found;
  }
  visiting.delete(node);
  visited.add(node);
  return null;
}
for (const m of modules) {
  const cycle = hasCycle(m.slug, []);
  if (cycle) fail(`ciclo de pré-requisitos: ${cycle.join(" -> ")}`);
}

// --- sections: âncoras + acumulação requires/provides na ordem ---
for (const m of modules) {
  const sections = m.sections ?? [];
  const seen = new Set();
  for (const s of sections) {
    if (seen.has(s.id)) fail(`${m.slug}: section duplicada ${s.id}`);
    seen.add(s.id);
    if (typeof s.optional !== "boolean") fail(`${m.slug}: section ${s.id} sem optional explícito`);
  }
  if (sections.length === 0) continue;
  const file = join(web, "src", "pages", "tracks", m.track, `${m.slug}.mdx`);
  if (!existsSync(file)) {
    fail(`${m.slug}: MDX ausente para validar sections`);
    continue;
  }
  const ids = idsForFile(file);
  for (const s of sections) {
    if (!ids.has(s.id)) fail(`${m.slug}: section ${s.id} sem âncora no MDX`);
  }
  const known = new Set(m.concepts?.known ?? []);
  const declared = new Set([...(m.concepts?.known ?? []), ...(m.concepts?.current ?? [])]);
  for (const s of sections) {
    for (const req of s.requires ?? []) {
      if (!known.has(req)) fail(`${m.slug}#${s.id}: requires não satisfeito: ${req}`);
    }
    for (const prov of s.provides ?? []) {
      if (!declared.has(prov)) fail(`${m.slug}#${s.id}: provides fora do ledger: ${prov}`);
    }
    if (!s.optional) {
      for (const prov of s.provides ?? []) known.add(prov);
    }
  }
}

// --- sem selos sem evidência no escopo UI ---
const scopeFiles = [
  "src/pages/index.astro",
  "src/pages/tracks/01-hardware-and-os/index.astro",
  "src/pages/tracks/02-networks/index.astro",
  "src/layouts/TrackLayout.astro",
];
const bannedPhrases = ["C11 VERIFIED", "100% Gates Aprovados", "Gates Verificados", "C11 Sanitized", "100% Pass", "Verificado</span>"];
for (const rel of scopeFiles) {
  const content = readFileSync(join(web, rel), "utf-8");
  for (const phrase of bannedPhrases) {
    if (content.includes(phrase)) fail(`${rel} contém selo sem evidência: ${phrase}`);
  }
  if (content.includes('href="#"') || content.includes("href='#'")) {
    fail(`${rel} contém href# enganoso`);
  }
}

if (errors.length > 0) {
  console.error(`check-curriculum: ${errors.length} violação(ões):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

// --- unificação: artefatos MDX via CLI do pipeline (sem duplicar checagem) ---
const verifier = join(repo, "tests", "pilot", "verify_pilot_artifacts.py");
const result = spawnSync("python3", [verifier, "--repo", repo], { encoding: "utf-8" });
if (result.error) {
  console.error(`check-curriculum: não foi possível executar o verificador: ${result.error.message}`);
  console.error("Comando: python3 tests/pilot/verify_pilot_artifacts.py --repo <repo>");
  process.exit(1);
}
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.status !== 0) {
  console.error("check-curriculum: verify_pilot_artifacts.py reprovou (ver saída acima).");
  process.exit(result.status ?? 1);
}

console.log(
  `check-curriculum: OK — ${modules.length} módulos, ${linkFields.length} links conferidos, ` +
    `sections acumuladas, sem ciclos, artefatos verificados.`,
);
