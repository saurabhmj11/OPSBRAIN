"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Network, Layers, Calendar, Server, Tag } from "lucide-react";
import { DOC_TYPE_COLORS } from "./types";

type DocDetail = {
  id: string;
  docId: string;
  title: string;
  docType: string;
  facility: string;
  sourceSystem: string;
  uploadedAt: string;
  meta: Record<string, string>;
  chunks: {
    id: string;
    index: number;
    text: string;
    section: string;
    page: number;
    entityIds: string[];
  }[];
  entities: { entityId: string; type: string; name: string }[];
};

export function SourceDrawer({
  docId,
  onClose,
}: {
  docId: string | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!docId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto scroll-area p-0 border-l shadow-2xl"
      >
        {docId ? (
          <SourceContent key={docId} docId={docId} />
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Select a document source to inspect.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SourceContent({ docId }: { docId: string }) {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/documents?docId=${encodeURIComponent(docId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.document) setDoc(j.document);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docId]);

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b bg-card/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <SheetTitle className="text-base font-bold flex items-center gap-2.5">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-brand" />
          ) : (
            <div className="size-7 rounded-lg bg-brand/15 text-brand flex items-center justify-center border border-brand/30">
              <FileText className="size-4" />
            </div>
          )}
          <span className="font-mono text-foreground">{doc?.docId ?? docId}</span>
        </SheetTitle>
        <SheetDescription className="text-xs text-muted-foreground line-clamp-1 font-medium">
          {doc?.title ?? "Loading document inspector..."}
        </SheetDescription>
      </SheetHeader>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-brand" />
          <span className="text-xs">Fetching source document details & chunks…</span>
        </div>
      ) : doc ? (
        <div className="p-6 space-y-5">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-[10.5px] font-bold ${DOC_TYPE_COLORS[doc.docType] ?? ""}`}>
              {doc.docType}
            </Badge>
            {doc.facility && (
              <Badge variant="outline" className="text-[10.5px] font-mono gap-1 bg-muted">
                <Server className="size-2.5" /> {doc.facility}
              </Badge>
            )}
            {doc.sourceSystem && (
              <Badge variant="outline" className="text-[10.5px] font-mono bg-muted">
                via {doc.sourceSystem}
              </Badge>
            )}
            <span className="text-[10.5px] text-muted-foreground ml-auto font-mono flex items-center gap-1">
              <Calendar className="size-3" /> {new Date(doc.uploadedAt).toLocaleString()}
            </span>
          </div>

          {/* Key-Value Metadata Grid */}
          {Object.keys(doc.meta).length > 0 && (
            <div className="bg-muted/40 rounded-xl p-3.5 text-xs border space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="size-3" /> Extracted Document Attributes
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {Object.entries(doc.meta).map(([k, v]) => (
                  <div key={k} className="bg-card/70 px-2.5 py-1 rounded-lg border text-[11px]">
                    <span className="text-muted-foreground">{k}: </span>
                    <strong className="text-foreground font-mono">{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Entities */}
          {doc.entities.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Network className="size-3 text-amber-500" /> Extracted Graph Entities
                </span>
                <span className="font-mono text-brand text-[10px]">{doc.entities.length} Nodes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {doc.entities.map((e) => (
                  <Badge key={e.entityId} variant="outline" className="text-[10px] font-mono gap-1 bg-card">
                    <span className="opacity-60">{e.type}:</span>
                    <strong className="text-foreground">{e.name}</strong>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chunks View */}
          <div className="space-y-3 pt-2 border-t">
            <div className="text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Layers className="size-3 text-brand" /> Document Vector Chunks
              </span>
              <span className="font-mono text-muted-foreground text-[10px]">{doc.chunks.length} Chunks</span>
            </div>

            <div className="space-y-3">
              {doc.chunks.map((c) => (
                <div
                  key={c.id}
                  className="border rounded-xl p-4 bg-card/80 backdrop-blur space-y-2 hover:border-brand/40 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between text-[11px] border-b pb-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-brand font-bold">#{c.index}</span>
                      <span className="font-semibold text-foreground">{c.section}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">Page {c.page}</span>
                  </div>

                  <p className="text-xs leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap">
                    {c.text}
                  </p>

                  {c.entityIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-2 border-t text-[10px]">
                      <span className="text-muted-foreground mr-1">Entities:</span>
                      {c.entityIds.slice(0, 8).map((id) => (
                        <code
                          key={id}
                          className="bg-muted px-1.5 py-0.5 rounded font-mono text-[9.5px] text-brand"
                        >
                          {id}
                        </code>
                      ))}
                      {c.entityIds.length > 8 && (
                        <span className="text-[9.5px] text-muted-foreground">
                          +{c.entityIds.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Document not found in ingested index.
        </div>
      )}
    </>
  );
}
