import { notFound } from "next/navigation";

import { StandardDetail, type RelatedItem } from "@/components/StandardDetail";
import {
  getRelationshipsForStandard,
  getStandard,
  listProducts,
  officialSourcesWithUrl,
  relatedStandards,
} from "@/lib/repository";
import { resultById } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export default async function StandardPage({
  params,
}: {
  params: { id: string };
}) {
  const standard = getStandard(params.id);
  if (!standard) notFound();

  const result = resultById(params.id, "en", null);
  if (!result) notFound();

  const related: RelatedItem[] = relatedStandards(params.id, 8).map((s) => ({
    id: s.id,
    is_number: s.is_number,
    title: s.title,
  }));

  const linkedIds = new Set<string>([
    ...getRelationshipsForStandard(params.id).map((r) => r.product_id),
  ]);
  for (const p of listProducts()) {
    if (p.seed_standard_ids.includes(params.id)) linkedIds.add(p.id);
  }
  const linkedProducts = listProducts()
    .filter((p) => linkedIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <StandardDetail
      result={result}
      related={related}
      linkedProducts={linkedProducts}
      official={officialSourcesWithUrl()}
      context={null}
    />
  );
}
