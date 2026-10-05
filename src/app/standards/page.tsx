import { StandardsExplorer } from "@/components/StandardsExplorer";
import { getKb } from "@/lib/repository";

export const dynamic = "force-static";

export default function StandardsPage() {
  const kb = getKb();

  const evaluationCases = [
    ...kb.evaluation_cases,
    ...kb.consumer_evaluation_cases.map((c) => ({
      Case_ID: c.Case_ID,
      Domain: c.Input_Type,
      Input_Product_or_Query: c.User_Input,
      Expected_or_Source_Mapped_Result: c.Expected_Behavior,
      Why_This_Case_Matters: c.Why_Test_Matters,
      Basis: c.Source_Basis,
    })),
  ];

  return (
    <StandardsExplorer
      standards={kb.standards}
      products={kb.products}
      relationships={kb.relationships}
      evaluationCases={evaluationCases}
    />
  );
}
