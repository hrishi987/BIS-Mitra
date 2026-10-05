import { getMeta, getStats } from "@/lib/repository";
import { LandingPage } from "@/components/LandingPage";

export const dynamic = "force-static";

export default function Home() {
  const stats = getStats();
  const meta = getMeta();
  return <LandingPage stats={stats} trustPolicy={meta.trust_policy} generatedAt={meta.generated_at} />;
}
