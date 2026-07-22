"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Network, Search, X } from "lucide-react";
import type { GraphData, GraphNode } from "./types";
import { ENTITY_COLORS, ENTITY_LABELS } from "./types";

const NODE_RADIUS: Record<string, number> = {
  Equipment: 12,
  Incident: 10,
  NearMiss: 9,
  WorkOrder: 9,
  Procedure: 10,
  RegulatoryClause: 10,
  Person: 9,
};

export function GraphPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Network className="size-5 text-brand" />
          <div>
            <h1 className="font-semibold text-base">Knowledge Graph</h1>
            <p className="text-xs text-muted-foreground">
              Entities + relations extracted across all documents · click a node to explore
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                const match = data?.nodes.find((n) =>
                  n.name.toLowerCase().includes(e.target.value.toLowerCase())
                );
                setFocusedId(match?.id ?? null);
              }}
              placeholder="Find entity (e.g. P-204)…"
              className="pl-7 h-8 text-xs w-44 md:w-56"
            />
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Graph canvas */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : !data || data.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No graph data. Initialize the corpus first.
            </div>
          ) : (
            <ForceGraph
              data={data}
              focusedId={focusedId}
              onSelect={setSelected}
              svgRef={svgRef}
            />
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur border rounded-md p-2.5 text-[10.5px]">
            <div className="font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">
              Entity types
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(ENTITY_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: color }}
                  />
                  <span>{ENTITY_LABELS[type] ?? type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side drawer */}
        {selected && (
          <div className="w-full md:w-80 border-l bg-card overflow-y-auto scroll-area">
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-card">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ background: ENTITY_COLORS[selected.type] ?? "#888" }}
                />
                <span className="text-sm font-semibold">{selected.name}</span>
              </div>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => setSelected(null)}>
                <X className="size-3.5" />
              </Button>
            </div>
            <NodeDetails node={selected} data={data} openSource={openSource} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Force-directed graph (simple simulation, no external lib) ──────────────
function ForceGraph({
  data,
  focusedId,
  onSelect,
  svgRef,
}: {
  data: GraphData;
  focusedId: string | null;
  onSelect: (n: GraphNode) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [positions, setPositions] = useState<
    Map<string, { x: number; y: number; vx: number; vy: number }>
  >(new Map());

  // Track container size
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

  // Initialize node positions in a circle
  useEffect(() => {
    if (!data || data.nodes.length === 0) return;
    const map = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    const cx = size.w / 2;
    const cy = size.h / 2;
    const r = Math.min(size.w, size.h) / 3;
    data.nodes.forEach((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      map.set(n.id, {
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      });
    });
    setPositions(map);
  }, [data, size.w, size.h]);

  // Simulation loop
  useEffect(() => {
    if (positions.size === 0) return;
    let raf = 0;
    let iter = 0;
    const maxIter = 250;

    const tick = () => {
      setPositions((prev) => {
        const next = new Map(prev);
        const cx = size.w / 2;
        const cy = size.h / 2;
        const k = 0.06; // centering force
        const repulsion = 4500; // node-node repulsion
        const springK = 0.025; // edge spring
        const springLen = 90; // target edge length
        const damping = 0.78;

        // Repulsion between all pairs
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

        // Spring forces along edges
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

        // Centering + integrate
        for (const [, p] of next) {
          p.vx += (cx - p.x) * k * 0.1;
          p.vy += (cy - p.y) * k * 0.1;
          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;
          // Bounds
          p.x = Math.max(30, Math.min(size.w - 30, p.x));
          p.y = Math.max(30, Math.min(size.h - 30, p.y));
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
        className="absolute inset-0"
      >
        {/* Edges */}
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
              strokeOpacity={0.2}
              strokeWidth={1}
              className="text-foreground"
            />
          );
        })}
        {/* Nodes */}
        {data.nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const r = NODE_RADIUS[n.type] ?? 8;
          const color = ENTITY_COLORS[n.type] ?? "#888";
          const isFocused = focusedId === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(n)}
            >
              <circle
                r={r + (isFocused ? 4 : 0)}
                fill={color}
                fillOpacity={0.85}
                stroke={isFocused ? "#fff" : "rgba(0,0,0,0.2)"}
                strokeWidth={isFocused ? 2 : 1}
                className="graph-node"
              />
              <text
                y={r + 12}
                textAnchor="middle"
                fontSize={9.5}
                className="pointer-events-none fill-foreground font-medium"
              >
                {n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label}
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
  // Find connected nodes
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

  // Extract docId from entity name (if any)
  const docId = node.documentId;
  // Try to find associated document by entity name patterns
  const impliedDocId = (() => {
    const m = node.name.match(/(WO-\d+|INC-\d{4}-\d{3}|NM-\d{4}-\d{3}|SOP-[A-Z]+-\d{3}|PR-[A-Z]+-\d{3}|OM-[A-Z\d]+-Rev\d+)/);
    return m?.[1];
  })();

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Type</div>
        <Badge variant="outline" className="text-[10px]">
          {ENTITY_LABELS[node.type] ?? node.type}
        </Badge>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Entity ID</div>
        <code className="text-[10.5px] bg-muted px-1.5 py-0.5 rounded">{node.id}</code>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Connections ({connected.length})
        </div>
        {connected.length === 0 ? (
          <p className="text-xs text-muted-foreground">No relations in the graph.</p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto scroll-area">
            {connected.map((c, i) => (
              <li
                key={i}
                className="text-xs flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1.5"
              >
                <span className="text-[9px] uppercase font-mono text-muted-foreground">
                  {c.edge}
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: ENTITY_COLORS[c.other.type] ?? "#888" }}
                />
                <span className="font-medium truncate">{c.other.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(docId || impliedDocId) && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Source
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => openSource(impliedDocId ?? "")}
          >
            Open {impliedDocId}
          </Button>
        </div>
      )}
    </div>
  );
}
