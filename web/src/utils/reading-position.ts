/**
 * Posição de leitura guardada só no navegador (localStorage).
 *
 * Contrato honesto: guarda ONDE a pessoa parou, nunca o quanto aprendeu.
 * Leitura concluída não equivale a domínio; nenhum campo representa
 * progresso, nota ou competência.
 *
 * Defesas: chave com namespace + base normalizada (duas implantações na
 * mesma origem não colidem), validação estrita do payload, try/catch em
 * todo acesso a storage, só caminhos internos allowlistados (sem `..`,
 * sem backslash, sem redirect externo) e nunca innerHTML com dados lidos.
 */

export const STORAGE_NAMESPACE = "teachyourself:reading-position:v1";
/** Chave legada sem base, lida só como fallback de migração. */
export const LEGACY_STORAGE_KEY = STORAGE_NAMESPACE;

export interface ReadingPosition {
  /** Caminho site-root-relative, ex. "/tracks/01-hardware-and-os/00-...". */
  path: string;
  /** Id da seção (slug do cabeçalho ou âncora explícita) ou null no topo. */
  sectionId: string | null;
  /** Rótulo humano da seção, exibido como contexto. */
  sectionLabel: string | null;
  /** Epoch ms do último salvamento. */
  updatedAt: number;
}

export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Entrada leve de catálogo para conferir a retomada sem puxar o JSON inteiro. */
export interface CatalogEntry {
  track: string;
  slug: string;
  title: string;
}

const MAX_PATH_LEN = 300;
const MAX_LABEL_LEN = 200;
const MAX_SECTION_LEN = 220;

/** "" ou "/base" sem barra final. */
export function normalizeBasePath(base: string): string {
  if (typeof base !== "string") return "";
  const trimmed = base.trim();
  if (trimmed === "" || trimmed === "/") return "";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "";
}

/** Chave de storage com namespace + base: implantações não colidem. */
export function storageKeyForBase(base: string): string {
  const normalized = normalizeBasePath(base);
  return `${STORAGE_NAMESPACE}:${normalized || "/"}`;
}

/**
 * Normaliza um id de seção: aceita unicode, pontos e forma percent-encoded
 * (decodifica e valida a forma decodificada, como o DOM). Retorna null para
 * qualquer forma suspeita.
 */
export function normalizeSectionId(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  let id = raw;
  if (id.includes("%")) {
    try {
      id = decodeURIComponent(id);
    } catch {
      return null;
    }
  }
  if (id.length === 0 || id.length > MAX_SECTION_LEN) return null;
  if (!/^[\p{L}\p{N}\-_.:~]+$/u.test(id)) return null;
  return id;
}

/**
 * Normaliza um caminho para a forma site-root-relative allowlistada
 * ("/" ou "/tracks/..."). Elimina esquemas, backslash, segmentos vazios,
 * "." e ".." (inclusive percent-encoded). Retorna null se inválido.
 */
export function normalizeInternalPath(rawPath: unknown, basePath: string): string | null {
  if (typeof rawPath !== "string" || rawPath.length === 0 || rawPath.length > MAX_PATH_LEN) {
    return null;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawPath)) return null;
  if (rawPath.includes("\\")) return null;
  let path = rawPath;
  if (path.includes("%")) {
    try {
      path = decodeURIComponent(path);
    } catch {
      return null;
    }
    if (path.includes("\\")) return null;
  }
  if (!path.startsWith("/")) return null;
  if (/[\s<>"'`]/.test(path) || /[\u0000-\u001F\u007F]/.test(path)) return null;
  path = path.replace(/\/{2,}/g, "/");
  if (path === "/") return "/";
  const segments = path.split("/").slice(1);
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  const base = normalizeBasePath(basePath);
  let sitePath = path;
  if (base) {
    if (sitePath === base) {
      sitePath = "/";
    } else if (sitePath.startsWith(`${base}/`)) {
      sitePath = sitePath.slice(base.length);
    }
  }
  if (sitePath !== "/" && !sitePath.startsWith("/tracks/")) return null;
  return sitePath;
}

/** Valida payload lido do storage. Retorna null para qualquer forma suspeita. */
export function parseReadingPosition(raw: string | null): ReadingPosition | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj["path"] !== "string") return null;
  const sectionRaw = obj["sectionId"];
  const sectionId = sectionRaw === null || sectionRaw === undefined ? null : normalizeSectionId(sectionRaw);
  if (sectionRaw !== null && sectionRaw !== undefined && sectionId === null) return null;
  const label = obj["sectionLabel"];
  if (label !== null && label !== undefined && typeof label !== "string") return null;
  if (typeof label === "string" && (label.length === 0 || label.length > MAX_LABEL_LEN)) return null;
  if (typeof label === "string" && /[<>]/.test(label)) return null;
  const updatedAt = obj["updatedAt"];
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt) || updatedAt <= 0) return null;
  return {
    path: obj["path"] as string,
    sectionId,
    sectionLabel: (label as string | null) ?? null,
    updatedAt,
  };
}

function readKey(storage: MinimalStorage, key: string): ReadingPosition | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  return parseReadingPosition(raw);
}

export function readReadingPosition(
  storage: MinimalStorage | null | undefined,
  basePath = "",
): ReadingPosition | null {
  if (!storage) return null;
  const key = storageKeyForBase(basePath);
  let found = readKey(storage, key);
  let foundKey = key;
  if (!found && key !== LEGACY_STORAGE_KEY) {
    found = readKey(storage, LEGACY_STORAGE_KEY);
    foundKey = LEGACY_STORAGE_KEY;
  }
  if (!found) return null;
  const normalized = normalizeInternalPath(found.path, basePath);
  if (!normalized) return null;
  const position: ReadingPosition = { ...found, path: normalized };
  if (foundKey === LEGACY_STORAGE_KEY) {
    try {
      storage.setItem(key, JSON.stringify(position));
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Migração é cortesia; a leitura continua válida.
    }
  }
  return position;
}

export function writeReadingPosition(
  storage: MinimalStorage | null | undefined,
  position: ReadingPosition,
  basePath = "",
): boolean {
  if (!storage) return false;
  const normalized = normalizeInternalPath(position.path, basePath);
  if (!normalized) return false;
  const sectionId =
    position.sectionId === null ? null : normalizeSectionId(position.sectionId);
  if (position.sectionId !== null && sectionId === null) return false;
  try {
    storage.setItem(
      storageKeyForBase(basePath),
      JSON.stringify({ ...position, path: normalized, sectionId }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearReadingPosition(
  storage: MinimalStorage | null | undefined,
  basePath = "",
): void {
  if (!storage) return;
  try {
    storage.removeItem(storageKeyForBase(basePath));
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage indisponível: retomar é opcional, nunca fatal.
  }
}

/**
 * Confere o caminho contra entradas de catálogo (track+slug publicados).
 * A retomada nunca linka caminhos arbitrários nem módulos desconhecidos.
 */
export function matchCatalogEntry(
  entries: CatalogEntry[],
  sitePath: string,
): CatalogEntry | null {
  const m = /^\/tracks\/([^/]+)\/([^/#?]+)\/?$/.exec(sitePath);
  if (!m) return null;
  try {
    const slug = decodeURIComponent(m[2]);
    return entries.find((e) => e.track === m[1] && e.slug === slug) ?? null;
  } catch {
    return null;
  }
}

/**
 * Monta o href de retomada a partir de posição já validada.
 * Sempre interno; inclui a base de deploy e a âncora da seção.
 */
export function buildResumeHref(basePath: string, position: ReadingPosition): string | null {
  const sitePath = normalizeInternalPath(position.path, basePath);
  if (!sitePath) return null;
  const base = normalizeBasePath(basePath);
  const path = `${base}${sitePath}`;
  if (position.sectionId) {
    const section = normalizeSectionId(position.sectionId);
    if (!section) return null;
    return `${path}#${encodeURIComponent(section)}`;
  }
  return path;
}
