/**
 * Deterministic cross-check — pure, dependency-free, usable on both sides of
 * the wire so the UI and the API always agree.
 *
 * The strongest verdict available is POTENTIAL DISCREPANCY. The word "fake" is
 * deliberately not part of this vocabulary: a mismatch is a prompt to verify,
 * not a conclusion.
 */

import type { CrossCheck, CrossCheckStatus } from "./types";

const strip = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const words = (v: string) => strip(v).split(" ").filter(Boolean);

export function compareValues(supplied: string, recorded: string | null): CrossCheckStatus {
  if (!recorded || !recorded.trim()) return "INSUFFICIENT INFORMATION";
  const a = strip(supplied);
  const b = strip(recorded);
  if (!a) return "INSUFFICIENT INFORMATION";
  if (a === b) return "MATCH";

  const aw = words(a);
  const bw = words(b);
  const shared = aw.filter((w) => bw.includes(w));
  const overlap = shared.length / Math.max(aw.length, bw.length, 1);

  if (a.includes(b) || b.includes(a)) return "PARTIAL MATCH";
  if (overlap >= 0.5) return "PARTIAL MATCH";
  return "POTENTIAL DISCREPANCY";
}

export interface CrossCheckInput {
  manufacturer?: string;
  product?: string;
  isNumber?: string;
}

export function crossCheck(
  record: { manufacturer: string | null; product: string | null; associated_is_number: string | null },
  input: CrossCheckInput,
): CrossCheck[] {
  const out: CrossCheck[] = [];

  if (input.manufacturer && input.manufacturer.trim()) {
    const status = compareValues(input.manufacturer, record.manufacturer);
    const messages: string[] =
      status === "MATCH"
        ? ["The manufacturer name supplied matches the retrieved record."]
        : status === "PARTIAL MATCH"
          ? [
              "The supplied manufacturer name partially matches the retrieved record — check the spelling, suffix and registered address.",
            ]
          : status === "POTENTIAL DISCREPANCY"
            ? [
                "The manufacturer information supplied does not match the retrieved prototype record.",
                "This does not establish that the product is counterfeit. Verify the information through the official BIS channel.",
              ]
            : [
                "The retrieved record does not carry a manufacturer value, so this field cannot be cross-checked.",
              ];
    out.push({
      status,
      field: "Manufacturer",
      supplied: input.manufacturer.trim(),
      recorded: record.manufacturer,
      messages,
    });
  }

  if (input.product && input.product.trim()) {
    const status = compareValues(input.product, record.product);
    const messages: string[] =
      status === "MATCH"
        ? ["The product name supplied matches the retrieved record."]
        : status === "POTENTIAL DISCREPANCY"
          ? [
              "The product description supplied does not match the retrieved prototype record.",
              "This does not establish that the product is counterfeit. Verify the information through the official BIS channel.",
            ]
          : status === "INSUFFICIENT INFORMATION"
            ? ["The retrieved record does not carry a product name, so this field cannot be cross-checked."]
            : ["The supplied product description partially matches the retrieved record."];
    out.push({
      status,
      field: "Product",
      supplied: input.product.trim(),
      recorded: record.product,
      messages,
    });
  }

  if (input.isNumber && input.isNumber.trim()) {
    const status = compareValues(input.isNumber, record.associated_is_number);
    const messages: string[] =
      status === "INSUFFICIENT INFORMATION"
        ? ["The retrieved record does not carry an associated Indian Standard, so this field cannot be cross-checked."]
        : status === "MATCH"
          ? ["The Indian Standard supplied matches the one recorded against this identifier."]
          : [
              "The Indian Standard supplied does not match the one recorded against this retrieved prototype record.",
              "Verify the information through the official BIS channel before drawing any conclusion.",
            ];
    out.push({
      status,
      field: "Associated standard",
      supplied: input.isNumber.trim(),
      recorded: record.associated_is_number,
      messages,
    });
  }

  return out;
}

/** Worst-case status, used for the headline badge. */
export function overallStatus(checks: CrossCheck[]): CrossCheckStatus {
  const order: CrossCheckStatus[] = [
    "POTENTIAL DISCREPANCY",
    "INSUFFICIENT INFORMATION",
    "PARTIAL MATCH",
    "MATCH",
  ];
  for (const s of order) if (checks.some((c) => c.status === s)) return s;
  return "INSUFFICIENT INFORMATION";
}
