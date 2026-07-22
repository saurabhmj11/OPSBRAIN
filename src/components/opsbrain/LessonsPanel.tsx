"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Activity, Send, Sparkles, ArrowRight, ShieldAlert, FileText, CheckCircle2, History, Zap } from "lucide-react";
import type { LessonsAlert } from "./types";
import { toast } from "sonner";

const SAMPLE_TRIGGERS = [
  {
    label: "Surge event on Compressor C-302",
    text: "WO-4710: Compressor C-302 tripped on high vibration at 22:45 last night. Anti-surge controller was operating in manual mode. Vibration reading peaked at 9.2 mm/s RMS. Investigation pending.",
    ref: "WO-4710",
  },
  {
    label: "Seal leak on Pump P-204 (Recurrence)",
    text: "WO-4712: Field technician reports hydrocarbon odor near Pump P-204 in Crude Unit 3. Visual inspection shows seal leak ~1.5 L/min. Pump isolated per LOTO protocol. Repair scheduled.",
    ref: "WO-4712",
  },
  {
    label: "Valve V-118 Packing Blowout",
    text: "WO-4715: Emergency shutdown triggered in Vacuum Distillation Unit due to packing blowout on Valve V-118. Fugitive emissions detected.",
    ref: "WO-4715",
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
      toast.success("Incident similarity analysis completed");
      loadAlerts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Analysis failed: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="px-4 md:px-8 py-3.5 border-b bg-card/70 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center border border-orange-500/25 shadow-inner">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Proactive Lessons Learned Agent
              <Badge variant="outline" className="text-[10px] font-mono bg-orange-500/10 text-orange-600 border-orange-500/30">
                Incident Surfacing
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Cross-references work order telemetry against historical incident logs to prevent recurring failures
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Work Order Trigger Input Card */}
          <Card className="border-l-4 border-l-orange-500 bg-card/80 backdrop-blur shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <AlertTriangle className="size-4 text-orange-500" />
                Work Order / Fault Event Trigger Input
              </CardTitle>
              <CardDescription className="text-xs">
                Paste a work order description, maintenance log, or fault summary. The agent traverses vector space + knowledge graph to surface past incidents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g., Compressor C-302 tripped on high vibration. Anti-surge controller in manual mode. Vibration reading 9.2 mm/s RMS."
                className="bg-background min-h-[100px] text-sm leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <input
                  value={triggerRef}
                  onChange={(e) => setTriggerRef(e.target.value)}
                  placeholder="Work Order Ref (e.g. WO-4710)"
                  className="text-xs px-3 py-2 rounded-lg border bg-background font-mono flex-1 max-w-xs"
                />

                <Button
                  onClick={() => analyze()}
                  disabled={!trigger.trim() || analyzing}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow transition-all"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" /> Surfacing Incidents…
                    </>
                  ) : (
                    <>
                      <Zap className="size-4 mr-1.5" /> Surface Similar Incidents
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Preset Buttons */}
              <div className="pt-2 border-t text-xs space-y-1.5">
                <span className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground">
                  Or load a test scenario preset:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TRIGGERS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => {
                        setTrigger(s.text);
                        setTriggerRef(s.ref);
                        analyze(s.text, s.ref);
                      }}
                      disabled={analyzing}
                      className="text-xs px-3 py-1.5 rounded-lg border bg-card hover:bg-accent/60 transition-all font-medium flex items-center gap-1.5"
                    >
                      <ArrowRight className="size-3 text-orange-500" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incident Surfacing Result Card */}
          {result && (
            <Card className={`border-l-4 ${result.similarity > 0.15 ? "border-l-rose-500 alert-pulse bg-rose-500/5" : "border-l-emerald-500 bg-card"} backdrop-blur shadow-md`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm md:text-base flex items-center gap-2">
                    <Sparkles className="size-4 text-brand" />
                    Surfaced Incident Match Analysis
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-mono text-[11px] ${result.similarity > 0.15 ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>
                      {(result.similarity * 100).toFixed(0)}% Similarity Score
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.matchedIncidents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No historically similar incidents found in the corpus above similarity threshold.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground">
                        Matched Historical Documents ({result.matchedIncidents.length})
                      </div>

                      <div className="grid gap-2">
                        {result.matchedIncidents.map((m, i) => (
                          <button
                            key={i}
                            onClick={() => openSource(m.docId)}
                            className="text-left flex items-center justify-between gap-3 p-3 rounded-xl border bg-card hover:bg-accent/40 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono font-bold">
                                {m.docId}
                              </code>
                              <Badge variant="outline" className="text-[10px]">
                                {m.docType}
                              </Badge>
                              <span className="text-xs font-semibold text-foreground truncate">{m.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-600 border-amber-500/30">
                                {(m.similarity * 100).toFixed(0)}% Match
                              </Badge>
                              <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-card rounded-xl p-4 text-xs leading-relaxed border space-y-1.5 shadow-inner">
                      <div className="text-[10.5px] uppercase font-bold tracking-wider text-brand flex items-center gap-1.5">
                        <Activity className="size-3.5" /> Agent Rationale & Recommendation
                      </div>
                      <p className="text-foreground">{result.rationale}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Historical Alert Log */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <History className="size-4 text-orange-500" /> Historical Surfaced Alerts ({alerts.length})
              </span>
              <span className="text-muted-foreground">Stored in telemetry log</span>
            </div>

            {loadingAlerts ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin inline mr-2" /> Loading alert log…
              </div>
            ) : alerts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center text-xs text-muted-foreground">
                  No historical alerts generated yet. Run a trigger above to test the agent.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <Card key={a.id} className="overflow-hidden border bg-card/80 backdrop-blur shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${a.similarity > 0.15 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {(a.similarity * 100).toFixed(0)}% Match
                          </Badge>
                          {a.triggerRef && (
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{a.triggerRef}</code>
                          )}
                        </div>
                        <span className="text-[10.5px] font-mono text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs bg-muted/30 p-2.5 rounded-lg border font-mono leading-relaxed text-muted-foreground">
                        {a.triggerText}
                      </div>

                      {a.matchedIncidentIds.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">Matched:</span>
                          {a.matchedIncidentIds.map((id) => (
                            <button
                              key={id}
                              onClick={() => openSource(id)}
                              className="text-[10.5px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-mono font-semibold hover:underline"
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      )}
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
