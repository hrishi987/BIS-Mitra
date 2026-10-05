# BIS MITRA — Demo Recording Script

A beat-by-beat script for recording the prototype: **you screen-record the browser while reading the
voiceover aloud.** Total runtime ≈ **7–8 minutes** (a 90-second cut is at the end).

Two rules that make or break the recording:

1. **Do every action yourself, live.** The value of the demo is that it's real — type the queries, let the
   results load, show the refusal.
2. **Never narrate a fact the screen doesn't show.** If a field says "—", say *"not in the dataset"* —
   don't fill the gap yourself. That restraint is the whole pitch.

---

## Pre-flight checklist (before you hit record)

- [ ] Server running: `npm run dev` (or `npm run build && npm start`) → open `http://localhost:3000`
- [ ] Fresh browser profile or incognito window — clean chat history, no leftover session
- [ ] Window at least 1280×800, browser zoom 100%, bookmarks bar hidden
- [ ] Language set to **English** (you'll switch mid-demo in Beat 10)
- [ ] Notifications / Slack / email paused; phone on silent
- [ ] Mic check; record at 1080p, 30 fps; hide your facecam if you don't want it
- [ ] Run through the script once without recording (≈8 min)

**Reset between takes:** click **Clear conversation** in the chat panel, then reload the page. If the
session still looks stale, clear it in devtools → Application → Local Storage → delete
`bis-mitra.session.v2` → reload.

**Pacing:** pause ~2 seconds after every result renders before you start speaking. Type at a readable
speed. Move the cursor to what you're talking about, then hold it still while you speak.

---

## Beat 1 — Opening on the dashboard `0:00–0:35`

**Do:** Land on `http://localhost:3000`. Let the hero sit for a beat. Hover the two cards
("Find applicable standards" / "Check a BIS / ISI identifier"), then scroll slowly down to the
**Knowledge Base** counts and the footer disclaimer.

**You should see:** hero — *BIS Mitra · Understand Indian Standards. Find the right BIS information. Know
what to do next.* Two entry cards, knowledge-base counts (36 standards · 29 products · 11 relationships ·
20 rules · 22 sources), footer: *"Not affiliated with BIS."*

**Say:**

> This is BIS Mitra — Indian Standards intelligence, made understandable. It's an assistant for the
> Smart India Hackathon problem statement on Indian Standards and BIS services, and it has one hard rule:
> it never invents a fact. Everything you'll see comes from the seed workbook we ingested, and everywhere
> the workbook is silent, the app says so out loud.
>
> Two ways in: manufacturers describe what they make, consumers check an identifier. Let's start with the
> industry side.

---

## Beat 2 — Industry query and the understanding card `0:35–1:20`

**Do:** Click **Industry / Manufacturer** in the header (or "Explore Industry Assistant" on the card).
Type slowly, exactly:

```
I manufacture a PVC pipe for drinking-water supply
```

Press Enter / run the query. Wait for the results page to fully render.

**You should see:** an **understanding card** before the results — PRODUCT `PVC pipe`, MATERIAL `PVC`,
USE `Drinking-water supply`, confidence **HIGH**.

**Say:**

> First, notice what it shows before any answer: how it interpreted my request — the product it picked
> out, the material, the use, and how confident it is. If it read me wrong, I'd know immediately instead
> of trusting a black box.

---

## Beat 3 — Ranked results and match types `1:20–2:30`

**Do:** Scroll the results slowly, top to bottom. Hover each result card as you mention it.

**You should see (in order):**

| Result | Match type |
|---|---|
| **IS 4985:2000** — PVC pipe for drinking water supply | `DIRECT MATCH` (score 216) |
| IS 7634, IS 7834 | `RELATED` |
| IS 13592:2013, IS 4984 | `ALTERNATIVE` with a **"How this differs"** note |

**Say:**

> The top hit is IS 4985:2000 — the standard for PVC pipe for drinking-water supply — flagged as a direct
> match with its score shown. Then related standards from the same family, and then alternatives.
>
> Look at the alternatives: IS 13592 is a drainage standard. The app isn't hiding it — it explains how it
> differs from what I asked for, so I can make the call myself. The scoring is deterministic: same query,
> same ranking, every time.

---

## Beat 4 — Relationship map, evidence, and the honest gap `2:30–3:20`

**Do:** Scroll to the **relationship map** and hover a node or two. Then open the **Evidence & Source**
panel on the IS 4985 result and leave it on screen while you talk. Finish by pointing at the **Standards
Passport** card.

**You should see:** relationship map (product → standard → related standards). Evidence panel:
**EV-0032**, section —, clause **—**, page **—**, and the box:

> *Source metadata not available in the current prototype dataset.*
> *BIS Mitra will not generate a URL, clause or page to fill this gap.*

**Say:**

> Every result carries its evidence. Here's IS 4985's evidence record: EV-0032, straight from the
> workbook — and clause and page are empty, because the workbook never supplied them.
>
> This is the part most assistants get wrong. It would be easy for a model to invent a plausible-looking
> page number or a bis.gov.in link. BIS Mitra refuses: it shows the gap and tells you it won't paper over
> it. Honest abstention is the feature.
>
> And here's the Standards Passport — everything worth carrying forward from this search, in one card.

---

## Beat 5 — Chat: explanation, related standards, then refusal `3:20–4:30`

**Do:** In the results-page chat, send these one at a time, waiting for each answer to finish:

1. `What does this mean?`
2. `What other standards are related to this product?`
3. `What is the penalty for selling without a BIS licence?`

**You should see:** grounded summaries for 1 and 2 (with a **GROUNDED FALLBACK** badge if no API key is
set). For 3, a refusal card: **"Insufficient evidence"** — *"…BIS Mitra will not guess at penalties, clause
numbers, fees, licence numbers or legal outcomes. Check official BIS sources."*

**Say:**

> The chat is scoped to this query, so follow-ups already know the context. "What does this mean" gives a
> plain-language summary of the retrieved record.
>
> If you see the GROUNDED FALLBACK badge, that's the deterministic composer answering from the evidence
> packet — set a Gemini key and the wording becomes model-written, but the facts are identical either way,
> because the model only ever sees what was retrieved.
>
> Now watch this one — a penalty question. It's exactly the kind of thing a language model loves to
> hallucinate a number for. BIS Mitra refuses: insufficient evidence, and it points you to official BIS
> sources instead. It would rather say nothing than say something wrong.

---

## Beat 6 — Consumer lookup `4:30–5:30`

**Do:** Click the **Consumer** tab in the header (or "Check a Product"). Type the identifier exactly:

```
DEMO-LIC-0001
```

Press Enter. Scroll the record slowly.

**You should see:** **Verification Result — DEMO-CONS-001**, `DEMO RECORD` and `PROTOTYPE DATASET` badges,
fields (Product: Demo Electric Appliance · Manufacturer: Demo Manufacturer · Identifier type: Licence ·
Status: DEMO · Authority: DEMO_ONLY), associated standard **IS 302 (Part 1):2024**, QCO staggered dates
(non-MSE 01-Oct-2026 · small 01-Jan-2027 · micro 01-Apr-2027), official lookup channels, and the notice:
*"Synthetic identifier/record for testing the UI only."*

**Say:**

> Consumer side now. You paste whatever is printed on your product — a licence number, an R-number, a
> HUID — and it pulls the record.
>
> Everything here is badged: this is a demo record, status DEMO, authority DEMO_ONLY. The prototype ships
> three of them — a licence, an R-number and a HUID — so you can see the flow without touching live BIS
> data. The associated standard, the QCO dates, the lookup links — all of it is from the workbook, with
> the source shown.

---

## Beat 7 — "What does this mean?" and the cross-check `5:30–6:15`

**Do:** Click the **What does this mean?** button on the consumer page and let the answer render. Then
fill the **Cross-check the information on your product** form exactly:

| Field | Type this |
|---|---|
| Manufacturer on my product | `XYZ Industries` |
| Product name on my product | `Ceiling Fan` |
| IS number on my product | `IS 4985:2000` |

Click **Cross-check**. Scroll to the result and leave it on screen.

**You should see:** the meaning answer (can-verify vs cannot-verify lists, with the synthetic-record
disclaimer), then a **POTENTIAL DISCREPANCY** banner and three field comparisons — YOU ENTERED vs
RETRIEVED RECORD — for manufacturer, product and standard, each closing with:

> *This does not establish that the product is counterfeit. Verify the information through the official
> BIS channel.*

**Say:**

> "What does this mean" draws the line the only honest way: this system can verify that the entry exists
> and what it's recorded against — it cannot verify that the physical product in your hand is genuine, or
> the live status of a licence. That's BIS's job, not ours.
>
> Now the cross-check: I'll type what's printed on *my* product — deliberately mismatched. All three
> fields come back as potential discrepancies, side by side with the retrieved record. And read the
> footer line: a discrepancy does not establish that the product is counterfeit. It's a deterministic
> field comparison that tells you *where to go next* — the official BIS channel — never a verdict.
> The word "fake" never appears.

---

## Beat 8 — Standards Explorer and the relationship graph `6:15–6:50`

**Do:** Click **Standards** in the header. Scroll the explorer, hover the graph edges, then click into
**IS 4985:2000** to open its detail page (evidence panel visible).

**You should see:** searchable/filterable list of the 36 ingested standards, a relationship graph, and the
standard detail page with its evidence.

**Say:**

> Beyond the guided flows, there's a Standards Explorer — the whole ingested knowledge base, with the
> relationship graph, so you can browse how products, standards and their neighbours connect. Every detail
> page ends in the same place: evidence, or an honest gap.

---

## Beat 9 — Sources & Provenance `6:50–7:15`

**Do:** Click **Sources** in the header. Scroll through the source cards.

**You should see:** 22 sources — **14 Official BIS · 7 Reference · 1 Demo** — each with its type and the
workbook/sheet it came from, plus guidance on following official links.

**Say:**

> This page is the receipts: every source behind every answer, labelled — official BIS, reference, or demo
> — with the workbook and sheet each one came from. Twenty-two sources. If an answer cites something, you
> can walk it back to here.

---

## Beat 10 — Multilingual UI `7:15–7:35`

**Do:** Click the **English** switcher in the header → pick **हिन्दी**. Let the page re-render, then
(optionally) switch back.

**You should see:** navigation, buttons and labels in Hindi; content still grounded in the dataset.
Languages available: English · हिन्दी · ಕನ್ನಡ · தமிழ் · తెలుగు.

**Say:**

> The interface speaks five languages — English, Hindi, Kannada, Tamil, Telugu — and typed queries are
> script-detected too. The trust rules don't change with the language.

---

## Beat 11 — Closing `7:35–8:00`

**Do:** Navigate back to the dashboard. Scroll to the footer disclaimer and park the cursor on it.

**Say:**

> So: ranked, explained standards for industry; identifier lookups and a cross-check for consumers;
> evidence on everything; refusals where the data doesn't go; and demo records that never pretend to be
> real. BIS Mitra doesn't replace BIS — it helps you reach it with the right question. Prototype, not
> affiliated with BIS, nothing here is an official decision.
>
> That's BIS Mitra — Indian Standards intelligence, made understandable.

---

## Guardrails — what NOT to say

- **Always "BIS Mitra"** — never "BIS Navigator", "BIS Assistant", or "BIS's assistant". It's *our*
  prototype, not BIS's product.
- **Never conclude "fake" / "counterfeit" / "genuine."** The screen never says it; neither do you. Use
  "potential discrepancy" and "verify through official BIS channels".
- **Never quote a clause, page, URL or licence status the screen doesn't show.** "—" means *not in the
  dataset*.
- **Don't oversell OCR.** The upload panel shows a photo and lets you correct fields; call it a
  "preview — manual entry is the reliable path".
- **Don't hide the fallback.** If GROUNDED FALLBACK is on screen, explain it in one sentence — it reads as
  honesty, not weakness.

## If something goes wrong mid-take

| Snag | Fix |
|---|---|
| Result takes a second to load | Pause, take a breath — don't narrate loading. |
| Chat answer wording differs slightly | Fine — the beats are about *behavior*, read the gist. |
| Refusal card phrasing changed | Read the title ("Insufficient evidence") and the CTA ("Check official BIS sources"). |
| Page looks stale from a previous take | Stop. Clear conversation → reload → restart the beat. |
| Forgot which query to type | Every exact string is in this doc — it's your teleprompter. |

---

## Short cut — 90-second version (for a time-boxed slot)

1. **0:00** Dashboard hero + trust line. *(5 s)*
2. **0:05** Industry: type the PVC query → understanding card. *(15 s)*
3. **0:20** Results: point at IS 4985 `DIRECT MATCH`, then an `ALTERNATIVE` + "How this differs". *(15 s)*
4. **0:35** Evidence panel: EV-0032, empty clause/page, "will not generate a URL". *(15 s)*
5. **0:50** Chat: penalty question → refusal. Say the one-liner about hallucinations. *(15 s)*
6. **1:05** Consumer: `DEMO-LIC-0001` → record with DEMO badges → cross-check → `POTENTIAL DISCREPANCY`
   + "does not establish counterfeit". *(25 s)*
7. **1:30** Footer disclaimer + sign-off. *(5 s)*

---

## After recording

- [ ] Watch it once at 2× — if any beat drags, trim, don't re-record
- [ ] Check the audio on Beat 5 and Beat 7 (the two most important voiceovers)
- [ ] Confirm no `.env`, API keys, or devtools console are visible in frames
- [ ] Export at 1080p; filename suggestion: `bis-mitra-demo.mp4`
