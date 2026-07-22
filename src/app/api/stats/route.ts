// Stats endpoint — feeds the dashboard header.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const [
    documents,
    chunks,
    entities,
    relations,
    clauses,
    gaps,
    alerts,
    queryLogs,
  ] = await Promise.all([
    db.document.count(),
    db.chunk.count(),
    db.entity.count(),
    db.relation.count(),
    db.regulatoryClause.count(),
    db.complianceGap.count(),
    db.lessonsAlert.count(),
    db.queryLog.count(),
  ]);

  const docsByType = await db.document.groupBy({
    by: ["docType"],
    _count: { _all: true },
  });
  const entitiesByType = await db.entity.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  const gapSummary = await db.complianceGap.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return NextResponse.json({
    counts: { documents, chunks, entities, relations, clauses, gaps, alerts, queryLogs },
    docsByType: Object.fromEntries(docsByType.map((d) => [d.docType, d._count._all])),
    entitiesByType: Object.fromEntries(entitiesByType.map((e) => [e.type, e._count._all])),
    gapSummary: Object.fromEntries(gapSummary.map((g) => [g.status, g._count._all])),
  });
}
