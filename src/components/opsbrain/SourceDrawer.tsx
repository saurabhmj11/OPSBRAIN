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
import { Loader2, FileText, Network } from "lucide-react";
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
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto scroll-area p-0"
      >
        {docId ? (
          <SourceContent key={docId} docId={docId} />
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Select a source to view.
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
      <SheetHeader className="px-5 py-4 border-b bg-card sticky top-0 z-10">
        <SheetTitle className="text-base flex items-center gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4 text-brand" />
          )}
          {doc?.docId ?? docId}
        </SheetTitle>
        <SheetDescription className="text-xs">
          {doc?.title ?? "Source document"}
        </SheetDescription>
      </SheetHeader>

      {loading ? (
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-brand" />
        </div>
      ) : doc ? (
        <div className="p-5 space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${DOC_TYPE_COLORS[doc.docType] ?? ""}`}>
              {doc.docType}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {doc.facility}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              via {doc.sourceSystem}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Ingested {new Date(doc.uploadedAt).toLocaleString()}
            </span>
          </div>

          {Object.keys(doc.meta).length > 0 && (
            <div className="bg-muted/40 rounded-md p-3 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Metadata
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(doc.meta).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entities */}
          {doc.entities.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Network className="size-3" /> Extracted entities ({doc.entities.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {doc.entities.map((e) => (
                  <Badge key={e.entityId} variant="outline" className="text-[9.5px] gap-1">
                    <span className="opacity-60">{e.type}:</span>
                    <span className="font-mono">{e.name}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chunks */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Chunks ({doc.chunks.length})
            </div>
            <div className="space-y-2.5">
              {doc.chunks.map((c) => (
                <div
                  key={c.id}
                  className="border rounded-md p-3 bg-card hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-muted-foreground">#{c.index}</span>
                      <span className="font-medium">{c.section}</span>
                    </div>
                    <span className="text-muted-foreground">p.{c.page}</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{c.text}</p>
                  {c.entityIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                      {c.entityIds.slice(0, 8).map((id) => (
                        <code
                          key={id}
                          className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono"
                        >
                          {id}
                        </code>
                      ))}
                      {c.entityIds.length > 8 && (
                        <span className="text-[9px] text-muted-foreground">
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
        <div className="p-6 text-center text-sm text-muted-foreground">
          Document not found.
        </div>
      )}
    </>
  );
}
