/**
 * Retrieval — turns a plain-language product query into ranked, explained,
 * evidence-backed results.
 *
 * Signal priority follows the product spec:
 *   1. explicit product -> standard relationships in the dataset
 *   2. product category / label
 *   3. material
 *   4. intended use
 *   5. standard title
 *   6. description / domain
 *   7. keyword similarity
 *
 * Every number below is a deterministic, auditable weight — nothing is learned
 * and nothing is invented. The same input always produces the same ranking.
 */

import {
  getCertificationInfo,
  getProduct,
  getRelationshipsForProduct,
  getStandard,
  listStandards,
  relatedStandards,
  toSourceSummary,
  getSource,
  getEvidenceForStandard,
  officialSourcesWithUrl,
} from "./repository";
import { squash } from "./understand";
import { understand, type Understanding } from "./understand";
import type {
  EvidenceRef,
  Language,
  MatchType,
  Product,
  ProductContext,
  RelationshipInfo,
  RetrievalPacket,
  RetrievalResult,
  Signal,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Tunables (all visible in the reason chips — nothing hidden)                 */
/* -------------------------------------------------------------------------- */

const PRODUCT_BASE = [100, 70, 55, 45, 38, 32];
const W_CATEGORY = 20;
const W_MATERIAL = 20;
const W_USE = 20;
const W_RELATIONSHIP = 40;
const W_SEED = 30;
const W_TEXT = 8;
const W_CORE = 45;
const W_FAMILY = 15;
const P_MATERIAL_CONFLICT = -30;
const P_USE_CONFLICT = -30;

/** Non-direct results below this score are dropped instead of being dumped. */
const SCORE_FLOOR = 85;
const MAX_RESULTS = 8;
const CANDIDATE_PRODUCTS = 6;

const USE_KEYWORDS: Record<string, string[]> = {
  POTABLE: ["potable", "drinking water", "water supply", "water supplies", "drinking"],
  DRAINAGE: ["drainage", "sewerage", "soil", "waste", "non-potable", "nonpotable", "effluent"],
  GASEOUS: ["gaseous fuel", "gas supply", "gaseous", "natural gas"],
  HOTCOLD: ["hot and cold", "hot water", "cold water"],
};

const QUERY_STOP = new Set([
  "i", "am", "is", "are", "the", "for", "and", "with", "that", "this", "our",
  "manufacture", "manufacturing", "make", "produce", "company", "business",
  "need", "want", "which", "what", "from", "have", "has", "can", "you",
  "bis", "standard", "standards", "certification", "apply", "apply.",
]);

function contextUseMatchesHay(hay: string, intendedUse: string): boolean {
  const u = intendedUse.toLowerCase();
  if (u.includes("drinking") || u.includes("potable")) return USE_KEYWORDS.POTABLE.some((k) => hay.includes(k));
  if (u.includes("drainage") || u.includes("sewerage")) return USE_KEYWORDS.DRAINAGE.some((k) => hay.includes(k));
  if (u.includes("gaseous") || u.includes("fuel")) return USE_KEYWORDS.GASEOUS.some((k) => hay.includes(k));
  if (u.includes("hot")) return USE_KEYWORDS.HOTCOLD.some((k) => hay.includes(k));
  return false;
}

/* -------------------------------------------------------------------------- */
/* Candidate accumulation                                                      */
/* -------------------------------------------------------------------------- */

interface Candidate {
  standardId: string;
  base: number;
  viaProductId: string | null;
  via: "relationship" | "seed" | "family" | "domain";
  relationship: {
    id: string | null;
    type: string;
    derivation: string | null;
    original_text: string | null;
    source_notes: string | null;
  } | null;
  seedOrder: number;
}

function addCandidate(map: Map<string, Candidate>, c: Candidate) {
  const existing = map.get(c.standardId);
  if (!existing || c.base > existing.base) map.set(c.standardId, c);
}

function collectFromProduct(
  map: Map<string, Candidate>,
  product: Product,
  base: number,
) {
  const rels = getRelationshipsForProduct(product.id);
  const relByStd = new Map(rels.map((r) => [r.standard_id, r]));
  const ids = [...new Set([...rels.map((r) => r.standard_id), ...product.seed_standard_ids])];

  ids.forEach((sid, idx) => {
    const rel = relByStd.get(sid);
    const cand: Candidate = {
      standardId: sid,
      base,
      viaProductId: product.id,
      via: rel ? "relationship" : "seed",
      relationship: rel
        ? {
            id: rel.id,
            type: rel.relationship_type ?? "Applicable",
            derivation: rel.derivation,
            original_text: rel.original_text,
            source_notes: rel.source_notes,
          }
        : {
            id: null,
            type: "Listed as applicable in the dataset",
            derivation: product.derivation_note,
            original_text: product.applicable_standards_text,
            source_notes: product.seed_notes,
          },
      seedOrder: idx,
    };

    const existing = map.get(sid);
    if (!existing) map.set(sid, cand);
    else if (cand.base > existing.base) map.set(sid, cand);
    else if (
      cand.base === existing.base &&
      cand.via === "relationship" &&
      existing.via !== "relationship"
    ) {
      map.set(sid, cand);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Scoring a single candidate                                                  */
/* -------------------------------------------------------------------------- */

interface ScoredResult {
  result: RetrievalResult;
  conflictMaterial: boolean;
  conflictUse: boolean;
}

function scoreCandidate(
  cand: Candidate,
  understanding: Understanding,
  rank: number,
): ScoredResult | null {
  const std = getStandard(cand.standardId);
  if (!std) return null;

  const ctx = understanding.context;
  const linkedProduct = cand.viaProductId ? getProduct(cand.viaProductId) : null;
  const hay = squash(
    [std.title, std.notes, std.standard_type, std.domain, std.iec_reference]
      .filter(Boolean)
      .join(" "),
  );
  // Material must be evidenced by the record itself — never by the domain
  // label ("Plastic/PVC Pipes & Fittings" would otherwise mark every pipe
  // standard in the domain as PVC).
  const materialHay = squash(
    [std.title, std.notes].filter(Boolean).join(" "),
  );
  const qTokens = squash(ctx.rawQuery)
    .split(" ")
    .filter((t) => t.length > 2 && !QUERY_STOP.has(t));

  const signals: Signal[] = [];
  const reasons: string[] = [];
  let score = cand.base;

  /* 1 — product category */
  const categoryLabel = ctx.matchedProductName ?? ctx.product;
  const categoryMatched = Boolean(linkedProduct);
  signals.push({
    label: "Product category",
    detail: categoryLabel,
    matched: categoryMatched,
    weight: W_CATEGORY,
  });
  if (categoryMatched) {
    score += W_CATEGORY;
    reasons.push(`Product category: ${linkedProduct?.name ?? categoryLabel}`);
  }

  /* 2 — material */
  let conflictMaterial = false;
  if (ctx.material) {
    const canonical = ctx.material.split(" / ")[0];
    const linkedMaterial = linkedProduct?.material ?? null;
    const hayHasMaterial = materialHay.includes(canonical.toLowerCase());
    if (linkedMaterial && linkedMaterial.toUpperCase() !== canonical.toUpperCase()) {
      conflictMaterial = true;
      signals.push({
        label: "Material",
        detail: `${ctx.material} expected, this record is ${linkedMaterial}`,
        matched: false,
        weight: P_MATERIAL_CONFLICT,
      });
      score += P_MATERIAL_CONFLICT;
    } else if (hayHasMaterial || linkedMaterial) {
      signals.push({ label: "Material", detail: ctx.material, matched: true, weight: W_MATERIAL });
      score += W_MATERIAL;
      reasons.push(`Material: ${ctx.material}`);
    } else {
      signals.push({
        label: "Material",
        detail: `${ctx.material} — not evidenced in this record`,
        matched: false,
        weight: 0,
      });
    }
  }

  /* 3 — intended use */
  let conflictUse = false;
  if (ctx.intendedUse) {
    const linkedApp = linkedProduct?.application ?? null;
    const contextValue = appValueFor(ctx.intendedUse);
    if (linkedApp && contextValue && linkedApp !== contextValue) {
      conflictUse = true;
      signals.push({
        label: "Intended use",
        detail: `${ctx.intendedUse} expected, this record is for ${describeApplication(linkedApp)}`,
        matched: false,
        weight: P_USE_CONFLICT,
      });
      score += P_USE_CONFLICT;
    } else if (linkedApp || contextUseMatchesHay(hay, ctx.intendedUse)) {
      signals.push({ label: "Intended use", detail: ctx.intendedUse, matched: true, weight: W_USE });
      score += W_USE;
      reasons.push(`Intended use: ${ctx.intendedUse}`);
    } else {
      signals.push({
        label: "Intended use",
        detail: `${ctx.intendedUse} — not evidenced in this record`,
        matched: false,
        weight: 0,
      });
    }
  }

  /* 4 — explicit relationship / dataset listing */
  if (cand.via === "relationship" && cand.relationship) {
    signals.push({
      label: "Product → standard relationship",
      detail: cand.relationship.id ?? "dataset relationship",
      matched: true,
      weight: W_RELATIONSHIP,
    });
    score += W_RELATIONSHIP;
    reasons.push(
      `Product → standard relationship found${cand.relationship.id ? ` (${cand.relationship.id})` : ""}`,
    );
  } else if (cand.via === "seed") {
    signals.push({
      label: "Listed as applicable",
      detail: linkedProduct?.applicable_standards_text ?? "dataset product mapping",
      matched: true,
      weight: W_SEED,
    });
    score += W_SEED;
    reasons.push("Listed in the dataset as an applicable standard for this product");
  } else if (cand.via === "family") {
    signals.push({
      label: "Same standard family",
      detail: "shares an IS number family with a matched standard",
      matched: true,
      weight: W_FAMILY,
    });
    score += W_FAMILY;
    reasons.push("Same IS-number family as a directly matched standard");
  }

  /* 5 — title / description overlap */
  const overlap = qTokens.filter((t) => hay.includes(t)).length;
  if (overlap > 0) {
    const w = W_TEXT * Math.min(overlap, 2);
    signals.push({
      label: "Title / description",
      detail: `${overlap} matching term${overlap > 1 ? "s" : ""} in the standard record`,
      matched: true,
      weight: w,
    });
    score += w;
    reasons.push("Standard title / description overlaps with your query");
  }

  /* 6 — core standard of the family */
  const isCore = (std.standard_type ?? "").toLowerCase().includes("core/general");
  if (isCore) {
    signals.push({
      label: "Core standard",
      detail: "general standard that the particular-requirement sections are used with",
      matched: true,
      weight: W_CORE,
    });
    score += W_CORE;
    reasons.push("Core/general standard for this family of products");
  }

  /* ---- classification ---------------------------------------------------- */
  let matchType: MatchType;
  let contrast: string | null = null;

  if (understanding.ambiguity) {
    matchType = "NEEDS CLARIFICATION";
    contrast = "The query does not yet specify enough to choose between products.";
  } else if (
    linkedProduct &&
    ctx.matchedProductId === linkedProduct.id &&
    (cand.via === "relationship" || cand.via === "seed") &&
    !conflictMaterial &&
    !conflictUse
  ) {
    matchType = "DIRECT MATCH";
  } else if (conflictMaterial || conflictUse) {
    matchType = "ALTERNATIVE";
    contrast = conflictMaterial
      ? `Different material from your query (${linkedProduct?.material ?? "unknown"} vs ${ctx.material ?? "not stated"}).`
      : `Different intended use from your query (${describeApplication(linkedProduct?.application ?? null)}).`;
  } else {
    matchType = "RELATED";
    contrast = linkedProduct
      ? `Linked to a related product entry: “${linkedProduct.name}”.`
      : "Surfaced from the same domain/family rather than an explicit product mapping.";
  }

  if (matchType !== "DIRECT MATCH" && !understanding.ambiguity && cand.via === "family" && !reasons.length) {
    return null;
  }

  const evidence: EvidenceRef[] = getEvidenceForStandard(std.id).map((e) => ({
    evidence_id: e.id,
    text: e.text,
    clause: e.clause,
    page: e.page,
    section: e.section,
    limitation: e.limitation,
    source: toSourceSummary(getSource(e.source_id ?? "")),
  }));

  const relationship: RelationshipInfo | null = cand.relationship
    ? {
        id: cand.relationship.id,
        type: cand.relationship.type,
        derivation: cand.relationship.derivation,
        original_text: cand.relationship.original_text,
        source_notes: cand.relationship.source_notes,
      }
    : null;

  const result: RetrievalResult = {
    standard_id: std.id,
    is_number: std.is_number,
    title: std.title,
    domain: std.domain,
    standard_type: std.standard_type,
    iec_reference: std.iec_reference,
    amendments_count: std.amendments_count,
    notes: std.notes,
    verification_status: std.verification_status,
    data_basis: std.data_basis,
    provenance: `${std.sheet} · ${std.workbook}`,
    match_type: matchType,
    match_reason: reasons,
    signals,
    relationship,
    evidence,
    source:
      toSourceSummary(getSource(std.source_id ?? "")) ??
      (evidence[0]?.source ?? null),
    certification: getCertificationInfo(std),
    score,
    rank,
    product_id: linkedProduct?.id ?? null,
    product_name: linkedProduct?.name ?? null,
    contrast,
  };

  return { result, conflictMaterial, conflictUse };
}

function appValueFor(intendedUse: string): string | null {
  const u = intendedUse.toLowerCase();
  if (u.includes("drinking") || u.includes("potable")) return "Potable/water supply";
  if (u.includes("drainage") || u.includes("sewerage") || u.includes("non-potable"))
    return "Drainage/sewerage/non-potable";
  if (u.includes("gaseous") || u.includes("fuel")) return "Gaseous fuel supply";
  return null;
}

function describeApplication(value: string | null): string {
  if (!value) return "not specified in the dataset";
  if (value === "Potable/water supply") return "drinking / potable water supply";
  if (value === "Drainage/sewerage/non-potable") return "drainage / sewerage / non-potable use";
  if (value === "Gaseous fuel supply") return "gaseous fuel supply";
  return value;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

export function retrieve(rawQuery: string, language: Language): RetrievalPacket {
  const understanding = understand(rawQuery, language);
  const ctx: ProductContext = understanding.context;

  const candidates = new Map<string, Candidate>();
  const considered = understanding.candidates.slice(0, CANDIDATE_PRODUCTS);

  considered.forEach(({ product }, index) => {
    const base = PRODUCT_BASE[index] ?? 32;
    collectFromProduct(candidates, product, base);
  });

  const directSeeds = new Set(
    considered
      .filter(({ product }) => product.id === ctx.matchedProductId)
      .flatMap(({ product }) => [...product.seed_standard_ids, ...getRelationshipsForProduct(product.id).map((r) => r.standard_id)]),
  );

  /* Family tier — other parts of the same IS family as a directly matched one. */
  for (const sid of directSeeds) {
    const std = getStandard(sid);
    if (!std) continue;
    const family = (std.is_number ?? "").toLowerCase().match(/is\s?\d+/)?.[0].replace(/\s+/g, "");
    if (!family) continue;
    for (const other of listStandards()) {
      if (other.id === sid) continue;
      const otherFamily = (other.is_number ?? "").toLowerCase().match(/is\s?\d+/)?.[0].replace(/\s+/g, "");
      if (otherFamily !== family) continue;
      addCandidate(candidates, {
        standardId: other.id,
        base: 50,
        viaProductId: null,
        via: "family",
        relationship: null,
        seedOrder: 0,
      });
    }
  }

  const scored: ScoredResult[] = [];
  for (const cand of candidates.values()) {
    const s = scoreCandidate(cand, understanding, 0);
    if (s) scored.push(s);
  }

  scored.sort((a, b) => b.result.score - a.result.score);

  let results = scored.filter(
    (s) =>
      s.result.match_type === "DIRECT MATCH" ||
      s.result.match_type === "NEEDS CLARIFICATION" ||
      s.result.score >= SCORE_FLOOR,
  );
  results = results.slice(0, MAX_RESULTS);
  results.forEach((s, i) => {
    s.result.rank = i + 1;
  });

  const packet: RetrievalPacket = {
    context: ctx,
    results: results.map((s) => s.result),
    primary: results[0]?.result ?? null,
    clarification: understanding.ambiguity?.questions ?? [],
    empty: results.length === 0,
    official_sources: officialSourcesWithUrl(),
    searched: {
      products_considered: considered.length,
      standards_considered: candidates.size,
      matched: results.length,
    },
    generated_at: new Date().toISOString(),
    language,
  };

  return packet;
}

/**
 * Rebuild a single result from the knowledge base by id — used by the chat
 * transport so the client can never smuggle untrusted evidence to the model.
 */
export function resultById(
  standardId: string,
  language: Language,
  productId?: string | null,
): RetrievalResult | null {
  const std = getStandard(standardId);
  if (!std) return null;

  const product = productId ? getProduct(productId) : null;
  const rel = product
    ? getRelationshipsForProduct(product.id).find((r) => r.standard_id === standardId)
    : undefined;

  const fakeUnderstanding: Understanding = {
    context: {
      product: product?.name ?? std.domain ?? "",
      material: product?.material ?? null,
      intendedUse: product?.application ?? null,
      domain: std.domain,
      matchedProductId: product?.id ?? null,
      matchedProductName: product?.name ?? null,
      language,
      rawQuery: "",
      method: "lexical",
      confidence: "high",
      gaps: [],
    },
    candidates: [],
    ambiguity: null,
    extraction: {
      materials: [],
      applications: [],
      nouns: [],
      appliances: [],
      queryTokens: [],
      normalized: "",
      detectedLanguage: language,
    },
  };

  const cand: Candidate = {
    standardId,
    base: 100,
    viaProductId: product?.id ?? null,
    via: rel ? "relationship" : product?.seed_standard_ids.includes(standardId) ? "seed" : "domain",
    relationship: rel
      ? {
          id: rel.id,
          type: rel.relationship_type ?? "Applicable",
          derivation: rel.derivation,
          original_text: rel.original_text,
          source_notes: rel.source_notes,
        }
      : null,
    seedOrder: 0,
  };

  return scoreCandidate(cand, fakeUnderstanding, 1)?.result ?? null;
}

/** Standards that share a product or an IS family — used by detail pages. */
export function relatedFor(standardId: string): RetrievalResult[] {
  return relatedStandards(standardId, 6)
    .map((s) => resultById(s.id, "en"))
    .filter((r): r is RetrievalResult => Boolean(r));
}
