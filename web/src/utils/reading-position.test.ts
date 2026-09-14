import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_STORAGE_KEY,
  buildResumeHref,
  clearReadingPosition,
  matchCatalogEntry,
  normalizeBasePath,
  normalizeInternalPath,
  normalizeSectionId,
  parseReadingPosition,
  readReadingPosition,
  storageKeyForBase,
  writeReadingPosition,
} from "./reading-position.ts";
import type { MinimalStorage, ReadingPosition } from "./reading-position.ts";

function fakeStorage(initial: Record<string, string> = {}): MinimalStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

const pos: ReadingPosition = {
  path: "/tracks/01-hardware-and-os/00-mod",
  sectionId: "soma-binaria",
  sectionLabel: "Soma Binária",
  updatedAt: 1726000000000,
};

const catalog = [
  { track: "01-hardware-and-os", slug: "00-mod", title: "00. Da Chave ao Clock" },
];

describe("normalizeBasePath + storageKeyForBase", () => {
  it("normaliza raiz, vazio e barra final", () => {
    assert.equal(normalizeBasePath(""), "");
    assert.equal(normalizeBasePath("/"), "");
    assert.equal(normalizeBasePath("/teachyourself/"), "/teachyourself");
    assert.equal(normalizeBasePath("teachyourself"), "/teachyourself");
  });

  it("duas implantações na mesma origem usam chaves distintas", () => {
    const root = storageKeyForBase("");
    const base = storageKeyForBase("/teachyourself");
    assert.notEqual(root, base);
    assert.ok(root.startsWith("teachyourself:reading-position:v1:"));
    assert.ok(base.endsWith(":/teachyourself"));
  });
});

describe("normalizeInternalPath", () => {
  it("aceita raiz e caminho de trilha", () => {
    assert.equal(normalizeInternalPath("/", ""), "/");
    assert.equal(normalizeInternalPath("/tracks/01-hardware-and-os/00-mod", "/teachyourself"), "/tracks/01-hardware-and-os/00-mod");
  });

  it("remove a base quando presente e rejeita fora da base", () => {
    assert.equal(
      normalizeInternalPath("/teachyourself/tracks/01-hardware-and-os/00-mod", "/teachyourself"),
      "/tracks/01-hardware-and-os/00-mod",
    );
    assert.equal(normalizeInternalPath("/outra-base/tracks/x", "/teachyourself"), null);
  });

  it("elimina travessia, backslash e esquemas", () => {
    assert.equal(normalizeInternalPath("/tracks/../../evil", ""), null);
    assert.equal(normalizeInternalPath("/tracks/%2e%2e/evil", ""), null);
    assert.equal(normalizeInternalPath("/tracks/..%5cevil", ""), null);
    assert.equal(normalizeInternalPath("\\\\evil\\\\x", ""), null);
    assert.equal(normalizeInternalPath("https://evil.example/", ""), null);
    assert.equal(normalizeInternalPath("javascript:alert(1)", ""), null);
    assert.equal(normalizeInternalPath("//evil.example/x", ""), null);
    assert.equal(normalizeInternalPath("/tracks/x with space", ""), null);
    assert.equal(normalizeInternalPath("/tracks/x<script>", ""), null);
  });

  it("recusa caminhos arbitrários fora da allowlist", () => {
    assert.equal(normalizeInternalPath("/admin/painel", ""), null);
    assert.equal(normalizeInternalPath("/qualquer-coisa", ""), null);
  });
});

describe("normalizeSectionId", () => {
  it("aceita ids simples, unicode e com pontos", () => {
    assert.equal(normalizeSectionId("bit"), "bit");
    assert.equal(normalizeSectionId("soma-binaria"), "soma-binaria");
    assert.equal(normalizeSectionId("secao.2"), "secao.2");
  });

  it("aceita forma percent-encoded e decodifica como o DOM", () => {
    assert.equal(normalizeSectionId("soma-bin%C3%A1ria"), "soma-binária");
  });

  it("recusa suspeito", () => {
    assert.equal(normalizeSectionId('x"><img'), null);
    assert.equal(normalizeSectionId("com espaço"), null);
    assert.equal(normalizeSectionId("a/b"), null);
    assert.equal(normalizeSectionId(""), null);
    assert.equal(normalizeSectionId("%ZZ"), null);
  });
});

describe("parseReadingPosition", () => {
  it("aceita payload válido", () => {
    assert.deepEqual(parseReadingPosition(JSON.stringify(pos)), pos);
  });

  it("recusa payload corrompido", () => {
    assert.equal(parseReadingPosition(null), null);
    assert.equal(parseReadingPosition("{quebrado"), null);
    assert.equal(parseReadingPosition(JSON.stringify({ path: 42 })), null);
    assert.equal(parseReadingPosition(JSON.stringify({ ...pos, sectionId: 'x"><img' })), null);
    assert.equal(parseReadingPosition(JSON.stringify({ ...pos, updatedAt: "ontem" })), null);
    assert.equal(parseReadingPosition(JSON.stringify({ ...pos, sectionLabel: "a<b" })), null);
  });
});

describe("storage round-trip", () => {
  it("escreve e lê na raiz e na base sem colidir", () => {
    const storage = fakeStorage();
    assert.equal(writeReadingPosition(storage, pos, ""), true);
    assert.equal(writeReadingPosition(storage, { ...pos, sectionId: "clock" }, "/teachyourself"), true);
    const fromRoot = readReadingPosition(storage, "");
    const fromBase = readReadingPosition(storage, "/teachyourself");
    assert.equal(fromRoot?.sectionId, "soma-binaria");
    assert.equal(fromBase?.sectionId, "clock");
  });

  it("migra a chave legada para a chave com base", () => {
    const storage = fakeStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(pos) });
    const found = readReadingPosition(storage, "/teachyourself");
    assert.equal(found?.path, pos.path);
    assert.equal(storage.data[storageKeyForBase("/teachyourself")] !== undefined, true);
    assert.equal(LEGACY_STORAGE_KEY in storage.data, false);
  });

  it("storage bloqueado nunca quebra", () => {
    const broken: MinimalStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    assert.equal(readReadingPosition(broken, ""), null);
    assert.equal(writeReadingPosition(broken, pos), false);
    clearReadingPosition(broken, "");
  });

  it("ignora posição externa gravada à mão e limpa as duas chaves", () => {
    const storage = fakeStorage({
      [storageKeyForBase("")]: JSON.stringify({ ...pos, path: "https://evil.example/" }),
    });
    assert.equal(readReadingPosition(storage, ""), null);
    clearReadingPosition(storage, "");
    assert.deepEqual(storage.data, {});
  });
});

describe("matchCatalogEntry", () => {
  it("casa track+slug publicados", () => {
    assert.deepEqual(
      matchCatalogEntry(catalog, "/tracks/01-hardware-and-os/00-mod"),
      catalog[0],
    );
  });

  it("pula módulo desconhecido e caminho arbitrário", () => {
    assert.equal(matchCatalogEntry(catalog, "/tracks/01-hardware-and-os/99-inexistente"), null);
    assert.equal(matchCatalogEntry(catalog, "/tracks/outra/00-mod"), null);
    assert.equal(matchCatalogEntry(catalog, "/"), null);
    assert.equal(matchCatalogEntry([], "/tracks/01-hardware-and-os/00-mod"), null);
  });
});

describe("buildResumeHref", () => {
  it("prefixa a base e ancora a seção com encode", () => {
    assert.equal(
      buildResumeHref("/teachyourself", pos),
      "/teachyourself/tracks/01-hardware-and-os/00-mod#soma-binaria",
    );
    assert.equal(buildResumeHref("", { ...pos, sectionId: null }), pos.path);
  });

  it("ancora hashes unicode de forma reversível", () => {
    const href = buildResumeHref("", { ...pos, sectionId: "soma-binária" });
    assert.equal(href, `${pos.path}#soma-bin%C3%A1ria`);
    assert.equal(normalizeSectionId(href?.split("#")[1]), "soma-binária");
  });

  it("nunca monta href externo", () => {
    assert.equal(buildResumeHref("", { ...pos, path: "https://evil.example/" }), null);
  });
});
