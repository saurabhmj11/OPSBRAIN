# design.md — UX & Product Design

**Companion to:** `PRD.md`, `architecture.md`

---

## 1. Design Principles

1. **Citations are always one tap away.** Trust is the product's core value proposition — never make a user hunt for where an answer came from.
2. **Field-first, not desk-first.** The highest-frequency user (field technician) is on a phone, possibly with gloves on, possibly with poor connectivity. Design for that constraint first, then layer in desktop density for engineers/managers.
3. **Show confidence, don't hide uncertainty.** Low-confidence answers are visually distinct from high-confidence ones — never let the UI imply more certainty than the system has.
4. **Proactive surfaces are separated from reactive answers.** A pushed "lessons learned" alert should never be visually confused with an answer the user asked for — different affordance, different color language.
5. **The graph is a tool, not decoration.** The Knowledge Graph Visualizer must let an engineer actually navigate to source documents, not just look impressive on a screen.

## 2. Primary User Flows

### Flow A — Field Technician Quick Query (mobile)
1. Open app → single prominent search/chat bar (no dashboard clutter).
2. Type or voice-input query: "Has pump P-204 failed before?"
3. Answer streams in with 2–3 sentence synthesis + confidence badge.
4. Citations shown as tappable chips below the answer (e.g., `[Work Order #4521]`, `[Inspection Report Mar 2025]`).
5. Tap a chip → source document opens with the relevant section highlighted/scrolled-to.

### Flow B — Maintenance Engineer Root-Cause Investigation (desktop)
1. Engineer opens Copilot in desktop mode — split view: chat on left, Knowledge Graph Visualizer on right.
2. Asks a synthesis question; answer appears in chat, and the relevant graph nodes/edges auto-highlight in the visualizer.
3. Engineer clicks a graph node (e.g., the equipment node) → side panel shows all connected documents, incidents, work orders.
4. Engineer can pivot the graph view from any node without re-querying the chat.

### Flow C — Compliance Officer Audit Prep
1. Opens Compliance Dashboard.
2. Sees a table: Regulatory Clause | Covering Procedure | Status (Covered / Partial / Gap) | Evidence link.
3. Filters by status = Gap.
4. Clicks a gap row → side-by-side view: clause text vs. closest-matching procedure text, with the specific missing element highlighted.
5. Exports gap report (PDF) for audit submission.

### Flow D — Proactive Lessons Learned (push, any persona)
1. New work order/incident text is entered/ingested into the system by any user.
2. If the Lessons Learned Agent finds a high-similarity historical match, a distinct alert card appears (not inline in chat) with: "This resembles Incident #221 (Jan 2024) — similarity: [rationale]."
3. User can accept ("acknowledge, reviewed") or expand for full historical detail.

## 3. Screens

| Screen | Purpose | Priority |
|---|---|---|
| Copilot Chat | Core Q&A interface, citation-first | Must |
| Knowledge Graph Visualizer | Cross-document exploration | Should |
| Compliance Dashboard | Gap analysis table + detail view | Should |
| Lessons Learned Feed | Chronological proactive alerts | Should |
| Document Explorer | Browse/search raw ingested documents | Could |
| Admin/Ingestion Status | Upload + pipeline processing status | Could |

## 4. Wireframe Notes (text description — build in Figma/code, not here)

**Copilot Chat screen:**
- Top bar: minimal, plant/facility selector only.
- Main area: chat thread, user messages right-aligned, agent answers left-aligned with a distinct "agent" avatar.
- Each agent answer: text block → confidence badge (High/Medium/Low, color-coded green/amber/red) → citation chip row → "was this helpful" micro-feedback (thumbs).
- Input bar: text + voice-input icon (field technician use case), sticky to bottom on mobile.

**Knowledge Graph Visualizer:**
- Force-directed graph, node color by entity type (Equipment=blue, Document=grey, Person=purple, Incident=red, Procedure=green).
- Click node → right-side drawer with entity details + linked documents list.
- Search-to-focus: typing an equipment tag pans/zooms to that node.

**Compliance Dashboard:**
- Table view, status column color-coded (Gap=red, Partial=amber, Covered=green).
- Row expansion reveals clause-vs-procedure diff view, not a separate page — keeps audit review fast.

## 5. Design System (lightweight, for hackathon speed)

- **Typography:** System font stack (e.g., Inter) for build speed; clear hierarchy (16px body, 20px section headers, 14px citation chips/metadata).
- **Color language:**
  - Confidence: Green (high) / Amber (medium) / Red (low, "insufficient evidence")
  - Compliance status: Green (covered) / Amber (partial) / Red (gap)
  - Proactive alerts: distinct accent color (e.g., indigo) never reused for confidence/compliance, so users don't conflate meanings
- **Spacing/density:** Compact on desktop (engineers value density), generous touch targets on mobile (field technicians, gloves, one-handed use).

## 6. Accessibility & Field Conditions

- High-contrast mode for outdoor/bright-light mobile use.
- Voice input for field technicians who can't type easily on-site.
- Offline-tolerant queue: if connectivity drops mid-query on mobile, queue and retry rather than silently failing (design intent for production; can be a stated roadmap item if not built for hackathon).

## 7. What "Good" Looks Like in the Demo

The single best UX moment to engineer for judges: a technician asks a plain-English question on a phone screen, gets a synthesized answer with visible citations from two different document types, taps a citation, and the actual source document opens with the relevant passage highlighted — all in under 10 seconds, live, unscripted.
