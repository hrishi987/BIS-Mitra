/**
 * Query understanding — transparent, rule-based extraction.
 *
 * This is deliberately NOT an ML model. The UI says "Product context understood"
 * and shows exactly what was matched, because every extraction here is a
 * dictionary lookup that a reviewer can audit.
 *
 * Multilingual queries are normalized into the same concepts so that one
 * knowledge base serves every language: no per-language data duplication.
 */

import { listProducts } from "./repository";
import type { Language, Product, ProductContext } from "./types";

/* -------------------------------------------------------------------------- */
/* Normalization                                                               */
/* -------------------------------------------------------------------------- */

/** Lowercase, strip punctuation, collapse whitespace. Keeps Indic scripts. */
export function squash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(text: string): string[] {
  const s = squash(text);
  return s ? s.split(" ") : [];
}

const ASCII = /^[\x20-\x7e]+$/;

function phraseIn(hay: string, needle: string): boolean {
  return ` ${hay} `.includes(` ${needle} `);
}

function hasAlias(hay: string, alias: string): boolean {
  const a = squash(alias);
  if (!a) return false;
  if (!ASCII.test(a)) return hay.includes(a);      // Indic scripts: substring
  if (a.includes(" ")) return phraseIn(hay, a);    // multi-word English phrase
  return hay.split(" ").includes(a);               // single English token
}

/** Which script a string is written in — used to label detected language. */
export function detectScript(text: string): Language {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0C80-\u0CBF]/.test(text)) return "kn";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  return "en";
}

/* -------------------------------------------------------------------------- */
/* Concept dictionaries                                                        */
/* -------------------------------------------------------------------------- */

interface Concept {
  id: string;
  label: string;
  aliases: string[];
}

/** Material concepts — matched against the dataset's own Material column. */
const MATERIALS: (Concept & { datasetValue: string; display: string })[] = [
  {
    id: "PVC",
    datasetValue: "PVC",
    display: "PVC",
    label: "PVC",
    aliases: [
      "pvc", "upvc", "u pvc", "pvc u", "unplasticized pvc", "unplasticised pvc",
      "polyvinyl chloride", "unplasticized polyvinyl chloride",
      "पीवीसी", "यूपीवीसी", "पॉलीविनाइल क्लोराइड", "प्लास्टिक पाइप",
      "ಪಿವಿಸಿ", "ಯುಪಿವಿಸಿ", "ಪಾಲಿವಿನೈಲ್ ಕ್ಲೋರೈಡ್",
      "பிவிசி", "ஒய்பிவிசி",
      "పీవీసీ", "యూపీవీసీ",
    ],
  },
  {
    id: "HDPE",
    datasetValue: "HDPE",
    display: "HDPE",
    label: "HDPE / Polyethylene",
    aliases: [
      "hdpe", "high density polyethylene", "high-density polyethylene",
      "polyethylene", "polythene", "pe pipe", "pe 100",
      "हाई डेंसिटी पॉलीइथाइलीन", "पॉलीइथाइलीन", "पॉलिथीन",
      "ಎಚ್‌ಡಿಪಿಇ", "ಪಾಲಿಈಥಿಲೀನ್", "ಪಾಲಿಥೀನ್",
      "పాలిథిలీన్", "హై డెన్సిటీ",
    ],
  },
  {
    id: "GRP",
    datasetValue: "GRP",
    display: "GRP",
    label: "GRP / Fibre-reinforced",
    aliases: [
      "grp", "frp", "glass fibre", "glass-fibre", "glassfibre",
      "glass reinforced plastic", "fibreglass", "fiber glass",
      "ग्लास फाइबर", "फाइबर ग्लास", "काँच का रेशा",
      "ಗ್ಲಾಸ್ ಫೈಬರ್", "ಫೈಬರ್ ಗ್ಲಾಸ್",
      "గ్లాస్ ఫైబర్",
    ],
  },
  {
    id: "PP",
    datasetValue: "Polypropylene",
    display: "Polypropylene",
    label: "Polypropylene",
    aliases: [
      "polypropylene", "pp pipe", "ppr",
      "पॉलीप्रोपिलीन",
      "ಪಾಲಿಪ್ರೊಪಿಲೀನ್",
      "పాలిప్రొపిలీన్",
    ],
  },
];

/** Intended-use concepts — matched against the dataset's Application column. */
const APPLICATIONS: (Concept & { datasetValue: string | null; display: string })[] = [
  {
    id: "POTABLE",
    datasetValue: "Potable/water supply",
    display: "Drinking-water supply",
    label: "Drinking / potable water",
    aliases: [
      "potable", "drinking water", "drinkingwater", "water supply", "water supplies",
      "drinking water supply", "safe drinking water", "pipewater",
      "पीने के पानी", "पीने वाला पानी", "पेयजल", "पानी की आपूर्ति", "जल आपूर्ति",
      "ಕುಡಿಯುವ ನೀರು", "ಕುಡಿಯುವಂತ ನೀರು", "ನೀರಿನ ಪೂರೈಕೆ",
      "குடிநீர்", "குடிநீர் விநியோகம்",
      "తాగునీరు", "మంచినీరు", "నీటి సరఫరా",
    ],
  },
  {
    id: "DRAINAGE",
    datasetValue: "Drainage/sewerage/non-potable",
    display: "Drainage / sewerage / non-potable",
    label: "Drainage, sewerage and waste",
    aliases: [
      "drainage", "sewerage", "soil discharge", "waste water", "wastewater",
      "building waste", "non potable", "nonpotable", "rain water", "rainwater",
      "soil and waste", "effluent",
      "सीवेज", "मल निकास", "गंदा पानी", "जल निकास",
      "ಕಾಗುಣಿತ", "ಕೊಳಚೆ ನೀರು", "ನೀರು ಬಿಡುಗಡೆ",
      "கழிவு", "சாக்கடை",
      "వర్జ్యం", "మురుగు", "వర్జ్య నీరు",
    ],
  },
  {
    id: "GASEOUS",
    datasetValue: "Gaseous fuel supply",
    display: "Gaseous fuel supply",
    label: "Gaseous fuel / gas supply",
    aliases: [
      "gaseous fuel", "gas supply", "natural gas", "piped natural gas", "png",
      "lpg", "cooking gas", "gas line",
      "गैस आपूर्ति", "प्राकृतिक गैस", "एलपीजी",
      "ಅನಿಲ", "ಅನಿಲ ಸರಬರಾಜು", "ಸಹಜ ಅನಿಲ",
      "எரிவாயு", "இயற்கை எரிவாயு",
      "వాయువు", "సహజ వాయువు",
    ],
  },
  {
    id: "HOTCOLD",
    datasetValue: null,
    display: "Hot & cold water supply",
    label: "Hot and cold water",
    aliases: [
      "hot and cold water", "hot and cold", "hot water", "cold water",
      "गर्म और ठंडा पानी", "गर्म पानी",
      "ಬಿಸಿ ಮತ್ತು ತಣ್ಣೀರು", "ಬಿಸಿ ನೀರು",
      "சூடான நீர்",
      "వేడి నీరు", "చల్లని నీరు",
    ],
  }
];

/**
 * Product-noun concepts. `commonNoun` means the word reads oddly on its own, so
 * we render it as "<material> <noun>" (e.g. "PVC pipe").
 */
const PRODUCT_NOUNS: (Concept & { commonNoun: boolean })[] = [
  {
    id: "pipe",
    label: "pipe",
    commonNoun: true,
    aliases: [
      "pipe", "pipes", "piping", "tube", "tubing",
      "पाइप", "पाइपिंग", "नली",
      "ಪೈಪ್", "ಟ್ಯೂಬ್",
      "பைப்",
      "పైపు", "పైపులు",
    ],
  },
  {
    id: "fittings",
    label: "fittings",
    commonNoun: true,
    aliases: [
      "fitting", "fittings", "joint", "joints", "elbow", "bend", "socket",
      "फिटिंग", "जोड़",
      "ಫಿಟ್ಟಿಂಗ್", "ಜೋಡಿ",
      "இணைப்பு",
      "ఫిట్టింగ్",
    ],
  },
  {
    id: "solvent cement",
    label: "solvent cement",
    commonNoun: true,
    aliases: [
      "solvent cement", "adhesive", "glue", "cement for pipe",
      "सॉल्वेंट सीमेंट", "पाइप गोंद",
      "ಸಾಲ್ವೆಂಟ್ ಸಿಮೆಂಟ್", "ಒಟ್ಟು ಸಿಮೆಂಟ್",
      "கரைப்பான் சிமெண்ட்",
      "సాల్వెంట్ సిమెంట్",
    ],
  },
];

/** Appliance concepts — these map onto whole dataset product labels. */
const APPLIANCES: (Concept & { commonNoun: boolean })[] = [
  { id: "electric iron", label: "Electric iron", commonNoun: false, aliases: ["electric iron", "iron", "press iron", "इस्त्री", "लोहा", "ಐರನ್", "இஸ்திரி", "ఇస్త్రి"] },
  { id: "immersion water heater", label: "Immersion water heater", commonNoun: false, aliases: ["immersion water heater", "immersion heater", "immersion rod", "immersion", "गीजर रॉड", "ಇಮ್ಮರ್ಷನ್", "ఇమ్మర్షన్"] },
  { id: "instantaneous water heater", label: "Instantaneous water heater", commonNoun: false, aliases: ["instantaneous water heater", "instantaneous", "geyser", "geyser type", "गीजर", "ಗೀಜರ್", "ஜியூசர்"] },
  { id: "water heater", label: "Water heater", commonNoun: false, aliases: ["water heater", "hot water heater", "गर्म पानी हीटर", "ನೀರು ಹೀಟರ್"] },
  { id: "pressure cooker", label: "Pressure cooker", commonNoun: false, aliases: ["pressure cooker", "cooker", "प्रेशर कुकर", "कुकर", "ಪ್ರೆಶರ್ ಕುಕ್ಕರ್", "குக்கர்", "ప్రెషర్ కుక్కర్"] },
  { id: "gas stove", label: "Gas stove", commonNoun: false, aliases: ["gas stove", "stove", "burner", "चूल्हा", "गैस स्टोव", "ಅನಿಲ ಒಲೆ", "அடுப்பு", "వంట పొయ్యి"] },
  { id: "washing machine", label: "Clothes washing machine", commonNoun: false, aliases: ["washing machine", "washer", "वॉशिंग मशीन", "ಕಲ್ಸಿ ಯಂತ್ರ", "వాషింగ్ మెషీన్"] },
  { id: "room heater", label: "Room heater", commonNoun: false, aliases: ["room heater", "heater", "रूम हीटर", "कमरा हीटर"] },
  { id: "toaster", label: "Toaster / grill", commonNoun: false, aliases: ["toaster", "toast", "grill", "roaster", "टोस्टर", "ಟೋಸ್ಟರ್"] },
  { id: "kitchen machine", label: "Kitchen machine (mixer / blender)", commonNoun: false, aliases: ["kitchen machine", "mixer", "blender", "grinder", "मिक्सर", "मिक्सी", "ಮಿಕ್ಸರ್", "மிக்சர்"] },
  { id: "shaver", label: "Shaver / hair clipper", commonNoun: false, aliases: ["shaver", "razor", "hair clipper", "trimmer", "शेवर", "दाढ़ी बनाने की मशीन"] },
  { id: "tumbler dryer", label: "Tumbler dryer", commonNoun: false, aliases: ["tumbler dryer", "dryer", "सुखाने वाली मशीन"] },
  { id: "warming plate", label: "Warming plate", commonNoun: false, aliases: ["warming plate", "hot plate"] },
  { id: "frying pan", label: "Frying pan / deep fat fryer", commonNoun: false, aliases: ["frying pan", "deep fat fryer", "fryer", "kadhai"] },
  { id: "oven", label: "Oven / cooking range / hob", commonNoun: false, aliases: ["oven", "cooking range", "hob", "microwave", "चूल्हा रेंज"] },
  { id: "spin extractor", label: "Spin extractor", commonNoun: false, aliases: ["spin extractor", "extractor"] },
  { id: "vacuum cleaner", label: "Vacuum cleaner", commonNoun: false, aliases: ["vacuum cleaner", "suction cleaner", "वैक्यूम क्लीनर"] },
];

/* -------------------------------------------------------------------------- */
/* Extraction                                                                  */
/* -------------------------------------------------------------------------- */

export interface Extraction {
  materials: (typeof MATERIALS)[number][];
  applications: (typeof APPLICATIONS)[number][];
  nouns: (typeof PRODUCT_NOUNS)[number][];
  appliances: (typeof APPLIANCES)[number][];
  queryTokens: string[];
  normalized: string;
  detectedLanguage: Language;
}

export function extract(raw: string): Extraction {
  const normalized = squash(raw);
  const qt = tokens(raw);

  const pick = <T extends Concept>(list: T[]): T[] =>
    list.filter((c) => c.aliases.some((a) => hasAlias(normalized, a)));

  return {
    materials: pick(MATERIALS),
    applications: pick(APPLICATIONS),
    nouns: pick(PRODUCT_NOUNS),
    appliances: pick(APPLIANCES),
    queryTokens: qt,
    normalized,
    detectedLanguage: detectScript(raw),
  };
}

/* -------------------------------------------------------------------------- */
/* Matching the extraction to dataset products                                 */
/* -------------------------------------------------------------------------- */

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const set = new Set(a);
  let hit = 0;
  for (const t of b) if (set.has(t)) hit += 1;
  return hit;
}

const STOP = new Set([
  "i", "am", "is", "are", "the", "a", "an", "for", "of", "to", "in", "on", "and",
  "manufacture", "manufacturing", "make", "making", "produce", "producing", "we",
  "my", "our", "company", "business", "need", "want", "which", "what", "that",
  "with", "using", "use", "used", "supply", "supplies", "system", "systems",
  "please", "find", "show", "me", "bis", "standard",
  "standards", "certification", "apply", "application",
]);

interface Scored {
  product: Product;
  score: number;
  nameHit: number;
}

function scoreProducts(ext: Extraction): Scored[] {
  const queryTerms = [...ext.queryTokens.filter((t) => !STOP.has(t) && t.length > 2)];
  for (const c of ext.appliances) queryTerms.push(...squash(c.id).split(" "));
  for (const c of ext.nouns) queryTerms.push(...squash(c.id).split(" "));

  const results: Scored[] = [];

  for (const product of listProducts()) {
    const nameTokens = tokens(product.name);
    const nameHit = overlap(nameTokens, queryTerms);
    let score = 0;

    // Direct label overlap is the strongest non-explicit signal.
    const normName = squash(product.name);
    if (normName === ext.normalized) score += 60;
    else if (ext.normalized.includes(normName)) score += 45;
    score += nameHit * 7;

    // Whole-appliance concept maps straight onto a product label.
    for (const a of ext.appliances) {
      if (squash(product.name).includes(squash(a.id))) score += 40;
    }

    // Attribute agreement / disagreement.
    if (ext.materials.length) {
      if (product.material && ext.materials.some((m) => m.datasetValue === product.material)) score += 22;
      else if (product.material) score -= 26;
    }
    if (ext.applications.length) {
      if (product.application && ext.applications.some((a) => a.datasetValue === product.application)) score += 22;
      else if (product.application) score -= 24;
    } else if (product.application) {
      // Not penalised: the user simply did not state a use.
    }

    // Product noun agreement.
    for (const n of ext.nouns) {
      const nounTokens = squash(n.id).split(" ");
      if (nounTokens.every((t) => nameTokens.includes(t))) score += 12;
    }

    if (score > 0) results.push({ product, score, nameHit });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/* -------------------------------------------------------------------------- */
/* Ambiguity detection                                                         */
/* -------------------------------------------------------------------------- */

interface Ambiguity {
  questions: string[];
  reason: string;
}

function detectAmbiguity(ext: Extraction, scored: Scored[]): Ambiguity | null {
  if (!scored.length) return null;
  const top = scored.slice(0, 4);
  const best = top[0].score;
  const close = top.filter((s) => s.score >= best - 14);
  const questions: string[] = [];

  if (!ext.applications.length) {
    const uses = new Set(
      close.map((s) => s.product.application).filter((v): v is string => Boolean(v)),
    );
    if (uses.size > 1) {
      questions.push("Which application is it for — drinking-water supply, or drainage / sewerage?");
    }
  }

  if (!ext.materials.length) {
    const mats = new Set(
      close.map((s) => s.product.material).filter((v): v is string => Boolean(v)),
    );
    if (mats.size > 1) {
      questions.push("Which material is it — PVC, HDPE, GRP or polypropylene?");
    }
  }

  if (!ext.materials.length && !ext.applications.length) {
    if (top.length > 1 && best - top[1].score < 12) {
      questions.push("What is the product, and what is it used for?");
    }
  }

  if (!questions.length) return null;
  return {
    questions: [...new Set(questions)],
    reason:
      "More than one product in the knowledge base fits the wording of this query equally well.",
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface Understanding {
  context: ProductContext;
  candidates: { product: Product; score: number }[];
  ambiguity: Ambiguity | null;
  extraction: Extraction;
}

export function understand(raw: string, language: Language): Understanding {
  const ext = extract(raw);
  const scored = scoreProducts(ext);
  const ambiguity = detectAmbiguity(ext, scored);
  const best = scored[0];

  const gaps: string[] = [];
  if (!ext.materials.length) gaps.push("material not stated in the query");
  if (!ext.applications.length) gaps.push("intended use not stated in the query");
  if (!scored.length) gaps.push("no product in the knowledge base matched this wording");

  const material = ext.materials.length ? ext.materials[0].datasetValue : (best?.product.material ?? null);
  const materialDisplay = ext.materials.length
    ? ext.materials[0].display
    : (best?.product.material ?? null);

  const upvcMentioned = /\b(upvc|u pvc|pvc u|u-pvc|pvc-u)\b/i.test(ext.normalized);
  const materialLabel = materialDisplay
    ? upvcMentioned && materialDisplay === "PVC"
      ? "PVC / UPVC"
      : materialDisplay
    : null;

  const application = ext.applications.length ? ext.applications[0] : null;

  const noun = ext.nouns[0] ?? null;
  const appliance = ext.appliances[0] ?? null;

  let productLabel: string;
  if (appliance) productLabel = appliance.label;
  else if (noun && materialLabel) productLabel = `${materialLabel} ${noun.label}`;
  else if (noun) productLabel = noun.label.replace(/^./, (c) => c.toUpperCase());
  else if (best) productLabel = best.product.name;
  else productLabel = ext.normalized || "Unspecified product";

  const confidence: ProductContext["confidence"] = ambiguity
    ? "low"
    : scored.length && ext.materials.length && ext.applications.length
      ? "high"
      : scored.length && (ext.materials.length || ext.applications.length || appliance)
        ? "medium"
        : "low";

  const context: ProductContext = {
    product: productLabel,
    material: materialLabel,
    intendedUse: application ? application.display : null,
    domain: best ? (best.product.domain ?? null) : null,
    matchedProductId: best && !ambiguity ? best.product.id : null,
    matchedProductName: best && !ambiguity ? best.product.name : null,
    language,
    rawQuery: raw,
    method: "lexical",
    confidence,
    gaps,
  };

  if (context.domain) context.domain = context.domain.replace(/\//g, " / ");

  return {
    context,
    candidates: scored.slice(0, 5).map((s) => ({ product: s.product, score: s.score })),
    ambiguity,
    extraction: ext,
  };
}
