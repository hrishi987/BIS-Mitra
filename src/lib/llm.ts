/**
 * LLM layer — explanation and navigation, never a source of truth.
 *
 * The model only ever receives evidence that this application retrieved from
 * the knowledge layer. When the API key is missing, slow or broken, a
 * deterministic composer answers from the same evidence so the demo never dies.
 */

import {
  compactResult,
  getConsumerRecord,
  getKb,
  listSources,
  officialSourcesWithUrl,
  toSourceSummary,
} from "./repository";
import { retrieve, resultById } from "./retrieval";
import { squash } from "./understand";
import { t, type PhraseKey } from "./i18n";
import type {
  ChatIntent,
  ChatRequest,
  ChatResponse,
  ConsumerLookup,
  Language,
  RetrievalPacket,
  RetrievalResult,
} from "./types";
import { lookupConsumer } from "./consumer";

export const SYSTEM_PROMPT = `You are BIS Mitra, an assistant for navigating Indian Standards and BIS information.

You are an explanation and navigation layer, not the source of truth.

Use only the structured information and evidence supplied to you by the application.

Do not invent:
- Indian Standards
- IS numbers
- certification requirements
- licence numbers
- clauses
- pages
- manufacturers
- official statuses
- source URLs.

If the retrieved information is insufficient, explicitly say that the available evidence is insufficient.

When explaining a result, distinguish between:
- directly supported information
- related information
- inference
- missing information.

Never claim that an AI response is an official BIS decision.

When appropriate, direct the user to the official BIS source or service.`;

/* -------------------------------------------------------------------------- */
/* Grounding                                                                   */
/* -------------------------------------------------------------------------- */

interface Grounding {
  productContext: unknown;
  results: unknown[];
  consumer: unknown;
  language: Language;
}

function buildGrounding(req: ChatRequest, packet: RetrievalPacket | null): Grounding {
  const ids = req.standardIds ?? [];
  const results = ids
    .map((id) => resultById(id, req.language, req.productId ?? null))
    .filter((r): r is RetrievalResult => Boolean(r));

  let consumer: unknown = null;
  if (req.consumerRecordId) {
    const rec = getConsumerRecord(req.consumerRecordId);
    if (rec) {
      const lookup = lookupConsumer(rec.identifier ?? "", req.language);
      consumer = consumerSummary(lookup);
    }
  }

  return {
    productContext: packet?.context ?? null,
    results: results.map(compactResult),
    consumer,
    language: req.language,
  };
}

function consumerSummary(lookup: ConsumerLookup) {
  const r = lookup.record;
  if (!r) return { found: false, note: lookup.note };
  return {
    found: true,
    demo: r.demo,
    identifier: r.identifier,
    identifier_type: r.identifier_type,
    product: r.product,
    manufacturer: r.manufacturer,
    associated_is_number: r.associated_is_number,
    certification_context: r.certification_context,
    status: r.status,
    authority_level: r.authority_level,
    verification_status: r.verification_status,
    notes: r.notes,
    source: lookup.source,
    associated_standard: lookup.standard
      ? { is_number: lookup.standard.is_number, title: lookup.standard.title }
      : null,
    cross_checks: lookup.crossChecks,
  };
}

/* -------------------------------------------------------------------------- */
/* Abstention                                                                  */
/* -------------------------------------------------------------------------- */

const ABSTAIN_EN = [
  "penalty", "penalties", "punishment", "jail", "imprisonment", "fine", "fined",
  "clause", "clauses", "page", "pages", "price", "cost", "fee", "fees", "charge",
  "charges", "salary", "discount", "tax", "gst", "duty", "customs", "court",
  "lawsuit", "sue", "compensation", "damages", "counterfeit", "fake", "genuine",
  "expiry", "expire", "validity", "deadline", "address", "phone", "contact",
  "email", "manufacturer of", "licence number", "license number", "certificate number",
  "hallucinate", "guarantee", "guaranteed", "best before", "shelf life",
];

const ABSTAIN_HI = [
  "दंड", "जुर्माना", "सजा", "धारा", "क्लॉज़", "क्लॉज", "पेज", "कीमत", "मूल्य",
  "शुल्क", "फीस", "अदालत", "नकली", "असली", "गारंटी", "मियाद", "समाप्ति",
];

const ABSTAIN_KN = [
  "ದಂಡ", "ಜರಿಮಾನೆ", "ಶಿಕ್ಷೆ", "ಸೆಕ್ಷನ್", "ಕ್ಲಾಸ್", "ಬೆಲೆ", "ಶುಲ್ಕ", "ನ್ಯಾಯಾಲಯ",
  "ನಕಲಿ", "ಅಸಲಿ", "ಖಾತರಿ", "ಮುಗಿಯುವಿಕೆ",
];

const ABSTAIN_TA = ["அபராதம்", "தண்டனை", "விலை", "கட்டணம்", "நீதிமன்றம்", "போலி", "உத்தரவாதம்"];
const ABSTAIN_TE = ["జరిమానా", "శిక్ష", "ధర", "రుసుము", "కోర్టు", "నకిలీ", "హామీ"];

const ABSTAIN_TERMS: Record<Language, string[]> = {
  en: ABSTAIN_EN,
  hi: ABSTAIN_HI,
  kn: ABSTAIN_KN,
  ta: ABSTAIN_TA,
  te: ABSTAIN_TE,
};

function hitsTerm(message: string, term: string): boolean {
  const isAscii = /^[\x20-\x7e]+$/.test(term);
  if (!isAscii) return message.includes(term);
  const tokens = message.split(" ");
  if (term.includes(" ")) return ` ${message} `.includes(` ${term} `);
  return tokens.includes(term);
}

export function abstainTrigger(message: string): string | null {
  const msg = squash(message);
  for (const terms of Object.values(ABSTAIN_TERMS)) {
    for (const term of terms) {
      if (hitsTerm(msg, squash(term))) return term;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Intent                                                                      */
/* -------------------------------------------------------------------------- */

const INTENT_TERMS: Record<Exclude<ChatIntent, "retrieval">, string[]> = {
  coverage: ["cover", "covers", "covering", "scope", "about", "describe", "specifies", "कवर", "व्याप्ति", "ಒಳಗೊಳ್ಳು", "ವ್ಯಾಪ್ತಿ"],
  related: ["related", "similar", "other standard", "other standards", "alternatives", "संबंधित", "अन्य मानक", "ಸಂಬಂಧಿತ", "ಇತರ ಮಾನದಂಡ"],
  why: ["why", "reason", "rationale", "क्यों", "कारण", "ಏಕೆ", "ಕಾರಣ"],
  verify: ["verify", "verification", "before applying", "certification", "certified", "licence", "license", "apply for", "testing", "जांच", "प्रमाणन", "प्रमाणपत्र", "परिशीलन", "परीक्षण", "ಪರಿಶೀಲನೆ", "ಪ್ರಮಾಣೀಕರಣ", "ಪರೀಕ್ಷೆ"],
  meaning: ["what does this mean", "what does that mean", "what does this record", "what does the record", "mean", "meaning", "explain", "interpret", "अर्थ", "समझाइए", "रिकॉर्ड", "दर्शाता", "ವಿವರಿಸಿ", "ಅರ್ಥ", "ದಾಖಲೆ"],
  next_steps: ["next step", "next steps", "what should i do", "what do i do", "how do i proceed", "अगला कदम", "क्या करूं", "ಮುಂದಿನ ಹಂತ"],
  general: [],
};

function detectIntent(message: string): ChatIntent {
  const msg = squash(message);
  let best: { intent: ChatIntent; score: number } = { intent: "general", score: 0 };

  for (const [intent, terms] of Object.entries(INTENT_TERMS) as [
    Exclude<ChatIntent, "retrieval">,
    string[],
  ][]) {
    let score = 0;
    for (const term of terms) if (hitsTerm(msg, squash(term))) score += 1;
    if (score > best.score) best = { intent, score };
  }
  return best.intent;
}

/* -------------------------------------------------------------------------- */
/* Official fallback destinations                                              */
/* -------------------------------------------------------------------------- */

function officialHint(kind: "standard" | "consumer"): { label: string; url: string } | null {
  const official = listSources().filter((s) => s.category === "Official BIS" && s.url);
  const preferred =
    kind === "consumer"
      ? official.find((s) => /care|apps|manak/i.test(`${s.name} ${s.what_it_gives}`))
      : official.find((s) => /know your standard/i.test(s.name ?? ""));
  const chosen = preferred ?? official[0];
  return chosen && chosen.url ? { label: chosen.name ?? "Official BIS source", url: chosen.url } : null;
}

/* -------------------------------------------------------------------------- */
/* Deterministic answer composer                                               */
/* -------------------------------------------------------------------------- */

function fmt(x: string | null | undefined, fallback = "—"): string {
  return x && String(x).trim() ? String(x) : fallback;
}

function sourceLine(r: RetrievalResult): string {
  if (r.source?.url) return `${r.source.name} — ${r.source.url}`;
  if (r.source?.name) return `${r.source.name} (no URL recorded in the dataset)`;
  return "Source metadata not available in the current prototype dataset.";
}

function evidenceBlock(r: RetrievalResult): string[] {
  if (!r.evidence.length) {
    return ["Evidence: no evidence record is attached to this standard in the prototype dataset."];
  }
  return r.evidence.map(
    (e) =>
      `Evidence ${e.evidence_id}: ${fmt(e.text, "no text recorded")}` +
      (e.limitation ? `\n  Limitation: ${e.limitation}` : "") +
      `\n  Source: ${
        e.source?.url ? `${e.source.name} — ${e.source.url}` : e.source?.name ?? "not available"
      }`,
  );
}

function answerCoverage(r: RetrievalResult, lang: Language): string {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  return [
    `${fmt(r.is_number)} — ${fmt(r.title)}`,
    "",
    p("a.datasetRecords"),
    `• ${p("a.domain")}: ${fmt(r.domain)}`,
    `• ${p("a.stdType")}: ${fmt(r.standard_type)}`,
    `• ${p("a.recordNote")}: ${fmt(r.notes)}`,
    r.iec_reference ? `• ${p("a.iecRef")}: ${r.iec_reference}` : "",
    r.amendments_count !== null ? `• ${p("a.amendments")}: ${r.amendments_count}` : "",
    "",
    ...evidenceBlock(r),
    "",
    `${p("a.source")}: ${sourceLine(r)}`,
    `${p("a.verification")}: ${fmt(r.verification_status)}`,
    "",
    p("a.notTheText"),
  ]
    .filter(Boolean)
    .join("\n");
}

function answerRelated(packet: RetrievalPacket, lang: Language): string {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  const primaryId = packet.primary?.standard_id;
  const others = primaryId
    ? packet.results.filter((r) => r.standard_id !== primaryId)
    : packet.results;
  if (!others.length) return p("a.noRelated");
  return [
    p("a.relatedTo", [packet.context.product]),
    "",
    ...others.map(
      (r) =>
        `• ${fmt(r.is_number)} — ${fmt(r.title)}\n  ${p("a.classification")}: ${r.match_type}${
          r.contrast ? `\n  ${r.contrast}` : ""
        }`,
    ),
    "",
    p("a.relatedNote"),
  ].join("\n");
}

function answerWhy(r: RetrievalResult, lang: Language): string {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  return [
    p("a.whyThis", [fmt(r.is_number)]),
    "",
    ...r.match_reason.map((m) => `✓ ${m}`),
    "",
    `${p("a.classification")}: ${r.match_type}`,
    r.relationship
      ? `${p("a.relationship")}: ${r.relationship.type}${
          r.relationship.id ? ` (${r.relationship.id})` : ""
        }${r.relationship.original_text ? ` — ${r.relationship.original_text}` : ""}`
      : "",
    r.contrast ? `${p("a.contrast")}: ${r.contrast}` : "",
    "",
    ...evidenceBlock(r),
    "",
    `${p("a.source")}: ${sourceLine(r)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function answerVerify(r: RetrievalResult, lang: Language): string | null {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  const info = r.certification;
  const has =
    info?.certification || info?.qco || (info?.testing && info.testing.length > 0);
  if (!has) return null;

  const lines: string[] = [p("a.verifyFor", [fmt(r.is_number)])];
  if (info?.qco) {
    lines.push("", `• ${p("a.qco")}: ${fmt(info.qco.QCO_or_Certification_Status_Raw)}`);
    if (info.qco.Key_Dates_Raw) lines.push(`  ${p("a.keyDates")}: ${info.qco.Key_Dates_Raw}`);
    if (info.qco.Source_Raw) lines.push(`  ${p("a.source")}: ${info.qco.Source_Raw}`);
    if (info.qco.Verification_Note) lines.push(`  ${p("a.verification")}: ${info.qco.Verification_Note}`);
  }
  if (info?.certification) {
    lines.push("", `• ${p("a.certification")}: ${fmt(info.certification.Certification_Relevance)}`);
    if (info.certification.Note) lines.push(`  ${info.certification.Note}`);
    if (info.certification.Scheme_Name) lines.push(`  ${p("a.scheme")}: ${info.certification.Scheme_Name}`);
  }
  if (info?.testing?.length) {
    lines.push("", `• ${p("a.testing")}:`);
    for (const test of info.testing) {
      lines.push(`  — ${fmt(test.Source_Note_Raw)}${test.Verification_Note ? ` (${test.Verification_Note})` : ""}`);
    }
  }
  lines.push("", p("a.verifyCaveat"));
  return lines.join("\n");
}

function answerMeaning(lookup: ConsumerLookup, lang: Language): string | null {
  const r = lookup.record;
  if (!r) return null;
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  return [
    p("a.recordMeaning"),
    "",
    `• ${p("a.identifier")}: ${fmt(r.identifier)} (${fmt(r.identifier_type)})`,
    `• ${p("a.product")}: ${fmt(r.product)}`,
    `• ${p("a.manufacturer")}: ${fmt(r.manufacturer)}`,
    `• ${p("a.associatedIs")}: ${fmt(r.associated_is_number)}`,
    `• ${p("a.status")}: ${fmt(r.status)}`,
    `• ${p("a.certContext")}: ${fmt(r.certification_context)}`,
    "",
    p("a.canVerify"),
    `— ${p("a.can1")}`,
    `— ${p("a.can2")}`,
    `— ${p("a.can3")}`,
    "",
    p("a.cannotVerify"),
    `— ${p("a.cannot1")}`,
    `— ${p("a.cannot2")}`,
    `— ${p("a.cannot3")}`,
    "",
    r.demo ? p("a.demoNotice") : "",
    p("a.notCertified"),
  ]
    .filter(Boolean)
    .join("\n");
}

function answerGeneral(packet: RetrievalPacket | null, lookup: ConsumerLookup | null, lang: Language): string {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  if (lookup?.record) return answerMeaning(lookup, lang) ?? p("a.insufficient");
  const r = packet?.primary;
  if (!r) return p("a.insufficient");
  return [
    p("a.summaryFor", [fmt(r.is_number)]),
    "",
    `• ${p("a.title")}: ${fmt(r.title)}`,
    `• ${p("a.domain")}: ${fmt(r.domain)}`,
    `• ${p("a.classification")}: ${r.match_type}`,
    `• ${p("a.why")}: ${r.match_reason[0] ?? "—"}`,
    "",
    ...evidenceBlock(r),
    "",
    `${p("a.source")}: ${sourceLine(r)}`,
    `${p("a.missing")}: ${p("a.missingNote")}`,
  ].join("\n");
}

function abstentionReply(lang: Language, trigger: string | null): string {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  return [
    p("a.insufficient"),
    "",
    p("a.insufficientBody"),
    trigger ? `${p("a.triggeredOn")}: “${trigger}”` : "",
    "",
    p("a.willNotGuess"),
  ]
    .filter(Boolean)
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/* Gemini                                                                      */
/* -------------------------------------------------------------------------- */

function groundingJson(g: Grounding): string {
  return JSON.stringify(g, null, 1);
}

async function callGemini(prompt: string, system: string, lang: Language): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.LLM_TIMEOUT_MS ?? 12000));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

function buildPacket(
  results: RetrievalResult[],
  primary: RetrievalResult | null,
  req: ChatRequest,
  lang: Language,
): RetrievalPacket | null {
  if (!results.length && !primary) return null;
  const ordered = results.map((r, i) => ({ ...r, rank: i + 1 }));
  return {
    context: {
      product: req.productName ?? "",
      material: req.productMaterial ?? null,
      intendedUse: req.productUse ?? null,
      domain: null,
      matchedProductId: req.productId ?? null,
      matchedProductName: req.productName ?? null,
      language: lang,
      rawQuery: "",
      method: "lexical",
      confidence: "medium",
      gaps: [],
    },
    results: ordered,
    primary: primary ? { ...primary, rank: ordered.find((r) => r.standard_id === primary.standard_id)?.rank ?? 0 } : null,
    clarification: [],
    empty: ordered.length === 0,
    official_sources: officialSourcesWithUrl(),
    searched: { products_considered: 0, standards_considered: 0, matched: ordered.length },
    generated_at: new Date().toISOString(),
    language: lang,
  };
}

export async function answer(req: ChatRequest): Promise<ChatResponse> {
  const lang = req.language;
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);

  const lastUser = [...req.messages].reverse().find((m) => m.role === "user");
  const message = lastUser?.content ?? "";

  /* Re-derivation from ids the client holds — never from client-supplied text. */
  const results = (req.standardIds ?? [])
    .map((id) => resultById(id, lang, req.productId ?? null))
    .filter((r): r is RetrievalResult => Boolean(r));
  const primary = req.primaryStandardId
    ? resultById(req.primaryStandardId, lang, req.productId ?? null)
    : results[0] ?? null;

  const groundingResults =
    primary && !results.some((r) => r.standard_id === primary.standard_id)
      ? [primary, ...results]
      : results;

  const currentPacket = buildPacket(groundingResults, primary, req, lang);

  const consumerLookup = req.consumerRecordId
    ? (() => {
        const rec = getConsumerRecord(req.consumerRecordId);
        return rec ? lookupConsumer(rec.identifier ?? "", lang) : null;
      })()
    : null;

  const hasGrounding = groundingResults.length > 0 || Boolean(consumerLookup?.record);

  /* ---- 1. deterministic abstention ------------------------------------- */
  const trigger = abstainTrigger(message);
  if (trigger) {
    return {
      reply: abstentionReply(lang, trigger),
      intent: detectIntent(message),
      abstained: true,
      mode: "fallback",
      officialHint: officialHint(consumerLookup?.record ? "consumer" : "standard"),
      usedIds: groundingResults.map((r) => r.standard_id),
    };
  }

  if (!hasGrounding) {
    return {
      reply: abstentionReply(lang, null),
      intent: "general",
      abstained: true,
      mode: "fallback",
      officialHint: officialHint("standard"),
      usedIds: [],
    };
  }

  const intent = detectIntent(message);

  /* ---- 2. did the user switch product mid-conversation? ----------------- */
  const probe = retrieve(message, lang);
  const switched = Boolean(
    probe.context.matchedProductId &&
      probe.context.matchedProductId !== (req.productId ?? null) &&
      probe.primary?.match_type === "DIRECT MATCH" &&
      probe.context.confidence !== "low",
  );

  if (switched && probe.primary) {
    const fresh = await respond(probe, null, "retrieval", lang, message, probe);
    return { ...fresh, packet: probe };
  }

  /* ---- 3. a verify question is abstained on unless the dataset supports it */
  if (intent === "verify") {
    const supported = primary ? answerVerify(primary, lang) : null;
    if (!supported) {
      return {
        reply: abstentionReply(lang, p("a.verifyTopic")),
        intent,
        abstained: true,
        mode: "fallback",
        officialHint: officialHint("standard"),
        usedIds: groundingResults.map((r) => r.standard_id),
      };
    }
  }

  /* ---- 4. LLM when available, deterministic otherwise ------------------- */
  return respond(currentPacket, consumerLookup, intent, lang, message, currentPacket);
}

async function respond(
  packet: RetrievalPacket | null,
  consumerLookup: ConsumerLookup | null,
  intent: ChatIntent,
  lang: Language,
  message: string,
  groundingPacket: RetrievalPacket | null,
): Promise<ChatResponse> {
  const p = (k: PhraseKey, params: string[] = []) => t(k, lang, params);
  const usedIds = (packet?.results ?? groundingPacket?.results ?? []).map((r) => r.standard_id);

  const system = [
    SYSTEM_PROMPT,
    "",
    `Respond in the user's language: ${lang}.`,
    lang === "en"
      ? ""
      : `Keep Indian Standard numbers, titles, IDs and source names exactly as supplied; translate the surrounding explanation.`,
    "",
    "STRUCTURED EVIDENCE SUPPLIED BY THE APPLICATION (this is the only evidence you may use):",
    groundingJson({
      productContext: groundingPacket?.context ?? packet?.context ?? null,
      results: (packet?.results ?? groundingPacket?.results ?? []).map(compactResult),
      consumer: consumerLookup ? consumerSummary(consumerLookup) : null,
      language: lang,
    }),
    "",
    "If this evidence does not support an answer, say plainly that the available evidence is insufficient and stop.",
  ]
    .filter((x) => x !== "")
    .join("\n");

  const prompt = message;

  const llmText = await callGemini(prompt, system, lang);
  if (llmText) {
    return { reply: llmText, intent, abstained: false, mode: "llm", officialHint: null, usedIds };
  }

  /* Deterministic fallback — still grounded, still honest. */
  const primary = packet?.primary ?? groundingPacket?.primary ?? null;
  let reply: string;
  let abstained = false;

  const pk = packet ?? groundingPacket;

  switch (intent) {
    case "coverage":
      reply = primary ? answerCoverage(primary, lang) : p("a.insufficient");
      abstained = !primary;
      break;
    case "related":
      reply = pk ? answerRelated(pk, lang) : p("a.insufficient");
      abstained = !pk;
      break;
    case "why":
      reply = primary ? answerWhy(primary, lang) : p("a.insufficient");
      abstained = !primary;
      break;
    case "meaning":
      /* Consumer record on screen → explain the record. Otherwise, if we have
         retrieved results, explain what the match means from those. Abstain
         only when there is nothing grounded to explain. */
      if (consumerLookup?.record) {
        reply = answerMeaning(consumerLookup, lang) ?? p("a.insufficient");
        abstained = false;
      } else if (pk?.primary) {
        reply = answerGeneral(pk, null, lang);
        abstained = false;
      } else {
        reply = p("a.insufficient");
        abstained = true;
      }
      break;
    case "verify": {
      const v = primary ? answerVerify(primary, lang) : null;
      reply = v ?? p("a.insufficient");
      abstained = !v;
      break;
    }
    case "retrieval":
      reply = pk?.primary
        ? [t("a.retrievalIntro", lang), "", answerWhy(pk.primary, lang), "", answerRelated(pk, lang)].join("\n")
        : p("a.insufficient");
      abstained = !pk?.primary;
      break;
    case "next_steps":
      reply = [p("a.nextSteps"), "", p("a.nextStepsBody")].join("\n");
      break;
    default:
      reply = answerGeneral(pk, consumerLookup, lang);
  }

  return {
    reply,
    intent,
    abstained,
    mode: "fallback",
    officialHint: abstained ? officialHint(consumerLookup?.record ? "consumer" : "standard") : null,
    usedIds,
  };
}

/** Which sources the knowledge layer itself points at for "check officially". */
export function officialSources() {
  return listSources()
    .filter((s) => s.category === "Official BIS" && s.url)
    .map(toSourceSummary)
    .filter(Boolean);
}

export function datasetTrustPolicy(): string {
  return getKb().meta.trust_policy;
}
