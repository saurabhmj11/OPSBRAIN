# PRD.md — OpsBrain: Unified Industrial Knowledge Intelligence Platform

**Version:** 1.0
**Track:** ET AI Hackathon 2026 — Problem Statement #8 (Industrial Intelligence / Document Management / Knowledge Engineering / Quality)
**Doc owner:** [Team name]
**Status:** Draft for build

---

## 1. Executive Summary

OpsBrain is an AI-powered knowledge intelligence platform for asset-intensive industrial operations (steel plants, refineries, EPC sites, power plants). It ingests heterogeneous documents — engineering drawings, maintenance records, safety procedures, inspection reports, SOPs, RFIs, compliance filings — across structured and unstructured formats, builds a unified knowledge graph over them, and exposes that knowledge through a conversational copilot, a compliance-gap detector, and a proactive lessons-learned engine.

The core bet: industrial knowledge loss is not a search problem, it's a **connection** problem. The fix is not "a chatbot on top of a PDF folder" — it's an entity-linked knowledge layer that lets the system reason *across* documents, not just retrieve *within* one.

## 2. Problem Statement

- Professionals in asset-intensive industries spend an average of **35% of working hours** searching for information or recreating documents that already exist (McKinsey, 2024).
- The average large Indian plant operates across **7–12 disconnected document systems** (NASSCOM-EY).
- Document fragmentation contributes to **18–22% of unplanned downtime** in Indian heavy industry (BIS Research) because maintenance teams act without full equipment history.
- **~25% of India's experienced industrial engineers** retire within the next decade, taking undocumented tacit knowledge with them — a one-way loss once it happens.

This is simultaneously a **safety problem**, a **quality/compliance problem**, and an **efficiency problem** — and it compounds every year it isn't solved.

## 3. Goals & Objectives

**Hackathon goals (48-hour scope):**
1. Demonstrate real multi-document ingestion (not a single-PDF demo).
2. Prove cross-document reasoning via a working knowledge graph, not just vector search.
3. Ship one flagship agent end-to-end with visible, verifiable output (not a mockup).
4. Show a believable path to production scale and quantified business impact.

**Product goals (beyond hackathon):**
1. Cut time-to-answer for operational/engineering queries from hours to seconds.
2. Reduce compliance audit prep time by automating gap detection.
3. Prevent recurrence of known failure modes by surfacing historical incidents proactively, not on-demand.
4. Preserve retiring engineers' tacit knowledge before it's lost.

## 4. Target Users / Personas

| Persona | Context | Core need |
|---|---|---|
| **Field Technician (Raju)** | On-site, mobile device, noisy/low-connectivity environment | "Has this valve failed before, and how was it fixed?" — answered in seconds, on phone |
| **Plant/Maintenance Engineer (Priya)** | Desktop, plans maintenance schedules | Root-cause analysis across work orders + OEM manuals + inspection history |
| **Compliance/QA Officer (Anil)** | Prepares for OISD/DGMS/Factory Act audits | Gap analysis between current procedures and regulatory requirements, with evidence trail |
| **Plant Manager (Meena)** | Oversees operations, accountable for incidents | Aggregate visibility: recurring risk patterns, compliance posture, knowledge coverage gaps |
| **New Hire / Junior Engineer** | Onboarding, no institutional memory | Access to the "tribal knowledge" of retiring seniors via captured lessons-learned |

## 5. Scope

### In scope — Hackathon MVP
- Multi-format document ingestion (PDF, scanned image, spreadsheet, plain text/email)
- Entity extraction (equipment tags, dates, personnel, regulatory references, procedures)
- Knowledge graph construction linking entities across documents
- RAG-powered **Expert Knowledge Copilot** with source citations and confidence scores
- **Lessons Learned & Failure Intelligence** surfacing (proactive, not just query-response)
- **Compliance Gap Agent** — lightweight version: maps a sample regulation set against ingested procedures
- Web dashboard + chat interface (desktop-first, mobile-responsive)

### Explicitly out of scope for hackathon (roadmap only)
- Live SCADA/IoT integration
- Full OCR pipeline for hand-annotated engineering drawings (P&ID parsing) — demo with a representative sample only
- Multi-tenant enterprise auth/SSO
- Fine-tuned domain LLM (use general-purpose LLM + RAG instead)
- Real-time document sync from enterprise systems (SharePoint, SAP, etc.)

## 6. Core Features (MoSCoW)

| Priority | Feature | Description |
|---|---|---|
| **Must** | Document Ingestion Pipeline | Multi-format upload → parse → chunk → embed |
| **Must** | Entity Extraction & Knowledge Graph | NER + relation extraction → graph DB |
| **Must** | Expert Knowledge Copilot | RAG chat with citations + confidence scores |
| **Must** | Cross-document Query Resolution | Answers requiring synthesis across ≥2 document types |
| **Should** | Lessons Learned Engine | Surfaces relevant past incidents proactively on matching conditions |
| **Should** | Compliance Gap Agent | Diffs procedures against regulatory text, flags gaps |
| **Could** | Knowledge Graph Visualizer | Interactive graph exploration UI |
| **Could** | Multi-language query support | Regional language input for field technicians |
| **Won't (this round)** | Live sensor/SCADA fusion | Out of scope — see Industrial Safety Intelligence track |

## 7. User Stories & Acceptance Criteria

**US-1:** As a field technician, I want to ask "Has pump P-204 failed before, and how was it fixed?" so that I don't repeat past mistakes.
- *AC:* System returns answer synthesized from ≥2 source documents (e.g., work order + inspection report), each cited with document name and page/section.

**US-2:** As a compliance officer, I want to see which safety procedures don't meet OISD-118 requirements, so I can fix gaps before an audit.
- *AC:* System outputs a ranked list of gaps with the specific regulatory clause and the specific procedure section that conflicts or is missing.

**US-3:** As a maintenance engineer, I want the system to warn me proactively when current conditions resemble a past incident, so I can intervene before it recurs.
- *AC:* Given a new work order description, system surfaces top 3 historically similar incidents with similarity rationale, without being explicitly asked.

**US-4:** As any user, I want to trust the answers, so I need to see exactly where information came from.
- *AC:* Every factual claim in a copilot response is traceable to a specific ingested document; system states its confidence level and flags when evidence is thin.

## 8. Functional Requirements

- **FR-1:** System shall accept PDF, DOCX, XLSX, CSV, TXT, and image (PNG/JPG scanned form) uploads.
- **FR-2:** System shall extract structured entities: equipment tags, personnel names, dates, regulatory clause references, procedure IDs.
- **FR-3:** System shall build and persist a knowledge graph linking entities across documents (e.g., Equipment ↔ WorkOrder ↔ Technician ↔ IncidentReport).
- **FR-4:** System shall support natural-language query via chat interface, returning cited, confidence-scored answers.
- **FR-5:** System shall detect and surface cross-document relationships not explicit in any single source (e.g., three separate near-miss reports referencing the same equipment class).
- **FR-6:** System shall flag and surface compliance gaps between ingested procedures and a reference regulatory corpus.
- **FR-7:** System shall log every query and answer with source citations for auditability.
- **FR-8:** System shall degrade gracefully — return "insufficient evidence" rather than a hallucinated answer when retrieval confidence is below threshold.

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Accuracy** | ≥85% entity extraction precision on test document set; citation must always resolve to a real source (0% fabricated citations) |
| **Latency** | Copilot response < 5s for cached corpus; ingestion of a 20-page PDF < 30s |
| **Auditability** | 100% of agent outputs must carry traceable citations |
| **Scalability** | Architecture must support horizontal scaling of ingestion workers and vector store sharding (design-time requirement, not hackathon-demo requirement) |
| **Security** | Document access should be attributable per-user (RBAC design in architecture, stub in demo) |
| **Availability** | Demo environment must survive live judge queries without manual intervention |

## 10. Success Metrics / KPIs (mapped to judging weights)

| Judging criterion | Weight | How we demonstrate it |
|---|---|---|
| Innovation (25%) | Knowledge-graph-backed cross-document reasoning, not single-doc RAG; proactive lessons-learned push |
| Business Impact (25%) | Quantify: reduction in "time-to-answer" (search minutes → seconds), audit prep time saved, downtime-avoidance narrative tied to BIS Research stat |
| Technical Excellence (20%) | Live entity extraction accuracy shown on stage; citation correctness verified live by judges asking their own questions |
| Scalability (15%) | Architecture doc shows path from 20-document demo corpus to enterprise-scale ingestion (see `architecture.md`) |
| User Experience (15%) | Mobile-first copilot for field techs; citations always one click from source |

## 11. Assumptions & Constraints

- Demo corpus will use a mix of real public industrial documents (OEM manuals, public safety standards excerpts, regulatory text) and realistic synthetic documents (work orders, inspection reports) generated to resemble real plant records, since real proprietary plant data is unavailable.
- General-purpose LLM (via API) used for extraction/generation — no time to fine-tune within hackathon window.
- Team has strong NLP/RAG/agent skills; geospatial and computer-vision components are deliberately minimized in MVP scope.

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Demo corpus too small to look "real" | Curate 15–20 documents across all target types before build starts (see `phases.md`) |
| Hallucinated citations undermine credibility with judges | Hard rule: no answer ships without a resolvable citation (see `rules.md`) |
| Judges perceive this as "just a RAG chatbot" | Lead every demo answer with the knowledge-graph relationship that a plain RAG system would have missed |
| Compliance agent oversimplifies real regulation | Explicitly scope demo to a small, well-defined regulatory excerpt (e.g., specific OISD-118 clauses) rather than claiming full coverage |

## 13. Why Not Just [Alternative]?

- **Generic ChatGPT/enterprise search:** No persistent entity linkage across documents; can't tell you a gas sensor reading correlates with an open hot-work permit three documents away.
- **SharePoint/Confluence search:** Keyword-based, no reasoning, no proactive surfacing, no compliance mapping.
- **Manual audit processes:** Point-in-time, doesn't scale, misses cross-referential patterns humans don't have time to find.

## 14. Judging Criteria Alignment Summary

See table in Section 10. Full architecture, phased build plan, agent behavior rules, UX design, and cross-session build memory are documented in the companion files: `architecture.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`.
