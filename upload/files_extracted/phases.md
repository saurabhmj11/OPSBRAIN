# phases.md — Build Plan & Timeline

**Assumption:** 48-hour hackathon window, 4-person team. Adjust hour blocks to your actual schedule; the phase order and dependencies matter more than exact hours.

---

## Phase 0 — Setup & Planning (Hours 0–3)

**Goal:** Everyone aligned, environment ready, corpus sourced.

- Finalize scope: which 2 agents ship deep (recommend: Expert Copilot + Lessons Learned) vs which ships shallow (Compliance Gap — simplified demo).
- Repo scaffolding per `rules.md` Section 1.1.
- Source/curate demo document corpus (15–20 docs): mix of real public OEM manuals + safety standard excerpts + synthetic-but-realistic work orders, inspection reports, incident reports.
- Confirm tech stack access: LLM API keys, embedding model, vector store, graph library.

**Deliverable:** Repo skeleton, curated corpus folder, role assignments (Ingestion owner, Graph/Retrieval owner, Agent/Orchestration owner, Frontend owner).

---

## Phase 1 — Ingestion Pipeline (Hours 3–10)

**Goal:** Documents in → chunks with metadata out.

- Build format router + parsers (PDF/DOCX/XLSX/TXT first; OCR for scanned image only if time allows — can stub with pre-OCR'd text for demo).
- Chunking engine with metadata tagging (doc_id, page, section).
- Run full corpus through pipeline; manually spot-check 20% of chunks for extraction quality.

**Deliverable:** All demo documents chunked and stored with provenance metadata. **Checkpoint: do not proceed to Phase 2 until this is solid — everything downstream depends on it.**

---

## Phase 2 — Entity Extraction & Knowledge Graph (Hours 10–18)

**Goal:** Entities and relations extracted, graph populated.

- Build entity extraction prompts (few-shot, per `rules.md` 2.6 — extractive only).
- Build relation extraction for the core edge types in `architecture.md` Section 6.
- Populate graph DB (NetworkX for speed, or Neo4j if the team has prior experience).
- Populate vector store with embeddings, cross-referenced to graph entity IDs.

**Deliverable:** Working knowledge graph queryable by entity; vector store populated. Spot-test: can you traverse `Equipment → Incident → WorkOrder` for at least 3 equipment items in the demo corpus?

---

## Phase 3 — Retrieval & Expert Copilot Agent (Hours 18–28)

**Goal:** First end-to-end query → cited answer working.

- Build hybrid retrieval (vector + graph expansion) per `architecture.md` Section 7.
- Build reranking step.
- Build synthesis prompt with mandatory citation structure (per `rules.md` 2.1).
- Build confidence scoring.
- **Milestone: first live end-to-end query answered correctly with citations.** This is the single most important milestone in the whole build — protect this timeline slot.

**Deliverable:** Working Expert Copilot Agent, testable via API/CLI before frontend exists.

---

## Phase 4 — Lessons Learned Agent (Hours 28–34)

**Goal:** Proactive pattern-surfacing working on top of the same graph/vector infrastructure.

- Build similarity-matching logic (structural via graph + semantic via vector) for incident/near-miss records.
- Build proactive trigger: given a new work-order description, surface top 3 historically similar incidents with rationale.

**Deliverable:** Demonstrable "the system told me something I didn't ask for and it was right" moment — this is a key differentiator for the judges.

---

## Phase 5 — Compliance Gap Agent (Hours 34–38, kept intentionally shallow)

**Goal:** Directionally credible, honestly scoped.

- Curate a small, specific regulatory excerpt (e.g., 5–10 clauses from OISD-118 or Factory Act sections relevant to the demo corpus).
- Build diff logic: does an ingested procedure address each clause? Flag gap/partial/covered.

**Deliverable:** A gap report for the demo corpus that is accurate for the specific clauses used — do not overclaim full regulatory coverage in the pitch.

---

## Phase 6 — Frontend Integration (Hours 28–40, parallel with Phases 4–5)

**Goal:** Usable, demo-ready UI.

- Chat/Copilot interface with inline citation rendering (click-to-source).
- Knowledge Graph Visualizer (even a simple force-directed graph view is high-impact for judges).
- Compliance Dashboard view.
- Mobile-responsive check (field-technician persona matters for UX score).

**Deliverable:** Full UI wired to backend, no mock data remaining.

---

## Phase 7 — Testing, Demo Script & Deck (Hours 40–46)

**Goal:** Everything works live, unscripted.

- Run the full QA checklist in `rules.md` Section 4.
- Write demo script: 3 scripted "wow" queries + 1 deliberately unscripted judge-driven query.
- Build architecture diagram slide (reuse `architecture.md` Mermaid diagram).
- Build business impact slide (reuse `PRD.md` Section 10 metrics).
- Record demo video (backup in case live demo fails).

**Deliverable:** Presentation deck, demo video, rehearsed script.

---

## Phase 8 — Buffer & Rehearsal (Hours 46–48)

- No new features. Bug fixes and rehearsal only.
- Full dry run with a teammate playing "skeptical judge" asking off-script questions.

---

## Post-Hackathon Roadmap (for the pitch deck, not built)

| Phase | Timeframe | Focus |
|---|---|---|
| P9 | Month 1–2 | Real customer pilot with one plant's document archive; OCR pipeline hardening for engineering drawings |
| P10 | Month 3–4 | RBAC/SSO, enterprise deployment, managed graph DB migration |
| P11 | Month 5–6 | Full regulatory corpus (OISD/DGMS/Factory Act complete), multi-plant tenancy |
| P12 | Month 6+ | Fine-tuned domain embeddings, integration with live work-order/CMMS systems |
