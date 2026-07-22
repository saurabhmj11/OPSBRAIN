# rules.md — Development & Agent Behavior Rules

**Purpose:** This is the binding rulebook for two audiences: (1) anyone/any AI assistant building OpsBrain, and (2) the in-product agents themselves at runtime. Treat this as the constitution — architecture and code decisions should be checked against it.

---

## 1. Development Rules

### 1.1 Repo & code structure
- Monorepo layout: `/ingestion`, `/graph`, `/retrieval`, `/agents`, `/api`, `/frontend`, `/docs`.
- No business logic in the API layer — routes call orchestration functions, never inline logic.
- Every ingestion/extraction function must be independently testable without a live LLM call (mock the LLM boundary).

### 1.2 Coding standards
- Python: type-hinted, `black`-formatted, one responsibility per module.
- All LLM prompts stored as versioned template files (`/agents/prompts/*.md`), never inlined as raw strings in application code — makes prompt iteration and auditing possible.
- Every external API call (LLM, OCR, embeddings) wrapped with timeout + retry + graceful degradation.

### 1.3 Commit & documentation discipline
- Commit messages describe *why*, not just *what* (e.g., `fix: reject citations below confidence 0.6 — was surfacing weak matches as fact`).
- Any change to the knowledge graph schema must be reflected same-commit in `architecture.md` Section 6 and logged in `memory.md`.

### 1.4 Demo-readiness discipline
- No feature is "done" until it survives a live, un-rehearsed query — not just the scripted demo path.
- Freeze feature work at least 3 hours before presentation; remaining time is testing + fallback prep only (see `phases.md`).

---

## 2. In-Product Agent Behavior Rules (runtime guardrails)

These rules are enforced in the agent orchestration layer, not just suggested in prompts — violations should be structurally prevented where possible, not just discouraged.

### 2.1 Citation is non-negotiable
- **Rule:** No factual claim may appear in a copilot response without a resolvable citation to an ingested source document (doc ID + location).
- **Enforcement:** The synthesis step must return claims as structured `{text, source_chunk_ids}` pairs; any claim with an empty `source_chunk_ids` list is stripped before the response reaches the user, not just flagged.

### 2.2 Fail closed on low confidence
- **Rule:** If retrieval confidence is below a defined threshold, the agent must respond "I don't have sufficient evidence to answer this confidently" rather than generate a best-guess answer.
- **Rationale:** In a safety/compliance-relevant domain, a confident wrong answer is worse than an honest non-answer.

### 2.3 One quote budget, otherwise paraphrase
- When synthesizing from source documents, the agent should paraphrase document content rather than reproduce large verbatim blocks — keeps outputs auditable and avoids misrepresenting a paraphrase as an exact procedural quote.
- Exact wording is preserved only for safety-critical instructions or regulatory clause text, where precision matters more than brevity — and even then, flagged visibly as a direct quote.

### 2.4 Scope discipline per agent
- The **Compliance Gap Agent** may only read `Procedure` and `RegulatoryClause` nodes — it must not access `Person` or unrelated `Incident` data, even if technically reachable in the graph.
- The **Lessons Learned Agent** surfaces patterns; it does not issue directives ("shut down the plant") — it recommends escalation to a human role.
- No agent takes an autonomous action with real-world effect (e.g., no auto-filing of a regulatory report) without an explicit human confirmation step. This is a knowledge/decision-support system, not an autonomous control system.

### 2.5 Escalation over silent failure
- If entity extraction confidence is low for a safety-critical document (e.g., an incident report), the system flags it for human review rather than silently ingesting it as-is.

### 2.6 No fabricated entities
- The extraction agent must not invent equipment tags, personnel names, or regulatory clause numbers that don't appear in source text — extraction is strictly extractive, not generative, for identifiers.

### 2.7 Transparency about limitations
- When a user asks a question the corpus cannot answer (e.g., about equipment not in the ingested document set), the agent states this plainly rather than generalizing from unrelated equipment.

---

## 3. Data Handling Rules

- Uploaded documents are processed only for the purpose of answering queries within the platform — not used to train external models.
- Personnel names extracted as entities are access-controlled; exported reports default to role-redacted unless explicitly authorized.
- Regulatory corpus text is sourced from publicly available standards excerpts only, for the hackathon demo.

## 4. QA Checklist Before Any Demo/Submission

- [ ] Every sample query in the demo script returns citations that resolve to real, visible source documents.
- [ ] At least one "trick" query is tested where the correct answer is "I don't know" — confirm the system doesn't hallucinate.
- [ ] Knowledge graph visualizer renders without manual data massaging.
- [ ] Compliance gap output reviewed against the actual regulatory excerpt used — no overstated coverage claims.
- [ ] Judges can ask an off-script question live without the system breaking.
