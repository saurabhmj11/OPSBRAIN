// Document explorer endpoint.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const docId = url.searchParams.get("docId");
  const docType = url.searchParams.get("docType");

  if (docId) {
    const doc = await db.document.findUnique({
      where: { docId },
      include: { chunks: { orderBy: { index: "asc" } } },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const entities = await db.entity.findMany({
      where: { documentId: doc.id },
      select: { entityId: true, type: true, name: true },
    });
    return NextResponse.json({
      document: {
        ...doc,
        meta: JSON.parse(doc.metaJson || "{}"),
        chunks: doc.chunks.map((c) => ({
          ...c,
          entityIds: JSON.parse(c.entityIds || "[]"),
        })),
        entities,
      },
    });
  }

  const where = docType ? { docType } : {};
  const docs = await db.document.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      docId: d.docId,
      title: d.title,
      docType: d.docType,
      facility: d.facility,
      sourceSystem: d.sourceSystem,
      uploadedAt: d.uploadedAt,
      meta: JSON.parse(d.metaJson || "{}"),
      chunkCount: d._count.chunks,
    })),
  });
}
