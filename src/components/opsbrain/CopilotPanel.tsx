"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, Citation } from "./types";
import { DOC_TYPE_COLORS } from "./types";
import { Sparkles, Send, Loader2, AlertTriangle, Quote, Network, Lightbulb, Copy, Check, ShieldCheck, Wrench, Search, Layers } from "lucide-react";
import { toast } from "sonner";

type QueryCategory = "all" | "equipment" | "oem" | "compliance" | "incidents";

const CATEGORIES: { id: QueryCategory; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Topics", icon: <Sparkles className="size-3" /> },
  { id: "equipment", label: "Equipment History", icon: <Wrench className="size-3" /> },
  { id: "oem", label: "OEM Manuals", icon: <Layers className="size-3" /> },
  { id: "compliance", label: "Compliance & Safety", icon: <ShieldCheck className="size-3" /> },
  { id: "incidents", label: "Incident Surfacing", icon: <AlertTriangle className="size-3" /> },
];

const SUGGESTED_QUERIES: { category: QueryCategory; text: string }[] = [
  { category: "equipment", text: "Has pump P-204 failed before, and how was it fixed?" },
  { category: "oem", text: "What does the OEM manual say about vibration limits for C-302?" },
  { category: "equipment", text: "Who performed the last inspection on Valve V-118 and when?" },
  { category: "incidents", text: "What caused the surge event on Compressor C-302 in February 2024?" },
  { category: "compliance", text: "What are the requirements for hot work permits per OISD-118?" },
  { category: "incidents", text: "Show me the lessons learned from incident INC-2024-045" },
];

export function CopilotPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reasoningStep, setReasoningStep] = useState<string>("Initializing...");
  const [selectedCat, setSelectedCat] = useState<QueryCategory>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || sending) return;
    setInput("");
    setSending(true);
    setReasoningStep("Vector Similarity Search (1536-dim)...");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      createdAt: Date.now(),
    };
    const loadingMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      loading: true,
    };
    setMessages((m) => [...m, userMsg, loadingMsg]);

    const stepTimer1 = setTimeout(() => {
      setReasoningStep("Traversing Knowledge Graph (Entity Links)...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setReasoningStep("Synthesizing Citation-First Answer...");
    }, 2800);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingMsg.id
            ? {
                ...msg,
                content: j.answer,
                citations: j.citations,
                confidence: j.confidence,
                chunksConsidered: j.chunksConsidered,
                loading: false,
              }
            : msg
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Query failed: ${msg}`);
      setMessages((m) =>
        m.map((s) =>
          s.id === loadingMsg.id
            ? {
                ...s,
                content: `Query failed: ${msg}`,
                loading: false,
                error: true,
              }
            : s
        )
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-screen bg-background">
      {/* Top Header */}
      <div className="px-4 md:px-8 py-3.5 border-b bg-card/70 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center border border-brand/25 shadow-inner">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              Expert Knowledge Copilot
              <Badge variant="outline" className="text-[10px] font-mono bg-brand/10 text-brand border-brand/30">
                Fail-Closed RAG
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Cross-document vector + graph traversal · mandatory source citations
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setMessages([])}
          disabled={messages.length === 0 || sending}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear Thread
        </Button>
      </div>

      {/* Main Chat Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <EmptyState
              selectedCat={selectedCat}
              onSelectCat={setSelectedCat}
              onSelectQuery={(q) => send(q)}
            />
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              openSource={openSource}
              reasoningStep={reasoningStep}
            />
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t bg-card/80 backdrop-blur-md px-4 md:px-8 py-4 shadow-lg">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pump failures, OEM manual specs, SOP compliance, or inspection history…"
              className="resize-none min-h-14 max-h-40 bg-background border-border text-sm leading-relaxed"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={sending}
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              size="icon"
              className="size-14 bg-brand hover:bg-brand/90 text-brand-foreground shrink-0 shadow-md transition-all"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </Button>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-muted-foreground px-1">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-muted border font-mono text-[9.5px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted border font-mono text-[9.5px]">Shift+Enter</kbd> for line break.</span>
            <span className="font-mono text-brand font-medium">100% Citation Verifiable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  selectedCat,
  onSelectCat,
  onSelectQuery,
}: {
  selectedCat: QueryCategory;
  onSelectCat: (c: QueryCategory) => void;
  onSelectQuery: (q: string) => void;
}) {
  const filteredQueries = selectedCat === "all"
    ? SUGGESTED_QUERIES
    : SUGGESTED_QUERIES.filter((q) => q.category === selectedCat);

  return (
    <div className="pt-6 pb-4 space-y-6">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <div className="size-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20 shadow-sm">
          <Sparkles className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Ask OpsBrain Industrial Copilot</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The copilot searches across vector embeddings and traverses entity graph links to synthesize cited, audit-ready answers.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-area text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCat(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                selectedCat === cat.id
                  ? "bg-brand text-brand-foreground border-brand font-semibold shadow-sm"
                  : "bg-card hover:bg-accent/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Query list */}
        <div className="grid gap-2">
          {filteredQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => onSelectQuery(q.text)}
              className="text-left text-xs px-4 py-3 rounded-xl border bg-card/80 hover:bg-accent/50 hover:border-brand/40 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-md bg-brand/10 text-brand flex items-center justify-center text-xs shrink-0 group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                  ?
                </span>
                <span className="font-medium text-foreground">{q.text}</span>
              </div>
              <span className="text-muted-foreground group-hover:text-brand transition-colors text-sm">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  openSource,
  reasoningStep,
}: {
  message: ChatMessage;
  openSource: (docId: string) => void;
  reasoningStep: string;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-brand text-brand-foreground rounded-2xl rounded-tr-xs px-4 py-3 text-sm shadow-md font-medium leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="size-9 rounded-xl bg-card border flex items-center justify-center text-brand shrink-0 mt-0.5 shadow-sm">
        {message.error ? <AlertTriangle className="size-4 text-rose-500" /> : <Sparkles className="size-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {message.loading ? (
          <ThinkingIndicator step={reasoningStep} />
        ) : (
          <>
            <div className="bg-card border rounded-2xl rounded-tl-xs p-4 text-sm leading-relaxed shadow-sm relative group">
              <div className="flex items-center justify-between pb-2 mb-2 border-b text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" /> OpsBrain Synthesized Response
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-[10.5px] gap-1 opacity-70 hover:opacity-100"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <FormattedAnswer text={message.content} />
            </div>

            {/* Confidence & Chunks Metadata */}
            {(message.confidence !== undefined || message.chunksConsidered !== undefined) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {message.confidence !== undefined && (
                  <ConfidenceBadge confidence={message.confidence} />
                )}
                {message.chunksConsidered !== undefined && (
                  <Badge variant="outline" className="text-[10px] gap-1 bg-card">
                    <Network className="size-2.5 text-brand" />
                    {message.chunksConsidered} chunks retrieved across graph
                  </Badge>
                )}
              </div>
            )}

            {/* Citations List */}
            {message.citations && message.citations.length > 0 && (
              <CitationList citations={message.citations} openSource={openSource} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator({ step }: { step: string }) {
  return (
    <div className="bg-card border rounded-2xl rounded-tl-xs p-4 text-xs flex items-center gap-3 text-muted-foreground shadow-sm">
      <Loader2 className="size-4 animate-spin text-brand shrink-0" />
      <div className="space-y-0.5">
        <div className="font-semibold text-foreground">Executing Hybrid Retrieval</div>
        <div className="text-[11px] font-mono text-brand">{step}</div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let label: "High" | "Medium" | "Low";
  let cls: string;
  if (confidence >= 0.4) {
    label = "High";
    cls = "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300";
  } else if (confidence >= 0.18) {
    label = "Medium";
    cls = "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
  } else {
    label = "Low";
    cls = "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300";
  }
  return (
    <Badge variant="outline" className={`gap-1 font-mono text-[10.5px] ${cls}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label} Confidence · {(confidence * 100).toFixed(0)}%
    </Badge>
  );
}

function CitationList({
  citations,
  openSource,
}: {
  citations: Citation[];
  openSource: (docId: string) => void;
}) {
  return (
    <div className="space-y-2 pt-1">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <Quote className="size-3 text-brand" /> Verified Source Citations ({citations.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <button
            key={c.index}
            onClick={() => openSource(c.docId)}
            className={`citation-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] hover:scale-[1.02] transition-all font-medium ${
              DOC_TYPE_COLORS[c.docType] ?? "bg-muted text-muted-foreground border-border"
            }`}
            title={`${c.title} — ${c.section} (Page ${c.page})`}
          >
            <span className="font-mono opacity-70 font-bold">[C{c.index}]</span>
            <span>{c.docId}</span>
            {c.graphExpanded && (
              <span aria-label="Graph Expanded Link">
                <Network className="size-3 text-amber-600 dark:text-amber-400" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  const parts = text.split(/(Sources:[\s\S]*)$/);
  const main = parts[0] || text;
  const sourcesLine = parts[1];

  const segments = main.split(/(\[C\d+\])/g);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {segments.map((seg, i) => {
          if (/^\[C\d+\]$/.test(seg)) {
            return (
              <sup key={i} className="text-brand font-mono text-[11px] font-bold mx-0.5 bg-brand/15 px-1 py-0.2 rounded border border-brand/30">
                {seg}
              </sup>
            );
          }
          return <span key={i}>{seg}</span>;
        })}
      </div>
      {sourcesLine && (
        <div className="text-[11.5px] text-muted-foreground border-t pt-2 mt-2 font-mono bg-muted/30 p-2 rounded">
          {sourcesLine}
        </div>
      )}
    </div>
  );
}
