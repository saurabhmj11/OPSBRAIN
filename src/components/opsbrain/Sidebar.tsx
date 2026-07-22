"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TabId } from "@/app/page";
import type { Stats } from "./types";
import { Loader2, Sparkles, Database, Activity } from "lucide-react";

type NavItem = {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  desc: string;
};

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: <Database size={18} />, desc: "Platform dashboard" },
  { id: "copilot", label: "Expert Copilot", icon: <Sparkles size={18} />, desc: "RAG chat with citations" },
  { id: "graph", label: "Knowledge Graph", icon: <GraphIcon />, desc: "Cross-document links" },
  { id: "compliance", label: "Compliance Gaps", icon: <ShieldIcon />, desc: "Clause vs procedure" },
  { id: "lessons", label: "Lessons Learned", icon: <Activity size={18} />, desc: "Proactive alerts" },
  { id: "documents", label: "Documents", icon: <FileIcon />, desc: "Ingested corpus" },
];

export function Sidebar({
  tab,
  setTab,
  stats,
  seeding,
  seeded,
  onSeed,
  mobileOpen,
  onCloseMobile,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  stats: Stats | null;
  seeding: boolean;
  seeded: boolean;
  onSeed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:sticky top-0 left-0 z-40 md:z-auto w-72 h-screen md:h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 flex flex-col`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-sidebar-primary/15 flex items-center justify-center text-sidebar-primary border border-sidebar-primary/30">
              <BrainIcon />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">OpsBrain</div>
              <div className="text-[11px] text-sidebar-foreground/60 leading-tight">
                Industrial Knowledge Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Seed button */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <Button
            onClick={onSeed}
            disabled={seeding}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
            size="sm"
          >
            {seeding ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Seeding…
              </>
            ) : seeded ? (
              <>
                <Database className="size-3.5 mr-1.5" /> Re-seed Corpus
              </>
            ) : (
              <>
                <Database className="size-3.5 mr-1.5" /> Initialize Corpus
              </>
            )}
          </Button>
          <div className="text-[10px] text-sidebar-foreground/50 mt-1.5 px-1">
            18 documents · 7 entities · 3 agents
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scroll-area">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-start gap-2.5 ${
                tab === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80"
              }`}
            >
              <span className="mt-0.5 text-sidebar-primary/80">{item.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium leading-tight">{item.label}</span>
                <span className="block text-[10.5px] text-sidebar-foreground/50 leading-tight mt-0.5">
                  {item.desc}
                </span>
              </span>
            </button>
          ))}
        </nav>

        {/* Stats footer */}
        {stats && (
          <div className="px-4 py-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/60 space-y-1">
            <div className="flex justify-between">
              <span>Documents</span>
              <span className="font-mono text-sidebar-foreground/90">{stats.counts.documents}</span>
            </div>
            <div className="flex justify-between">
              <span>Chunks</span>
              <span className="font-mono text-sidebar-foreground/90">{stats.counts.chunks}</span>
            </div>
            <div className="flex justify-between">
              <span>Entities</span>
              <span className="font-mono text-sidebar-foreground/90">{stats.counts.entities}</span>
            </div>
            <div className="flex justify-between">
              <span>Relations</span>
              <span className="font-mono text-sidebar-foreground/90">{stats.counts.relations}</span>
            </div>
            <div className="flex justify-between">
              <span>Clauses</span>
              <span className="font-mono text-sidebar-foreground/90">{stats.counts.clauses}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0-2 7 4 4 0 0 0 2 7 4 4 0 0 0 8 0 4 4 0 0 0 2-7 4 4 0 0 0-2-7 4 4 0 0 0-4-4z" />
      <path d="M12 6v12" />
      <path d="M8 10c2 0 3-1 4-2 1 1 2 2 4 2" />
      <path d="M8 14c2 0 3 1 4 2 1-1 2-2 4-2" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <line x1="7.5" y1="7" x2="11" y2="16" />
      <line x1="16.5" y1="7" x2="13" y2="16" />
      <line x1="8.5" y1="6" x2="15.5" y2="6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
