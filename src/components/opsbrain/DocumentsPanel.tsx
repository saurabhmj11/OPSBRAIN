"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Search } from "lucide-react";
import type { DocumentRecord } from "./types";
import { DOC_TYPE_COLORS } from "./types";

export function DocumentsPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/documents");
      const j = await r.json();
      setDocs(j.documents ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const types = Array.from(new Set(docs.map((d) => d.docType)));
  const filtered = docs.filter((d) => {
    if (typeFilter !== "all" && d.docType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.docId.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.docType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-5 text-brand" />
          <div>
            <h1 className="font-semibold text-base">Document Explorer</h1>
            <p className="text-xs text-muted-foreground">
              All ingested documents · {docs.length} total · click any row to view chunks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doc ID, title, or type…"
              className="pl-7 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                typeFilter === "all" ? "bg-brand text-brand-foreground border-brand" : "bg-card hover:bg-accent/40"
              }`}
            >
              All ({docs.length})
            </button>
            {types.map((t) => {
              const count = docs.filter((d) => d.docType === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                    typeFilter === t ? "bg-brand text-brand-foreground border-brand" : "bg-card hover:bg-accent/40"
                  }`}
                >
                  {t} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-brand" />
              <span className="text-sm">Loading documents…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => (
                <Card key={d.id} className="overflow-hidden hover:border-brand/40 transition-colors">
                  <button
                    onClick={() => openSource(d.docId)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`size-9 rounded-md flex items-center justify-center border shrink-0 ${DOC_TYPE_COLORS[d.docType] ?? "bg-muted"}`}>
                        <FileText className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {d.docId}
                          </code>
                          <Badge variant="outline" className="text-[10px]">
                            {d.docType}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {d.chunkCount} chunks
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(d.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm font-medium mt-1 line-clamp-1">{d.title}</div>
                        {Object.keys(d.meta).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(d.meta).slice(0, 4).map(([k, v]) => (
                              <span key={k} className="text-[10px] text-muted-foreground">
                                <span className="opacity-60">{k}:</span> <span className="font-medium">{v}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
              {filtered.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                    No documents match filters.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
