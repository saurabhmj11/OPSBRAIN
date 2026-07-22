"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TabId } from "@/app/page";
import type { Stats } from "./types";
import { Loader2, Sparkles, Database, Activity, Sun, Moon, CheckCircle2, ShieldCheck, FileText } from "lucide-react";

type NavItem = {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  desc: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: <Database size={17} />, desc: "Telemetry & system metrics" },
  { id: "copilot", label: "Expert Copilot", icon: <Sparkles size={17} />, desc: "Citation-first RAG chat", badge: "AI" },
  { id: "graph", label: "Knowledge Graph", icon: <GraphIcon />, desc: "Entity-linked relations" },
  { id: "compliance", label: "Compliance Gaps", icon: <ShieldIcon />, desc: "OISD-118 vs procedures" },
  { id: "lessons", label: "Lessons Learned", icon: <Activity size={17} />, desc: "Proactive incident surfacing" },
  { id: "documents", label: "Document Hub", icon: <FileIcon />, desc: "Ingested corpus & chunks" },
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
  isDark,
  onToggleTheme,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  stats: Stats | null;
  seeding: boolean;
  seeded: boolean;
  onSeed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:sticky top-0 left-0 z-40 md:z-auto w-72 h-screen md:h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 flex flex-col shadow-xl md:shadow-none`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-sidebar-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary border border-sidebar-primary/30 shadow-inner">
              <BrainIcon />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
                OpsBrain
                <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30">
                  v2.4
                </span>
              </div>
              <div className="text-[11px] text-sidebar-foreground/60 leading-tight">
                Industrial Intelligence
              </div>
            </div>
          </div>
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="size-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-lg"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </Button>
          )}
        </div>

        {/* Telemetry Status Bar */}
        <div className="px-4 py-2 bg-sidebar-accent/30 border-b border-sidebar-border/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sidebar-foreground/80 font-medium">Corpus Online</span>
          </div>
          <span className="text-sidebar-foreground/50 font-mono text-[10px]">
            {seeded ? "18 Docs Synced" : "Pending Seed"}
          </span>
        </div>

        {/* Seed button */}
        <div className="px-3 py-3 border-b border-sidebar-border/80 space-y-2">
          <Button
            onClick={onSeed}
            disabled={seeding}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm transition-all hover:shadow"
            size="sm"
          >
            {seeding ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Ingesting & Extracting…
              </>
            ) : seeded ? (
              <>
                <CheckCircle2 className="size-3.5 mr-1.5 text-emerald-300" /> Re-sync Knowledge Base
              </>
            ) : (
              <>
                <Database className="size-3.5 mr-1.5" /> Initialize Corpus (18 Docs)
              </>
            )}
          </Button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto scroll-area">
          <div className="px-2 pb-1 text-[10px] uppercase font-semibold text-sidebar-foreground/40 tracking-wider">
            Navigation
          </div>
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-2.5 relative group ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border border-sidebar-border/50"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/75 hover:text-sidebar-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sidebar-primary" />
                )}
                <span className={`mt-0.5 transition-colors ${active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-primary/80"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between">
                    <span className="block text-xs font-semibold leading-tight">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-sidebar-primary/20 text-sidebar-primary font-bold">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="block text-[10.5px] text-sidebar-foreground/50 leading-tight mt-0.5 truncate">
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Live Corpus Metrics Footer */}
        {stats && (
          <div className="px-4 py-3 border-t border-sidebar-border/80 text-[10.5px] text-sidebar-foreground/60 space-y-1.5 bg-sidebar-accent/10">
            <div className="text-[9.5px] uppercase font-semibold text-sidebar-foreground/40 tracking-wider mb-1 flex items-center justify-between">
              <span>Telemetry Snapshot</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sidebar-foreground/70">Documents</span>
              <span className="font-mono text-sidebar-foreground font-semibold bg-sidebar-accent/40 px-1.5 py-0.2 rounded">
                {stats.counts.documents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sidebar-foreground/70">Chunks & Embeddings</span>
              <span className="font-mono text-sidebar-foreground font-semibold bg-sidebar-accent/40 px-1.5 py-0.2 rounded">
                {stats.counts.chunks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sidebar-foreground/70">Graph Entities</span>
              <span className="font-mono font-semibold text-amber-400 bg-sidebar-accent/40 px-1.5 py-0.2 rounded">
                {stats.counts.entities}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sidebar-foreground/70">Regulatory Clauses</span>
              <span className="font-mono font-semibold text-emerald-400 bg-sidebar-accent/40 px-1.5 py-0.2 rounded">
                {stats.counts.clauses}
              </span>
            </div>
          </div>
        )}

        {/* Developer Credit Footer */}
        <div className="px-4 py-2.5 border-t border-sidebar-border/80 bg-sidebar text-[10px] text-sidebar-foreground/60 text-center">
          <div>Built by <strong className="text-sidebar-foreground">Saurabh Lokhande</strong></div>
          <div className="text-sidebar-foreground/50 font-mono text-[9.5px]">Team: <span className="text-sidebar-primary font-bold">saurabhmj11</span></div>
        </div>
      </aside>
    </>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0-2 7 4 4 0 0 0 2 7 4 4 0 0 0 8 0 4 4 0 0 0 2-7 4 4 0 0 0-2-7 4 4 0 0 0-4-4z" />
      <path d="M12 6v12" />
      <path d="M8 10c2 0 3-1 4-2 1 1 2 2 4 2" />
      <path d="M8 14c2 0 3 1 4 2 1-1 2-2 4-2" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
