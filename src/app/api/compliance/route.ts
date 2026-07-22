// Compliance Gap Agent endpoint.
// Per rules.md 2.4: only reads Procedure + RegulatoryClause nodes.
// Per D-005: scoped to small specific regulatory excerpt — don't overclaim.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/retrieval";
import { llmComplete, PROMPTS } from "@/lib/llm";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 180;

// POST: run gap analysis on all clauses (or a specific clause)
export async function POST(req: Request) {
  // Rate limit
  const limited = checkRateLimit(req, "compliance");
  if (limited) return limited;

  try {
    const url = new URL(req.url);
    const onlyClauseId = url.searchParams.get("clauseId");
    const body = (await req.json().catch(() => ({}))) as { regenerate?: boolean };

    const where = onlyClauseId ? { clauseId: onlyClauseId } : {};
    const clauses = await db.regulatoryClause.findMany({ where });
    if (clauses.length === 0) {
      return NextResponse.json({ error: "No regulatory clauses seeded. Run /api/seed first." }, { status: 400 });
    }

    type GapResult = {
      clauseId: string;
      standard: string;
      title: string;
      clauseText: string;
      status: string;
      procedureId: string | null | undefined;
      evidence: string;
      rationale: string;
    };
    const results: GapResult[] = [];
    for (const clause of clauses) {
      // Skip if already analyzed unless regenerate
      const existing = await db.complianceGap.findUnique({ where: { clauseId: clause.clauseId } });
      if (existing && !body.regenerate) {
        results.push({
          clauseId: clause.clauseId,
          standard: clause.standard,
          title: clause.title,
          clauseText: clause.text,
          status: existing.status,
          procedureId: existing.procedureId,
          evidence: existing.evidence,
          rationale: existing.rationale,
        });
        continue;
      }

      // Retrieve procedure chunks relevant to this clause
      // (Rules.md 2.4: agent only reads Procedure + RegulatoryClause nodes)
      const retrievalQuery = `${clause.title} ${clause.text}`;
      const retrieval = await retrieve(retrievalQuery, 4);

      // Filter to only Procedures + SOPs (rules.md 2.4 — scope discipline)
      const procedureChunks = retrieval.chunks.filter((c) =>
        ["Procedure", "SOP"].includes(c.docType)
      );

      let analysis: { status: string; evidence: string; rationale: string; procedureId?: string } = {
        status: "Gap",
        evidence: "NOT FOUND",
        rationale: "No procedure documents in the corpus address this clause.",
      };

      if (procedureChunks.length > 0) {
        const context = procedureChunks
          .map((c, i) => `[C${i}] Document: ${c.docId} (${c.docType})\nSection: ${c.section}\nText: ${c.text}`)
          .join("\n\n");
        const userPrompt = `Regulatory Clause:\nClause ID: ${clause.clauseId}\nStandard: ${clause.standard}\nTitle: ${clause.title}\nText: ${clause.text}\n\nRetrieved Procedure Chunks:\n${context}\n\nClassify whether the procedures cover this clause. Return JSON only.`;
        try {
          const raw = await llmComplete(PROMPTS.complianceGap, userPrompt, {
            temperature: 0.1,
            maxTokens: 500,
          });
          const parsed = JSON.parse(
            raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
          );
          analysis = {
            status: parsed.status ?? "Gap",
            evidence: parsed.evidence ?? "NOT FOUND",
            rationale: parsed.rationale ?? "No rationale provided.",
            procedureId: procedureChunks[0]?.docId,
          };
        } catch (e) {
          // Fallback: heuristic coverage — if we retrieved procedure chunks with high similarity, mark Partial
          const topSim = procedureChunks[0]?.similarity ?? 0;
          analysis = {
            status: topSim > 0.2 ? "Partial" : "Gap",
            evidence: procedureChunks[0]?.text.slice(0, 300) ?? "NOT FOUND",
            rationale: `Heuristic: best-matching procedure chunk had similarity ${topSim.toFixed(2)}.`,
            procedureId: procedureChunks[0]?.docId,
          };
        }
      }

      // Upsert gap record
      await db.complianceGap.upsert({
        where: { clauseId: clause.clauseId },
        create: {
          clauseId: clause.clauseId,
          status: analysis.status,
          procedureId: analysis.procedureId,
          evidence: analysis.evidence,
          rationale: analysis.rationale,
        },
        update: {
          status: analysis.status,
          procedureId: analysis.procedureId,
          evidence: analysis.evidence,
          rationale: analysis.rationale,
          lastChecked: new Date(),
        },
      });

      results.push({
        clauseId: clause.clauseId,
        standard: clause.standard,
        title: clause.title,
        clauseText: clause.text,
        status: analysis.status,
        procedureId: analysis.procedureId,
        evidence: analysis.evidence,
        rationale: analysis.rationale,
      });
    }

    return NextResponse.json({ gaps: results, total: results.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const gaps = await db.complianceGap.findMany({
    orderBy: [{ status: "asc" }, { clauseId: "asc" }],
  });
  const clauses = await db.regulatoryClause.findMany();
  const clauseMap = new Map(clauses.map((c) => [c.clauseId, c]));
  return NextResponse.json({
    gaps: gaps.map((g) => ({
      ...g,
      clause: clauseMap.get(g.clauseId),
    })),
    summary: {
      total: gaps.length,
      covered: gaps.filter((g) => g.status === "Covered").length,
      partial: gaps.filter((g) => g.status === "Partial").length,
      gap: gaps.filter((g) => g.status === "Gap").length,
    },
  });
}
