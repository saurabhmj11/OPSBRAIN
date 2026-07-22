// Lessons Learned Agent endpoint.
// Given a trigger text (new work order or incident description), surface
// historically similar incidents via graph + vector similarity.
// Per rules.md 2.4: recommends escalation, never issues directives.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tokenize, buildIdfMap } from "@/lib/ingestion";
import { llmComplete, PROMPTS } from "@/lib/llm";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

type LessonsRequest = { triggerText: string; triggerRef?: string };

export async function POST(req: Request) {
  // Rate limit
  const limited = checkRateLimit(req, "lessons");
  if (limited) return limited;

  try {
    const body = (await req.json()) as LessonsRequest;
    const triggerText = (body.triggerText ?? "").trim();
    if (!triggerText) {
      return NextResponse.json({ error: "Missing triggerText" }, { status: 400 });
    }

    // Find all incident + near-miss documents
    const incidentDocs = await db.document.findMany({
      where: { docType: { in: ["IncidentReport", "NearMiss"] } },
      include: { chunks: true },
    });
    if (incidentDocs.length === 0) {
      return NextResponse.json({
        similarity: 0,
        matchedIncidents: [],
        rationale: "No historical incidents in the corpus to compare against.",
      });
    }

    // Compute similarity between triggerText and each incident doc
    const allTexts = [triggerText, ...incidentDocs.flatMap((d) => d.chunks.map((c) => c.text))];
    const idf = buildIdfMap(allTexts);
    const triggerVec = computeVec(triggerText, idf);

    const scoredIncidents = incidentDocs.map((doc) => {
      // Aggregate chunk embeddings
      const docVec: Record<string, number> = {};
      for (const c of doc.chunks) {
        let emb: Record<string, number> = {};
        try {
          emb = JSON.parse(c.embedding || "{}");
        } catch {
          emb = {};
        }
        for (const [k, v] of Object.entries(emb)) {
          docVec[k] = (docVec[k] ?? 0) + v;
        }
      }
      // normalize
      const norm = Math.sqrt(Object.values(docVec).reduce((s, v) => s + v * v, 0)) || 1;
      for (const k of Object.keys(docVec)) docVec[k] /= norm;
      // cosine sim with trigger
      let sim = 0;
      for (const [k, v] of Object.entries(triggerVec)) {
        if (docVec[k] !== undefined) sim += v * docVec[k];
      }
      return { doc, similarity: sim };
    });

    scoredIncidents.sort((a, b) => b.similarity - a.similarity);
    const topMatches = scoredIncidents.slice(0, 3).filter((m) => m.similarity > 0.05);

    if (topMatches.length === 0) {
      return NextResponse.json({
        similarity: 0,
        matchedIncidents: [],
        rationale: "No historically similar incidents found above similarity threshold.",
      });
    }

    // Build context for LLM to write rationale
    const matchedContext = topMatches
      .map(
        (m, i) =>
          `Match ${i + 1} (similarity ${m.similarity.toFixed(2)}):\nDocument: ${m.doc.docId} (${m.doc.docType})\nTitle: ${m.doc.title}\nExcerpt: ${m.doc.chunks
            .map((c) => c.text)
            .join(" ")
            .slice(0, 800)}`
      )
      .join("\n\n");

    const userPrompt = `Trigger text (new work order or incident):\n"""\n${triggerText}\n"""\n\nHistorically similar incidents retrieved from knowledge graph:\n${matchedContext}\n\nWrite the alert per the system instructions.`;

    let rationale = "";
    try {
      rationale = await llmComplete(PROMPTS.lessonsLearned, userPrompt, {
        temperature: 0.3,
        maxTokens: 600,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      rationale = `Similar incident(s) detected in the corpus (similarity: ${topMatches[0].similarity.toFixed(
        2
      )}). Reference: ${topMatches.map((m) => m.doc.docId).join(", ")}. LLM detail unavailable: ${msg}`;
    }

    // Persist the alert
    const matchedIds = topMatches.map((m) => m.doc.docId);
    const alert = await db.lessonsAlert.create({
      data: {
        triggerText,
        triggerRef: body.triggerRef ?? "",
        matchedIncidentIds: JSON.stringify(matchedIds),
        similarity: topMatches[0].similarity,
        rationale,
      },
    });

    return NextResponse.json({
      alertId: alert.id,
      similarity: topMatches[0].similarity,
      matchedIncidents: topMatches.map((m) => ({
        docId: m.doc.docId,
        docType: m.doc.docType,
        title: m.doc.title,
        similarity: m.similarity,
      })),
      rationale,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function computeVec(text: string, idf: Map<string, number>): Record<string, number> {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vec: Record<string, number> = {};
  const total = tokens.length || 1;
  for (const [term, count] of tf) {
    const idfVal = idf.get(term) ?? Math.log(2);
    vec[term] = (count / total) * idfVal;
  }
  const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
  for (const k of Object.keys(vec)) vec[k] /= norm;
  return vec;
}

// GET: list recent alerts
export async function GET() {
  const alerts = await db.lessonsAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      triggerText: a.triggerText,
      triggerRef: a.triggerRef,
      matchedIncidentIds: JSON.parse(a.matchedIncidentIds || "[]"),
      similarity: a.similarity,
      rationale: a.rationale,
      acknowledged: a.acknowledged,
      createdAt: a.createdAt,
    })),
  });
}
