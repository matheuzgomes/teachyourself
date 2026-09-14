import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeText, searchStudy } from "./study-search.ts";
import type { SearchableEntry } from "./study-search.ts";

const entries: SearchableEntry[] = [
  {
    id: "q-soma",
    question: "Como o hardware soma dois bits?",
    terms: ["soma binária", "meio-somador", "carry"],
    track: "01-hardware-and-os",
    slug: "00-mod",
    href: "/tracks/01-hardware-and-os/00-mod#05-soma",
    moduleTitle: "00. Da Chave ao Clock",
    moduleDescription: "Portas NAND, somadores e clock.",
    pilot: true,
  },
  {
    id: "q-float",
    question: "Como a máquina guarda números com casas decimais?",
    terms: ["ponto flutuante", "IEEE 754"],
    track: "01-hardware-and-os",
    slug: "01-mod",
    href: "/tracks/01-hardware-and-os/01-mod",
    moduleTitle: "01. Representação e Ponto Flutuante",
    moduleDescription: "Bytes e aritmética.",
    pilot: true,
  },
];

describe("normalizeText", () => {
  it("ignora acentos e caixa", () => {
    assert.equal(normalizeText("Soma Binária"), "soma binaria");
    assert.equal(normalizeText("  COMPLEMENTO   de   dois "), "complemento de dois");
  });
});

describe("searchStudy", () => {
  it("acha por pergunta com acento na consulta", () => {
    const res = searchStudy(entries, "soma binaria");
    assert.equal(res.length, 1);
    assert.equal(res[0].entry.id, "q-soma");
  });

  it("acha por termo (IEEE sem hífen parcial)", () => {
    const res = searchStudy(entries, "ponto flutuante");
    assert.equal(res.length, 1);
    assert.equal(res[0].entry.id, "q-float");
    assert.ok(res[0].matchedOn.includes("terms"));
  });

  it("exige AND entre tokens", () => {
    assert.equal(searchStudy(entries, "soma flutuante").length, 0);
  });

  it("consulta vazia ou curta retorna vazio", () => {
    assert.equal(searchStudy(entries, "").length, 0);
    assert.equal(searchStudy(entries, "a").length, 0);
  });

  it("respeita o limite", () => {
    const res = searchStudy(entries, "modulo", 1);
    assert.ok(res.length <= 1);
  });
});
