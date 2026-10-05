# BIS MITRA

> **Indian Standards intelligence, made understandable.**

BIS Mitra is an AI-powered assistant for **Indian Standards and BIS services**, built for the Smart India
Hackathon problem statement *"AI-powered Intelligent Assistant for Indian Standards and BIS Services for
Industries and Consumers."*

It reads the supplied seed workbook, turns it into a single evidence-backed knowledge layer, and serves two
guided workflows:

- **Industry / Manufacturer** — describe what you make, get ranked applicable standards with explanations,
  relationships, evidence and a Standards Passport.
- **Consumer** — look up a BIS / ISI identifier, see what the record can and cannot establish, and
  cross-check what is printed on your product.

Every answer carries its provenance. Where the workbook has no data, the app says so and stops — it never
invents an IS number, clause, page, licence number, URL or status.

**Prototype · Not affiliated with BIS. Nothing it produces is an official BIS decision.**

---

## Features

### Industry workflow (`/industry`)

- Natural-language query → **understanding card** (product / material / use extracted, with a confidence
  level) so you can see how the request was interpreted before the results.
- **Ranked results** with explicit match types: `DIRECT MATCH`, `RELATED`, `ALTERNATIVE`. Alternatives come
  with a *"How this differs"* explanation (e.g. a drainage pipe standard vs. a drinking-water pipe standard).
- **Relationship map** — product → standard → related standards, from the workbook's relationship table.
- **Evidence & Source panel** per result — evidence id, section / clause / page, or an explicit gap:
  *"Source metadata not available in the current prototype dataset. BIS Mitra will not generate a URL,
  clause or page to fill this gap."*
- **Standards Passport** — condenses the result set into a carry-forward card you can keep referring to.
- **Contextual chat** — ask follow-ups ("What does this mean?", "What other standards are related…") scoped
  to the query you just ran.

### Consumer workflow (`/consumer`)

- **Identifier lookup** for licence numbers, R-numbers and HUIDs — plain IS numbers resolve to the standard
  record as well.
- Three synthetic **demo records** ship with the app, badged `DEMO RECORD` everywhere they appear:

  | Identifier | Type | Record |
  |---|---|---|
  | `DEMO-LIC-0001` | Licence | DEMO-CONS-001 — Demo Electric Appliance |
  | `DEMO-RNO-0001` | R-number | DEMO-CONS-002 — Demo Consumer Product |
  | `DEMO-HUID-0001` | HUID | DEMO-CONS-003 — Demo Hallmarked Item |

- **"What does this mean?"** chat explains what the record can verify (that the entry exists in this dataset
  and what it is recorded against) and what it cannot (genuineness of the physical product, live licence
  status in the official register).
- **Cross-check** — enter the manufacturer / product / IS number printed on your product; a deterministic
  comparison flags each field as `POTENTIAL DISCREPANCY` with a standing note:
  *"This does not establish that the product is counterfeit. Verify the information through the official
  BIS channel."* A mismatch is never presented as proof of a fake product.
- **Scan / Upload panel** — shows your product photo, but extracted fields are labelled *untrusted preview*;
  manual entry is the reliable path in this prototype.

### Knowledge & trust layer

- **Standards Explorer** (`/standards`) — search and filter the ingested records, with a relationship graph.
- **Sources & Provenance** (`/sources`) — all 22 sources (14 Official BIS · 7 Reference · 1 Demo) plus the
  workbook and sheet every fact came from.
- **Abstention** — questions the workbook cannot support (penalties, fees, clause numbers, live statuses)
  get an explicit *"Insufficient evidence"* refusal instead of a guess: *"BIS Mitra will not guess at
  penalties, clause numbers, fees, licence numbers or legal outcomes."*
- **Multilingual UI** — English, हिन्दी, ಕನ್ನಡ, தமிழ், తెలుగు (language switch in the header; typed input is
  script-detected too).

### LLM (optional)

The app runs fully without a key. With `GEMINI_API_KEY` set, explanations are model-written **but still
constrained to the retrieved evidence packet** — the model may not add facts. Without a key, a deterministic
composer answers from the same packet and the UI labels it `GROUNDED FALLBACK`.

---

## Trust rules

The single rule the whole system is built around:

> **No invented BIS facts.** No fabricated IS numbers, clauses, page numbers, licence numbers, URLs or
> statuses. Missing values stay `null`, gaps are shown honestly, and unsupported questions are refused.

This is enforced at ingestion (`scripts/ingest.py`), in retrieval/evidence (`src/lib/retrieval.ts`), in the
answer composer (`src/lib/llm.ts`), and asserted by the smoke suite (75 checks).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.15 (App Router) |
| UI | React 18, TypeScript (strict), Tailwind CSS, lucide-react |
| Knowledge layer | Excel → `scripts/ingest.py` → `data/knowledge.json` → `src/lib/repository.ts` |
| Retrieval | deterministic scoring + relationship expansion (`src/lib/retrieval.ts`) |
| Explanations | Gemini (optional) with deterministic grounded fallback |
| State | client session store (`src/lib/store.tsx`, localStorage) — no server database |

## Quick start

**Requirements:** Node 20+, Python 3.10 with `openpyxl` (only needed if you rebuild the knowledge layer).

```bash
git clone <your-repo-url>
cd <repo>

npm install

# knowledge layer is committed — only re-run if you change the workbooks:
pip3 install openpyxl
npm run ingest          # datasets/*.xlsx -> data/knowledge.json

npm run dev             # http://localhost:3000
```

Production build:

```bash
npm run build
npm start               # serves on http://localhost:3000
```

### Environment variables (all optional)

Copy `.env.example` to `.env` and fill in only what you need:

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | — | enables model-written explanations |
| `GEMINI_MODEL` | `gemini-2.0-flash` | any Gemini model name |
| `LLM_TIMEOUT_MS` | `12000` | abandon the model call and fall back |

Without a key everything still works — answers come from the grounded fallback composer and are labelled
`GROUNDED FALLBACK` in the chat.

### Verify a build

```bash
npm run typecheck       # tsc --noEmit
npm run build           # production build (10 pages + 4 API routes)

# with a server running on :3000 (dev or start):
node scripts/smoke.mjs  # -> "75 passed, 0 failed"
```

`node scripts/smoke.mjs` runs the 14 spec demo scenarios end-to-end against a live server and exits non-zero
on any failure, so it can gate a release.

> `npm run lint` exists (`next lint`) but **ESLint is not configured** in this repo — running it will prompt
> to install ESLint. Type-check + build + smoke are the meaningful gates.

---

## Try it (copy-paste demo inputs)

**Industry query**

```
I manufacture a PVC pipe for drinking-water supply
```

Expect: understanding card (PRODUCT `PVC pipe` · MATERIAL `PVC` · USE `Drinking-water supply`), then
**IS 4985:2000** as `DIRECT MATCH` (score 216), **IS 7634 / IS 7834** as `RELATED`, and **IS 13592:2013 /
IS 4984** as `ALTERNATIVE` with a "How this differs" note. The evidence panel for IS 4985 shows `EV-0032`
with Clause — Page — and the honest source gap.

**Consumer lookup**

```
DEMO-LIC-0001
```

Expect the DEMO-CONS-001 record with `DEMO RECORD` badges, associated standard **IS 302 (Part 1):2024**,
QCO staggered dates and official lookup channels.

**Cross-check (on the consumer result page)**

| Field | Value |
|---|---|
| Manufacturer on my product | `XYZ Industries` |
| Product name on my product | `Ceiling Fan` |
| IS number on my product | `IS 4985:2000` |

Expect three `POTENTIAL DISCREPANCY` fields and the "does not establish counterfeit" disclaimer.

**Abstention check (chat)**

```
What is the penalty for selling without a BIS licence?
```

Expect an explicit "Insufficient evidence" refusal — no invented penalty.

---

## How it works

```
Excel workbooks (datasets/*.xlsx)
  └─ scripts/ingest.py        trust rules enforced; missing values stay null
       └─ data/knowledge.json  single normalized knowledge layer
            └─ src/lib/repository.ts   (swap seam for Postgres + pgvector later)
                 └─ src/lib/retrieval.ts   scoring, match types, relationship expansion
                      └─ evidence packet   facts + provenance + gaps
                           ├─ src/lib/llm.ts        answer composer (Gemini | grounded fallback | abstain)
                           └─ UI components          results, passport, evidence, chat, cross-check
```

### Project structure

```
src/
  app/                  pages + API routes
    page.tsx             dashboard / landing
    industry/            query → results → standard/[id] detail
    consumer/            lookup → result/[id] (record + cross-check)
    standards/           explorer + relationship graph
    sources/             sources & provenance
    ask/                 open-ended ask
    api/                 query · chat · consumer · reference
  components/            StandardCard, EvidencePanel, ChatPanel, RelationshipGraph, …
  lib/                   repository, retrieval, llm, understand, crosscheck, i18n, store
scripts/
  ingest.py              workbook → knowledge.json
  smoke.mjs              75-assertion demo-scenario suite (needs a running server)
datasets/                supplied seed workbooks
data/knowledge.json      generated knowledge layer (committed)
```

### Knowledge-base contents (after `npm run ingest`)

36 standards · 29 products · 11 relationships · 20 rules · 5 QCOs · 22 sources (14 Official BIS / 7 Reference
/ 1 Demo) · 36 evidence records · 3 consumer demo records · 16 evaluation cases · 1,508 reference titles
(exploration only) · 2 domains.

---

## Known limitations

- **Prototype data only.** Three synthetic consumer records (badged `DEMO`); live BIS registers are not
  connected. Clause / page / URL are absent wherever the workbook didn't supply them — by design.
- **Scan/OCR panel is a preview.** It renders your photo and lets you correct fields; it does not run real
  OCR — manual entry is the reliable path (the UI says so).
- **Cross-check is a comparison, not a verdict.** A discrepancy never establishes counterfeit; the UI says
  so on every result.
- **No server persistence.** Session state lives in the browser (`localStorage`); no auth, no database.
  The repository layer (`src/lib/repository.ts`) is the seam for a Postgres + pgvector backend.
- **No ESLint config** — `npm run lint` is not a meaningful gate yet.
- **LLM optional.** Without a key you get the deterministic grounded fallback, labelled as such.

## Disclaimer

BIS Mitra is an explanation and navigation layer for Indian Standards. It is **not** an official BIS service,
and nothing it produces is an official BIS decision. Smart India Hackathon prototype · not affiliated with
BIS. Verify everything through official BIS channels before relying on it.
