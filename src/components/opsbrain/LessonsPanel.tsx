"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Activity, Send, Sparkles, ArrowRight } from "lucide-react";
import type { LessonsAlert } from "./types";
import { toast } from "sonner";

const SAMPLE_TRIGGERS = [
  {
    label: "New surge event on C-302",
    text:
      "WO-4710: Compressor C-302 tripped on high vibration at 22:45 last night. Anti-surge controller was in manual mode. Vibration reading 9.2 mm/s RMS. Investigation pending.",
  },
  {
    label: "Seal leak on Pump P-204 (recurrence)",
    text:
      "WO-4712: Field technician reports hydrocarbon odor near Pump P-204 in Crude Unit 3. Visual inspection shows seal leak ~1.5 L/min. Pump isolated per LOTO. Repair scheduled.",
  },
];

export function LessonsPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [trigger, setTrigger] = useState("");
  const [triggerRef, setTriggerRef] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    alertId: string;
    similarity: number;
    matchedIncidents: { docId: string; docType: string; title: string; similarity: number }[];
    rationale: string;
  } | null>(null);
  const [alerts, setAlerts] = useState<LessonsAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const r = await fetch("/api/lessons");
      const j = await r.json();
      setAlerts(j.alerts ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const analyze = async (text?: string, ref?: string) => {
    const t = (text ?? trigger).trim();
    if (!t) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const r = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerText: t, triggerRef: ref ?? triggerRef }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setResult(j);
      loadAlerts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Analysis failed: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-orange-600" />
          <div>
            <h1 className="font-semibold text-base">Lessons Learned Agent</h1>
            <p className="text-xs text-muted-foreground">
              Proactive incident-similarity surfacing · graph + vector · recommends escalation, never issues directives
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Trigger input */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="size-4 text-orange-600" />
                New Event Trigger
              </CardTitle>
              <CardDescription className="text-xs">
                Paste a new work order description or incident summary. The agent will surface
                historically similar incidents from the knowledge graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g., Compressor C-302 tripped on high vibration. Anti-surge controller in manual. Vibration 9.2 mm/s RMS."
                className="bg-background min-h-[100px] text-sm"
              />
              <input
                value={triggerRef}
                onChange={(e) => setTriggerRef(e.target.value)}
                placeholder="Reference (optional, e.g. WO-4710)"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-background"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => analyze()}
                  disabled={!trigger.trim() || analyzing}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="size-3.5 mr-1 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5 mr-1" /> Surface similar incidents
                    </>
                  )}
                </Button>
                <div className="text-[10px] text-muted-foreground">or try:</div>
                {SAMPLE_TRIGGERS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      setTrigger(s.text);
                      analyze(s.text, s.label);
                    }}
                    disabled={analyzing}
                    className="text-[10.5px] px-2 py-1 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className={`border-l-4 ${result.similarity > 0.15 ? "border-l-rose-500 alert-pulse" : "border-l-muted"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="size-4 text-brand" />
                    Similarity Analysis Result
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    similarity: {(result.similarity * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.matchedIncidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No historically similar incidents found above the similarity threshold.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Top matched incidents
                      </div>
                      {result.matchedIncidents.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => openSource(m.docId)}
                          className="w-full text-left flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/40 transition-colors"
                        >
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
                                {m.docId}
                              </code>
                              <span className="text-[10px] text-muted-foreground">{m.docType}</span>
                            </div>
                            <div className="text-xs truncate mt-0.5">{m.title}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {(m.similarity * 100).toFixed(0)}%
                          </Badge>
                        </button>
                      ))}
                    </div>
                    <div className="bg-muted/40 rounded-md p-3 text-sm leading-relaxed border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Agent rationale
                      </div>
                      {result.rationale}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* History */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="size-3" /> Recent alerts
            </div>
            {loadingAlerts ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin inline mr-2" />
                Loading…
              </div>
            ) : alerts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No alerts yet. Run a trigger above to generate the first one.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <Card key={a.id} className="overflow-hidden">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`size-2 rounded-full mt-1.5 shrink-0 ${a.similarity > 0.15 ? "bg-rose-500" : "bg-muted-foreground/40"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {(a.similarity * 100).toFixed(0)}% match
                            </Badge>
                            {a.triggerRef && (
                              <span className="text-[10px] text-muted-foreground font-mono">{a.triggerRef}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs bg-muted/40 rounded px-2 py-1 mb-2 font-mono">
                            {a.triggerText.length > 120
                              ? a.triggerText.slice(0, 120) + "…"
                              : a.triggerText}
                          </div>
                          {a.matchedIncidentIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {a.matchedIncidentIds.map((id) => (
                                <button
                                  key={id}
                                  onClick={() => openSource(id)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 font-mono"
                                >
                                  {id}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {a.rationale}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
