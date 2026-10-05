/**
 * Repository — the only place that reads the knowledge layer.
 *
 * Excel -> scripts/ingest.py -> data/knowledge.json -> this repository ->
 * retrieval -> evidence packet -> UI / LLM.
 *
 * Server-side only. The JSON is parsed once and cached on `globalThis` so hot
 * reload and per-route bundles share a single in-memory copy (fast demo, no
 * repeated file IO).
 */

import fs from "fs";
import path from "path";

import type {
  ApplicabilityRule,
  Certification,
  ConsumerEvaluationCase,
  ConsumerRecord,
  EvaluationCase,
  Evidence,
  KnowledgeBase,
  OfficialSource,
  Product,
  Qco,
  Relationship,
  ReferenceStandard,
  RetrievalResult,
  Source,
  SourceSummary,
  Standard,
  TestingRequirement,
} from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "knowledge.json");

const CACHE_KEY = "__bis_mitra_kb__";

interface Cache {
  kb: KnowledgeBase;
  byStdId: Map<string, Standard>;
  byProdId: Map<string, Product>;
  bySrcId: Map<string, Source>;
  evByStd: Map<string, Evidence[]>;
  relByProd: Map<string, Relationship[]>;
  relByStd: Map<string, Relationship[]>;
  rulesByProd: Map<string, ApplicabilityRule[]>;
  certByStd: Map<string, Certification[]>;
  testsByStd: Map<string, TestingRequirement[]>;
}

function load(): Cache {
  const g = globalThis as unknown as Record<string, unknown>;
  const existing = g[CACHE_KEY] as Cache | undefined;
  if (existing) return existing;

  let raw: string;
  try {
    raw = fs.readFileSync(DATA_FILE, "utf8");
  } catch {
    throw new Error(
      "Knowledge layer not found. Run `python3 scripts/ingest.py` to generate data/knowledge.json.",
    );
  }
  const kb = JSON.parse(raw) as KnowledgeBase;

  const cache: Cache = {
    kb,
    byStdId: new Map(kb.standards.map((s) => [s.id, s])),
    byProdId: new Map(kb.products.map((p) => [p.id, p])),
    bySrcId: new Map(kb.sources.map((s) => [s.id, s])),
    evByStd: new Map(),
    relByProd: new Map(),
    relByStd: new Map(),
    rulesByProd: new Map(),
    certByStd: new Map(),
    testsByStd: new Map(),
  };

  const push = <K extends string, V>(map: Map<K, V[]>, key: K, value: V) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  for (const e of kb.evidence) if (e.standard_id) push(cache.evByStd, e.standard_id, e);
  for (const r of kb.relationships) {
    push(cache.relByProd, r.product_id, r);
    push(cache.relByStd, r.standard_id, r);
  }
  for (const r of kb.rules) if (r.product_id) push(cache.rulesByProd, r.product_id, r);
  for (const c of kb.certifications) if (c.Standard_ID) push(cache.certByStd, c.Standard_ID, c);
  for (const t of kb.testing_requirements) if (t.Standard_ID) push(cache.testsByStd, t.Standard_ID, t);

  g[CACHE_KEY] = cache;
  return cache;
}

/* -------------------------------------------------------------------------- */
/* Generic accessors                                                           */
/* -------------------------------------------------------------------------- */

export function getKb(): KnowledgeBase {
  return load().kb;
}

export function getStats() {
  return getKb().meta.stats;
}

export function getMeta() {
  return getKb().meta;
}

export function listStandards(): Standard[] {
  return getKb().standards;
}

export function getStandard(id: string): Standard | null {
  return load().byStdId.get(id) ?? null;
}

export function findStandardByIsNumber(isNumber: string): Standard | null {
  const needle = normalizeIs(isNumber);
  if (!needle) return null;
  return (
    listStandards().find((s) => normalizeIs(s.is_number) === needle) ??
    listStandards().find((s) => {
      const k = normalizeIs(s.is_number);
      return k.startsWith(needle) || needle.startsWith(k);
    }) ??
    null
  );
}

export function normalizeIs(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .toLowerCase()
    .replace(/:\d{4}/g, " ")
    .replace(/\(\s*\d+(?:st|nd|rd|th)\s+revision\s*\)/g, " ")
    .replace(/[^a-z0-9()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function listProducts(): Product[] {
  return getKb().products;
}

export function getProduct(id: string): Product | null {
  return load().byProdId.get(id) ?? null;
}

export function listSources(): Source[] {
  return getKb().sources;
}

/** Official BIS destinations that the workbook itself lists, with URLs. */
export function officialSourcesWithUrl(): OfficialSource[] {
  return listSources()
    .filter((s) => s.category === "Official BIS" && s.url)
    .map((s) => ({ id: s.id, name: s.name, url: s.url, what_it_gives: s.what_it_gives }));
}

export function getSource(id: string): Source | null {
  return load().bySrcId.get(id) ?? null;
}

export function toSourceSummary(s: Source | null): SourceSummary | null {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    category: s.category,
    authority: s.authority,
    verification_status: s.verification_status,
    status: s.status,
    what_it_gives: s.what_it_gives,
  };
}

/** How much of the knowledge layer points back at a given source. */
export function sourceUsage(sourceId: string) {
  const kb = getKb();
  const standards = kb.standards.filter((s) => s.source_id === sourceId);
  const evidence = kb.evidence.filter((e) => e.source_id === sourceId);
  const qcos = kb.qcos.filter((q) => q.Source_ID === sourceId);
  const certs = kb.certifications.filter((c) => c.Source_ID === sourceId);
  const tests = kb.testing_requirements.filter((t) => t.Source_ID === sourceId);
  const consumer = kb.consumer_records.filter((c) => c.source_id === sourceId);
  return {
    standards,
    evidence,
    qcos,
    certs,
    tests,
    consumer,
    total: standards.length + evidence.length + qcos.length + certs.length + tests.length + consumer.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Standard-centric joins                                                      */
/* -------------------------------------------------------------------------- */

export function getEvidenceForStandard(standardId: string): Evidence[] {
  return load().evByStd.get(standardId) ?? [];
}

export function getCertificationsForStandard(standardId: string): Certification[] {
  return load().certByStd.get(standardId) ?? [];
}

export function getTestsForStandard(standardId: string): TestingRequirement[] {
  return load().testsByStd.get(standardId) ?? [];
}

/**
 * QCOs are keyed by category text rather than by standard id, so they are
 * matched conservatively against the IS number / title / domain wording that
 * actually appears in the workbook.
 */
export function getQcosForStandard(standard: Standard): Qco[] {
  const kb = getKb();
  const isNum = (standard.is_number ?? "").toLowerCase();
  const title = (standard.title ?? "").toLowerCase();
  const family = isNum.match(/is\s?\d+/)?.[0] ?? "";
  return kb.qcos.filter((q) => {
    const cat = (q.Category ?? "").toLowerCase();
    if (!cat) return false;
    if (family && cat.includes(family.replace(/\s+/g, ""))) return true;
    if (family && cat.includes(family)) return true;
    if (cat.includes("pressure cooker") && title.includes("pressure cooker")) return true;
    if (cat.includes("solvent cement") && title.includes("solvent cement")) return true;
    if (cat.includes("structured-wall") && title.includes("structured-wall")) return true;
    if (cat.includes("household") && (standard.domain ?? "").includes("Electrical")) return true;
    return false;
  });
}

export function getCertificationInfo(standard: Standard) {
  return {
    certification: getCertificationsForStandard(standard.id)[0] ?? null,
    qco: getQcosForStandard(standard)[0] ?? null,
    testing: getTestsForStandard(standard.id),
  };
}

export function getRelationshipsForProduct(productId: string): Relationship[] {
  return load().relByProd.get(productId) ?? [];
}

export function getRelationshipsForStandard(standardId: string): Relationship[] {
  return load().relByStd.get(standardId) ?? [];
}

export function getRulesForProduct(productId: string): ApplicabilityRule[] {
  return load().rulesByProd.get(productId) ?? [];
}

/* -------------------------------------------------------------------------- */
/* Related standards (for detail pages and "what else" answers)                */
/* -------------------------------------------------------------------------- */

function familyKey(isNumber: string | null): string {
  const m = (isNumber ?? "").toLowerCase().match(/is\s?\d+/);
  return m ? m[0].replace(/\s+/g, "") : "";
}

export function relatedStandards(standardId: string, limit = 6): Standard[] {
  const target = getStandard(standardId);
  if (!target) return [];
  const kb = getKb();
  const targetFamily = familyKey(target.is_number);

  // Standards attached to the same products.
  const productIds = new Set(getRelationshipsForStandard(standardId).map((r) => r.product_id));
  for (const p of kb.products) if (p.seed_standard_ids.includes(standardId)) productIds.add(p.id);
  const byProduct = new Map<string, number>();
  for (const p of kb.products) {
    if (!productIds.has(p.id)) continue;
    for (const sid of [p.seed_standard_ids, getRelationshipsForProduct(p.id).map((r) => r.standard_id)].flat()) {
      if (sid !== standardId) byProduct.set(sid, (byProduct.get(sid) ?? 0) + 6);
    }
  }

  // Same IS family (IS 302 Part x, IS 16098 Part x ...).
  const byFamily = new Map<string, number>();
  for (const s of kb.standards) {
    if (s.id === standardId) continue;
    if (targetFamily && familyKey(s.is_number) === targetFamily) byFamily.set(s.id, 4);
  }

  // Explicit IS numbers quoted in each other's notes.
  const byMention = new Map<string, number>();
  const mentioned = (target.notes ?? "").match(/IS\s?\d+/gi) ?? [];
  for (const frag of mentioned) {
    const key = frag.toLowerCase().replace(/\s+/g, "");
    for (const s of kb.standards) {
      if (s.id === standardId) continue;
      if (familyKey(s.is_number) === key) byMention.set(s.id, (byMention.get(s.id) ?? 0) + 3);
    }
  }

  // Shared domain is the weakest signal.
  const scores = new Map<string, number>();
  for (const entries of [byProduct, byFamily, byMention]) {
    for (const [id, w] of entries) scores.set(id, (scores.get(id) ?? 0) + w);
  }
  for (const s of kb.standards) {
    if (s.id === standardId) continue;
    if (target.domain && s.domain === target.domain) scores.set(s.id, (scores.get(s.id) ?? 0) + 1);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => getStandard(id))
    .filter((s): s is Standard => Boolean(s))
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Consumer                                                                    */
/* -------------------------------------------------------------------------- */

export function listConsumerRecords(): ConsumerRecord[] {
  return getKb().consumer_records;
}

export function getConsumerRecord(id: string): ConsumerRecord | null {
  return listConsumerRecords().find((r) => r.id === id) ?? null;
}

export function normalizeIdentifier(v: string): string {
  return v.replace(/\s+/g, "").replace(/[-_]+/g, "").toUpperCase();
}

export function findConsumerRecord(input: string): ConsumerRecord | null {
  const raw = input.trim();
  if (!raw) return null;
  const norm = normalizeIdentifier(raw);
  return (
    listConsumerRecords().find((r) => normalizeIdentifier(r.identifier ?? "") === norm) ??
    listConsumerRecords().find(
      (r) => normalizeIdentifier(r.identifier ?? "") === normalizeIdentifier(raw.replace(/^is/i, "")),
    ) ??
    null
  );
}

/** Coarse identifier-type detection, used to route and to explain mismatches. */
export function detectIdentifierType(input: string): string | null {
  const v = input.trim().toUpperCase();
  if (/^DEMO-LIC/.test(v) || /\bLIC(ENCE|ENSE)?\b/.test(v)) return "Licence";
  if (/^DEMO-RNO/.test(v) || /\bR-\d/.test(v) || /\bRNO\b/.test(v)) return "R-number";
  if (/^DEMO-HUID/.test(v) || /\bHUID\b/.test(v)) return "HUID";
  if (/^IS[\s\-]/.test(v) || /^IS\d/.test(v)) return "IS number";
  return null;
}

/* -------------------------------------------------------------------------- */
/* Reference catalogue + evaluation cases                                      */
/* -------------------------------------------------------------------------- */

export function searchReferenceStandards(query: string, limit = 25): ReferenceStandard[] {
  const q = query.trim().toLowerCase();
  const all = getKb().reference_standards;
  if (!q) return all.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored: { row: ReferenceStandard; score: number }[] = [];
  for (const row of all) {
    const hay = `${row.is_number ?? ""} ${row.title ?? ""}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
      if ((row.is_number ?? "").toLowerCase().startsWith(t)) score += 3;
    }
    if (score > 0) scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.row);
}

export function listEvaluationCases(): EvaluationCase[] {
  return getKb().evaluation_cases;
}

export function listConsumerEvaluationCases(): ConsumerEvaluationCase[] {
  return getKb().consumer_evaluation_cases;
}

/* -------------------------------------------------------------------------- */
/* Compact projection for the LLM / chat transport                             */
/* -------------------------------------------------------------------------- */

export function compactResult(r: RetrievalResult) {
  return {
    standard_id: r.standard_id,
    is_number: r.is_number,
    title: r.title,
    domain: r.domain,
    match_type: r.match_type,
    match_reason: r.match_reason,
    relationship: r.relationship,
    notes: r.notes,
    verification_status: r.verification_status,
    evidence: r.evidence.map((e) => ({
      evidence_id: e.evidence_id,
      text: e.text,
      limitation: e.limitation,
      source: e.source ? { name: e.source.name, url: e.source.url, category: e.source.category } : null,
    })),
    certification: r.certification,
  };
}
