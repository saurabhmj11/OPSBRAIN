"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, RefreshCw, FileText, CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles, Filter } from "lucide-react";
import type { GapRecord } from "./types";
import { toast } from "sonner";

export function CompliancePanel({ openSource }: { openSource: (docId: string) => void }) {
  const [gaps, setGaps] = useState<GapRecord[]>([]);
  const [summary, setSummary] = useState<{ Covered: number; Partial: number; Gap: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<"all" | "Covered" | "Partial" | "Gap">("all");
  const [standardFilter, setStandardFilter] = useState<string>("all");
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
    const t = toast.loading("Running automated compliance audit on all regulatory clauses...");
    try {
      const r = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      toast.success(`Compliance audit finished across ${j.total} clauses`, { id: t });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Analysis failed: ${msg}`, { id: t });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDraftRevision = (clauseId: string) => {
    toast.success(`Draft SOP revision requested for ${clauseId}. Task queued for engineering review.`);
  };

  // Filter clauses by status and standard
  const filtered = gaps.filter((g) => {
    if (filter !== "all" && g.status !== filter) return false;
    if (standardFilter !== "all" && g.clause?.standard !== standardFilter) return false;
    return true;
  });

  const totalCount = gaps.length;
  const coveredCount = summary?.Covered ?? 0;
  const complianceScore = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-4 md:px-8 py-3.5 border-b bg-card/70 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25 shadow-inner">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Compliance Command Center
              <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                OISD-118 + Factories Act
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Automated audit of plant procedures against mandatory statutory clauses
            </p>
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={analyze} disabled={analyzing} className="h-8 text-xs font-semibold">
          {analyzing ? (
            <>
              <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Auditing Clauses…
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5 mr-1.5" /> Re-run Compliance Audit
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Score Banner */}
          {summary && (
            <Card className="border bg-card/80 backdrop-blur">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Gauge Progress Score */}
                  <div className="flex items-center gap-4">
                    <div className="relative size-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xl font-mono shadow-sm">
                      {complianceScore}%
                    </div>
                    <div>
                      <div className="font-bold text-base flex items-center gap-2">
                        Plant Compliance Index
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                          Audited
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {coveredCount} of {totalCount} regulatory clauses fully covered by plant procedures.
                      </p>
                    </div>
                  </div>

                  {/* Summary Status Filters */}
                  <div className="grid grid-cols-3 gap-2">
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standard Tabs Filter */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="size-3" /> Standard:
              </span>
              {["all", "OISD-118", "Factories Act 1948"].map((std) => (
                <button
                  key={std}
                  onClick={() => setStandardFilter(std)}
                  className={`px-3 py-1 rounded-lg border transition-all text-[11px] ${
                    standardFilter === std
                      ? "bg-brand text-brand-foreground border-brand font-semibold shadow-sm"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {std === "all" ? "All Standards" : std}
                </button>
              ))}
            </div>

            <span className="text-muted-foreground font-mono text-[11px]">
              Showing {filtered.length} of {totalCount} clauses
            </span>
          </div>

          {/* Clauses List */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin text-brand" />
              <span className="text-sm">Evaluating regulatory coverage…</span>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center text-sm text-muted-foreground">
                {gaps.length === 0
                  ? 'No compliance evaluation found. Click "Re-run Compliance Audit" above.'
                  : `No regulatory clauses match the selected filters.`}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((g) => {
                const isExpanded = expanded === g.clauseId;
                return (
                  <Card key={g.clauseId} className="overflow-hidden border hover:border-brand/40 transition-all bg-card/80 backdrop-blur shadow-sm">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : g.clauseId)}
                      className="w-full text-left px-5 py-4 hover:bg-accent/40 transition-colors flex items-start gap-4"
                    >
                      <StatusIcon status={g.status} />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono font-bold text-foreground">
                            {g.clause?.standard}
                          </code>
                          <span className="text-sm font-bold text-foreground">{g.clause?.title ?? g.clauseId}</span>
                          <span className="text-xs text-muted-foreground font-mono">({g.clauseId})</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {g.rationale}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={g.status} />
                        <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* Detailed Accordion Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t bg-muted/20 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {/* Clause requirement */}
                          <div className="space-y-1.5">
                            <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                              <ShieldX className="size-3.5 text-rose-500" /> Mandatory Standard Clause
                            </div>
                            <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3.5 text-xs leading-relaxed">
                              <div className="font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-1">
                                {g.clauseId} · {g.clause?.standard}
                              </div>
                              <p className="text-foreground">{g.clause?.text ?? "Clause text unavailable."}</p>
                            </div>
                          </div>

                          {/* Procedure Evidence */}
                          <div className="space-y-1.5">
                            <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                              <FileText className="size-3.5 text-emerald-500" /> Plant Procedure Evidence
                            </div>
                            {g.procedureId ? (
                              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3.5 text-xs leading-relaxed">
                                <button
                                  onClick={() => openSource(g.procedureId!)}
                                  className="font-mono text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 mb-1 hover:underline flex items-center gap-1.5"
                                >
                                  <FileText className="size-3.5" />
                                  {g.procedureId} <ArrowUpRight className="size-3" />
                                </button>
                                <p className="text-foreground">
                                  {g.evidence === "NOT FOUND"
                                    ? "(No specific procedural evidence extracted from document)"
                                    : g.evidence}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3.5 text-xs text-rose-800 dark:text-rose-200 font-medium">
                                ⚠ No covering procedure identified in plant SOP corpus.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Audit Rationale & Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card rounded-xl p-3 border shadow-sm text-xs">
                          <div className="flex-1">
                            <span className="font-semibold text-foreground">Audit Rationale: </span>
                            <span className="text-muted-foreground">{g.rationale}</span>
                          </div>
                          {g.status !== "Covered" && (
                            <Button
                              size="sm"
                              onClick={() => handleDraftRevision(g.clauseId)}
                              className="bg-brand hover:bg-brand/90 text-brand-foreground text-xs shrink-0"
                            >
                              <Sparkles className="size-3 mr-1" /> Draft SOP Revision
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
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
  const styles = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  }[color];

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all ${
        active ? `${styles} ring-2 ring-offset-1 ring-current font-bold` : "bg-card hover:bg-accent/40"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10.5px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{count}</div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Covered")
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[10.5px]">
        Covered
      </Badge>
    );
  if (status === "Partial")
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-[10.5px]">
        Partial Gap
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[10.5px]">
      Uncovered Gap
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Covered") return <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />;
  if (status === "Partial") return <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />;
  return <ShieldX className="size-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />;
}
