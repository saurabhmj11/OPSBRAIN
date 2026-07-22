// Knowledge graph endpoint — returns nodes + edges for the visualizer.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const entities = await db.entity.findMany({
    include: {
      outRelations: { include: { target: true } },
      inRelations: { include: { source: true } },
    },
  });

  // Skip "Document" type for the visualizer — they'd clutter the graph;
  // they're accessible via Document Explorer.
  const visibleTypes = new Set([
    "Equipment",
    "Person",
    "Procedure",
    "RegulatoryClause",
    "Incident",
    "NearMiss",
    "WorkOrder",
  ]);
  const visibleEntities = entities.filter((e) => visibleTypes.has(e.type));

  const nodes = visibleEntities.map((e) => ({
    id: e.entityId,
    internalId: e.id,
    type: e.type,
    name: e.name,
    label: e.name,
    documentId: e.documentId,
  }));
  const nodeIds = new Set(visibleEntities.map((e) => e.id));

  const edges: { source: string; target: string; type: string }[] = [];
  for (const e of visibleEntities) {
    for (const r of e.outRelations) {
      if (nodeIds.has(r.targetId)) {
        edges.push({
          source: e.entityId,
          target: r.target.entityId,
          type: r.type,
        });
      }
    }
  }
  // Dedupe edges
  const edgeSet = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const key = `${e.source}|${e.target}|${e.type}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    return true;
  });

  // Compute entity counts by type
  const counts: Record<string, number> = {};
  for (const n of nodes) counts[n.type] = (counts[n.type] ?? 0) + 1;

  return NextResponse.json({
    nodes,
    edges: uniqueEdges,
    counts,
    totalNodes: nodes.length,
    totalEdges: uniqueEdges.length,
  });
}
