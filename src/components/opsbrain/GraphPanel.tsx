"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Network, Search, X, ZoomIn, ZoomOut, RotateCcw, Filter, FileText, ArrowRight } from "lucide-react";
import type { GraphData, GraphNode } from "./types";
import { ENTITY_COLORS, ENTITY_LABELS } from "./types";

const NODE_RADIUS: Record<string, number> = {
  Equipment: 14,
  Incident: 12,
  NearMiss: 10,
  WorkOrder: 10,
  Procedure: 11,
  RegulatoryClause: 11,
  Person: 10,
};

export function GraphPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    Equipment: true,
    Incident: true,
    NearMiss: true,
    WorkOrder: true,
    Procedure: true,
    RegulatoryClause: true,
    Person: true,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/graph");
      const j = await r.json();
      setData(j);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  // Filter nodes based on type toggles
  const filteredData = data
    ? {
        ...data,
        nodes: data.nodes.filter((n) => selectedTypes[n.type] !== false),
      }
    : null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header */}
      <div className="px-4 md:px-8 py-3.5 border-b bg-card/70 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/25 shadow-inner">
            <Network className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Entity Knowledge Graph
              {data && (
                <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-600 border-amber-500/30">
                  {data.nodes.length} Nodes · {data.edges.length} Edges
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              Cross-document entity linkages extracted across 18 industrial documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                const match = data?.nodes.find((n) =>
                  n.name.toLowerCase().includes(e.target.value.toLowerCase())
                );
                setFocusedId(match?.id ?? null);
              }}
              placeholder="Find entity (e.g. P-204, C-302)…"
              className="pl-8 h-8 text-xs w-44 md:w-56 bg-background"
            />
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8 text-xs">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Refresh Graph"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-industrial-grid">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-7 animate-spin text-brand" />
            </div>
          ) : !filteredData || filteredData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No nodes to display. Initialize the corpus or reset entity filters.
            </div>
          ) : (
            <ForceGraph
              data={filteredData}
              focusedId={focusedId}
              zoomLevel={zoomLevel}
              onSelect={setSelected}
              svgRef={svgRef}
            />
          )}

          {/* Controls Overlay Bar */}
          <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-md border rounded-xl p-1.5 flex items-center gap-1 shadow-md">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
              title="Zoom In"
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
              title="Zoom Out"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setZoomLevel(1);
                setFocusedId(null);
              }}
              title="Reset View"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>

          {/* Interactive Entity Filters Panel */}
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-md border rounded-xl p-3 text-[11px] max-w-xs shadow-lg">
            <div className="font-semibold mb-2 text-muted-foreground uppercase tracking-wider flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1">
                <Filter className="size-3" /> Entity Filter & Legend
              </span>
              <span className="font-mono">{filteredData?.nodes.length} Visible</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(ENTITY_COLORS).map(([type, color]) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-[10.5px] ${
                    selectedTypes[type] !== false
                      ? "bg-muted/60 text-foreground border-border font-medium"
                      : "bg-transparent text-muted-foreground opacity-40 border-transparent"
                  }`}
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="truncate">{ENTITY_LABELS[type] ?? type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Node Details Inspector Sidebar */}
        {selected && (
          <div className="w-full md:w-80 border-l bg-card/95 backdrop-blur-md overflow-y-auto scroll-area shadow-2xl z-20">
            <div className="px-4 py-3.5 border-b flex items-center justify-between sticky top-0 bg-card z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className="size-3.5 rounded-full shadow-sm"
                  style={{ background: ENTITY_COLORS[selected.type] ?? "#888" }}
                />
                <span className="text-sm font-bold truncate">{selected.name}</span>
              </div>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <NodeDetails node={selected} data={data} openSource={openSource} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interactive Force-Directed Graph Engine ──────────────
function ForceGraph({
  data,
  focusedId,
  zoomLevel,
  onSelect,
  svgRef,
}: {
  data: GraphData;
  focusedId: string | null;
  zoomLevel: number;
  onSelect: (n: GraphNode) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [positions, setPositions] = useState<
    Map<string, { x: number; y: number; vx: number; vy: number }>
  >(new Map());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data || data.nodes.length === 0) return;
    const map = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    const cx = size.w / 2;
    const cy = size.h / 2;
    const r = Math.min(size.w, size.h) / 3.2;
    data.nodes.forEach((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      map.set(n.id, {
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      });
    });
    setPositions(map);
  }, [data, size.w, size.h]);

  useEffect(() => {
    if (positions.size === 0) return;
    let raf = 0;
    let iter = 0;
    const maxIter = 280;

    const tick = () => {
      setPositions((prev) => {
        const next = new Map(prev);
        const cx = size.w / 2;
        const cy = size.h / 2;
        const k = 0.05;
        const repulsion = 5200;
        const springK = 0.03;
        const springLen = 100;
        const damping = 0.76;

        const ids = Array.from(next.keys());
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = next.get(ids[i])!;
            const b = next.get(ids[j])!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        for (const e of data.edges) {
          const a = next.get(e.source);
          const b = next.get(e.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - springLen) * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }

        for (const [, p] of next) {
          p.vx += (cx - p.x) * k * 0.1;
          p.vy += (cy - p.y) * k * 0.1;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;
          p.x = Math.max(40, Math.min(size.w - 40, p.x));
          p.y = Math.max(40, Math.min(size.h - 40, p.y));
        }
        return next;
      });

      iter++;
      if (iter < maxIter) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data, size.w, size.h]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
      >
        {/* Edge Lines */}
        {data.edges.map((e, i) => {
          const a = positions.get(e.source);
          const b = positions.get(e.target);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeOpacity={0.25}
              strokeWidth={1.5}
              className="text-foreground transition-all"
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const r = NODE_RADIUS[n.type] ?? 10;
          const color = ENTITY_COLORS[n.type] ?? "#888";
          const isFocused = focusedId === n.id;

          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              className="cursor-pointer group"
              onClick={() => onSelect(n)}
            >
              {/* Pulse glow if focused */}
              {isFocused && (
                <circle
                  r={r + 8}
                  fill={color}
                  fillOpacity={0.3}
                  className="animate-ping"
                />
              )}

              <circle
                r={r + (isFocused ? 4 : 0)}
                fill={color}
                fillOpacity={0.9}
                stroke={isFocused ? "#ffffff" : "rgba(0,0,0,0.3)"}
                strokeWidth={isFocused ? 2.5 : 1}
                className="graph-node shadow-md"
              />
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize={10}
                className="pointer-events-none fill-foreground font-semibold tracking-tight shadow-sm"
              >
                {n.label.length > 20 ? n.label.slice(0, 19) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function NodeDetails({
  node,
  data,
  openSource,
}: {
  node: GraphNode;
  data: GraphData | null;
  openSource: (docId: string) => void;
}) {
  const connected: { edge: string; other: GraphNode }[] = [];
  if (data) {
    for (const e of data.edges) {
      if (e.source === node.id) {
        const other = data.nodes.find((n) => n.id === e.target);
        if (other) connected.push({ edge: e.type, other });
      } else if (e.target === node.id) {
        const other = data.nodes.find((n) => n.id === e.source);
        if (other) connected.push({ edge: e.type, other });
      }
    }
  }

  const impliedDocId = (() => {
    if (node.documentId) return node.documentId;
    const m = node.name.match(/(WO-\d+|INC-\d{4}-\d{3}|NM-\d{4}-\d{3}|SOP-[A-Z]+-\d{3}|PR-[A-Z]+-\d{3}|OM-[A-Z\d]+-Rev\d+)/);
    return m?.[1];
  })();

  return (
    <div className="p-4 space-y-5 text-xs">
      <div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
          Entity Type
        </div>
        <Badge variant="outline" className="text-[11px] font-semibold bg-muted">
          {ENTITY_LABELS[node.type] ?? node.type}
        </Badge>
      </div>

      <div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
          System Identifier
        </div>
        <code className="text-[11px] bg-muted px-2 py-1 rounded font-mono block border">
          {node.id}
        </code>
      </div>

      <div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
          <span>Connected Relations</span>
          <span className="font-mono text-brand font-bold">{connected.length} Links</span>
        </div>

        {connected.length === 0 ? (
          <p className="text-xs text-muted-foreground">No explicit relations mapped.</p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto scroll-area">
            {connected.map((c, i) => (
              <li
                key={i}
                className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-2 border text-[11.5px]"
              >
                <span className="text-[9.5px] uppercase font-mono text-brand font-bold">
                  {c.edge}
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: ENTITY_COLORS[c.other.type] ?? "#888" }}
                />
                <span className="font-semibold truncate flex-1">{c.other.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {impliedDocId && (
        <div className="pt-2 border-t">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2">
            Primary Document Source
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs font-semibold justify-between group"
            onClick={() => openSource(impliedDocId)}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-brand" /> View {impliedDocId}
            </span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
