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
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

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
    <div className="min-h-screen flex flex-col md:flex-row bg-background bg-industrial-grid">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar text-sidebar-foreground sticky top-0 z-30 shadow">
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
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen justify-between">
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

        {/* Global Footer */}
        <footer className="border-t bg-card/60 backdrop-blur-md px-6 py-3.5 text-center text-xs text-muted-foreground">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <span>OpsBrain Platform</span>
              <span>·</span>
              <span className="text-foreground">ET AI Hackathon 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Designed &amp; Developed by</span>
              <span className="font-bold text-foreground hover:text-brand transition-colors">
                Saurabh Lokhande
              </span>
              <span>&amp; Team</span>
              <span className="font-mono px-2 py-0.5 rounded bg-brand/10 text-brand font-bold border border-brand/20">
                saurabhmj11
              </span>
            </div>
          </div>
        </footer>
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
