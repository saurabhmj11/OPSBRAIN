// OpsBrain hybrid retrieval pipeline.
// Stage 1: Vector (TF-IDF cosine) top-K.
// Stage 2: Graph expansion — for entities mentioned in top chunks, pull in chunks
//          that mention structurally-related entities (per architecture.md Section 7).
// Stage 3: Rerank by combined score (similarity * (1 + graph_bonus)).
// Stage 4: Confidence score = (top similarity) * (source agreement factor) * (recency factor).
//
// Per rules.md 2.2: fail closed on low confidence — caller must check confidence
// threshold before showing an answer.

import { db } from "@/lib/db";
import { tokenize, buildIdfMap } from "@/lib/ingestion";

const FAIL_CLOSED_THRESHOLD = 0.12;

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  docId: string;
  docType: string;
  title: string;
  text: string;
  section: string;
  page: number;
  similarity: number;
  graphExpanded: boolean;
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  confidence: number;
  aboveThreshold: boolean;
};

// ─── Stage 1: Vector Search (TF-IDF cosine similarity) ──────────────────────
//
// ⚠️ DEMO-SCALE ONLY: This implementation loads every chunk into memory per
// query (db.chunk.findMany with no scoping) and computes cosine similarity
// in JS. At 71 chunks this is sub-millisecond; at 200k chunks it would not
// work. Production path (per architecture.md Section 5 + 11): replace this
// with a real ANN vector index (Pinecone / Weaviate / pgvector) and shard by
// facility/business-unit. The graph-expansion step below already mirrors the
// production query plan — only the vector-search primitive is swapped.
export async function vectorSearch(query: string, topK = 20): Promise<RetrievedChunk[]> {
  const allChunks = await db.chunk.findMany({
    include: { document: true },
  });
  if (allChunks.length === 0) return [];

  // Build IDF map from all chunks
  const idf = buildIdfMap(allChunks.map((c) => c.text));
  const queryVec = computeQueryVector(query, idf);

  // Detect equipment tags / entity patterns in the query for entity-boost
  const queryEntityIds = new Set<string>();
  const entityPatterns: [RegExp, (m: string) => string][] = [
    [/\b([PVCBT])-(\d{2,4})\b/g, (m) => `EQ:${m}`],
    [/\bWO-(\d{3,5})\b/g, (m) => `WO:${m}`],
    [/\bINC-(\d{4})-(\d{3})\b/g, (m) => `INC:${m}`],
    [/\bNM-(\d{4})-(\d{3})\b/g, (m) => `NM:${m}`],
    [/\b(SOP|PR)-([A-Z]+)-(\d{3})\b/g, (m) => `PR:${m}`],
    [/OISD-(\d+)\s+Clause\s+(\d+\.\d+\.\d+)/gi, (m) => `REG:OISD-${m}:`],
  ];
  for (const [re, fn] of entityPatterns) {
    const matches = query.matchAll(re as RegExp);
    for (const m of matches) {
      queryEntityIds.add(fn(m[0]));
    }
  }

  const scored = allChunks.map((c) => {
    let embedding: Record<string, number> = {};
    try {
      embedding = JSON.parse(c.embedding || "{}");
    } catch {
      embedding = {};
    }
    let sim = cosineSim(queryVec, embedding);

    // Entity boost: if chunk mentions an entity that appears in the query, boost similarity
    let chunkEntityIds: string[] = [];
    try {
      chunkEntityIds = JSON.parse(c.entityIds || "[]");
    } catch {
      chunkEntityIds = [];
    }
    const entityOverlap = chunkEntityIds.filter((id) => queryEntityIds.has(id)).length;
    if (entityOverlap > 0) {
      sim += 0.15 * entityOverlap; // significant boost per matched entity
    }

    return {
      chunkId: c.id,
      documentId: c.documentId,
      docId: c.document.docId,
      docType: c.document.docType,
      title: c.document.title,
      text: c.text,
      section: c.section,
      page: c.page,
      similarity: sim,
      graphExpanded: false,
    };
  });
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

function computeQueryVector(
  query: string,
  idf: Map<string, number>
): Record<string, number> {
  const tokens = tokenize(query);
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
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

function cosineSim(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  for (const k of Object.keys(a)) {
    if (b[k] !== undefined) dot += a[k] * b[k];
  }
  // Both are L2-normalized, so dot product = cosine similarity
  return dot;
}

// ─── Stage 2: Graph Expansion ───────────────────────────────────────────────
// For each entity mentioned in the top-K chunks, find other chunks that mention
// the same entity OR entities related by the knowledge graph.

export async function graphExpand(
  seedChunks: RetrievedChunk[],
  topK = 10
): Promise<RetrievedChunk[]> {
  if (seedChunks.length === 0) return [];

  // Collect entity IDs from seed chunks
  const seedChunkIds = new Set(seedChunks.map((c) => c.chunkId));
  const seedChunksWithEntities = await db.chunk.findMany({
    where: { id: { in: Array.from(seedChunkIds) } },
    select: { id: true, entityIds: true },
  });
  const seedEntityIds = new Set<string>();
  for (const c of seedChunksWithEntities) {
    try {
      const ids: string[] = JSON.parse(c.entityIds || "[]");
      for (const id of ids) seedEntityIds.add(id);
    } catch {
      // skip
    }
  }
  if (seedEntityIds.size === 0) return [];

  // Find graph-related entities (1-hop neighbors)
  const seedEntityRecords = await db.entity.findMany({
    where: { entityId: { in: Array.from(seedEntityIds) } },
    select: { id: true, entityId: true },
  });
  const seedInternalIds = seedEntityRecords.map((e) => e.id);
  const entityIdToInternal = new Map(
    seedEntityRecords.map((e) => [e.entityId, e.id])
  );

  // Get related entity internal IDs (1-hop in either direction)
  const outRels = await db.relation.findMany({
    where: { sourceId: { in: seedInternalIds } },
    select: { targetId: true },
  });
  const inRels = await db.relation.findMany({
    where: { targetId: { in: seedInternalIds } },
    select: { sourceId: true },
  });
  const relatedInternalIds = new Set<string>([
    ...seedInternalIds,
    ...outRels.map((r) => r.targetId),
    ...inRels.map((r) => r.sourceId),
  ]);

  // Map internal IDs back to entityIds
  const relatedEntities = await db.entity.findMany({
    where: { id: { in: Array.from(relatedInternalIds) } },
    select: { id: true, entityId: true },
  });
  const relatedEntityIds = new Set(relatedEntities.map((e) => e.entityId));

  // Find chunks that mention any related entity, excluding seed chunks
  const allOtherChunks = await db.chunk.findMany({
    where: { id: { notIn: Array.from(seedChunkIds) } },
    include: { document: true },
  });

  const expanded: RetrievedChunk[] = [];
  for (const c of allOtherChunks) {
    let chunkEntityIds: string[] = [];
    try {
      chunkEntityIds = JSON.parse(c.entityIds || "[]");
    } catch {
      chunkEntityIds = [];
    }
    const overlap = chunkEntityIds.filter((id) => relatedEntityIds.has(id)).length;
    if (overlap > 0) {
      expanded.push({
        chunkId: c.id,
        documentId: c.documentId,
        docId: c.document.docId,
        docType: c.document.docType,
        title: c.document.title,
        text: c.text,
        section: c.section,
        page: c.page,
        similarity: 0.15 + overlap * 0.05, // graph bonus
        graphExpanded: true,
      });
    }
  }

  expanded.sort((a, b) => b.similarity - a.similarity);
  return expanded.slice(0, topK);
}

// ─── Stage 3: Rerank ────────────────────────────────────────────────────────
export function rerank(
  seedChunks: RetrievedChunk[],
  expandedChunks: RetrievedChunk[],
  topN = 6
): RetrievedChunk[] {
  // Merge & dedupe by chunkId
  const map = new Map<string, RetrievedChunk>();
  for (const c of seedChunks) map.set(c.chunkId, c);
  for (const c of expandedChunks) {
    const existing = map.get(c.chunkId);
    if (existing) {
      // Combine scores
      existing.similarity = Math.max(existing.similarity, c.similarity);
    } else {
      map.set(c.chunkId, c);
    }
  }
  const merged = Array.from(map.values());
  // Rerank: graph-expanded chunks get a small bonus (already in their similarity)
  merged.sort((a, b) => b.similarity - a.similarity);
  return merged.slice(0, topN);
}

// ─── Stage 4: Confidence Scoring ────────────────────────────────────────────
export function computeConfidence(chunks: RetrievedChunk[]): number {
  if (chunks.length === 0) return 0;
  // Factor 1: top similarity score
  const topSim = chunks[0].similarity;
  // Factor 2: source agreement (independent documents)
  const uniqueDocs = new Set(chunks.map((c) => c.docId)).size;
  const agreementFactor = Math.min(1.0, 0.7 + uniqueDocs * 0.1);
  // Factor 3: recency (newer docs = higher confidence; assume any date is fine)
  const recencyFactor = 1.0;
  const confidence = topSim * agreementFactor * recencyFactor;
  return Math.min(1.0, confidence);
}

// ─── Full Retrieval ─────────────────────────────────────────────────────────
export async function retrieve(query: string, topN = 6): Promise<RetrievalResult> {
  const seedChunks = await vectorSearch(query, 20);
  const expandedChunks = await graphExpand(seedChunks, 10);
  const reranked = rerank(seedChunks, expandedChunks, topN);
  const confidence = computeConfidence(reranked);
  return {
    chunks: reranked,
    confidence,
    aboveThreshold: confidence >= FAIL_CLOSED_THRESHOLD,
  };
}

// Re-export type alias used in retrieval helpers
export type { CorpusDoc } from "@/lib/corpus";
