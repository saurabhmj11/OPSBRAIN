"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, RefreshCw, FileText } from "lucide-react";
import type { GapRecord } from "./types";
import { toast } from "sonner";

export function CompliancePanel({ openSource }: { openSource: (docId: string) => void }) {
  const [gaps, setGaps] = useState<GapRecord[]>([]);
  const [summary, setSummary] = useState<{ Covered: number; Partial: number; Gap: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<"all" | "Covered" | "Partial" | "Gap">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/compliance");
      const j = await r.json();
      setGaps(j.gaps ?? []);
      setSummary(j.summary ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analyze = async () => {
    setAnalyzing(true);
    const t = toast.loading("Running compliance gap analysis on all regulatory clauses…");
    try {
      const r = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      toast.success(`Analyzed ${j.total} clauses`, { id: t });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Analysis failed: ${msg}`, { id: t });
    } finally {
      setAnalyzing(false);
    }
  };

  const filtered = filter === "all" ? gaps : gaps.filter((g) => g.status === filter);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700" />
          <div>
            <h1 className="font-semibold text-base">Compliance Gap Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              OISD-118 + Factories Act 1948 · mapped against ingested procedures
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={analyze} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5 mr-1" /> Run analysis
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <SummaryCard
                label="Covered"
                count={summary.Covered ?? 0}
                icon={<ShieldCheck className="size-4" />}
                color="emerald"
                active={filter === "Covered"}
                onClick={() => setFilter(filter === "Covered" ? "all" : "Covered")}
              />
              <SummaryCard
                label="Partial"
                count={summary.Partial ?? 0}
                icon={<ShieldAlert className="size-4" />}
                color="amber"
                active={filter === "Partial"}
                onClick={() => setFilter(filter === "Partial" ? "all" : "Partial")}
              />
              <SummaryCard
                label="Gap"
                count={summary.Gap ?? 0}
                icon={<ShieldX className="size-4" />}
                color="rose"
                active={filter === "Gap"}
                onClick={() => setFilter(filter === "Gap" ? "all" : "Gap")}
              />
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin text-brand" />
              <span className="text-sm">Loading compliance status…</span>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {gaps.length === 0
                  ? "No analysis run yet. Click \"Run analysis\" to evaluate compliance."
                  : `No clauses match the "${filter}" filter.`}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((g) => (
                <Card key={g.clauseId} className="overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === g.clauseId ? null : g.clauseId)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <StatusIcon status={g.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {g.clause?.standard}
                          </code>
                          <span className="text-sm font-medium">{g.clause?.title ?? g.clauseId}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {g.rationale}
                        </div>
                      </div>
                      <StatusBadge status={g.status} />
                    </div>
                  </button>
                  {expanded === g.clauseId && (
                    <div className="px-4 pb-4 pt-1 border-t bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                            <ShieldX className="size-3" /> Regulatory Clause
                          </div>
                          <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs leading-relaxed">
                            <div className="font-mono text-[10px] text-rose-700 mb-1">
                              {g.clauseId}
                            </div>
                            {g.clause?.text ?? "Clause text unavailable."}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                            <FileText className="size-3" /> Covering Procedure
                          </div>
                          {g.procedureId ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs leading-relaxed">
                              <button
                                onClick={() => openSource(g.procedureId!)}
                                className="font-mono text-[10px] text-emerald-700 mb-1 hover:underline flex items-center gap-1"
                              >
                                <FileText className="size-3" />
                                {g.procedureId}
                              </button>
                              {g.evidence === "NOT FOUND"
                                ? "(no specific evidence extracted)"
                                : g.evidence}
                            </div>
                          ) : (
                            <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-800">
                              No covering procedure found in the corpus.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground bg-card rounded-md p-2.5 border">
                        <span className="font-medium">Rationale: </span>
                        {g.rationale}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: "emerald" | "amber" | "rose";
  active: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  } as const;
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-md border p-3 transition-all ${
        active ? `${colorMap[color]} ring-2 ring-offset-1 ring-current` : "bg-card hover:bg-accent/40"
      }`}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className={active ? "" : colorMap[color].split(" ").slice(0, 2).join(" ")}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{count}</div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Covered")
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
        Covered
      </Badge>
    );
  if (status === "Partial")
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
        Partial
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
      Gap
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Covered") return <ShieldCheck className="size-4 text-emerald-600 mt-0.5 shrink-0" />;
  if (status === "Partial") return <ShieldAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />;
  return <ShieldX className="size-4 text-rose-600 mt-0.5 shrink-0" />;
}
