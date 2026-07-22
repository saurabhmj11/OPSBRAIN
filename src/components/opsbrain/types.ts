// Shared types for OpsBrain frontend.

export type Citation = {
  index: number;
  docId: string;
  docType: string;
  title: string;
  section: string;
  page: number;
  text: string;
  graphExpanded: boolean;
  similarity: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  chunksConsidered?: number;
  createdAt: number;
  loading?: boolean;
  error?: boolean;
};

export type GraphNode = {
  id: string;
  internalId: string;
  type: "Equipment" | "Person" | "Procedure" | "RegulatoryClause" | "Incident" | "NearMiss" | "WorkOrder" | string;
  name: string;
  label: string;
  documentId?: string | null;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: string;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  counts: Record<string, number>;
  totalNodes: number;
  totalEdges: number;
};

export type GapRecord = {
  id: string;
  clauseId: string;
  status: "Covered" | "Partial" | "Gap";
  procedureId: string | null;
  evidence: string;
  rationale: string;
  lastChecked: string;
  clause?: {
    clauseId: string;
    standard: string;
    title: string;
    text: string;
    category: string;
  };
};

export type LessonsAlert = {
  id: string;
  triggerText: string;
  triggerRef: string;
  matchedIncidentIds: string[];
  similarity: number;
  rationale: string;
  acknowledged: boolean;
  createdAt: string;
};

export type DocumentRecord = {
  id: string;
  docId: string;
  title: string;
  docType: string;
  facility: string;
  sourceSystem: string;
  uploadedAt: string;
  meta: Record<string, string>;
  chunkCount: number;
};

export type Stats = {
  counts: {
    documents: number;
    chunks: number;
    entities: number;
    relations: number;
    clauses: number;
    gaps: number;
    alerts: number;
    queryLogs: number;
  };
  docsByType: Record<string, number>;
  entitiesByType: Record<string, number>;
  gapSummary: Record<string, number>;
};

// Entity type → color (industrial palette, no indigo/blue per skill rules)
export const ENTITY_COLORS: Record<string, string> = {
  Equipment: "#d97706",          // amber-600
  Person: "#7c3aed",             // violet-600
  Procedure: "#0d9488",          // teal-600
  RegulatoryClause: "#dc2626",   // red-600
  Incident: "#b91c1c",           // red-700
  NearMiss: "#f59e0b",           // amber-500
  WorkOrder: "#65a30d",          // lime-600
};

export const ENTITY_LABELS: Record<string, string> = {
  Equipment: "Equipment",
  Person: "Personnel",
  Procedure: "Procedure",
  RegulatoryClause: "Regulatory Clause",
  Incident: "Incident",
  NearMiss: "Near-Miss",
  WorkOrder: "Work Order",
};

export const DOC_TYPE_COLORS: Record<string, string> = {
  WorkOrder: "bg-lime-100 text-lime-900 border-lime-300",
  InspectionReport: "bg-amber-100 text-amber-900 border-amber-300",
  IncidentReport: "bg-red-100 text-red-900 border-red-300",
  NearMiss: "bg-orange-100 text-orange-900 border-orange-300",
  OEMManual: "bg-teal-100 text-teal-900 border-teal-300",
  SOP: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Regulation: "bg-rose-100 text-rose-900 border-rose-300",
  Procedure: "bg-cyan-100 text-cyan-900 border-cyan-300",
};
