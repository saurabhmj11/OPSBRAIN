// OpsBrain ingestion pipeline.
// Stage 1: Section-aware chunking with provenance metadata.
// Stage 2: LLM-based entity + relation extraction (rules.md 2.6 — strictly extractive).
// Stage 3: TF-IDF embedding generation (lightweight, hackathon-size corpus).
// Stage 4: Knowledge graph population (entities + relations).
//
// Per architecture.md Section 3.1: chunking is section-aware, ~300-500 tokens,
// metadata-tagged with doc_id, page, section, source_type.

import { db } from "@/lib/db";
import type { CorpusDoc } from "@/lib/corpus";
import { llmComplete, PROMPTS } from "@/lib/llm";

// ─── Stage 1: Chunking ──────────────────────────────────────────────────────
export type ChunkInput = {
  text: string;
  section: string;
  page: number;
  index: number;
};

export function chunkDocument(doc: CorpusDoc): ChunkInput[] {
  return doc.sections.map((s, i) => ({
    text: s.body,
    section: s.heading,
    page: s.page ?? 1,
    index: i,
  }));
}

// ─── Stage 2: Entity Extraction ─────────────────────────────────────────────
export type ExtractedEntity = {
  type: string;
  name: string;
  entityId: string;
};

export type ExtractedRelation = {
  source: string;
  type: string;
  target: string;
};

export type ExtractionResult = {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
};

export async function extractEntities(text: string): Promise<ExtractionResult> {
  // First try deterministic regex extraction for high-confidence entities
  // (rules.md 2.6 — strict extractive, never invent).
  const deterministic = deterministicExtract(text);

  // Then LLM extraction for relations and additional entities
  let llmResult: ExtractionResult = { entities: [], relations: [] };
  try {
    const raw = await llmComplete(
      PROMPTS.entityExtraction,
      `Extract entities and relations from this document chunk:\n\n"""\n${text}\n"""`,
      { temperature: 0.1, maxTokens: 1500 }
    );
    const jsonStr = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);
    llmResult = {
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      relations: Array.isArray(parsed.relations) ? parsed.relations : [],
    };
  } catch (e) {
    console.warn("[ingestion] LLM extraction failed, using deterministic only:", e);
  }

  // Merge: dedupe entities by entityId, prefer deterministic for equipment/regulatory
  const merged = mergeExtractions(deterministic, llmResult);
  return merged;
}

function deterministicExtract(text: string): ExtractionResult {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Equipment tags: P-204, V-118, C-302, T-203, etc.
  const equipMatches = text.matchAll(/\b([PVCBT])-(\d{2,4})\b/g);
  for (const m of equipMatches) {
    const name = m[0];
    const entityId = `EQ:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "Equipment", name, entityId });
    }
  }

  // Work order IDs: WO-XXXX
  const woMatches = text.matchAll(/\bWO-(\d{3,5})\b/g);
  for (const m of woMatches) {
    const name = `WO-${m[1]}`;
    const entityId = `WO:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "WorkOrder", name, entityId });
    }
  }

  // Incident IDs: INC-YYYY-NNN
  const incMatches = text.matchAll(/\bINC-(\d{4})-(\d{3})\b/g);
  for (const m of incMatches) {
    const name = `INC-${m[1]}-${m[2]}`;
    const entityId = `INC:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "Incident", name, entityId });
    }
  }

  // Near miss IDs: NM-YYYY-NNN
  const nmMatches = text.matchAll(/\bNM-(\d{4})-(\d{3})\b/g);
  for (const m of nmMatches) {
    const name = `NM-${m[1]}-${m[2]}`;
    const entityId = `NM:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "NearMiss", name, entityId });
    }
  }

  // Procedures/SOPs: SOP-XXX-NNN, PR-XXX-NNN
  const procMatches = text.matchAll(/\b(SOP|PR)-([A-Z]+)-(\d{3})\b/g);
  for (const m of procMatches) {
    const name = `${m[1]}-${m[2]}-${m[3]}`;
    const entityId = `PR:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "Procedure", name, entityId });
    }
  }

  // OEM manuals: OM-XXX-RevN
  const oemMatches = text.matchAll(/\bOM-([A-Z\d]+)-Rev(\d+)\b/g);
  for (const m of oemMatches) {
    const name = `OM-${m[1]}-Rev${m[2]}`;
    const entityId = `DOC:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "Document", name, entityId });
    }
  }

  // Regulatory clauses: OISD-118 Clause X.Y.Z or Section N
  const oisdMatches = text.matchAll(/OISD-(\d+)\s+Clause\s+(\d+\.\d+\.\d+)/gi);
  for (const m of oisdMatches) {
    const name = `OISD-${m[1]} Clause ${m[2]}`;
    const entityId = `REG:OISD-${m[1]}:${m[2]}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "RegulatoryClause", name, entityId });
    }
  }
  const sectionMatches = text.matchAll(/Section\s+(\d+[A-Z]?)/g);
  for (const m of sectionMatches) {
    const name = `Factories Act Section ${m[1]}`;
    const entityId = `REG:FactoryAct:${m[1]}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "RegulatoryClause", name, entityId });
    }
  }

  // Dates: YYYY-MM-DD
  const dateMatches = text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g);
  for (const m of dateMatches) {
    const name = `${m[1]}-${m[2]}-${m[3]}`;
    const entityId = `DATE:${name}`;
    if (!seen.has(entityId)) {
      seen.add(entityId);
      entities.push({ type: "Date", name, entityId });
    }
  }

  return { entities, relations: [] };
}

function mergeExtractions(a: ExtractionResult, b: ExtractionResult): ExtractionResult {
  const seen = new Set<string>();
  const entities: ExtractedEntity[] = [];
  for (const e of [...a.entities, ...b.entities]) {
    if (!seen.has(e.entityId)) {
      seen.add(e.entityId);
      entities.push(e);
    }
  }
  // Filter relations to those whose source/target both exist in merged entities
  const names = new Set(entities.map((e) => e.name));
  const relations = [...a.relations, ...b.relations].filter(
    (r) => names.has(r.source) && names.has(r.target)
  );
  return { entities, relations };
}

// ─── Stage 3: TF-IDF Embeddings ─────────────────────────────────────────────
// Lightweight TF-IDF for hackathon-scale corpus. Production would use sentence-transformers.
// Returns a sparse embedding { term: weight }.

export function computeTfidf(text: string, idfMap: Map<string, number>): Record<string, number> {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  const vec: Record<string, number> = {};
  const total = tokens.length || 1;
  for (const [term, count] of tf) {
    const idf = idfMap.get(term) ?? Math.log(1 + 1 / (1 + 1)); // fallback for unseen
    vec[term] = (count / total) * idf;
  }
  // L2 normalize
  const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
  for (const k of Object.keys(vec)) vec[k] /= norm;
  return vec;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "was", "were", "are", "been",
  "have", "has", "had", "not", "but", "his", "her", "their", "its", "all", "any",
  "per", "via", "may", "shall", "must", "will", "can", "did", "due", "than", "into",
  "onto", "over", "under", "such", "same", "during", "after", "before", "between",
  "within", "without", "about", "above", "below", "upon", "each", "every", "other",
  "more", "most", "less", "few", "many", "much", "some", "one", "two", "three",
  "first", "second", "third", "last", "next", "new", "old", "current", "prior",
  "present", "future", "past", "since", "until", "till", "while", "when", "where",
  "what", "which", "who", "whom", "how", "why", "whether", "either", "neither",
  "both", "also", "only", "just", "still", "even", "ever", "yet", "already",
]);

export function buildIdfMap(texts: string[]): Map<string, number> {
  const df = new Map<string, number>();
  const N = texts.length || 1;
  for (const text of texts) {
    const tokens = new Set(tokenize(text));
    for (const t of tokens) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log(1 + N / (1 + count)));
  }
  return idf;
}

// ─── Stage 4: Graph Population ──────────────────────────────────────────────
export async function persistChunk(
  documentId: string,
  chunk: ChunkInput,
  extraction: ExtractionResult,
  embedding: Record<string, number>
): Promise<string> {
  const created = await db.chunk.create({
    data: {
      documentId,
      index: chunk.index,
      text: chunk.text,
      section: chunk.section,
      page: chunk.page,
      embedding: JSON.stringify(embedding),
      entityIds: JSON.stringify(extraction.entities.map((e) => e.entityId)),
    },
  });
  return created.id;
}

export async function persistEntities(
  documentId: string,
  extraction: ExtractionResult
): Promise<Map<string, string>> {
  // Map entityId -> internal db id for relations
  const entityIdToDbId = new Map<string, string>();
  for (const e of extraction.entities) {
    // Skip dates — not first-class entities in the graph
    if (e.type === "Date") continue;
    const existing = await db.entity.findUnique({ where: { entityId: e.entityId } });
    if (existing) {
      entityIdToDbId.set(e.entityId, existing.id);
    } else {
      const created = await db.entity.create({
        data: {
          entityId: e.entityId,
          type: e.type,
          name: e.name,
          documentId,
          metaJson: "{}",
        },
      });
      entityIdToDbId.set(e.entityId, created.id);
    }
  }
  // Persist relations (deduplicated by unique constraint)
  for (const r of extraction.relations) {
    const srcEntity = extraction.entities.find((e) => e.name === r.source);
    const tgtEntity = extraction.entities.find((e) => e.name === r.target);
    if (!srcEntity || !tgtEntity) continue;
    const srcId = entityIdToDbId.get(srcEntity.entityId);
    const tgtId = entityIdToDbId.get(tgtEntity.entityId);
    if (!srcId || !tgtId) continue;
    try {
      await db.relation.create({
        data: { sourceId: srcId, targetId: tgtId, type: r.type, documentId },
      });
    } catch {
      // unique constraint violation — relation already exists, skip
    }
  }
  return entityIdToDbId;
}

// ─── Full Ingestion Flow ────────────────────────────────────────────────────
export async function ingestDocument(doc: CorpusDoc): Promise<{
  documentId: string;
  chunkCount: number;
  entityCount: number;
}> {
  // 1. Create document
  const document = await db.document.create({
    data: {
      docId: doc.docId,
      title: doc.title,
      docType: doc.docType,
      sourceSystem: doc.sourceSystem,
      facility: doc.facility,
      rawText: doc.sections.map((s) => s.body).join("\n\n"),
      metaJson: JSON.stringify(doc.meta),
    },
  });

  // 2. Chunk
  const chunks = chunkDocument(doc);

  // 3. Extract entities per chunk
  const allExtractions: ExtractionResult[] = [];
  for (const c of chunks) {
    const extraction = await extractEntities(c.text);
    allExtractions.push(extraction);
  }

  // 4. Build IDF map across all chunks of this document (and we'll rebuild globally later)
  const idfMap = buildIdfMap(chunks.map((c) => c.text));

  // 5. Persist chunks + embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const extraction = allExtractions[i];
    const embedding = computeTfidf(chunk.text, idfMap);
    await persistChunk(document.id, chunk, extraction, embedding);
  }

  // 6. Merge all extractions and persist entities + relations
  const merged: ExtractionResult = allExtractions.reduce(
    (acc, cur) => mergeExtractions(acc, cur),
    { entities: [], relations: [] }
  );
  await persistEntities(document.id, merged);

  return {
    documentId: document.id,
    chunkCount: chunks.length,
    entityCount: merged.entities.filter((e) => e.type !== "Date").length,
  };
}

// Rebuild the global IDF map after all documents ingested — improves retrieval quality.
export async function rebuildGlobalIdf(): Promise<Map<string, number>> {
  const chunks = await db.chunk.findMany({ select: { text: true } });
  const idf = buildIdfMap(chunks.map((c) => c.text));
  // Update all chunk embeddings
  for (const c of chunks) {
    const embedding = computeTfidf(c.text, idf);
    await db.chunk.updateMany({
      where: { text: c.text },
      data: { embedding: JSON.stringify(embedding) },
    });
  }
  return idf;
}
