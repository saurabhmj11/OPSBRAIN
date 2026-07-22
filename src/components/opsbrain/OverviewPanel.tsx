"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Stats } from "./types";
import type { TabId } from "@/app/page";
import { Sparkles, Network, ShieldCheck, AlertTriangle, FileText, Loader2, Database, Zap, Quote } from "lucide-react";

export function OverviewPanel({
  stats,
  seeded,
  seeding,
  onSeed,
  onNavigate,
}: {
  stats: Stats | null;
  seeded: boolean;
  seeding: boolean;
  onSeed: () => void;
  onNavigate: (t: TabId) => void;
}) {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
          <span className="size-1.5 rounded-full bg-brand animate-pulse" />
          Problem Statement #8 · Industrial Intelligence · ET AI Hackathon 2026
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          OpsBrain
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
          An AI-powered knowledge intelligence platform for asset-intensive industrial operations.
          Ingests heterogeneous documents — drawings, work orders, OEM manuals, incident reports,
          SOPs, regulatory text — builds a unified knowledge graph, and exposes that knowledge
          through three agents: a citation-first copilot, a proactive lessons-learned engine,
          and a compliance-gap detector.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <Badge variant="outline" className="bg-amber-50">Knowledge Graph</Badge>
          <Badge variant="outline" className="bg-emerald-50">Hybrid RAG</Badge>
          <Badge variant="outline" className="bg-rose-50">Fail-Closed Citations</Badge>
          <Badge variant="outline" className="bg-teal-50">Proactive Agents</Badge>
          <Badge variant="outline" className="bg-orange-50">OISD-118 Aligned</Badge>
        </div>
      </div>

      {/* Core bet callout */}
      <Card className="mb-8 border-l-4 border-l-brand bg-gradient-to-br from-amber-50/40 to-background">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="size-5 text-brand shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">The Core Bet</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Industrial knowledge loss is not a <em>search</em> problem — it&apos;s a{" "}
                <strong className="text-foreground">connection</strong> problem. The fix is not
                &ldquo;a chatbot on top of a PDF folder&rdquo; — it&apos;s an entity-linked
                knowledge layer that lets the system reason <em>across</em> documents, not just
                retrieve <em>within</em> one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats / Setup */}
      {!seeded ? (
        <Card className="border-dashed border-2 border-brand/30 bg-brand-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5 text-brand" />
              Initialize Demo Corpus
            </CardTitle>
            <CardDescription>
              No documents have been ingested yet. Click below to ingest 18 industrial documents
              (work orders, inspection reports, incident reports, OEM manual excerpts, SOPs, OISD-118
              regulatory clauses), extract entities into a knowledge graph, and enable all three agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onSeed} disabled={seeding} size="lg" className="bg-brand hover:bg-brand/90 text-brand-foreground">
              {seeding ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Seeding corpus…
                </>
              ) : (
                <>
                  <Database className="size-4 mr-2" /> Initialize Corpus
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              First-time seeding takes ~30-60 seconds for LLM-based entity extraction.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatCard
              label="Documents"
              value={stats?.counts.documents ?? 0}
              icon={<FileText className="size-5" />}
              accent="amber"
            />
            <StatCard
              label="Chunks"
              value={stats?.counts.chunks ?? 0}
              icon={<FileText className="size-5" />}
              accent="amber"
            />
            <StatCard
              label="Graph Entities"
              value={stats?.counts.entities ?? 0}
              icon={<Network className="size-5" />}
              accent="teal"
            />
            <StatCard
              label="Relations"
              value={stats?.counts.relations ?? 0}
              icon={<Network className="size-5" />}
              accent="teal"
            />
          </div>

          {/* Try these */}
          <h2 className="text-lg font-semibold mb-3">Try the three flagship agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <AgentCard
              title="Expert Copilot"
              tagline="RAG chat with mandatory citations"
              icon={<Sparkles className="size-5 text-brand" />}
              examples={[
                "Has pump P-204 failed before, and how was it fixed?",
                "What does the OEM manual say about vibration limits for C-302?",
                "Who performed the last inspection on Valve V-118?",
              ]}
              onTry={() => onNavigate("copilot")}
              accent="brand"
            />
            <AgentCard
              title="Lessons Learned"
              tagline="Proactive incident surfacing"
              icon={<AlertTriangle className="size-5 text-orange-600" />}
              examples={[
                "Paste a new work order description that resembles a past incident",
                "System surfaces top-3 similar incidents with rationale",
                "Recommends escalation — never auto-issues directives",
              ]}
              onTry={() => onNavigate("lessons")}
              accent="orange"
            />
            <AgentCard
              title="Compliance Gaps"
              tagline="Clause vs. procedure diff"
              icon={<ShieldCheck className="size-5 text-emerald-700" />}
              examples={[
                "OISD-118 clause 4.3.2: PSV inspection interval ≤ 12 months",
                "Factories Act Section 31: LOTO procedures + annual audits",
                "Each clause mapped to covering procedure or flagged as gap",
              ]}
              onTry={() => onNavigate("compliance")}
              accent="emerald"
            />
          </div>

          {/* Why this isn't just RAG */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="size-4 text-brand" />
                Why this isn&apos;t just another RAG chatbot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                Generic RAG retrieves semantically-similar chunks from a single document.
                OpsBrain&apos;s retrieval pipeline performs <strong className="text-foreground">hybrid
                retrieval</strong> — vector similarity finds candidate chunks, then the knowledge graph
                expands the candidate set by following entity edges (e.g., &ldquo;Pump P-204 → Incident
                → WorkOrder → Document&rdquo;).
              </p>
              <p>
                This means a question like <em>&ldquo;has pump P-204 failed before?&rdquo;</em> can be
                answered even though no single document contains the full answer — the copilot
                synthesizes across a work order (WO-4521), an inspection report (IR-2024-088), and a
                near-miss report (NM-2024-031), with each fact cited.
              </p>
              <p>
                Every factual claim carries a citation marker. If retrieval confidence is below
                threshold, the system says <em>&ldquo;insufficient evidence&rdquo;</em> rather than
                hallucinating — a non-negotiable rule in a safety/compliance domain.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "amber" | "teal" | "rose" | "orange";
}) {
  const accentMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  } as const;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={`size-8 rounded-md flex items-center justify-center border ${accentMap[accent]}`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function AgentCard({
  title,
  tagline,
  icon,
  examples,
  onTry,
  accent,
}: {
  title: string;
  tagline: string;
  icon: React.ReactNode;
  examples: string[];
  onTry: () => void;
  accent: "brand" | "orange" | "emerald";
}) {
  const accentMap = {
    brand: "border-l-brand hover:border-l-brand/70",
    orange: "border-l-orange-500 hover:border-l-orange-400",
    emerald: "border-l-emerald-600 hover:border-l-emerald-500",
  } as const;
  return (
    <Card className={`border-l-4 ${accentMap[accent]} flex flex-col`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{tagline}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 flex-1">
          {examples.map((e, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="size-1 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{e}</span>
            </li>
          ))}
        </ul>
        <Button size="sm" variant="outline" onClick={onTry} className="w-full">
          Try it →
        </Button>
      </CardContent>
    </Card>
  );
}
