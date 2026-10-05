/**
 * Consumer verification — deterministic lookup and cross-check.
 *
 * Rules that must never bend:
 *  * never call anything "fake"; the strongest negative verdict is
 *    POTENTIAL DISCREPANCY, which is a prompt to verify, not a conclusion;
 *  * records that the workbook marks as demo stay visibly demo;
 *  * missing data yields INSUFFICIENT INFORMATION, never a guess.
 */

import {
  detectIdentifierType,
  findConsumerRecord,
  findStandardByIsNumber,
  getEvidenceForStandard,
  getSource,
  getStandard,
  normalizeIdentifier,
  toSourceSummary,
} from "./repository";
import type { ConsumerLookup, CrossCheck, CrossCheckStatus, Language, RetrievalResult } from "./types";
import { resultById } from "./retrieval";

import { crossCheck, overallStatus, type CrossCheckInput } from "./crosscheck";

export { crossCheck, overallStatus };
export type { CrossCheckInput };

export function lookupConsumer(
  rawInput: string,
  language: Language,
  input: CrossCheckInput = {},
): ConsumerLookup {
  const trimmed = rawInput.trim();
  const normalized = normalizeIdentifier(trimmed);
  const record = findConsumerRecord(trimmed);
  const identifierType = detectIdentifierType(trimmed);

  if (!record) {
    // An IS number is not a consumer record — surface the standard instead.
    const asStandard = identifierType === "IS number" ? findStandardByIsNumber(trimmed) : null;
    if (asStandard) {
      return {
        found: false,
        record: null,
        identifierType,
        normalizedIdentifier: trimmed,
        standard: asStandard,
        source: toSourceSummary(getSource(asStandard.source_id ?? "")),
        evidence: getEvidenceForStandard(asStandard.id).map((e) => ({
          evidence_id: e.id,
          text: e.text,
          clause: e.clause,
          page: e.page,
          section: e.section,
          limitation: e.limitation,
          source: toSourceSummary(getSource(e.source_id ?? "")),
        })),
        crossChecks: [],
        note: "This value is an Indian Standard number, not a consumer licence / HUID / R-number. The standard record is shown instead.",
      };
    }
    return {
      found: false,
      record: null,
      identifierType,
      normalizedIdentifier: normalized,
      standard: null,
      source: null,
      evidence: [],
      crossChecks: [],
      note: "No record with this identifier exists in the prototype knowledge base.",
    };
  }

  const standard = record.standard_id
    ? getStandard(record.standard_id)
    : record.associated_is_number
      ? findStandardByIsNumber(record.associated_is_number)
      : null;

  return {
    found: true,
    record,
    identifierType: record.identifier_type ?? identifierType,
    normalizedIdentifier: trimmed,
    standard,
    source: toSourceSummary(getSource(record.source_id ?? "")),
    evidence: standard ? getEvidenceForStandard(standard.id).map((e) => ({
      evidence_id: e.id,
      text: e.text,
      clause: e.clause,
      page: e.page,
      section: e.section,
      limitation: e.limitation,
      source: toSourceSummary(getSource(e.source_id ?? "")),
    })) : [],
    crossChecks: crossCheck(record, input),
    note: record.notes,
  };
}

/** Result attached to the consumer context so chat can talk about it. */
export function consumerResult(lookup: ConsumerLookup, language: Language): RetrievalResult | null {
  if (!lookup.standard) return null;
  return resultById(lookup.standard.id, language, null);
}
