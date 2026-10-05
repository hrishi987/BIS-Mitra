import { notFound } from "next/navigation";

import { ConsumerResultView } from "@/components/ConsumerResultView";
import { lookupConsumer } from "@/lib/consumer";
import { getConsumerRecord, officialSourcesWithUrl } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ConsumerResultPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { manufacturer?: string; product?: string; is?: string };
}) {
  const record = getConsumerRecord(params.id);
  if (!record) notFound();

  const lookup = lookupConsumer(record.identifier ?? "", "en", {
    manufacturer: searchParams.manufacturer,
    product: searchParams.product,
    isNumber: searchParams.is,
  });

  if (!lookup.found || !lookup.record) notFound();

  return <ConsumerResultView lookup={lookup} official={officialSourcesWithUrl()} />;
}
