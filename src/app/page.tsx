"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/opsbrain/Sidebar";
import { CopilotPanel } from "@/components/opsbrain/CopilotPanel";
import { GraphPanel } from "@/components/opsbrain/GraphPanel";
import { CompliancePanel } from "@/components/opsbrain/CompliancePanel";
import { LessonsPanel } from "@/components/opsbrain/LessonsPanel";
import { DocumentsPanel } from "@/components/opsbrain/DocumentsPanel";
import { OverviewPanel } from "@/components/opsbrain/OverviewPanel";
import { SourceDrawer } from "@/components/opsbrain/SourceDrawer";
import type { Stats, DocumentRecord } from "@/components/opsbrain/types";
import { toast } from "sonner";

export type TabId =
  | "overview"
  | "copilot"
  | "graph"
  | "compliance"
  | "lessons"
  | "documents";

export default function Home() {
  const [tab, setTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [sourceDrawerDocId, setSourceDrawerDocId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/stats");
      const j = await r.json();
      setStats(j);
      if (j.counts?.documents > 0) setSeeded(true);
    } catch (e) {
      // ignore — initial load
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const seed = async () => {
    setSeeding(true);
    const t = toast.loading("Seeding corpus — ingesting 18 industrial documents, extracting entities, building knowledge graph...");
    try {
      // DEMO_ADMIN_TOKEN is intentionally exposed via NEXT_PUBLIC_ so the
      // demo operator (and judges) can re-trigger seeding from the UI. This is
      // NOT a security boundary — see /api/seed route comment.
      const adminToken = process.env.NEXT_PUBLIC_DEMO_ADMIN_TOKEN ?? "";
      const r = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
      });
      const j = await r.json();
      if (j.success) {
        toast.success(`Corpus seeded in ${(j.elapsedMs / 1000).toFixed(1)}s — ${j.documentsIngested} docs, ${j.clausesSeeded} regulatory clauses`, { id: t });
        setSeeded(true);
        loadStats();
      } else {
        toast.error(`Seed failed: ${j.error}`, { id: t });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Seed failed: ${msg}`, { id: t });
    } finally {
      setSeeding(false);
    }
  };

  const openSource = (docId: string) => setSourceDrawerDocId(docId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar text-sidebar-foreground sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <BrainIcon />
          <span className="font-semibold">OpsBrain</span>
        </div>
        <button
          aria-label="Toggle navigation"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-sidebar-accent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Sidebar — desktop fixed, mobile drawer */}
      <Sidebar
        tab={tab}
        setTab={(t) => {
          setTab(t);
          setMobileNavOpen(false);
        }}
        stats={stats}
        seeding={seeding}
        seeded={seeded}
        onSeed={seed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 overflow-y-auto scroll-area">
          {tab === "overview" && (
            <OverviewPanel
              stats={stats}
              seeded={seeded}
              seeding={seeding}
              onSeed={seed}
              onNavigate={setTab}
            />
          )}
          {tab === "copilot" && <CopilotPanel openSource={openSource} />}
          {tab === "graph" && <GraphPanel openSource={openSource} />}
          {tab === "compliance" && <CompliancePanel openSource={openSource} />}
          {tab === "lessons" && <LessonsPanel openSource={openSource} />}
          {tab === "documents" && <DocumentsPanel openSource={openSource} />}
        </div>
      </main>

      {/* Source drawer */}
      <SourceDrawer docId={sourceDrawerDocId} onClose={() => setSourceDrawerDocId(null)} />
    </div>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0-2 7 4 4 0 0 0 2 7 4 4 0 0 0 8 0 4 4 0 0 0 2-7 4 4 0 0 0-2-7 4 4 0 0 0-4-4z" />
      <path d="M12 6v12" />
      <path d="M8 10c2 0 3-1 4-2 1 1 2 2 4 2" />
      <path d="M8 14c2 0 3 1 4 2 1-1 2-2 4-2" />
    </svg>
  );
}
