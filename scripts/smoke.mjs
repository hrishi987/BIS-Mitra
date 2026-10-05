/**
 * BIS Mitra — demo-scenario smoke test.
 *
 * Run against a live server:  node scripts/smoke.mjs [baseUrl]
 * Exits non-zero if any scenario fails, so it can gate a release.
 */

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    fail += 1;
    failures.push({ name, detail });
    console.log(`  FAIL ${name}`);
    if (detail) console.log(`       ${String(detail).slice(0, 600)}`);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, text: await res.text() };
}

const chat = (messages, extra = {}) =>
  post("/api/chat", { messages, language: extra.language ?? "en", ...extra });

const idsFrom = (packet) => packet.results.map((r) => r.standard_id);

/* -------------------------------------------------------------------------- */
console.log("\n1. Industry — PVC pipe for drinking-water supply");
{
  const { packet } = await post("/api/query", {
    query: "I manufacture a PVC pipe for drinking-water supply.",
    language: "en",
  });
  check("primary is IS 4985:2000", packet.primary?.is_number === "IS 4985:2000", packet.primary?.is_number);
  check("primary is DIRECT MATCH", packet.primary?.match_type === "DIRECT MATCH", packet.primary?.match_type);
  check(
    "context product is PVC pipe",
    /PVC pipe/i.test(packet.context.product ?? ""),
    packet.context.product,
  );
  check("context material mentions PVC", /PVC/.test(packet.context.material ?? ""), packet.context.material);
  check(
    "context use is drinking water",
    /Drinking/i.test(packet.context.intendedUse ?? ""),
    packet.context.intendedUse,
  );
  check(
    "relationship reason present",
    packet.primary?.match_reason.some((r) => /relationship/i.test(r)),
    JSON.stringify(packet.primary?.match_reason),
  );
  check(
    "IS 13592 is an ALTERNATIVE, not primary",
    packet.results.some((r) => r.is_number === "IS 13592:2013" && r.match_type === "ALTERNATIVE"),
    packet.results.map((r) => `${r.is_number}:${r.match_type}`).join(", "),
  );
  check(
    "IS 4984 (HDPE) is an ALTERNATIVE",
    packet.results.some((r) => r.is_number?.startsWith("IS 4984") && r.match_type === "ALTERNATIVE"),
    packet.results.map((r) => `${r.is_number}:${r.match_type}`).join(", "),
  );
  check("evidence attached", (packet.primary?.evidence?.length ?? 0) > 0);
  check("official sources supplied", (packet.official_sources?.length ?? 0) > 0);

  /* 2 — contextual follow-ups */
  console.log("\n2. Conversation — coverage / related / unsupported");
  const ids = idsFrom(packet);
  const ctx = {
    productId: packet.context.matchedProductId,
    productName: packet.context.product,
    productMaterial: packet.context.material,
    productUse: packet.context.intendedUse,
    standardIds: ids,
    primaryStandardId: packet.primary?.standard_id,
  };

  const coverage = await chat(
    [{ role: "user", content: "What does this standard cover?" }],
    ctx,
  );
  check("coverage answered", !coverage.abstained, coverage.reply);
  check(
    "coverage quotes the retrieved title",
    coverage.reply.includes(packet.primary.title.slice(0, 30)),
    coverage.reply.slice(0, 300),
  );

  const related = await chat(
    [{ role: "user", content: "What other standards are related to my product?" }],
    ctx,
  );
  check("related answered", !related.abstained, related.reply);
  check(
    "related lists another IS number",
    /IS\s?\d/.test(related.reply),
    related.reply.slice(0, 300),
  );

  const why = await chat([{ role: "user", content: "Why was this standard selected?" }], ctx);
  check("why answered", !why.abstained, why.reply);
  check(
    "why includes match reasons",
    /Product/.test(why.reply) || /relationship/i.test(why.reply),
    why.reply.slice(0, 300),
  );

  const penalty = await chat(
    [{ role: "user", content: "What is the exact penalty for violating this standard?" }],
    ctx,
  );
  check("penalty abstains", penalty.abstained === true, penalty.reply);
  check(
    "abstention text is the agreed one",
    /does not contain enough information/i.test(penalty.reply),
    penalty.reply,
  );
  check("abstention offers official source", Boolean(penalty.officialHint?.url), JSON.stringify(penalty.officialHint));

  const verify = await chat(
    [{ role: "user", content: "What should I verify before applying for certification?" }],
    ctx,
  );
  check("verify question abstains for IS 4985", verify.abstained === true, verify.reply);
}

/* -------------------------------------------------------------------------- */
console.log("\n3. Industry — other products");
{
  const iron = await post("/api/query", {
    query: "I make an electric iron.",
    language: "en",
  });
  const ironIds = iron.packet.results.map((r) => r.is_number);
  check("electric iron -> IS 302 Part 1", ironIds.includes("IS 302 (Part 1):2024"), ironIds.join(" | "));
  check(
    "electric iron -> IS 302 Part 2 Sec 3",
    ironIds.some((x) => x?.includes("Part 2/Sec 3")),
    ironIds.join(" | "),
  );
  check(
    "both iron results are DIRECT MATCH",
    iron.packet.results
      .filter((r) => r.is_number === "IS 302 (Part 1):2024" || r.is_number?.includes("Sec 3"))
      .every((r) => r.match_type === "DIRECT MATCH"),
    iron.packet.results.map((r) => `${r.is_number}:${r.match_type}`).join(", "),
  );

  const ironVerify = await chat(
    [{ role: "user", content: "What should I verify before applying for certification?" }],
    {
      productId: iron.packet.context.matchedProductId,
      productName: iron.packet.context.product,
      standardIds: idsFrom(iron.packet),
      primaryStandardId: iron.packet.primary?.standard_id,
    },
  );
  check(
    "verify IS ANSWERED where the dataset has QCO evidence",
    ironVerify.abstained === false && /Quality Control Order/i.test(ironVerify.reply),
    ironVerify.reply.slice(0, 400),
  );
  check(
    "verify answer keeps the source caveat",
    /verify|re-verif|confirm/i.test(ironVerify.reply),
    ironVerify.reply.slice(-300),
  );

  const geo = await post("/api/query", {
    query: "I manufacture an electric immersion water heater.",
    language: "en",
  });
  check(
    "immersion heater -> Sec 201",
    geo.packet.results.some((r) => r.is_number?.includes("Sec 201")),
    geo.packet.results.map((r) => r.is_number).join(" | "),
  );

  const ambiguous = await post("/api/query", {
    query: "I manufacture a plastic pipe.",
    language: "en",
  });
  check(
    "ambiguous query asks for clarification",
    ambiguous.packet.clarification.length > 0,
    JSON.stringify(ambiguous.packet.clarification),
  );
  check(
    "ambiguous results are NEEDS CLARIFICATION",
    ambiguous.packet.results.every((r) => r.match_type === "NEEDS CLARIFICATION"),
    ambiguous.packet.results.map((r) => r.match_type).join(", "),
  );

  const nonsense = await post("/api/query", {
    query: "What is the capital of France?",
    language: "en",
  });
  check("unrelated query returns no results", nonsense.packet.empty === true);
  const abstain = await chat(
    [{ role: "user", content: "What is the capital of France?" }],
    { standardIds: [] },
  );
  check("ungrounded chat abstains", abstain.abstained === true, abstain.reply);
}

/* -------------------------------------------------------------------------- */
console.log("\n4. Multilingual retrieval + answers");
{
  const hindi = await post("/api/query", {
    query:
      "मैं पीने के पानी के लिए PVC पाइप बनाता हूँ। मेरे लिए कौन सा BIS मानक लागू हो सकता है?",
    language: "hi",
  });
  check("Hindi query -> IS 4985:2000", hindi.packet.primary?.is_number === "IS 4985:2000", hindi.packet.primary?.is_number);
  check("Hindi query is DIRECT MATCH", hindi.packet.primary?.match_type === "DIRECT MATCH", hindi.packet.primary?.match_type);

  const kannada = await post("/api/query", {
    query:
      "ನಾನು ಕುಡಿಯುವ ನೀರಿಗಾಗಿ PVC ಪೈಪ್ ತಯಾರಿಸುತ್ತೇನೆ. ಯಾವ BIS ಮಾನದಂಡ ಅನ್ವಯಿಸಬಹುದು?",
    language: "kn",
  });
  check("Kannada query -> IS 4985:2000", kannada.packet.primary?.is_number === "IS 4985:2000", kannada.packet.primary?.is_number);

  const ctx = {
    productId: hindi.packet.context.matchedProductId,
    productName: hindi.packet.context.product,
    standardIds: idsFrom(hindi.packet),
    primaryStandardId: hindi.packet.primary?.standard_id,
  };
  const hiAnswer = await chat(
    [{ role: "user", content: "यह मानक क्या कवर करता है?" }],
    { ...ctx, language: "hi" },
  );
  check("Hindi answer is not English-only", /[ऀ-ॿ]/.test(hiAnswer.reply), hiAnswer.reply.slice(0, 240));
  check("Hindi answer keeps the IS number", hiAnswer.reply.includes("IS 4985:2000"), hiAnswer.reply.slice(0, 240));

  const knAnswer = await chat(
    [{ role: "user", content: "ಈ ಮಾನದಂಡ ಏನನ್ನು ಒಳಗೊಳ್ಳುತ್ತದೆ?" }],
    ctx,
    );
  void knAnswer;
  const knAnswer2 = await post("/api/chat", {
    messages: [{ role: "user", content: "ಈ ಮಾನದಂಡ ಏನನ್ನು ಒಳಗೊಳ್ಳುತ್ತದೆ?" }],
    language: "kn",
    ...ctx,
  });
  check("Kannada answer is not English-only", /[ಀ-೿]/.test(knAnswer2.reply), knAnswer2.reply.slice(0, 240));
}

/* -------------------------------------------------------------------------- */
console.log("\n5. Consumer — record, not-found, cross-check");
{
  const found = await post("/api/consumer", { identifier: "DEMO-LIC-0001", language: "en" });
  check("DEMO-LIC-0001 resolves", found.found === true && found.recordId === "DEMO-CONS-001", JSON.stringify(found));

  const missing = await post("/api/consumer", { identifier: "NOT-A-REAL-ID", language: "en" });
  check("unknown identifier not found", missing.found === false, JSON.stringify(missing));

  const result = await get("/consumer/result/DEMO-CONS-001");
  check("result page renders", result.status === 200);
  check("result page shows demo record", /Demo record/i.test(result.text));
  check("result page shows the identifier", result.text.includes("DEMO-LIC-0001"));

  const mismatch = await get(
    "/consumer/result/DEMO-CONS-001?manufacturer=XYZ%20Industries",
  );
  check("cross-check page renders", mismatch.status === 200);
  check("cross-check flags discrepancy", /POTENTIAL DISCREPANCY/i.test(mismatch.text));
  check(
    "cross-check carries the counterfeit disclaimer",
    /does not establish that the product is counterfeit/i.test(mismatch.text),
    mismatch.text.slice(0, 400),
  );
  check(
    "cross-check points to the official channel",
    /official BIS channel/i.test(mismatch.text),
  );
  check("never says FAKE", !/\bFAKE\b/i.test(mismatch.text));

  const match = await get("/consumer/result/DEMO-CONS-001?manufacturer=Demo%20Manufacturer");
  check("matching manufacturer reports MATCH", /MATCH/i.test(match.text));
}

/* -------------------------------------------------------------------------- */
console.log("\n6. Pages render without error");
{
  for (const path of ["/", "/industry", "/consumer", "/standards", "/sources", "/ask"]) {
    const res = await get(path);
    check(`${path} -> 200`, res.status === 200, `status ${res.status}`);
    check(`${path} has no raw error`, !/Internal Server Error|Unhandled Runtime/i.test(res.text));
    check(`${path} is branded BIS Mitra`, /BIS\s?Mitra|BIS MITRA/i.test(res.text));
    check(`${path} does not use a retired brand`, !/BIS Navigator/i.test(res.text));
  }

  const detail = await get("/industry/standard/STD-PIPE-032");
  check("standard detail renders", detail.status === 200, `status ${detail.status}`);
  check("standard detail shows IS 4985", detail.text.includes("IS 4985:2000"));
  check("standard detail shows evidence panel", /Evidence/i.test(detail.text));

  const bad = await get("/industry/standard/NOPE");
  check("unknown standard is a 404", bad.status === 404, `status ${bad.status}`);
}

/* -------------------------------------------------------------------------- */
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log("\nFailures:");
  for (const f of failures) console.log(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
