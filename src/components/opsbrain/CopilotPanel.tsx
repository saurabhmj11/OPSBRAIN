"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage, Citation } from "./types";
import { DOC_TYPE_COLORS } from "./types";
import { Sparkles, Send, Loader2, AlertTriangle, Quote, Network, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const SUGGESTED_QUERIES = [
  "Has pump P-204 failed before, and how was it fixed?",
  "What does the OEM manual say about vibration limits for C-302?",
  "Who performed the last inspection on Valve V-118 and when?",
  "What caused the surge event on Compressor C-302 in February 2024?",
  "What are the requirements for hot work permits per OISD-118?",
  "Show me the lessons learned from incident INC-2024-045",
];

export function CopilotPanel({ openSource }: { openSource: (docId: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
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
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-brand" />
          <div>
            <h1 className="font-semibold text-base">Expert Knowledge Copilot</h1>
            <p className="text-xs text-muted-foreground">
              Citation-first RAG · cross-document reasoning · fail-closed on low confidence
            </p>
          </div>
        </div>
      </div>

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-area px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <EmptyState onSelect={(q) => send(q)} />
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} openSource={openSource} />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about equipment history, compliance, procedures…"
              className="resize-none min-h-[52px] max-h-[160px] bg-background"
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
              className="size-[52px] bg-brand hover:bg-brand/90 text-brand-foreground shrink-0"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Every factual claim is traceable to a source document. Press Enter to send, Shift+Enter for newline.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="text-center pt-8 pb-4">
      <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20">
        <Sparkles className="size-6" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Ask OpsBrain anything</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        The copilot retrieves from across the ingested corpus, follows entity links in the
        knowledge graph, and synthesizes a cited answer.
      </p>
      <div className="text-left max-w-2xl mx-auto">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Lightbulb className="size-3" /> Try one of these
        </div>
        <div className="grid gap-2">
          {SUGGESTED_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => onSelect(q)}
              className="text-left text-sm px-3.5 py-2.5 rounded-md border bg-card hover:bg-accent/50 hover:border-brand/40 transition-colors flex items-start gap-2"
            >
              <span className="text-brand mt-0.5 text-xs">→</span>
              <span className="flex-1">{q}</span>
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
}: {
  message: ChatMessage;
  openSource: (docId: string) => void;
}) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-brand text-brand-foreground rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="size-8 rounded-full bg-card border flex items-center justify-center text-brand shrink-0 mt-0.5">
        {message.error ? <AlertTriangle className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {message.loading ? (
          <ThinkingIndicator />
        ) : (
          <>
            <div className="bg-card border rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed">
              <FormattedAnswer text={message.content} />
            </div>
            {(message.confidence !== undefined || message.chunksConsidered !== undefined) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {message.confidence !== undefined && (
                  <ConfidenceBadge confidence={message.confidence} />
                )}
                {message.chunksConsidered !== undefined && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Network className="size-2.5" />
                    {message.chunksConsidered} chunks retrieved
                  </Badge>
                )}
              </div>
            )}
            {message.citations && message.citations.length > 0 && (
              <CitationList citations={message.citations} openSource={openSource} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="bg-card border rounded-2xl rounded-tl-md px-4 py-3.5 text-sm flex items-center gap-2 text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin text-brand" />
      <span>Retrieving · traversing graph · synthesizing…</span>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let label: "High" | "Medium" | "Low";
  let cls: string;
  if (confidence >= 0.4) {
    label = "High";
    cls = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (confidence >= 0.18) {
    label = "Medium";
    cls = "bg-amber-50 text-amber-900 border-amber-200";
  } else {
    label = "Low";
    cls = "bg-rose-50 text-rose-800 border-rose-200";
  }
  return (
    <Badge variant="outline" className={`gap-1 ${cls}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label} confidence · {(confidence * 100).toFixed(0)}%
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
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
        <Quote className="size-2.5" /> Sources ({citations.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <button
            key={c.index}
            onClick={() => openSource(c.docId)}
            className={`citation-chip inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10.5px] hover:bg-accent/70 transition-colors ${
              DOC_TYPE_COLORS[c.docType] ?? "bg-muted text-muted-foreground border-border"
            }`}
            title={`${c.title} — ${c.section} (p.${c.page})`}
          >
            <span className="font-mono opacity-70">[C{c.index}]</span>
            <span className="font-medium">{c.docId}</span>
            {c.graphExpanded && (
              <Network className="size-2.5 opacity-60" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  // Render answer with citation markers highlighted, plus "Sources:" line broken out.
  // Note: dotAll flag deliberately omitted for ES2017 compatibility.
  const parts = text.split(/(Sources:[\s\S]*)$/);
  const main = parts[0] || text;
  const sourcesLine = parts[1];

  // Highlight [C<n>] markers
  const segments = main.split(/(\[C\d+\])/g);

  return (
    <div className="space-y-2">
      <div>
        {segments.map((seg, i) => {
          if (/^\[C\d+\]$/.test(seg)) {
            return (
              <sup key={i} className="text-brand font-mono text-[10px] font-semibold mx-0.5">
                {seg}
              </sup>
            );
          }
          return <span key={i}>{seg}</span>;
        })}
      </div>
      {sourcesLine && (
        <div className="text-[11px] text-muted-foreground border-t pt-2 mt-2">{sourcesLine}</div>
      )}
    </div>
  );
}
