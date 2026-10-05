/**
 * BIS Mitra — normalized schema.
 *
 * These types describe the application's internal knowledge layer. The UI and
 * the LLM only ever see these shapes, never raw Excel columns, so the storage
 * backend (Excel today, PostgreSQL + pgvector later) can change without any
 * UI work.
 */

export type Language = "en" | "hi" | "kn" | "ta" | "te";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

/* -------------------------------------------------------------------------- */
/* Knowledge layer (from data/knowledge.json)                                  */
/* -------------------------------------------------------------------------- */

export interface KbMeta {
  name: string;
  tagline: string;
  generated_at: string;
  workbooks: string[];
  trust_policy: string;
  stats: KbStats;
}

export interface KbStats {
  standards: number;
  products: number;
  product_categories: number;
  domains: number;
  domain_list: string[];
  relationships: number;
  rules: number;
  sources: number;
  evidence: number;
  consumer_records: number;
  consumer_demo_records: number;
  qcos: number;
  certifications: number;
  testing_requirements: number;
  evaluation_cases: number;
  reference_standards: number;
}

export interface Standard {
  id: string;
  domain: string | null;
  is_number: string | null;
  iec_reference: string | null;
  title: string | null;
  standard_type: string | null;
  status: string | null;
  revision_or_year: string | null;
  amendments_count: number | null;
  notes: string | null;
  source_id: string | null;
  source_url: string | null;
  data_basis: string | null;
  verification_status: string | null;
  workbook: string;
  sheet: string;
}

export interface Product {
  id: string;
  domain: string | null;
  name: string;
  subcategory: string | null;
  material: string | null;
  application: string | null;
  source_notes: string | null;
  derivation_note: string | null;
  applicable_standards_text: string | null;
  seed_notes: string | null;
  seed_sheet: string | null;
  seed_standard_ids: string[];
  seed_unresolved_refs: string[];
  workbook: string;
  sheet: string;
}

export interface Relationship {
  id: string;
  product_id: string;
  standard_id: string;
  relationship_type: string | null;
  original_text: string | null;
  source_notes: string | null;
  derivation: string | null;
  evidence_id: string | null;
  workbook: string;
  sheet: string;
}

export interface ApplicabilityRule {
  id: string;
  product_id: string;
  standard_id: string | null;
  field: string | null;
  operator: string | null;
  value: string | null;
  derivation: string | null;
  validation_note: string | null;
  evidence_id: string | null;
  workbook: string;
  sheet: string;
}

export type SourceCategory = "Official BIS" | "Reference" | "Seed / Prototype" | "Demo";

export interface Source {
  id: string;
  name: string | null;
  url: string | null;
  status: string | null;
  verification_status: string | null;
  what_it_gives: string | null;
  raw_text: string | null;
  category: SourceCategory;
  authority: string;
  workbook: string;
  sheet: string;
}

export interface Evidence {
  id: string;
  standard_id: string | null;
  source_id: string | null;
  section: string | null;
  clause: string | null;
  page: string | null;
  text: string | null;
  limitation: string | null;
  workbook: string;
  sheet: string;
}

export interface Qco {
  QCO_ID: string | null;
  Category: string | null;
  QCO_or_Certification_Status_Raw: string | null;
  Key_Dates_Raw: string | null;
  Source_ID: string | null;
  Source_Raw: string | null;
  Verification_Note: string | null;
}

export interface Certification {
  Certification_ID: string | null;
  Standard_ID: string | null;
  Scheme_Name: string | null;
  Certification_Relevance: string | null;
  Source_ID: string | null;
  Note: string | null;
}

export interface TestingRequirement {
  Test_ID: string | null;
  Standard_ID: string | null;
  Test_or_Testing_Context: string | null;
  Source_Note_Raw: string | null;
  Source_ID: string | null;
  Verification_Note: string | null;
}

export interface Amendment {
  Amendment_Record_ID: string | null;
  Standard_ID: string | null;
  Amendments_Count: number | null;
  Basis: string | null;
  Amendment_Number_or_Date: string | null;
  Note: string | null;
}

export interface EvaluationCase {
  Case_ID: string | null;
  Domain: string | null;
  Input_Product_or_Query: string | null;
  Expected_or_Source_Mapped_Result: string | null;
  Why_This_Case_Matters: string | null;
  Basis: string | null;
}

export interface ConsumerRecord {
  id: string;
  identifier_type: string | null;
  identifier: string | null;
  product: string | null;
  manufacturer: string | null;
  associated_is_number: string | null;
  standard_id: string | null;
  certification_context: string | null;
  status: string | null;
  source_id: string | null;
  source_url: string | null;
  authority_level: string | null;
  verification_status: string | null;
  last_checked: string | null;
  demo: boolean;
  notes: string | null;
  workbook: string;
  sheet: string;
}

export interface ConsumerEvaluationCase {
  Case_ID: string | null;
  Input_Type: string | null;
  User_Input: string | null;
  Expected_Behavior: string | null;
  Why_Test_Matters: string | null;
  Source_Basis: string | null;
  Demo_or_Live: string | null;
}

export interface ReferenceStandard {
  sl_no: number | null;
  is_number: string;
  title: string | null;
  aspect: string | null;
  equivalence: string | null;
  published: string | null;
  action: string | null;
}

export interface SourceLink {
  source: string | null;
  url: string | null;
  what_it_gives: string | null;
}

export interface QaRow {
  QA_ID: string | null;
  Check: string | null;
  Status: string | null;
  Explanation: string | null;
}

export interface DictionaryRow {
  field: string | null;
  meaning: string | null;
  treatment: string | null;
}

export interface KnowledgeBase {
  meta: KbMeta;
  standards: Standard[];
  products: Product[];
  relationships: Relationship[];
  rules: ApplicabilityRule[];
  sources: Source[];
  evidence: Evidence[];
  qcos: Qco[];
  qco_notes: unknown[];
  certifications: Certification[];
  testing_requirements: TestingRequirement[];
  amendments: Amendment[];
  evaluation_cases: EvaluationCase[];
  consumer_records: ConsumerRecord[];
  consumer_evaluation_cases: ConsumerEvaluationCase[];
  source_links: SourceLink[];
  reference_standards: ReferenceStandard[];
  qa_status: QaRow[];
  data_dictionary: DictionaryRow[];
}

/* -------------------------------------------------------------------------- */
/* Query understanding                                                         */
/* -------------------------------------------------------------------------- */

export interface ProductContext {
  /** Normalized product phrase, e.g. "PVC pipe" */
  product: string;
  material: string | null;
  intendedUse: string | null;
  domain: string | null;
  matchedProductId: string | null;
  matchedProductName: string | null;
  language: Language;
  rawQuery: string;
  /** Transparent rule-based extraction — never claimed to be an ML model. */
  method: "lexical";
  confidence: "high" | "medium" | "low";
  /** Things the extractor could not determine from the query. */
  gaps: string[];
}

/* -------------------------------------------------------------------------- */
/* Retrieval — the object handed to the UI and the LLM                         */
/* -------------------------------------------------------------------------- */

export type MatchType = "DIRECT MATCH" | "RELATED" | "ALTERNATIVE" | "NEEDS CLARIFICATION";

export interface Signal {
  label: string;
  detail: string;
  matched: boolean;
  weight: number;
}

export interface SourceSummary {
  id: string;
  name: string | null;
  url: string | null;
  category: SourceCategory;
  authority: string;
  verification_status: string | null;
  status: string | null;
  what_it_gives: string | null;
}

export interface OfficialSource {
  id: string;
  name: string | null;
  url: string | null;
  what_it_gives: string | null;
}

export interface EvidenceRef {
  evidence_id: string;
  text: string | null;
  clause: string | null;
  page: string | null;
  section: string | null;
  limitation: string | null;
  source: SourceSummary | null;
}

export interface RelationshipInfo {
  id: string | null;
  type: string;
  derivation: string | null;
  original_text: string | null;
  source_notes: string | null;
}

export interface CertificationInfo {
  certification: Certification | null;
  qco: Qco | null;
  testing: TestingRequirement[];
}

export interface RetrievalResult {
  standard_id: string;
  is_number: string | null;
  title: string | null;
  domain: string | null;
  standard_type: string | null;
  iec_reference: string | null;
  amendments_count: number | null;
  notes: string | null;
  verification_status: string | null;
  data_basis: string | null;
  /** Which workbook / sheet this record was read from. */
  provenance: string | null;
  match_type: MatchType;
  match_reason: string[];
  signals: Signal[];
  relationship: RelationshipInfo | null;
  evidence: EvidenceRef[];
  source: SourceSummary | null;
  certification: CertificationInfo | null;
  score: number;
  rank: number;
  product_id: string | null;
  product_name: string | null;
  /** Why this result is weaker than the primary one, in plain language. */
  contrast: string | null;
}

export interface RetrievalPacket {
  context: ProductContext;
  results: RetrievalResult[];
  primary: RetrievalResult | null;
  /** Filled when the system cannot confidently pick a product/use. */
  clarification: string[];
  /** Present when nothing in the knowledge base matched. */
  empty: boolean;
  /** Official BIS destinations the dataset itself lists — never invented. */
  official_sources: OfficialSource[];
  searched: {
    products_considered: number;
    standards_considered: number;
    matched: number;
  };
  generated_at: string;
  language: Language;
}

/* -------------------------------------------------------------------------- */
/* Consumer verification                                                       */
/* -------------------------------------------------------------------------- */

export type CrossCheckStatus =
  | "MATCH"
  | "PARTIAL MATCH"
  | "POTENTIAL DISCREPANCY"
  | "INSUFFICIENT INFORMATION";

export interface CrossCheck {
  status: CrossCheckStatus;
  field: string;
  supplied: string;
  recorded: string | null;
  messages: string[];
}

export interface ConsumerLookup {
  found: boolean;
  record: ConsumerRecord | null;
  identifierType: string | null;
  normalizedIdentifier: string;
  /** Standard attached to the record, if the dataset links one. */
  standard: Standard | null;
  source: SourceSummary | null;
  evidence: EvidenceRef[];
  crossChecks: CrossCheck[];
  note: string | null;
}

/* -------------------------------------------------------------------------- */
/* Conversation                                                                */
/* -------------------------------------------------------------------------- */

export type ChatIntent =
  | "coverage"
  | "related"
  | "why"
  | "verify"
  | "meaning"
  | "next_steps"
  | "retrieval"
  | "general";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  abstained?: boolean;
  /** "llm" when the model answered, "fallback" when deterministic. */
  mode?: "llm" | "fallback";
  /** Official destination attached to an abstention. */
  hint?: { label: string; url: string } | null;
}

export interface ChatRequest {
  messages: ChatMessage[];
  language: Language;
  productId?: string | null;
  productName?: string | null;
  productMaterial?: string | null;
  productUse?: string | null;
  standardIds?: string[];
  primaryStandardId?: string | null;
  consumerRecordId?: string | null;
}

export interface ChatResponse {
  reply: string;
  intent: ChatIntent;
  abstained: boolean;
  mode: "llm" | "fallback";
  /** Official destination offered whenever the system declines to answer. */
  officialHint?: { label: string; url: string } | null;
  usedIds: string[];
  /** Present when the message re-opened a different product context. */
  packet?: RetrievalPacket;
}
