import curriculumData from "./curriculum.json";

export interface ConceptLedger {
  known: string[];
  current: string[];
  deferred: string[];
}

export type SourceRole = "primary" | "supporting";

export interface CurriculumSource {
  id: string;
  kind: "textbook" | "standard" | "paper";
  /** Papel da fonte dentro de cada módulo que a usa. */
  role?: SourceRole;
  citation: string;
  /** Link público autêntico e conhecido. Ausente quando não há URL estável. */
  url?: string;
  corpus_ref: string;
  covers: string;
  used_by: string[];
}

export interface ModuleObjective {
  id: string;
  label: string;
  /** Link interno real (página do módulo, com âncora quando existe seção). */
  href: string | null;
}

export interface ModulePrerequisite {
  id: string;
  label: string;
  /** Link interno real ou null quando o pré-requisito é externo ao percurso. */
  href: string | null;
}

export type StudyState = "pilot" | "content-unreviewed";

export interface ModuleSection {
  /** Âncora real da seção no MDX publicado (id explícito). */
  id: string;
  label: string;
  /** Conceitos exigidos: precisam estar em known ou em provides anteriores do caminho principal. */
  requires: string[];
  /** Conceitos ensinados por esta seção. */
  provides: string[];
  /** Seções opcionais não alimentam o acumulado do caminho principal. */
  optional: boolean;
}

export interface CurriculumModule {
  slug: string;
  track: string;
  title: string;
  description: string;
  status: string;
  /** "pilot": roteiro de estudo guiado. "content-unreviewed": página existe, revisão não realizada. */
  study_state?: StudyState;
  review_status: string;
  sources: string[];
  /** Fonte principal do módulo. Demais ids em `sources` são apoio. */
  primary_source?: string | null;
  objectives?: ModuleObjective[];
  prerequisites?: ModulePrerequisite[];
  /** Intervalos do caminho principal, definidos pelas âncoras reais do MDX. */
  sections?: ModuleSection[];
  /** Verdadeiro quando o próprio MDX já rende navegação anterior/próximo (verificado por leitura). */
  has_inline_navigation?: boolean;
  concepts: ConceptLedger;
}

export interface CurriculumTrack {
  id: string;
  title: string;
  description?: string;
  catalog_href: string | null;
  status: string;
}

export interface StudyIndexEntry {
  id: string;
  question: string;
  terms: string[];
  track: string;
  slug: string;
  href: string;
}

export interface CurriculumContract {
  contract_version: string;
  description: string;
  audience: {
    profile: string;
    assumes: string[];
    does_not_assume: string[];
    terminal_required: boolean;
    terminal_note: string;
  };
  reading_vs_mastery: string;
  tracks: CurriculumTrack[];
  planned_tracks: CurriculumTrack[];
  sources: CurriculumSource[];
  modules: CurriculumModule[];
  study_index: StudyIndexEntry[];
  claims_registry: unknown;
  visual_models: unknown;
}

export const curriculum = curriculumData as unknown as CurriculumContract;

export const contractVersion = curriculum.contract_version;

export function getTrack(trackId: string): CurriculumTrack | undefined {
  return (
    curriculum.tracks.find((t) => t.id === trackId) ??
    curriculum.planned_tracks.find((t) => t.id === trackId)
  );
}

export function getActiveTracks(): CurriculumTrack[] {
  return curriculum.tracks;
}

export function getPlannedTracks(): CurriculumTrack[] {
  return curriculum.planned_tracks;
}

export function getModule(track: string, slug: string): CurriculumModule | undefined {
  return curriculum.modules.find((m) => m.track === track && m.slug === slug);
}

export function getModuleBySlug(slug: string): CurriculumModule | undefined {
  return curriculum.modules.find((m) => m.slug === slug);
}

export function getModulesByTrack(track: string): CurriculumModule[] {
  return curriculum.modules.filter((m) => m.track === track);
}

export function getPilotModulesByTrack(track: string): CurriculumModule[] {
  return curriculum.modules.filter((m) => m.track === track && m.study_state === "pilot");
}

/** Módulo anterior e próximo dentro da mesma trilha, na ordem do contrato. */
export function getPrevNextModule(
  track: string,
  slug: string,
): { prev: CurriculumModule | null; next: CurriculumModule | null } {
  const list = getModulesByTrack(track);
  const idx = list.findIndex((m) => m.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx < list.length - 1 ? list[idx + 1] : null,
  };
}

export function getSourcesForModule(slug: string): CurriculumSource[] {
  const mod = curriculum.modules.find((m) => m.slug === slug);
  if (!mod) return [];
  return curriculum.sources.filter((s) => mod.sources.includes(s.id));
}

export function getPrimarySourceForModule(slug: string): CurriculumSource | undefined {
  const mod = curriculum.modules.find((m) => m.slug === slug);
  if (!mod?.primary_source) return undefined;
  return curriculum.sources.find((s) => s.id === mod.primary_source);
}

export function getSupportingSourcesForModule(slug: string): CurriculumSource[] {
  const mod = curriculum.modules.find((m) => m.slug === slug);
  if (!mod) return [];
  return curriculum.sources.filter(
    (s) => mod.sources.includes(s.id) && s.id !== mod.primary_source,
  );
}

export function getModuleSections(slug: string): ModuleSection[] {
  return getModuleBySlug(slug)?.sections ?? [];
}

/**
 * Confere um caminho interno contra o catálogo. Retorna o módulo quando o
 * caminho corresponde a `track/slug` publicados; null para caminhos
 * arbitrários. A retomada nunca linka o que o catálogo desconhece.
 */
export function matchCatalogModule(sitePath: string): CurriculumModule | null {
  const m = /^\/tracks\/([^/]+)\/([^/#?]+)/.exec(sitePath);
  if (!m) return null;
  return getModule(m[1], m[2]) ?? null;
}
export function moduleHref(mod: Pick<CurriculumModule, "track" | "slug">): string {
  return `/tracks/${mod.track}/${mod.slug}`;
}
