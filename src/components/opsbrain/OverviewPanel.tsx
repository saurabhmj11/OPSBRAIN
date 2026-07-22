"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Stats } from "./types";
import type { TabId } from "@/app/page";
import { Sparkles, Network, ShieldCheck, AlertTriangle, FileText, Loader2, Database, Zap, Quote, Cpu, Activity, ArrowRight, Layers, Lock } from "lucide-react";

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-sidebar-accent/80 via-sidebar to-sidebar border border-sidebar-border p-6 md:p-8 overflow-hidden text-sidebar-foreground shadow-lg">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Industrial Intelligence
              </span>
              <span className="text-sidebar-foreground/50">·</span>
              <span className="text-sidebar-foreground/70">ET AI Hackathon 2026</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              OpsBrain <span className="text-amber-400 font-normal">Command Center</span>
            </h1>
            
            <p className="text-sm md:text-base text-sidebar-foreground/80 leading-relaxed">
              An enterprise AI knowledge intelligence engine for asset-intensive industrial operations.
              Ingests drawings, work orders, OEM manuals, SOPs, and OISD-118 regulatory text — 
              constructing an entity-linked knowledge graph powering three autonomous agents.
            </p>

            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                <Network className="size-3 mr-1" /> Knowledge Graph
              </Badge>
              <Badge variant="outline" className="bg-teal-500/10 text-teal-300 border-teal-500/30">
                <Zap className="size-3 mr-1" /> Hybrid Vector + Graph RAG
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                <ShieldCheck className="size-3 mr-1" /> OISD-118 & Factories Act
              </Badge>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
                <Lock className="size-3 mr-1" /> Fail-Closed Citations
              </Badge>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <Button
              onClick={onSeed}
              disabled={seeding}
              size="lg"
              className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              {seeding ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Ingesting & Building Graph…
                </>
              ) : seeded ? (
                <>
                  <Database className="size-4 mr-2" /> Re-sync Corpus (18 Docs)
                </>
              ) : (
                <>
                  <Database className="size-4 mr-2" /> Initialize Demo Corpus
                </>
              )}
            </Button>
            <div className="text-[11px] text-sidebar-foreground/50 text-center font-mono">
              {seeded ? "18 docs · 7 entity types · 3 agents" : "Requires initialization"}
            </div>
          </div>
        </div>
      </div>

      {/* Core Bet Callout */}
      <Card className="border-l-4 border-l-brand bg-card/80 backdrop-blur shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center shrink-0 border border-brand/25 mt-0.5">
              <Zap className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-sm md:text-base flex items-center gap-2">
                The Core Industrial Bet
                <Badge variant="outline" className="text-[10px] font-mono bg-brand/10 text-brand border-brand/30">
                  Architectural Principle
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Industrial knowledge loss is not a <span className="text-foreground font-medium underline underline-offset-4 decoration-brand/50">search</span> problem — it&apos;s a{" "}
                <strong className="text-foreground font-semibold">connection</strong> problem. The fix is not a plain chatbot over a PDF folder; it&apos;s an entity-linked knowledge layer that enables reasoning <em className="text-foreground">across</em> work orders, inspection logs, OEM manuals, and safety standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bento Grid */}
      {seeded && stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Cpu className="size-4 text-brand" /> System Telemetry & Ingestion Metrics
            </h2>
            <span className="text-xs font-mono text-muted-foreground">Status: Operational</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatTile
              label="Ingested Documents"
              value={stats.counts.documents}
              unit="Files"
              subtext="Work orders, OEM manuals, SOPs"
              icon={<FileText className="size-5" />}
              color="amber"
            />
            <StatTile
              label="Text Embeddings"
              value={stats.counts.chunks}
              unit="Chunks"
              subtext="Vector indexed @ 1536 dim"
              icon={<Layers className="size-5" />}
              color="teal"
            />
            <StatTile
              label="Knowledge Entities"
              value={stats.counts.entities}
              unit="Nodes"
              subtext="Pumps, valves, personnel, WO"
              icon={<Network className="size-5" />}
              color="rose"
            />
            <StatTile
              label="Entity Relations"
              value={stats.counts.relations}
              unit="Edges"
              subtext="Cross-document linkage"
              icon={<Activity className="size-5" />}
              color="emerald"
            />
          </div>
        </div>
      )}

      {/* Visual System Architecture Diagram */}
      <Card className="border bg-card/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Layers className="size-4 text-brand" />
            End-to-End System Flow & Hybrid Reasoning Pipeline
          </CardTitle>
          <CardDescription className="text-xs">
            How OpsBrain ingests unstructured industrial data and transforms it into cited knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Step 1 */}
            <div className="rounded-xl border p-3.5 bg-muted/30 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                  01. INGESTION
                </span>
                <span className="text-muted-foreground text-[10px]">18 Docs</span>
              </div>
              <div className="font-semibold text-sm">Heterogeneous Corpus</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Parse OEM manuals, work orders, P&ID drawings, inspection reports, near-miss logs & OISD-118 clauses.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border p-3.5 bg-muted/30 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-950/50 px-2 py-0.5 rounded">
                  02. HYBRID LAYER
                </span>
                <span className="text-muted-foreground text-[10px]">Graph + Vector</span>
              </div>
              <div className="font-semibold text-sm">Entity Graph Index</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Extract equipment IDs (P-204, C-302), personnel, work orders, and link them across document boundaries.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border p-3.5 bg-muted/30 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                  03. AGENT LAYER
                </span>
                <span className="text-muted-foreground text-[10px]">3 Autonomous Agents</span>
              </div>
              <div className="font-semibold text-sm">Citation-First Reasoning</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Synthesize cited answers, surface proactive incident alerts, and audit regulatory compliance gaps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flagship Agents Launcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">Launch Flagship Industrial Agents</h2>
          <span className="text-xs text-muted-foreground">Select an agent to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AgentTile
            title="Expert Copilot"
            subtitle="RAG Chat with Citations"
            description="Ask complex cross-document questions regarding pump failures, OEM thresholds, and inspection history with mandatory source citations."
            icon={<Sparkles className="size-5 text-brand" />}
            tag="Citation-First"
            onLaunch={() => onNavigate("copilot")}
            accent="brand"
          />
          <AgentTile
            title="Lessons Learned"
            subtitle="Proactive Surfacing Engine"
            description="Paste new work order drafts or fault descriptions to surface historically similar incidents and prevent recurring equipment failures."
            icon={<AlertTriangle className="size-5 text-orange-500" />}
            tag="Incident Similarity"
            onLaunch={() => onNavigate("lessons")}
            accent="orange"
          />
          <AgentTile
            title="Compliance Gaps"
            subtitle="Clause vs Procedure Audit"
            description="Automatically audit plant SOPs against OISD-118 and Factories Act 1948 regulations to identify unaddressed compliance gaps."
            icon={<ShieldCheck className="size-5 text-emerald-500" />}
            tag="OISD-118 Audit"
            onLaunch={() => onNavigate("compliance")}
            accent="emerald"
          />
        </div>
      </div>

      {/* Architectural Philosophy Card */}
      <Card className="border bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Quote className="size-4 text-brand" />
            Why Hybrid Graph RAG Outperforms Traditional Vector Search
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-3">
          <p>
            Generic RAG retrieves isolated chunks from single documents based solely on text similarity.
            OpsBrain&apos;s pipeline performs <strong className="text-foreground">hybrid retrieval</strong> — combining vector similarity with graph traversal across entity edges (e.g. <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">Pump P-204 → Incident INC-2024-031 → WorkOrder WO-4521 → OEM Manual</code>).
          </p>
          <p>
            This enables answering multi-document queries like <em>&ldquo;Has pump P-204 failed before, and how was it fixed?&rdquo;</em> even when no single document contains the full timeline. Every statement is backed by explicit source citations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  subtext,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  subtext: string;
  icon: React.ReactNode;
  color: "amber" | "teal" | "rose" | "emerald";
}) {
  const colorStyles = {
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }[color];

  return (
    <Card className="hover:translate-y-[-2px] transition-all hover:shadow-md border bg-card/80 backdrop-blur">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div className={`size-8 rounded-lg flex items-center justify-center border ${colorStyles}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
            {value.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground font-medium">{unit}</span>
        </div>
        <div className="text-[10.5px] text-muted-foreground mt-1 truncate">
          {subtext}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentTile({
  title,
  subtitle,
  description,
  icon,
  tag,
  onLaunch,
  accent,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  onLaunch: () => void;
  accent: "brand" | "orange" | "emerald";
}) {
  const borderStyle = {
    brand: "border-l-brand hover:border-l-brand/90",
    orange: "border-l-orange-500 hover:border-l-orange-400",
    emerald: "border-l-emerald-500 hover:border-l-emerald-400",
  }[accent];

  return (
    <Card className={`border-l-4 ${borderStyle} flex flex-col justify-between hover:shadow-md transition-all bg-card/80 backdrop-blur`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted border">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <CardDescription className="text-[11px]">{subtitle}</CardDescription>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="w-fit text-[9.5px] font-mono mt-1">
          {tag}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
        <Button
          onClick={onLaunch}
          variant="outline"
          size="sm"
          className="w-full justify-between group text-xs font-semibold"
        >
          Launch Agent
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
