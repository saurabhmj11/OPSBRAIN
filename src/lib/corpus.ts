// Demo corpus for OpsBrain — synthetic-but-realistic industrial documents.
// Mix of work orders, inspection reports, incident reports, OEM manual excerpts,
// SOPs, regulatory clauses, and procedures.
// All entities referenced here (equipment tags, person names, dates, clause IDs)
// are extracted by the ingestion pipeline and used to build the knowledge graph.

export type CorpusDoc = {
  docId: string;
  title: string;
  docType:
    | "WorkOrder"
    | "InspectionReport"
    | "IncidentReport"
    | "NearMiss"
    | "OEMManual"
    | "SOP"
    | "Regulation"
    | "Procedure";
  facility: string;
  sourceSystem: string;
  meta: Record<string, string>;
  sections: { heading: string; body: string; page?: number }[];
};

export const CORPUS: CorpusDoc[] = [
  // ─── Work Orders ───────────────────────────────────────────────────────────
  {
    docId: "WO-4521",
    title: "Work Order: Pump P-204 Mechanical Seal Replacement",
    docType: "WorkOrder",
    facility: "Plant-A",
    sourceSystem: "SAP-PM",
    meta: { raisedBy: "Priya Sharma", assignedTo: "Raju Kumar", status: "Closed", priority: "High" },
    sections: [
      {
        heading: "Header",
        body:
          "Work Order WO-4521 raised on 2024-11-12 by Priya Sharma (Maintenance Engineer). Assigned to Raju Kumar (Field Technician). Equipment: Pump P-204 (Centrifugal Pump, Crude Unit 3). Priority: High.",
        page: 1,
      },
      {
        heading: "Problem Description",
        body:
          "Pump P-204 reported leaking from mechanical seal at 08:42 on 2024-11-12 by Control Room operator. Visual inspection confirmed seal oil leaking at rate of approximately 2 L/min. Pump immediately isolated and tagged out per SOP-LOTO-001.",
        page: 1,
      },
      {
        heading: "Root Cause",
        body:
          "Mechanical seal (Part No. MSE-204-A) failed due to cavitation-induced vibration. Bearing housing vibration trending upward since 2024-09-30 inspection (see IR-2024-088). Seal had been in service 14 months; expected life 18-24 months under normal conditions.",
        page: 2,
      },
      {
        heading: "Corrective Action",
        body:
          "Replaced mechanical seal with new unit (Part No. MSE-204-A, Batch B-2024-11). Re-aligned pump-motor coupling to within 0.05 mm TIR. Replaced bearing housing oil (ISO VG 46). Leak test conducted at 09:30 on 2024-11-13 — no leak observed. Pump P-204 returned to service at 14:00 on 2024-11-13.",
        page: 2,
      },
      {
        heading: "Recommendation",
        body:
          "Increase vibration monitoring frequency for P-204 from weekly to daily for next 30 days. Schedule follow-up inspection on 2024-12-15. Refer to OEM manual OM-P204-Rev3 for vibration acceptance criteria.",
        page: 3,
      },
    ],
  },
  {
    docId: "WO-4522",
    title: "Work Order: Pump P-204 Follow-up Vibration Survey",
    docType: "WorkOrder",
    facility: "Plant-A",
    sourceSystem: "SAP-PM",
    meta: { raisedBy: "Priya Sharma", assignedTo: "Raju Kumar", status: "Closed", priority: "Medium" },
    sections: [
      {
        heading: "Header",
        body:
          "Work Order WO-4522 raised on 2024-12-15 by Priya Sharma (Maintenance Engineer). Assigned to Raju Kumar. Equipment: Pump P-204 (Crude Unit 3). Trigger: Follow-up from WO-4521.",
        page: 1,
      },
      {
        heading: "Inspection",
        body:
          "Vibration survey conducted on Pump P-204 at 10:15 on 2024-12-15. Driver End (DE) bearing: 2.1 mm/s RMS (within ISO 10816 Zone A). Non-Drive End (NDE) bearing: 2.4 mm/s RMS (Zone A). No cavitation noise observed. Seal performance: leak-free since WO-4521 seal replacement.",
        page: 1,
      },
      {
        heading: "Conclusion",
        body:
          "Pump P-204 returned to normal monitoring regime (weekly). Mechanical seal from WO-4521 performing satisfactorily. Vibration trending normal — no recurrence of cavitation-induced failure.",
        page: 2,
      },
    ],
  },
  {
    docId: "WO-4601",
    title: "Work Order: Valve V-118 Pressure Relief Inspection",
    docType: "WorkOrder",
    facility: "Plant-A",
    sourceSystem: "SAP-PM",
    meta: { raisedBy: "Anil Verma", assignedTo: "Raju Kumar", status: "Closed", priority: "High" },
    sections: [
      {
        heading: "Header",
        body:
          "Work Order WO-4601 raised on 2025-01-08 by Anil Verma (Compliance Officer). Assigned to Raju Kumar. Equipment: Valve V-118 (Pressure Relief Valve, Tank T-203, Hydrocarbon Service). Priority: High. Trigger: Scheduled PSV inspection per OISD-118 clause 4.3.2.",
        page: 1,
      },
      {
        heading: "Work Performed",
        body:
          "Removed Valve V-118 from Tank T-203 service at 09:00 on 2025-01-09. Set pressure verified at 8.4 bar (design: 8.5 bar — within tolerance ±2%). Valve seat cleaned and lapped. Spring replaced with new part (Part No. SPR-V118-A). Bench-tested per OEM procedure. Reinstalled at 17:30 on 2025-01-09.",
        page: 1,
      },
      {
        heading: "Compliance",
        body:
          "All work performed in compliance with OISD-118 clause 4.3.2 (Pressure Relief Devices — periodic inspection interval not exceeding 12 months). Last inspection: 2024-01-15. Next due: 2026-01-09. Reference Procedure PR-PSV-001 for the full inspection checklist.",
        page: 2,
      },
    ],
  },
  {
    docId: "WO-4705",
    title: "Work Order: Compressor C-302 Surge Vibration Investigation",
    docType: "WorkOrder",
    facility: "Plant-A",
    sourceSystem: "SAP-PM",
    meta: { raisedBy: "Meena Iyer", assignedTo: "Priya Sharma", status: "Open", priority: "High" },
    sections: [
      {
        heading: "Header",
        body:
          "Work Order WO-4705 raised on 2025-02-14 by Meena Iyer (Plant Manager). Assigned to Priya Sharma. Equipment: Compressor C-302 (Centrifugal Compressor, Reforming Unit). Priority: High. Trigger: Surge event on 2025-02-13 with vibration spike to 9.8 mm/s RMS.",
        page: 1,
      },
      {
        heading: "Background",
        body:
          "Compressor C-302 experienced surge event at 23:15 on 2025-02-13. Anti-surge controller moved to manual due to setpoint drift. Vibration exceeded ISO 10816 Zone D (9.8 mm/s RMS vs threshold 7.1 mm/s). Unit tripped on high vibration. Similar surge event occurred on Incident INC-2024-045 — see that report for prior root-cause analysis.",
        page: 1,
      },
      {
        heading: "Action Plan",
        body:
          "(1) Inspect anti-surge controller calibration. (2) Trend vibration spectrum for sub-synchronous component. (3) Inspect dry-gas seal. (4) Review operating envelope with process engineering. Target completion: 2025-02-21.",
        page: 2,
      },
    ],
  },

  // ─── Inspection Reports ────────────────────────────────────────────────────
  {
    docId: "IR-2024-088",
    title: "Inspection Report: Pump P-204 Quarterly Vibration Survey",
    docType: "InspectionReport",
    facility: "Plant-A",
    sourceSystem: "InspectTech",
    meta: { inspector: "Priya Sharma", status: "Closed", date: "2024-09-30" },
    sections: [
      {
        heading: "Inspection Summary",
        body:
          "Quarterly vibration survey conducted on Pump P-204 (Crude Unit 3) on 2024-09-30 by Priya Sharma. Pump P-204 is a centrifugal pump (Sulzer ZF-250) commissioned 2019-04-12. Last overhaul: 2023-08-15.",
        page: 1,
      },
      {
        heading: "Findings",
        body:
          "Driver End (DE) bearing vibration: 4.8 mm/s RMS (ISO 10816 Zone C — unsatisfactory). Non-Drive End (NDE): 4.2 mm/s RMS (Zone C). Dominant frequency: 1× shaft speed — indicates imbalance or misalignment. Trend from previous quarter: +1.2 mm/s RMS. Recommendation: schedule alignment check within 30 days. Bearing housing oil sample shows elevated iron content (45 ppm, normal <20 ppm).",
        page: 2,
      },
      {
        heading: "Recommendation",
        body:
          "Increasing vibration trend and metal content suggest bearing degradation in progress. Recommend scheduling corrective maintenance within 60 days. Reference OEM manual OM-P204-Rev3 section 7.4 for acceptable vibration envelopes. If vibration exceeds 7.1 mm/s RMS (Zone D threshold), unit must be tripped.",
        page: 3,
      },
    ],
  },
  {
    docId: "IR-2025-012",
    title: "Inspection Report: Valve V-118 Post-Maintenance Verification",
    docType: "InspectionReport",
    facility: "Plant-A",
    sourceSystem: "InspectTech",
    meta: { inspector: "Raju Kumar", status: "Closed", date: "2025-01-10" },
    sections: [
      {
        heading: "Inspection Summary",
        body:
          "Post-maintenance inspection of Valve V-118 (Pressure Relief Valve, Tank T-203) conducted 2025-01-10 by Raju Kumar. Follow-up to WO-4601.",
        page: 1,
      },
      {
        heading: "Findings",
        body:
          "Valve V-118 reinstalled, leak-free, set pressure verified at 8.4 bar. Inspection records updated in equipment history. All documentation filed per PR-PSV-001. Compliance with OISD-118 clause 4.3.2 confirmed.",
        page: 1,
      },
    ],
  },
  {
    docId: "IR-2025-018",
    title: "Inspection Report: Compressor C-302 Post-Surge Inspection",
    docType: "InspectionReport",
    facility: "Plant-A",
    sourceSystem: "InspectTech",
    meta: { inspector: "Priya Sharma", status: "Open", date: "2025-02-15" },
    sections: [
      {
        heading: "Inspection Summary",
        body:
          "Post-surge inspection of Compressor C-302 (Reforming Unit) initiated 2025-02-15 by Priya Sharma. Follow-up to WO-4705 and Incident INC-2025-007.",
        page: 1,
      },
      {
        heading: "Preliminary Findings",
        body:
          "Dry gas seal show no visible damage. Anti-surge controller setpoint drift confirmed at 8% (acceptable ±2%). Spectrum analysis shows sub-synchronous vibration at 0.45× shaft speed — classic symptom of oil whirl. Bearing oil sample pending lab results.",
        page: 2,
      },
      {
        heading: "Risk Assessment",
        body:
          "Given the recurrence pattern (surge events in Feb 2024 and Feb 2025), this may indicate a systematic issue with the anti-surge controller. Recommend reviewing the controller tuning strategy and operator training. Reference OEM manual OM-C302-Rev1 section 5 for surge prevention logic.",
        page: 3,
      },
    ],
  },

  // ─── Incident Reports ──────────────────────────────────────────────────────
  {
    docId: "INC-2024-045",
    title: "Incident Report: Compressor C-302 Surge Event 2024-02-09",
    docType: "IncidentReport",
    facility: "Plant-A",
    sourceSystem: "IncidentMgmt",
    meta: { severity: "Medium", reportedBy: "Meena Iyer", status: "Closed", date: "2024-02-09" },
    sections: [
      {
        heading: "Incident Summary",
        body:
          "On 2024-02-09 at 14:22, Compressor C-302 (Reforming Unit) experienced a surge event resulting in automatic trip on high vibration. No injuries, no release of process gas. Severity: Medium. Equipment: C-302 (Sulzer R-70 centrifugal compressor, commissioned 2018-06-30).",
        page: 1,
      },
      {
        heading: "Sequence of Events",
        body:
          "14:20 — Process gas flow to compressor reduced due to upstream unit upset. Anti-surge valve did not open fully (controller output saturated). 14:22 — Compressor speed dropped, inlet flow below surge line. Vibration spike to 8.5 mm/s RMS. 14:22:08 — Trip on high vibration. 14:25 — Process stabilized. 14:30 — Compressor restarted successfully.",
        page: 2,
      },
      {
        heading: "Root Cause",
        body:
          "Anti-surge controller tuning too sluggish for the upset scenario. Setpoint of surge margin was 10% (recommended 15%). Operator training gap identified — operator manually reduced controller gain 2 weeks prior to incident without documentation. Controller was retuned per OEM manual OM-C302-Rev1 section 5.4.",
        page: 3,
      },
      {
        heading: "Lessons Learned",
        body:
          "1) Surge margin must be set at 15% minimum per OEM recommendation. 2) Controller tuning changes require engineering review and documentation. 3) Operator training on surge prevention must be refreshed annually. These lessons were incorporated into procedure PR-CMP-001 and SOP-SURGE-002.",
        page: 4,
      },
    ],
  },
  {
    docId: "INC-2025-007",
    title: "Incident Report: Compressor C-302 Surge Event 2025-02-13",
    docType: "IncidentReport",
    facility: "Plant-A",
    sourceSystem: "IncidentMgmt",
    meta: { severity: "Medium", reportedBy: "Meena Iyer", status: "Investigation", date: "2025-02-13" },
    sections: [
      {
        heading: "Incident Summary",
        body:
          "On 2025-02-13 at 23:15, Compressor C-302 (Reforming Unit) experienced a surge event resulting in automatic trip on high vibration. No injuries, no release of process gas. Severity: Medium. Equipment: C-302.",
        page: 1,
      },
      {
        heading: "Sequence of Events",
        body:
          "23:13 — Upset in upstream reforming unit causing rapid flow reduction. 23:14 — Anti-surge valve moved to manual mode by operator due to setpoint drift. 23:15 — Vibration exceeded 9.8 mm/s RMS. Trip. 23:20 — Process stabilized. 23:45 — Compressor restarted.",
        page: 2,
      },
      {
        heading: "Similarity to Prior Incident",
        body:
          "This event is similar to Incident INC-2024-045 (2024-02-09) on the same equipment. Both events involved anti-surge controller setpoint drift as a contributing factor. Lessons learned from INC-2024-045 appear to have been only partially implemented — surge margin may have drifted back below recommended 15%.",
        page: 3,
      },
      {
        heading: "Investigation Plan",
        body:
          "Full root cause analysis pending. Investigate: (1) Why anti-surge controller setpoint drift recurred after INC-2024-045 corrective actions. (2) Why operator chose to switch to manual mode. (3) Whether training and procedure updates from INC-2024-045 have been sustained. Related work order: WO-4705.",
        page: 4,
      },
    ],
  },
  {
    docId: "NM-2024-031",
    title: "Near Miss: Pump P-204 Seal Leak Pre-Isolation",
    docType: "NearMiss",
    facility: "Plant-A",
    sourceSystem: "IncidentMgmt",
    meta: { severity: "Low", reportedBy: "Raju Kumar", status: "Closed", date: "2024-11-12" },
    sections: [
      {
        heading: "Near-Miss Summary",
        body:
          "On 2024-11-12 at 08:42, Field Technician Raju Kumar observed a hydrocarbon odor near Pump P-204 (Crude Unit 3) during routine rounds. Visual inspection confirmed mechanical seal leak at approximately 2 L/min. Pump isolated before significant release. No ignition. No injuries. Severity: Low (potential: High if leak had continued unchecked).",
        page: 1,
      },
      {
        heading: "Immediate Action",
        body:
          "Operator in control room alerted, pump isolated per SOP-LOTO-001. Work order WO-4521 raised for corrective maintenance. Area barricaded and gas monitoring in place during repair work.",
        page: 1,
      },
      {
        heading: "Lessons Learned",
        body:
          "Daily field rounds by technicians remain the most effective detection method — online gas detection coverage near Pump P-204 is incomplete (north-east quadrant not covered by point detectors). Recommendation: add point gas detector to coverage map. Equipment: Pump P-204.",
        page: 2,
      },
    ],
  },

  // ─── OEM Manual Excerpts ──────────────────────────────────────────────────
  {
    docId: "OM-P204-Rev3",
    title: "OEM Manual: Sulzer ZF-250 Centrifugal Pump (P-204) — Operation & Maintenance",
    docType: "OEMManual",
    facility: "Plant-A",
    sourceSystem: "VendorDocs",
    meta: { vendor: "Sulzer Pumps", revision: "Rev3", date: "2022-03-15" },
    sections: [
      {
        heading: "Section 1 — Equipment Identification",
        body:
          "This manual applies to Sulzer ZF-250 centrifugal pump, tag P-204, installed in Crude Unit 3 of Plant-A. Commissioned 2019-04-12. Rated flow: 320 m³/h. Rated head: 145 m. Driver: 250 kW induction motor, 2975 RPM. Mechanical seal: MSE-204-A (API Plan 53A barrier fluid).",
        page: 1,
      },
      {
        heading: "Section 7.4 — Vibration Acceptance Criteria",
        body:
          "Pump P-204 vibration acceptance criteria per ISO 10816-3 (medium machine, rigid mount). Zone A (new condition): <2.3 mm/s RMS. Zone B (long-term operation acceptable): 2.3–4.5 mm/s RMS. Zone C (short-term operation, plan corrective action): 4.5–7.1 mm/s RMS. Zone D (immediate trip): >7.1 mm/s RMS. Any reading in Zone D requires immediate investigation and remediation per Section 7.6.",
        page: 12,
      },
      {
        heading: "Section 7.6 — Cavitation-Induced Seal Failure",
        body:
          "Mechanical seal failure may result from cavitation-induced vibration. Symptoms include: 1× shaft speed dominant vibration with sub-synchronous component, audible crackling noise, fluctuating discharge pressure. Seal life under normal operation: 18-24 months. Seal life under sustained cavitation: <6 months. If cavitation detected, reduce flow to within 10% of BEP and contact engineering.",
        page: 14,
      },
      {
        heading: "Section 9 — Maintenance Schedule",
        body:
          "Recommended maintenance intervals for Pump P-204: (1) Daily — visual inspection, leak check. (2) Weekly — vibration survey, oil level check. (3) Monthly — oil sample analysis (ISO VG 46). (4) Quarterly — full vibration spectrum analysis. (5) Annually — alignment check, coupling inspection. (6) Every 4 years — full overhaul including mechanical seal replacement.",
        page: 18,
      },
    ],
  },
  {
    docId: "OM-C302-Rev1",
    title: "OEM Manual: Sulzer R-70 Centrifugal Compressor (C-302) — Operation & Maintenance",
    docType: "OEMManual",
    facility: "Plant-A",
    sourceSystem: "VendorDocs",
    meta: { vendor: "Sulzer Turbo", revision: "Rev1", date: "2018-06-30" },
    sections: [
      {
        heading: "Section 1 — Equipment Identification",
        body:
          "This manual applies to Sulzer R-70 centrifugal compressor, tag C-302, installed in Reforming Unit of Plant-A. Commissioned 2018-06-30. Rated flow: 65,000 Nm³/h. Rated discharge pressure: 28 bar. Driver: 4.5 MW electric motor with speed-increasing gearbox. Dry gas seal: DGS-302-A (API 692).",
        page: 1,
      },
      {
        heading: "Section 5.4 — Surge Prevention System",
        body:
          "Compressor C-302 is protected by an anti-surge control system. Recommended surge margin: minimum 15% above the surge control line. Controller tuning parameters per Section 5.4.2: Kp = 0.8, Ti = 4.5 seconds. Any changes to tuning parameters require review and approval by the OEM or qualified process engineer. Operator-led tuning changes are NOT permitted.",
        page: 9,
      },
      {
        heading: "Section 5.4.2 — Controller Tuning Procedure",
        body:
          "Tuning of anti-surge controller requires the following steps: (1) Document current tuning parameters in equipment history. (2) Perform step-test to characterize compressor response. (3) Compute new tuning per Ziegler-Nichols or IMC method. (4) Implement changes during planned shutdown with engineering review. (5) Verify surge margin meets 15% minimum after tuning change. (6) Update documentation.",
        page: 10,
      },
      {
        heading: "Section 11 — Surge Event Investigation",
        body:
          "Following any surge event, the following data must be collected: (a) Controller tuning parameters at time of event. (b) Trend of inlet/discharge pressures and flow for 30 minutes before event. (c) Vibration spectrum before/during/after event. (d) Operator actions taken. (e) Setpoint drift if any. Surge events are reportable to OEM if surge margin was below 10%.",
        page: 22,
      },
    ],
  },

  // ─── Standard Operating Procedures (SOPs) ────────────────────────────────
  {
    docId: "SOP-LOTO-001",
    title: "SOP: Lockout-Tagout (LOTO) for Hazardous Energy Sources",
    docType: "SOP",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v3.2", approved: "2024-01-15", owner: "Anil Verma" },
    sections: [
      {
        heading: "1. Purpose",
        body:
          "This procedure establishes the minimum requirements for the lockout-tagout of energy sources prior to performing maintenance or servicing on equipment. Applies to all Plant-A equipment including pumps, compressors, valves, and electrical equipment. Compliance with Factory Act 1948 Section 31 (Machinery) is mandatory.",
        page: 1,
      },
      {
        heading: "2. Scope",
        body:
          "This SOP applies to all maintenance activities on Plant-A equipment, including but not limited to: Pump P-204, Compressor C-302, Valve V-118, and Tank T-203. All isolation of energy sources including electrical, hydraulic, pneumatic, thermal, and stored energy must follow this procedure.",
        page: 1,
      },
      {
        heading: "3. Procedure",
        body:
          "3.1 Notify affected personnel. 3.2 Identify and verify all energy sources using the equipment-specific isolation list. 3.3 Isolate each energy source. 3.4 Apply individual locks and tags to each isolation point. 3.5 Verify zero energy state by attempting to start equipment and checking for residual pressure/flow. 3.6 Perform work. 3.7 On completion, verify all personnel are clear, remove locks and tags, restore energy, notify affected personnel.",
        page: 2,
      },
      {
        heading: "4. Compliance",
        body:
          "LOTO procedures shall be audited annually per Factory Act 1948 Section 31. Annual audit records shall be maintained for 5 years. Any LOTO procedure failure shall be reported as an incident and investigated per PR-INC-001.",
        page: 3,
      },
    ],
  },
  {
    docId: "SOP-SURGE-002",
    title: "SOP: Compressor Surge Prevention and Response",
    docType: "SOP",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v2.1", approved: "2024-03-20", owner: "Priya Sharma" },
    sections: [
      {
        heading: "1. Purpose",
        body:
          "This procedure establishes requirements for the prevention of and response to surge events on Compressor C-302 (Reforming Unit). Implements lessons learned from Incident INC-2024-045 (2024-02-09). Reference: OEM manual OM-C302-Rev1 Section 5.4.",
        page: 1,
      },
      {
        heading: "2. Surge Margin Requirements",
        body:
          "Minimum surge margin: 15% above surge control line (per OEM Section 5.4). Surge margin shall be verified daily by operations. Any drift greater than 2% from setpoint shall be reported to maintenance and engineering immediately. Operator-led changes to controller tuning are PROHIBITED. All tuning changes require engineering review per Section 5.4.2 of OM-C302-Rev1.",
        page: 1,
      },
      {
        heading: "3. Surge Response",
        body:
          "Upon surge alarm: (1) DO NOT switch controller to manual mode. (2) Allow anti-surge valve to open automatically. (3) Reduce process demand if possible. (4) If trip occurs, do not restart compressor without engineering review. (5) Following any surge event, raise incident report within 24 hours.",
        page: 2,
      },
      {
        heading: "4. Training",
        body:
          "Operators shall receive annual refresher training on surge prevention. Training records maintained by HR per PR-TRAIN-001. Last training cycle: 2024-06-15. Next due: 2025-06-15.",
        page: 3,
      },
    ],
  },
  {
    docId: "SOP-PSV-003",
    title: "SOP: Pressure Safety Valve Inspection and Testing",
    docType: "SOP",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v1.4", approved: "2023-11-10", owner: "Anil Verma" },
    sections: [
      {
        heading: "1. Purpose",
        body:
          "This procedure defines the inspection and testing requirements for Pressure Safety Valves (PSVs) at Plant-A. Implements OISD-118 clause 4.3.2 requirements for periodic inspection of pressure relief devices.",
        page: 1,
      },
      {
        heading: "2. Inspection Interval",
        body:
          "All PSVs shall be inspected at intervals not exceeding 12 months. The inspection interval may be extended to 24 months only with engineering review and documented risk assessment per OISD-118. Records of inspection shall be maintained for the life of the equipment.",
        page: 1,
      },
      {
        heading: "3. Inspection Procedure",
        body:
          "Detailed inspection procedure for each PSV type is defined in Procedure PR-PSV-001. Minimum verification: (a) Visual inspection of valve body and connections. (b) Set pressure verification. (c) Seat tightness test. (d) Spring condition (if applicable). (e) Documentation update.",
        page: 2,
      },
      {
        heading: "4. Records",
        body:
          "Inspection records shall include: date, inspector, valve tag (e.g., V-118), set pressure, test pressure, pass/fail, parts replaced, next due date. Records maintained in equipment history file.",
        page: 3,
      },
    ],
  },

  // ─── Regulatory Clauses ───────────────────────────────────────────────────
  {
    docId: "REG-OISD-118",
    title: "Regulatory: OISD-118 — Pressure Relief Devices (Excerpts)",
    docType: "Regulation",
    facility: "Plant-A",
    sourceSystem: "Regulator",
    meta: { standard: "OISD-118", version: "2009", jurisdiction: "India" },
    sections: [
      {
        heading: "Clause 4.3.2 — Inspection Interval",
        body:
          "OISD-118 Clause 4.3.2: Pressure relief devices shall be inspected and tested at intervals not exceeding 12 months. Inspection shall include verification of set pressure, seat tightness, and valve condition. Records of inspection shall be maintained for the life of the equipment. The inspection interval may be extended to 24 months based on documented reliability analysis with engineering approval.",
        page: 14,
      },
      {
        heading: "Clause 4.3.5 — Documentation",
        body:
          "OISD-118 Clause 4.3.5: For each pressure relief device, the following documentation shall be maintained: (a) Equipment tag and location. (b) Set pressure. (c) Last inspection date. (d) Inspector name. (e) Parts replaced. (f) Next inspection due date. (g) Deviations from standard inspection procedure, if any.",
        page: 15,
      },
      {
        heading: "Clause 5.1.1 — Hot Work Permit",
        body:
          "OISD-118 Clause 5.1.1: Hot work permits are required for any work involving open flames, welding, cutting, grinding, or other spark-producing activity within designated hazardous areas. Permits must be issued by a competent authority and shall include: (a) Specific location and equipment involved. (b) Gas test results. (c) Firewatch assignment. (d) Validity period not exceeding 8 hours. (e) Signature of permit issuer and receiver.",
        page: 22,
      },
    ],
  },
  {
    docId: "REG-FactoryAct",
    title: "Regulatory: Factories Act 1948 — Excerpts Relevant to Plant Operations",
    docType: "Regulation",
    facility: "Plant-A",
    sourceSystem: "Regulator",
    meta: { standard: "Factories Act 1948", version: "Consolidated 2023", jurisdiction: "India" },
    sections: [
      {
        heading: "Section 31 — Machinery",
        body:
          "Section 31: Every factory shall maintain machinery in safe working condition. Lockout-tagout procedures shall be implemented and followed for all maintenance activities. Annual audit of LOTO procedures is mandatory. Records of audits shall be maintained for 5 years.",
        page: 18,
      },
      {
        heading: "Section 32 — Pressure Plant",
        body:
          "Section 32: Pressure plants shall be designed, installed, and maintained in accordance with applicable standards (OISD, IS). Pressure relief devices shall be inspected at intervals not exceeding 12 months. Inspection records shall be available for review by Factory Inspectorate.",
        page: 19,
      },
      {
        heading: "Section 111A — Worker Safety",
        body:
          "Section 111A: Workers shall be provided with information, training, and supervision necessary for their safety. Training records shall be maintained and made available to workers upon request. Annual refresher training is required for safety-critical procedures.",
        page: 47,
      },
    ],
  },

  // ─── Detailed Procedures ───────────────────────────────────────────────────
  {
    docId: "PR-PSV-001",
    title: "Procedure: Pressure Safety Valve Inspection Checklist (PR-PSV-001)",
    docType: "Procedure",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v2.0", approved: "2024-01-20", owner: "Anil Verma" },
    sections: [
      {
        heading: "1. Scope",
        body:
          "This procedure defines the detailed inspection checklist for Pressure Safety Valves (PSVs) at Plant-A. Implements OISD-118 Clause 4.3.2 and SOP-PSV-003. Applies to all PSVs including Valve V-118.",
        page: 1,
      },
      {
        heading: "2. Pre-Inspection",
        body:
          "Pre-inspection checklist: (a) Verify isolation and LOTO per SOP-LOTO-001. (b) Confirm depressurization. (c) Verify drainage and venting. (d) Gather required tools: torque wrench, lapping compound, calibration pressure gauge (certified within 6 months). (e) Review previous inspection report.",
        page: 2,
      },
      {
        heading: "3. Inspection Steps",
        body:
          "3.1 Visual: body, bonnet, valve connections. 3.2 Set pressure verification: bench test at 0.5 bar increments, record popping pressure. 3.3 Seat tightness: pressure test at 90% set pressure, leakage rate <0.01% of rated capacity. 3.4 Spring condition: visual and dimensional. 3.5 Internal: nozzle, disc, seat inspection. 3.6 Replace seals and gaskets as needed.",
        page: 3,
      },
      {
        heading: "4. Post-Inspection",
        body:
          "Post-inspection: (a) Document all findings in equipment history. (b) Update inspection record per OISD-118 Clause 4.3.5. (c) Update next inspection due date. (d) If valve failed set pressure verification, escalate to engineering — do not return to service without root cause determination.",
        page: 4,
      },
    ],
  },
  {
    docId: "PR-INC-001",
    title: "Procedure: Incident Reporting and Investigation (PR-INC-001)",
    docType: "Procedure",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v1.5", approved: "2024-02-15", owner: "Meena Iyer" },
    sections: [
      {
        heading: "1. Purpose",
        body:
          "This procedure defines the requirements for reporting and investigating incidents, near-misses, and unsafe conditions at Plant-A. Implements Factories Act 1948 Section 111A and supports lessons-learned capture for institutional memory.",
        page: 1,
      },
      {
        heading: "2. Reporting",
        body:
          "All incidents, near-misses, and unsafe conditions shall be reported within 24 hours via the IncidentMgmt system. Report shall include: (a) Date/time. (b) Location and equipment involved. (c) Description of event. (d) Immediate actions taken. (e) Severity rating. (f) Reporter name. Reports shall be reviewed by Plant Manager within 48 hours.",
        page: 1,
      },
      {
        heading: "3. Investigation",
        body:
          "Investigation shall be conducted by qualified personnel. Root cause analysis using 5-Why or Fishbone methodology. Investigation report shall include: (a) Sequence of events. (b) Root cause(s). (c) Contributing factors. (d) Corrective actions with owners and due dates. (e) Lessons learned — to be communicated to all relevant personnel.",
        page: 2,
      },
      {
        heading: "4. Lessons Learned Communication",
        body:
          "Lessons learned shall be: (a) Shared with all affected personnel within 30 days of incident closure. (b) Incorporated into relevant SOPs and procedures within 60 days. (c) Reviewed annually for relevance and effectiveness. (d) Used as input to new-hire training programs. This procedure was updated following INC-2024-045 to include proactive lessons-learned surfacing.",
        page: 3,
      },
    ],
  },
  {
    docId: "PR-CMP-001",
    title: "Procedure: Compressor Operation and Maintenance (PR-CMP-001)",
    docType: "Procedure",
    facility: "Plant-A",
    sourceSystem: "Procedures",
    meta: { version: "v3.0", approved: "2024-04-10", owner: "Priya Sharma" },
    sections: [
      {
        heading: "1. Purpose",
        body:
          "This procedure defines the operation and maintenance requirements for Compressor C-302 (Reforming Unit). Implements lessons learned from INC-2024-045. Reference: OEM manual OM-C302-Rev1 and SOP-SURGE-002.",
        page: 1,
      },
      {
        heading: "2. Operating Envelope",
        body:
          "Compressor C-302 shall be operated within the following envelope: (a) Speed: 8,000–9,500 RPM. (b) Discharge pressure: 22–28 bar. (c) Inlet temperature: 35–45°C. (d) Surge margin: minimum 15% above surge control line (per OEM Section 5.4). (e) Vibration: <7.1 mm/s RMS (per OEM Section 7.4). Operation outside this envelope requires engineering review.",
        page: 2,
      },
      {
        heading: "3. Maintenance Schedule",
        body:
          "3.1 Daily: visual inspection, gas seal leak check, oil level. 3.2 Weekly: vibration spectrum, oil sample. 3.3 Monthly: surge margin verification. 3.4 Quarterly: controller tuning verification per OM-C302-Rev1 Section 5.4.2. 3.5 Annually: full inspection per Section 11 of OEM manual.",
        page: 3,
      },
      {
        heading: "4. Surge Event Response",
        body:
          "Surge event response per SOP-SURGE-002. Following any surge event, the following data shall be collected within 24 hours: (a) Controller tuning parameters. (b) 30-minute trend of inlet/discharge pressures and flow. (c) Vibration spectrum before/during/after event. (d) Operator actions. (e) Setpoint drift. Surge events shall be reported to OEM if surge margin was below 10%.",
        page: 4,
      },
    ],
  },
];
