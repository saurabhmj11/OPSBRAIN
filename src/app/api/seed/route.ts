// Seed the corpus + regulatory clauses into the database.
// Also rebuilds the global IDF map for retrieval.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CORPUS } from "@/lib/corpus";
import { ingestDocument, rebuildGlobalIdf } from "@/lib/ingestion";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const startedAt = Date.now();
  try {
    // Wipe existing data — full reseed for idempotency
    await db.chunk.deleteMany();
    await db.relation.deleteMany();
    await db.entity.deleteMany();
    await db.document.deleteMany();
    await db.regulatoryClause.deleteMany();
    await db.complianceGap.deleteMany();
    await db.lessonsAlert.deleteMany();
    await db.queryLog.deleteMany();

    const results = [];
    for (const doc of CORPUS) {
      try {
        const result = await ingestDocument(doc);
        results.push({ docId: doc.docId, ...result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ docId: doc.docId, error: msg });
      }
    }

    // Rebuild global IDF map
    await rebuildGlobalIdf();

    // Seed regulatory clauses from corpus (only documents of type Regulation)
    const regDocs = CORPUS.filter((d) => d.docType === "Regulation");
    let clauseCount = 0;
    for (const r of regDocs) {
      const standard = r.meta.standard ?? "Unknown";
      for (const s of r.sections) {
        // Extract clause ID from heading like "Clause 4.3.2 — Inspection Interval"
        const m = s.heading.match(/Clause\s+(\d+\.\d+\.\d+)/i) || s.heading.match(/Section\s+(\d+[A-Z]?)/i);
        const clauseId = m ? `${standard}:${m[1]}` : `${standard}:${s.heading.slice(0, 30)}`;
        await db.regulatoryClause.upsert({
          where: { clauseId },
          create: {
            clauseId,
            standard,
            title: s.heading,
            text: s.body,
            category: standard.includes("OISD") ? "PressureSafety" : "FactoryAct",
          },
          update: {
            title: s.heading,
            text: s.body,
          },
        });
        clauseCount++;
      }
    }

    const elapsedMs = Date.now() - startedAt;
    return NextResponse.json({
      success: true,
      elapsedMs,
      documentsIngested: results.length,
      clausesSeeded: clauseCount,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const counts = {
    documents: await db.document.count(),
    chunks: await db.chunk.count(),
    entities: await db.entity.count(),
    relations: await db.relation.count(),
    clauses: await db.regulatoryClause.count(),
    gaps: await db.complianceGap.count(),
    alerts: await db.lessonsAlert.count(),
    queryLogs: await db.queryLog.count(),
  };
  return NextResponse.json({ counts });
}
