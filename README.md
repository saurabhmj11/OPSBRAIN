# OpsBrain — Industrial Knowledge Intelligence Platform

> **ET AI Hackathon 2026 · Problem Statement #8: Industrial Intelligence**  
> **Designed & Developed by [Saurabh Lokhande](https://github.com/saurabhmj11) & Team `saurabhmj11`**

---

## ⚡ Overview

**OpsBrain** is an enterprise AI knowledge intelligence engine designed for asset-intensive industrial operations (refineries, chemical plants, manufacturing, and heavy engineering). 

Industrial knowledge loss is not a *search* problem — it's a **connection** problem. Plain chatbots over PDF folders fail because critical operational insights span across heterogeneous files: work orders, OEM manual threshold tables, inspection reports, near-miss logs, and regulatory standards.

OpsBrain ingests 18 industrial documents, extracts equipment entities (e.g. `Pump P-204`, `Compressor C-302`, `Valve V-118`), constructs a cross-document **Entity Knowledge Graph**, and exposes that knowledge through **three autonomous agents**.

---

## 🤖 Flagship Autonomous Agents

### 1. 💬 Expert Knowledge Copilot (`/copilot`)
- **Citation-First RAG**: Every factual claim is backed by explicit source citation chips (`[C1]`, `[C2]`).
- **Fail-Closed Safety**: Returns *"Insufficient evidence"* rather than hallucinating if retrieval confidence is below threshold.
- **Topic Quick Categories**: Preset filters for *Equipment History*, *OEM Manual Specs*, *Compliance & Safety*, and *Incident Surfacing*.
- **Multi-Stage Execution Visualizer**: Displays step-by-step reasoning (*Vector Search @ 1536-dim* → *Graph Traversal* → *Citation Synthesis*).

### 2. ⚡ Proactive Lessons Learned Agent (`/lessons`)
- **Fault-Similarity Surfacing**: Cross-references new work order descriptions or fault telemetry against historical incident logs.
- **Scenario Presets**: 1-click test scenarios for real plant events (*C-302 High Vibration Surge*, *P-204 Hydrocarbon Seal Leak*, *V-118 Packing Blowout*).
- **Agent Rationale & Risk Rating**: Displays match percentages, historical incident links, and recommended escalation actions.

### 3. 🛡️ Compliance Command Center (`/compliance`)
- **Statutory Audit Engine**: Automatically audits plant SOPs against **OISD-118** and **Factories Act 1948** statutory clauses.
- **Plant Compliance Index**: Visual percentage score of covered vs. partial vs. uncovered clauses.
- **Side-by-Side Diff Cards**: Displays mandatory regulatory clause text next to extracted plant procedure evidence.
- **1-Click SOP Draft Action**: Enables engineering teams to trigger automated SOP revision drafts.

---

## 🕸️ Knowledge Graph & Ingested Corpus

- **18 Ingested Industrial Documents**: Work Orders, OEM Manuals, SOPs, Inspection Reports, Incident Logs, Near-Miss Reports, and OISD-118 Clauses.
- **7 Extracted Entity Types**: `Equipment`, `Personnel`, `WorkOrders`, `Incidents`, `NearMisses`, `Procedures`, and `RegulatoryClauses`.
- **Interactive Graph Inspector**: Force-directed SVG visualizer with zoom/pan controls, entity type toggles, and side detail drawer.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Database**: Prisma ORM (SQLite / PostgreSQL)
- **Language**: TypeScript 5
- **UI Components**: Shadcn UI primitives, Sonner Toast Notifications, Glassmorphic Design System

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` or `Bun v1 text`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/saurabhmj11/OPSBRAIN.git
cd OPSBRAIN
bun install   # or npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_DEMO_ADMIN_TOKEN="demo-token-opsbrain-2026"
```

### 3. Initialize Prisma Database & Sync Schema
```bash
npx prisma generate
npx prisma db push --accept-data-loss
```

### 4. Start Development Server
```bash
npx next dev -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Ingest Demo Corpus
Click the **"Initialize Corpus (18 Docs)"** button in the sidebar to run LLM entity extraction, build the knowledge graph, and seed all compliance clauses.

---

## 📂 Project Structure

```
f:\upstop
├── prisma/
│   ├── schema.prisma       # Database schema (Documents, Chunks, Graph Entities, Clauses)
│   └── dev.db              # SQLite Database
├── src/
│   ├── app/
│   │   ├── api/            # API routes (/api/chat, /api/graph, /api/compliance, /api/seed)
│   │   ├── globals.css     # Design system, glassmorphism & glows
│   │   ├── layout.tsx      # Root layout & font configuration
│   │   └── page.tsx        # Main dashboard wrapper & global footer
│   └── components/
│       └── opsbrain/
│           ├── Sidebar.tsx           # Sidebar navigation, theme toggle, corpus status
│           ├── OverviewPanel.tsx     # Bento-Grid dashboard & architecture flow
│           ├── CopilotPanel.tsx      # Citation-first RAG chat interface
│           ├── GraphPanel.tsx        # Interactive SVG knowledge graph visualizer
│           ├── CompliancePanel.tsx   # OISD-118 compliance audit dashboard
│           ├── LessonsPanel.tsx      # Proactive incident surfacing agent
│           ├── DocumentsPanel.tsx    # Ingested document hub & search
│           ├── SourceDrawer.tsx      # Chunk & metadata inspector drawer
│           └── types.ts              # Shared TypeScript definitions
├── package.json
└── README.md
```

---

## 👨‍💻 Author & Team Credits

Designed and Developed with ❤️ for **ET AI Hackathon 2026** by:

- **Saurabh Lokhande** ([@saurabhmj11](https://github.com/saurabhmj11))
- **Team**: `saurabhmj11`

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
