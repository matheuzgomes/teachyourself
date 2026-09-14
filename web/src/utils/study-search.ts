/**
 * Busca textual sobre o índice de estudo do percurso-piloto.
 *
 * Puro e sem dependências: roda no build (Astro, sem JS no cliente),
 * no cliente (progressive enhancement) e sob `node --test`.
 */

export interface SearchableEntry {
  id: string;
  question: string;
  terms: string[];
  track: string;
  slug: string;
  href: string;
  moduleTitle: string;
  moduleDescription: string;
  pilot: boolean;
}

export interface SearchResult {
  entry: SearchableEntry;
  /** Pontuação inteira maior que zero; ordenação decrescente com desempate alfabético. */
  score: number;
  /** Quais campos sustentam o resultado (para depuração e testes). */
  matchedOn: Array<"question" | "terms" | "title" | "description">;
}

/** Minúsculas, sem acentos, espaços colapsados. Busca em PT precisa disso. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length >= 2);
}

/**
 * AND entre tokens: todo token precisa aparecer em ao menos um campo.
 * Pesos: pergunta 5, termos 4, título do módulo 2, descrição 1.
 */
export function searchStudy(
  entries: SearchableEntry[],
  query: string,
  limit = 8,
): SearchResult[] {
  const tokens = tokenize(normalizeText(query));
  if (tokens.length === 0 || limit <= 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const question = normalizeText(entry.question);
    const title = normalizeText(entry.moduleTitle);
    const description = normalizeText(entry.moduleDescription);
    const termList = entry.terms.map(normalizeText);

    let score = 0;
    const matchedOn = new Set<SearchResult["matchedOn"][number]>();
    let allMatched = true;

    for (const token of tokens) {
      let tokenScore = 0;
      if (question.includes(token)) {
        tokenScore += 5;
        matchedOn.add("question");
      }
      if (termList.some((t) => t.includes(token) || token.includes(t))) {
        tokenScore += 4;
        matchedOn.add("terms");
      }
      if (title.includes(token)) {
        tokenScore += 2;
        matchedOn.add("title");
      }
      if (description.includes(token)) {
        tokenScore += 1;
        matchedOn.add("description");
      }
      if (tokenScore === 0) {
        allMatched = false;
        break;
      }
      score += tokenScore;
    }

    if (allMatched) {
      // Roteiro piloto primeiro; desempate estável por pergunta.
      if (entry.pilot) score += 1;
      results.push({ entry, score, matchedOn: [...matchedOn] });
    }
  }

  results.sort(
    (a, b) => b.score - a.score || a.entry.question.localeCompare(b.entry.question, "pt-BR"),
  );
  return results.slice(0, limit);
}
