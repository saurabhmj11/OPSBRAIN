"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Search, Filter, Layers, ExternalLink, Calendar, Server } from "lucide-react";
import type { DocumentRecord } from "./types";
import { DOC_TYPE_COLORS } from "./types";

export function DocumentsPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/documents")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setDocs(j.documents ?? []); })
      .catch((e) => console.error(e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const types = Array.from(new Set(docs.map((d) => d.docType)));
  const filtered = docs.filter((d) => {
    if (typeFilter !== "all" && d.docType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.docId.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.docType.toLowerCase().includes(q) ||
        (d.facility && d.facility.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header */}
      <div className="px-4 md:px-8 py-3.5 border-b bg-card/70 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center border border-brand/25 shadow-inner">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
                Ingested Document Hub
                <Badge variant="outline" className="text-[10px] font-mono bg-brand/10 text-brand border-brand/30">
                  {docs.length} Documents Indexed
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Corpus view of OEM manuals, work orders, SOPs, and regulatory documents
              </p>
            </div>
          </div>

          <div className="relative min-w-60 flex-1 md:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, facility, or type…"
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-area text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 rounded-lg border transition-all text-[11px] font-medium shrink-0 ${
              typeFilter === "all"
                ? "bg-brand text-brand-foreground border-brand font-semibold shadow-sm"
                : "bg-card hover:bg-accent/40 text-muted-foreground"
            }`}
          >
            All Documents ({docs.length})
          </button>

          {types.map((t) => {
            const count = docs.filter((d) => d.docType === t).length;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg border transition-all text-[11px] font-medium shrink-0 ${
                  typeFilter === t
                    ? "bg-brand text-brand-foreground border-brand font-semibold shadow-sm"
                    : "bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin text-brand" />
              <span className="text-sm">Loading ingested document index…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((d) => (
                <Card
                  key={d.id}
                  className="overflow-hidden border hover:border-brand/50 transition-all bg-card/80 backdrop-blur shadow-sm group cursor-pointer"
                  onClick={() => openSource(d.docId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Document Type Badge Icon */}
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center border shrink-0 shadow-sm ${
                          DOC_TYPE_COLORS[d.docType] ?? "bg-muted text-foreground border-border"
                        }`}
                      >
                        <FileText className="size-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono font-bold">
                              {d.docId}
                            </code>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {d.docType}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-mono bg-brand/10 text-brand border-brand/30">
                              <Layers className="size-2.5 mr-1" />
                              {d.chunkCount} Chunks
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Calendar className="size-3" />
                            {new Date(d.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-sm font-bold text-foreground group-hover:text-brand transition-colors flex items-center justify-between">
                          <span className="truncate">{d.title}</span>
                          <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                        </div>

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t">
                          {d.facility && (
                            <span className="flex items-center gap-1">
                              <Server className="size-3 text-muted-foreground/70" />
                              <span>Facility:</span> <strong className="text-foreground">{d.facility}</strong>
                            </span>
                          )}
                          {d.sourceSystem && (
                            <span>
                              <span>Source:</span> <strong className="text-foreground">{d.sourceSystem}</strong>
                            </span>
                          )}
                          {Object.entries(d.meta).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="bg-muted/40 px-2 py-0.5 rounded border text-[10.5px]">
                              <span className="opacity-70">{k}:</span> <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filtered.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="pt-8 pb-8 text-center text-sm text-muted-foreground">
                    No documents found matching &ldquo;{search}&rdquo;.
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
