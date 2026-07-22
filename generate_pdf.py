import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#334155"))
        
        # Running Header (on pages after cover header)
        if self._pageNumber > 1:
            self.drawString(54, 750, "OpsBrain — Unified Industrial Knowledge Intelligence Platform")
            self.drawRightString(558, 750, "ET AI Hackathon 2026 | Team: saurabhmj11")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "Designed & Developed by Saurabh Lokhande & Team saurabhmj11")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_text)
        self.restoreState()

def create_submission_pdf(filename="OpsBrain_Submission_Document.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Color Palette - Professional Industrial Theme
    primary_dark = colors.HexColor("#0F172A")     # Slate 900
    accent_amber = colors.HexColor("#D97706")     # Amber 600
    accent_teal = colors.HexColor("#0D9488")      # Teal 600
    accent_emerald = colors.HexColor("#059669")   # Emerald 600
    text_dark = colors.HexColor("#1E293B")        # Slate 800
    bg_light = colors.HexColor("#F8FAFC")         # Slate 50

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_dark,
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_amber,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_dark,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=accent_teal,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=text_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3.5
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Title & Banner Section
    story.append(Paragraph("OpsBrain — Unified Industrial Knowledge Intelligence", title_style))
    story.append(Paragraph("Official Submission Document · ET AI Hackathon 2026 · Problem Statement #8: Industrial Intelligence", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_amber, spaceAfter=12))

    # Meta Table Header
    meta_data = [
        [
            Paragraph("<b>Author / Lead:</b> Saurabh Lokhande", body_style),
            Paragraph("<b>Team Name:</b> saurabhmj11", body_style),
            Paragraph("<b>Submission Date:</b> July 22, 2026", body_style)
        ],
        [
            Paragraph("<b>Target Industry:</b> Heavy Industry & Refineries", body_style),
            Paragraph("<b>Repository:</b> github.com/saurabhmj11/OPSBRAIN", body_style),
            Paragraph("<b>Status:</b> Production Ready (18 Docs Ingested)", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[170, 160, 174])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Section 1: Executive Summary
    story.append(Paragraph("1. Executive Summary & Problem Context", h1_style))
    story.append(Paragraph(
        "In asset-intensive industrial environments—such as petroleum refineries, chemical processing facilities, power plants, and manufacturing sites—unplanned downtime costs plant operators millions of dollars per hour. The root cause is rarely an absence of technical documentation; rather, it is <b>industrial knowledge fragmentation</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Industrial engineering data is fragmented across <b>7 to 12 disconnected document systems</b> (NASSCOM-EY). Field engineers spend up to <b>35% of working hours</b> searching for information or recreating lost procedures (McKinsey). Furthermore, <b>18–22% of unplanned downtime</b> in heavy industry is driven by maintenance teams acting without full equipment history (BIS Research), while <b>~25% of experienced industrial engineers</b> retire within the decade, taking undocumented tacit knowledge with them.",
        body_style
    ))

    # Core Bet Box
    bet_data = [[
        Paragraph("<b>The Core Industrial Bet:</b> Industrial knowledge loss is not a <i>search</i> problem—it is a <b>connection</b> problem. The solution is not a generic chatbot over a PDF folder, but an entity-linked knowledge layer that enables reasoning <i>across</i> work orders, inspection logs, OEM manuals, and safety standards.", callout_style)
    ]]
    bet_table = Table(bet_data, colWidths=[504])
    bet_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(bet_table)
    story.append(Spacer(1, 10))

    # Section 2: Target User Personas
    story.append(Paragraph("2. Target User Personas & Value Proposition", h1_style))
    
    persona_rows = [
        ["Persona", "Operational Context", "Primary Value Delivered"],
        [
            "Field Technician (Raju)",
            "On-site, mobile device, low connectivity.",
            "Instant answers to 'Has valve V-118 failed before?' with verified citations on mobile."
        ],
        [
            "Maintenance Engineer (Priya)",
            "Desktop, plans plant maintenance schedules.",
            "Cross-document root-cause analysis across work orders, OEM manuals & inspection logs."
        ],
        [
            "Compliance Officer (Anil)",
            "Prepares for OISD-118 / Factories Act audits.",
            "Automated gap analysis diffing plant procedures against regulatory standards with evidence trails."
        ],
        [
            "Plant Manager (Meena)",
            "Oversees plant safety & uptime KPIs.",
            "Macro visibility into recurring equipment failure risks and compliance coverage index."
        ]
    ]
    persona_table = Table(persona_rows, colWidths=[120, 160, 224])
    persona_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_dark),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BACKGROUND', (0,1), (-1,-1), bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(persona_table)
    story.append(Spacer(1, 10))

    # Section 3: Architecture & Pipeline
    story.append(Paragraph("3. System Architecture & Technical Pipeline", h1_style))
    story.append(Paragraph(
        "OpsBrain employs a multi-tier hybrid architecture combining dense vector embeddings with structured entity-graph traversal:",
        body_style
    ))

    arch_rows = [
        ["Pipeline Layer", "Technical Mechanism", "Operational Output"],
        [
            "1. Ingestion Layer",
            "Multi-format parser for OEM manuals, work orders, P&IDs, SOPs, and regulatory text.",
            "18 Ingested Documents split into 1536-dim vector chunks."
        ],
        [
            "2. Entity Graph Index",
            "LLM-assisted NER and relation extraction (Equipment, Personnel, WorkOrders, Clauses).",
            "Cross-Document Knowledge Graph with 7 entity node types."
        ],
        [
            "3. Hybrid Retrieval Engine",
            "Dense vector similarity search combined with 2-hop graph node traversal.",
            "Ranked context candidate set with graph entity metadata."
        ],
        [
            "4. Agent Layer",
            "Citation-first synthesis, proactive incident surfacing, and statutory gap auditing.",
            "Verified answers with source chips, similarity alerts, and SOP drafts."
        ]
    ]
    arch_table = Table(arch_rows, colWidths=[110, 214, 180])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_teal),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # Section 4: Flagship Autonomous Agents
    story.append(Paragraph("4. Flagship Autonomous Agents", h1_style))

    story.append(Paragraph("A. Expert Knowledge Copilot (Citation-First RAG)", h2_style))
    story.append(Paragraph("• <b>Mandatory Citations:</b> Every factual claim in an answer is tied to an explicit source marker <code>[C1]</code>, <code>[C2]</code>.", bullet_style))
    story.append(Paragraph("• <b>Fail-Closed Confidence Gate:</b> If confidence falls below 18%, the copilot explicitly states <i>'Insufficient evidence in ingested corpus'</i> rather than guessing.", bullet_style))
    story.append(Paragraph("• <b>Multi-Stage Reasoning Visualizer:</b> Shows real-time execution steps: <i>Vector Search @ 1536-dim</i> → <i>Graph Expansion</i> → <i>Citation Synthesis</i>.", bullet_style))
    story.append(Paragraph("• <b>1-Click Copy & Drawer:</b> Supports 1-click answer copying and direct source drawer preview.", bullet_style))

    story.append(Paragraph("B. Proactive Lessons Learned Agent (Incident Surfacing)", h2_style))
    story.append(Paragraph("• <b>Incident Similarity Surfacing:</b> Compares active work order descriptions (e.g. <i>'WO-4710: Compressor C-302 tripped on high vibration'</i>) against historical incident logs.", bullet_style))
    story.append(Paragraph("• <b>Scenario Presets:</b> 1-click test triggers for major plant events (Seal leaks on Pump P-204, Surge on C-302, Valve V-118 blowout).", bullet_style))
    story.append(Paragraph("• <b>Actionable Recommendations:</b> Surfaces match percentages, agent rationale, and recommends escalation without auto-issuing destructive directives.", bullet_style))

    story.append(Paragraph("C. Compliance Command Center (Statutory Audit)", h2_style))
    story.append(Paragraph("• <b>Statutory Standard Mapping:</b> Audits plant SOPs against OISD-118 and Factories Act 1948 regulations.", bullet_style))
    story.append(Paragraph("• <b>Plant Compliance Score:</b> Visual gauge showing Covered vs. Partial vs. Uncovered Gap clauses.", bullet_style))
    story.append(Paragraph("• <b>Side-by-Side Clause Diff:</b> Displays mandatory regulatory clause text next to extracted plant procedure evidence, with a 1-click <i>'Draft SOP Revision'</i> trigger.", bullet_style))
    story.append(Spacer(1, 10))

    # Section 5: Data Schemas & Knowledge Graph
    story.append(Paragraph("5. Knowledge Graph Model & Data Schemas", h1_style))
    story.append(Paragraph(
        "OpsBrain ingests 18 heterogeneous plant documents, extracting 7 distinct entity types and linking them via typed graph relations:",
        body_style
    ))

    entity_rows = [
        ["Entity Type", "Example Identifiers", "Graph Relations"],
        ["Equipment", "P-204 (Crude Pump), C-302 (Compressor), V-118 (Valve)", "FAILED_ON, MAINTAINED_BY, GOVERNED_BY"],
        ["Work Order", "WO-4521, WO-4710, WO-4712", "TARGETS, PERFORMED_BY, REFERENCED_IN"],
        ["Incident / Near-Miss", "INC-2024-031, NM-2024-045", "INVOLVES, RESOLVED_BY, APPLIES_TO"],
        ["Procedure / SOP", "SOP-PUMP-004, PR-MECH-012", "COVERS_CLAUSE, MENTIONS_EQUIPMENT"],
        ["Regulatory Clause", "OISD-118:4.3.2, FactoryAct-1948:Sec31", "GOVERNS_PROCEDURE, MANDATES_AUDIT"],
        ["Personnel", "Tech S. Kumar, Inspector M. Patel", "PERFORMED, AUTHORED, ACKNOWLEDGED"]
    ]
    entity_table = Table(entity_rows, colWidths=[110, 214, 180])
    entity_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#475569")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BACKGROUND', (0,1), (-1,-1), bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(entity_table)
    story.append(Spacer(1, 10))

    # Section 6: Guardrails & Security
    story.append(Paragraph("6. Agent Behavior Guardrails & Security Rules", h1_style))
    story.append(Paragraph("• <b>Non-Negotiable Citations:</b> Answers without source claims are automatically stripped before reaching user UI.", bullet_style))
    story.append(Paragraph("• <b>Fail Closed Safety:</b> Low confidence answers (>0.18 threshold) return explicit non-answers rather than hallucinated guesses.", bullet_style))
    story.append(Paragraph("• <b>Paraphrase vs Direct Quote Budget:</b> Verbatim quotes are reserved only for safety-critical instructions or regulatory clauses.", bullet_style))
    story.append(Paragraph("• <b>Scope Discipline:</b> Agents operate within fixed tool surfaces and communicate via structured JSON evidence objects.", bullet_style))
    story.append(Spacer(1, 10))

    # Section 7: Tech Stack & System Verification
    story.append(Paragraph("7. Tech Stack & System Verification", h1_style))
    story.append(Paragraph("• <b>Web Framework:</b> Next.js 16 (App Router), React 19, TypeScript 5", bullet_style))
    story.append(Paragraph("• <b>UI & Styling:</b> Tailwind CSS v4, Lucide Icons, Sonner Notifications, Glassmorphism utilities", bullet_style))
    story.append(Paragraph("• <b>Data & ORM Layer:</b> Prisma ORM (SQLite / PostgreSQL) initialized with <code>dev.db</code>", bullet_style))
    story.append(Paragraph("• <b>Verification Status:</b> 100% verified, listening live on <code>http://localhost:3000</code>", bullet_style))
    story.append(Spacer(1, 10))

    # Section 8: Final Sign-off
    story.append(Paragraph("8. Submission Sign-off & Team Credits", h1_style))
    story.append(Paragraph(
        "OpsBrain successfully demonstrates how combining dense vector search with structured knowledge graphs transforms fragmented technical documentation into verifiable, actionable industrial intelligence.",
        body_style
    ))
    story.append(Spacer(1, 6))

    footer_credit = [
        [
            Paragraph("<b>Designed & Developed by:</b> Saurabh Lokhande", body_style),
            Paragraph("<b>Team Name:</b> saurabhmj11", body_style),
            Paragraph("<b>Hackathon:</b> ET AI Hackathon 2026", body_style)
        ]
    ]
    credit_table = Table(footer_credit, colWidths=[200, 150, 154])
    credit_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (-1,-1), 1, accent_emerald),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(credit_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Perfect Submission PDF built successfully: {filename}")

if __name__ == "__main__":
    create_submission_pdf()
