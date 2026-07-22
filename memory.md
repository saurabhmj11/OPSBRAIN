# memory.md — Project Memory & Context

**Purpose:** This file is the persistent context anchor for anyone (human or AI coding assistant) picking up work on OpsBrain across sessions. Read this first, before `architecture.md` or code. Update it every time a real decision is made — this file should always reflect current reality, not aspiration.

---

## 1. One-Paragraph Project Summary

OpsBrain is a knowledge intelligence platform for industrial plants that ingests heterogeneous documents (drawings, work orders, manuals, incident reports, procedures), builds a knowledge graph linking entities across them, and exposes that via a citation-first RAG copilot, a proactive lessons-learned agent, and a compliance gap detector. Core differentiator vs. generic RAG: cross-document reasoning through graph traversal, not just semantic similarity search. Built for ET AI Hackathon 2026, Problem Statement #8.

## 2. Canonical Glossary

| Term | Definition (as used in this project) |
|---|---|
| **Chunk** | A section-bounded piece of a parsed document (~300–500 tokens) with provenance metadata |
| **Entity** | An extracted node: Equipment, Document, Person, Procedure, RegulatoryClause, Incident, WorkOrder |
| **Relation / Edge** | A typed link between two entities (e.g., `Equipment -[MENTIONED_IN]-> Document`) |
| **Graph expansion** | Retrieval step that follows edges from query-matched entities to pull in structurally (not just semantically) related chunks |
| **Confidence score** | Derived score (retrieval similarity + source agreement + recency) attached to every copilot answer |
| **Evidence object** | The structured `{claim, source_chunk_ids, confidence}` unit agents pass between each other — never free text |
| **Fail closed** | Design rule: system says "insufficient evidence" rather than guessing when confidence is low |

## 3. Key Decisions Log (ADR-style, append-only — do not delete old entries)

| ID | Decision | Rationale | Status |
|---|---|---|---|
| D-001 | Use graph DB + vector store together, not vector-only RAG | Plain vector RAG can't answer cross-document structural questions (e.g., equipment failure history); this is the core differentiator vs. a generic chatbot | Locked |
| D-002 | NetworkX (in-memory) for hackathon, Neo4j noted as production path | Speed of build > production durability within 48hr window | Locked for hackathon; revisit if graph queries become the bottleneck |
| D-003 | No autonomous actions — agents are decision-support only | Safety/compliance domain; false confidence in an autonomous action is unacceptable risk (see `rules.md` 2.4) | Locked |
| D-004 | Extraction is strictly extractive for identifiers (no generated equipment tags/names) | Prevents hallucinated entities polluting the graph (see `rules.md` 2.6) | Locked |
| D-005 | Compliance Gap Agent scoped to a small, specific regulatory excerpt for demo | Avoid overclaiming regulatory coverage judges or real users could catch as false | Locked |
| D-006 | Flagship agents for hackathon: Expert Copilot (deep) + Lessons Learned (deep); Compliance Gap kept shallow | Team strength is NLP/RAG/agents — maximize where that strength shows, per PRD Section 5 scope decision | Locked |

*(Add new rows here as decisions are made. Never edit or delete a prior row — supersede it with a new row referencing the old ID if reversed.)*

## 4. Current Build State

> Update this section at the end of every work session — this is the "where did we leave off" snapshot.

- **Last updated:** [update timestamp when used]
- **Phase (per `phases.md`):** [e.g., "Phase 2 — Knowledge Graph, ~60% complete"]
- **What works end-to-end right now:** [be specific — e.g., "PDF + DOCX ingestion → chunking → extraction working; graph population not yet wired to vector store"]
- **What's broken / blocked:** [specific blockers]
- **Next concrete action:** [the single next task, not a list]

## 5. Open Questions (unresolved — revisit before final build)

- Which graph library ships in the actual demo — NetworkX (fast, fragile) or a lightweight Neo4j instance (more real, more setup risk)? Decide by end of Phase 0.
- How much of the regulatory corpus (OISD/DGMS/Factory Act) do we curate for the Compliance Gap Agent demo — keep this list short and specific, don't let scope creep here eat Copilot Agent time.
- Voice input for mobile field-technician flow — Should feature, not Must; only build if Phases 1–4 finish early.

## 6. Things That Have Already Been Tried and Rejected

*(Keep this section growing — prevents re-litigating settled questions mid-hackathon under time pressure.)*

- Fixed-length (token-count-only) chunking — rejected in favor of section-aware chunking; fixed-length splits were cutting procedures mid-step and breaking citation usefulness.

## 7. Reminders for Future Sessions / Future Agents

- Before adding any new agent or feature, check `rules.md` Section 2 guardrails first — especially citation-mandatory and fail-closed rules. Don't let a new feature quietly bypass them.
- Any schema change to the knowledge graph (Section 6 of `architecture.md`) must be logged as a new decision here (Section 3) in the same session.
- The single most important demo asset is the live, unscripted query surviving in front of judges — protect time for this over adding new features (see `phases.md` Phase 8).
- Don't let the Compliance Gap Agent's scope quietly expand — it's intentionally shallow per D-005. Resist "just add one more regulation" mid-build.
