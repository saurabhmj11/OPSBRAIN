// Copilot chat endpoint — RAG pipeline with mandatory citations + confidence.
// Per rules.md 2.1: no factual claim without citation. 2.2: fail closed on low confidence.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/retrieval";
import { llmComplete, PROMPTS } from "@/lib/llm";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatRequest = { query: string; history?: { role: string; content: string }[] };

export async function POST(req: Request) {
  // Rate limit (rules.md: every external API call wrapped with graceful degradation)
  const limited = checkRateLimit(req, "chat");
  if (limited) return limited;

  try {
    const body = (await req.json()) as ChatRequest;
    const query = (body.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Stage 1-4: retrieve
    const retrieval = await retrieve(query, 6);

    // Fail closed (rules.md 2.2)
    if (!retrieval.aboveThreshold || retrieval.chunks.length === 0) {
      const logEntry = await db.queryLog.create({
        data: {
          query,
          answer: "I don't have sufficient evidence to answer this confidently.",
          citations: "[]",
          confidence: retrieval.confidence,
          agentType: "Copilot",
        },
      });
      return NextResponse.json({
        answer:
          "I don't have sufficient evidence to answer this confidently. The ingested documents do not cover this topic. Try asking about Pump P-204, Compressor C-302, Valve V-118, or OISD-118 compliance.",
        citations: [],
        confidence: retrieval.confidence,
        queryLogId: logEntry.id,
        chunksConsidered: retrieval.chunks.length,
      });
    }

    // Build context with chunk indices for citation markers
    const context = retrieval.chunks
      .map(
        (c, i) =>
          `[C${i}] Document: ${c.docId} (${c.docType})\nSection: ${c.section} — Page ${c.page}\nText: ${c.text}`
      )
      .join("\n\n---\n\n");

    // Synthesis — per rules.md 2.1, prompt enforces citation markers
    const userPrompt = `User Question: ${query}\n\nRetrieved Context Chunks:\n${context}\n\nAnswer the user's question using ONLY the above context. Follow the output format strictly. Every factual sentence must end with a [C<n>] citation marker.`;

    let answer = "";
    try {
      answer = await llmComplete(PROMPTS.synthesis, userPrompt, {
        temperature: 0.3,
        maxTokens: 800,
        retries: 5,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // If LLM fails, return raw retrieved chunks as a fallback — never fabricate.
      answer = `I encountered an issue synthesizing the response, but here are the most relevant source chunks I retrieved:\n\n${retrieval.chunks
        .map((c, i) => `[C${i}] ${c.docId} — ${c.section}: ${c.text.slice(0, 300)}...`)
        .join("\n\n")}\n\nSources: ${retrieval.chunks.map((c) => c.docId).join(", ")}`;
    }

    // Build citations array
    const citations = retrieval.chunks.map((c, i) => ({
      index: i,
      docId: c.docId,
      docType: c.docType,
      title: c.title,
      section: c.section,
      page: c.page,
      text: c.text,
      graphExpanded: c.graphExpanded,
      similarity: c.similarity,
    }));

    const logEntry = await db.queryLog.create({
      data: {
        query,
        answer,
        citations: JSON.stringify(citations),
        confidence: retrieval.confidence,
        agentType: "Copilot",
      },
    });

    return NextResponse.json({
      answer,
      citations,
      confidence: retrieval.confidence,
      queryLogId: logEntry.id,
      chunksConsidered: retrieval.chunks.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
