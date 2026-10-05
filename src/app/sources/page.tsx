import type { SourceCardData } from "@/components/SourceCard";
import { SourcesClient } from "@/components/SourcesClient";
import { getKb, sourceUsage } from "@/lib/repository";

export const dynamic = "force-static";

function build() {
  const kb = getKb();
  const order: Record<string, number> = {
    "Official BIS": 0,
    Reference: 1,
    "Seed / Prototype": 2,
    Demo: 3,
  };
  const cards: SourceCardData[] = [...kb.sources]
    .sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9))
    .map((source) => {
      const u = sourceUsage(source.id);
      return {
        source,
        usage: {
          standards: u.standards.length,
          evidence: u.evidence.length,
          qcos: u.qcos.length,
          consumer: u.consumer.length,
          total: u.total,
        },
      };
    });

  const counts: Record<string, number> = {};
  for (const s of kb.sources) counts[s.category] = (counts[s.category] ?? 0) + 1;

  const qa = kb.qa_status.map((q) => ({
    id: q.QA_ID ?? "",
    check: q.Check ?? "",
    status: q.Status ?? "",
    explanation: q.Explanation ?? "",
  }));

  return { cards, counts, qa };
}

export default function SourcesPage() {
  const { cards, counts, qa } = build();
  return <SourcesClient cards={cards} counts={counts} qa={qa} />;
}
