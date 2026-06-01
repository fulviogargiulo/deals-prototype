import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { Deal } from "@/data/types";
import { DealStakeholder, StakeholderType, sharedDealStakeholders, sharedDealDocumentRequirements, sharedDocumentRequirementTemplates, sharedParties, sharedAgents, type StatusHistoryEntry } from "@huspy/shared-domain";
import { toast } from "@/hooks/use-toast";
import { recalculateDeal, derivePnlEngine, getMissingAgentFinancials, type DealEngineKey } from "@/lib/dealCalculations";
import { getBlueprint } from "@huspy/shared-domain";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealsCreated: (deals: Deal[]) => void;
}

// One row per stakeholder. Deal metadata only needed on the first row of each offerId group.
const CSV_HEADERS = [
  "offerId", "propertyName", "market", "businessUnit", "channel", "country", "currency", "dealPrice", "reportDate",
  "stakeRole", "partyId", "amount", "description", "chargedTo", "splitPct", "amount",
];

// Template: 2 deals showing REBU and MBU MA/Broker patterns.
//
// DEAL-BULK-001 (REBU): gross = 30,000 + 1,500 − 2,000 + 20,000 = 49,500 AED
//   commissionBase = 49,500 − 3,500 (C, co-broker) = 46,000
//   Agent1 (60%) pool 27,600 → flat 42% = 11,592 (+ TL/Mgr)
//   Agent2 (40%) pool 18,400 → slab: 5k×35% + 13.4k×45% = 7,780 (+ TL/Mgr)
//   Service cost 800 (D) deducted from Huspy share only
//
// DEAL-MBU-001 (MBU MA/Broker): mortgage principal AED 1,500,000 at DIB
//   Huspy revenue = 1.2% of principal = AED 18,000 (REVENUE_SOURCE from bank)
//   Broker payout auto-computed from AgentFinancials (0.624% of principal = AED 9,360)
//   No TL/Manager rows — external broker, no connected agents
const TEMPLATE_ROWS = [
  // ── REBU example ──────────────────────────────────────────────────────────
  // row 1: deal header + primary agent (lister, 60%) — channel blank for REBU
  ["DEAL-BULK-001", "Dubai Marina Tower Apt 2204", "primary", "rebu", "", "ae", "AED", "1500000", "2026-05-01", "AGENT_PAYOUT", "party-agent-004", "", "", "", "60", ""],
  // row 2: co-agent (closer, 40%)
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "AGENT_PAYOUT", "party-agent-005", "", "", "", "40", ""],
  // row 3: DEMAND — the buyer (identity only, no amount)
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "DEMAND", "party-client-008", "", "", "", "", ""],
  // row 4: SUPPLY — the developer/seller (identity only, no amount)
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "SUPPLY", "party-third-emaar", "", "", "", "", ""],
  // rows 5-7: revenue lines (buyer commission + conveyance + rebate)
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "REVENUE_SOURCE", "party-client-008", "30000", "Commission", "", "", ""],
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "REVENUE_SOURCE", "party-client-008", "1500", "Conveyance Fee", "", "", ""],
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "REVENUE_SOURCE", "party-client-008", "-2000", "Rebate", "", "", ""],
  // row 8: developer revenue line
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "REVENUE_SOURCE", "party-client-007", "20000", "Commission", "", "", ""],
  // row 9: Huspy-borne service cost
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "OPERATIONAL_DEDUCTION", "party-third-snb", "800", "Admin Cost", "", "", ""],
  // row 10: co-broker cost charged to agent1's pool
  ["DEAL-BULK-001", "", "", "", "", "", "", "", "", "ACQUISITION_DEDUCTION", "party-third-inmobiliaria-grupo-norte", "3500", "Co-broker", "party-agent-004", "", ""],

  // ── MBU MA/Broker example ─────────────────────────────────────────────────
  // channel = "MA". dealPrice = mortgage principal.
  // Broker payout resolved at runtime from BrokerRateSlab(reportingMonth, bankId, brokerMonthlyGmv).
  // row 11: deal header + sole broker (100% pool share)
  ["DEAL-MBU-001", "Creek Harbour Apartment", "primary", "mortgage", "MA", "ae", "AED", "1500000", "2026-05-01", "AGENT_PAYOUT", "party-broker-omar-rahman", "", "", "", "100", ""],
  // row 12: DEMAND — the borrower (identity only)
  ["DEAL-MBU-001", "", "", "", "", "", "", "", "", "DEMAND", "party-client-011", "", "", "", "", ""],
  // row 13: SUPPLY — the lending bank (identity only)
  ["DEAL-MBU-001", "", "", "", "", "", "", "", "", "SUPPLY", "party-third-dib", "", "", "", "", ""],
  // row 14: REVENUE_SOURCE — bank commission to Huspy (1.2% × 1,500,000 = 18,000)
  ["DEAL-MBU-001", "", "", "", "", "", "", "", "", "REVENUE_SOURCE", "party-third-dib", "18000", "Bank commission 1.2%", "", "", ""],
];

function downloadTemplate(): void {
  const csv = [CSV_HEADERS.join(","), ...TEMPLATE_ROWS.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "deal-upload-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedDeal {
  deal: Deal;
  stakeholders: DealStakeholder[];
}

const VALID_ROLES = new Set<string>(["AGENT_PAYOUT", "REVENUE_SOURCE", "ACQUISITION_DEDUCTION", "OPERATIONAL_DEDUCTION", "DEMAND", "SUPPLY"]);

function groupByDeal(rows: Record<string, string>[]): Map<string, Record<string, string>[]> {
  const map = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const id = row.offerId?.trim();
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(row);
  }
  return map;
}

function buildDeal(offerId: string, rows: Record<string, string>[], dealIndex: number): ParsedDeal {
  const header = rows[0];
  const country = (header.country as Deal["country"]) || "ae";
  const businessUnit = (header.businessUnit as Deal["businessUnit"]) || "rebu";
  const channel = header.channel || undefined;
  const currency = (header.currency as Deal["currency"]) || "AED";
  const blueprint = getBlueprint(country, businessUnit);

  // Gross = sum of positive REVENUE_SOURCE amounts (engine will recompute from stakes).
  const positiveRevenue = rows
    .filter(r => r.stakeRole === "REVENUE_SOURCE")
    .reduce((s, r) => s + Math.max(0, parseFloat(r.amount) || 0), 0);

  const primaryAgentRow = rows.find(r => r.stakeRole === "AGENT_PAYOUT");
  const primaryDemandRow = rows.find(r => r.stakeRole === "DEMAND");
  const agentName = primaryAgentRow ? (sharedParties.find(p => p.id === primaryAgentRow.partyId)?.displayName ?? "") : "";
  const clientName = primaryDemandRow ? (sharedParties.find(p => p.id === primaryDemandRow.partyId)?.displayName ?? undefined) : undefined;

  const deal: Deal = {
    id: offerId,
    status: "under-review",
    market: (header.market as Deal["market"]) || "primary",
    businessUnit,
    channel,
    pnlEngine: derivePnlEngine({ businessUnit, channel }),
    country,
    currency,
    blueprintId: blueprint.id,
    dealAmount: parseFloat(header.dealPrice) || 0,
    dealPrice: parseFloat(header.dealPrice) || 0,
    grossRevenue: positiveRevenue,
    takeRate: 0,
    commissionPercentage: 0,
    title: header.propertyName || "Untitled Property",
    buildingName: header.propertyName || "Untitled Property",
    reportDate: header.reportDate || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentName,
    clientName,
    ofCaseNumber: `CASE-${String(Date.now()).slice(-6)}`,
    statusHistory: [{ from: "pending-details", to: "under-review", timestamp: new Date().toISOString() } as StatusHistoryEntry],
    agents: [],
    externalPartners: [],
    receivables: [],
    payables: [],
  };

  const stakeholders: DealStakeholder[] = [];
  // Maps agent partyId → the stake ID assigned to them, for resolving chargedTo.
  const agentStakeIdByPartyId: Record<string, string> = {};
  let agentIdx = 0;

  // First pass: build agent stakes and stake-ID map.
  for (const row of rows) {
    if (row.stakeRole !== "AGENT_PAYOUT") continue;
    const stakeId = `ds-${offerId}-agent-${agentIdx++}`;
    agentStakeIdByPartyId[row.partyId] = stakeId;
    const fa = parseFloat(row.amount);
    const fixedAmount = !isNaN(fa) && fa > 0 ? fa : undefined;
    stakeholders.push({
      id: stakeId,
      dealId: offerId,
      partyId: row.partyId,
      role: "AGENT_PAYOUT",
      isPrimary: agentIdx === 1,
      splitPercentage: fixedAmount == null ? (parseFloat(row.splitPct) || (agentIdx === 1 ? 100 : 0)) : undefined,
      amount: fixedAmount,
      source: fixedAmount != null ? "manual" : "engine",
      status: "draft",
    });
  }

  // Second pass: all other roles.
  let otherIdx = 0;
  for (const row of rows) {
    const role = row.stakeRole as StakeholderType;
    if (role === "AGENT_PAYOUT") continue;
    const stakeId = `ds-${offerId}-s-${otherIdx++}`;

    // DEMAND/SUPPLY are non-financial — no amount needed.
    if (role === "DEMAND" || role === "SUPPLY") {
      stakeholders.push({ id: stakeId, dealId: offerId, partyId: row.partyId, role, isPrimary: true });
      continue;
    }

    const rawAmount = parseFloat(row.amount);
    if (Number.isNaN(rawAmount)) continue;

    const parentStakeholderId =
      (role === "ACQUISITION_DEDUCTION" || role === "OPERATIONAL_DEDUCTION") && row.chargedTo
        ? agentStakeIdByPartyId[row.chargedTo.trim()]
        : undefined;

    stakeholders.push({
      id: stakeId,
      dealId: offerId,
      partyId: row.partyId,
      role,
      // REVENUE_SOURCE: preserve sign (negative = rebate). Cost roles: engine expects negative.
      amount: role === "REVENUE_SOURCE" ? rawAmount : -Math.abs(rawAmount),
      description: row.description || undefined,
      parentStakeholderId,
      source: "manual",
      status: "draft",
    });
  }

  return { deal, stakeholders };
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

function validateRows(rows: Record<string, string>[]): string[] {
  const errs: string[] = [];
  const groups = groupByDeal(rows);
  if (groups.size === 0) { errs.push("No offerId found — first column must be offerId"); return errs; }
  for (const [id, dealRows] of groups) {
    const header = dealRows[0];
    if (!header.country) errs.push(`Deal ${id}: missing country`);
    if (!header.businessUnit) errs.push(`Deal ${id}: missing businessUnit`);
    if (!header.currency) errs.push(`Deal ${id}: missing currency`);
    if (!dealRows.some(r => r.stakeRole === "DEMAND")) errs.push(`Deal ${id}: missing DEMAND row (buyer / tenant / borrower)`);
    if (!dealRows.some(r => r.stakeRole === "SUPPLY")) errs.push(`Deal ${id}: missing SUPPLY row (seller / developer / landlord / bank)`);
    for (const [i, row] of dealRows.entries()) {
      if (!row.stakeRole) { errs.push(`Deal ${id} row ${i + 1}: missing stakeRole`); continue; }
      if (!VALID_ROLES.has(row.stakeRole)) errs.push(`Deal ${id} row ${i + 1}: unknown stakeRole "${row.stakeRole}"`);
      if (!row.partyId) errs.push(`Deal ${id} row ${i + 1}: missing partyId`);
      if (row.stakeRole === "AGENT_PAYOUT" && row.partyId && !sharedAgents.some(a => a.partyId === row.partyId))
        errs.push(`Deal ${id} row ${i + 1}: partyId "${row.partyId}" not found in agent registry — P&L cannot be calculated`);
      if (row.stakeRole === "OPERATIONAL_DEDUCTION" && row.chargedTo) errs.push(`Deal ${id} row ${i + 1}: OPERATIONAL_DEDUCTION cannot use chargedTo — use ACQUISITION_DEDUCTION for agent-borne costs`);
    }
    // AF validation: agents on non-manual deals without a fixed amount must have an AF config for the engine.
    const engine = derivePnlEngine({ businessUnit: header.businessUnit as any, channel: header.channel }) as DealEngineKey;
    if (engine !== "manual") {
      const agentStakes = dealRows
        .filter(r => r.stakeRole === "AGENT_PAYOUT" && r.partyId && !r.amount)
        .map(r => ({ role: "AGENT_PAYOUT" as const, partyId: r.partyId, amount: undefined, id: "", dealId: id }));
      const missing = getMissingAgentFinancials(engine, agentStakes);
      for (const m of missing)
        errs.push(`Deal ${id}: agent "${m.displayName}" has no "${engine}" engine config — set it up in their Agent profile first`);
    }
  }
  return errs;
}

export function BulkUploadDialog({ open, onClose, onDealsCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[]; dealCount: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [createdCount, setCreatedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setErrors([]);
    setStep("upload");
    setCreatedCount(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setFile(f);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const csv = parseCSV(text);
      if (csv.rows.length === 0) { setErrors(["CSV has no data rows"]); return; }
      const errs = validateRows(csv.rows);
      if (errs.length > 0) { setErrors(errs); return; }
      const dealCount = groupByDeal(csv.rows).size;
      setParsed({ ...csv, dealCount });
      setStep("preview");
    };
    reader.readAsText(f);
  };

  const handleCreate = () => {
    if (!parsed) return;
    const groups = groupByDeal(parsed.rows);
    const results: ParsedDeal[] = [];
    let i = 0;
    for (const [offerId, rows] of groups) {
      results.push(buildDeal(offerId, rows, i++));
    }
    for (const { stakeholders } of results) {
      for (const s of stakeholders) sharedDealStakeholders.push(s);
    }
    const deals = results.map(({ deal }) => recalculateDeal(deal));
    for (const deal of deals) {
      sharedDocumentRequirementTemplates
        .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
        .forEach((t, i) => {
          sharedDealDocumentRequirements.push({
            id: `ddr-${deal.id}-${i}`,
            dealId: deal.id,
            label: t.label,
            required: t.required,
            status: "pending",
          });
        });
    }
    onDealsCreated(deals);
    setCreatedCount(deals.length);
    setStep("success");
    toast({ title: "Deals Created", description: `${deals.length} deal(s) created with full stakeholder structure.` });
  };

  const PREVIEW_COLS = ["offerId", "stakeRole", "partyId", "amount", "description"];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Deals
          </DialogTitle>
          <DialogDescription>One CSV row per stakeholder — multiple rows share an offerId to form one deal.</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-[14px] font-medium text-foreground">Drop your CSV here or click to browse</p>
              <p className="text-[12px] text-muted-foreground mt-1">.csv only</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-[13px] text-destructive space-y-0.5">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}

            <div className="bg-accent/50 rounded-md p-4 space-y-2 text-[11px]">
              <p className="font-medium text-foreground text-[12px]">Format — one row per stakeholder</p>
              <p className="font-mono text-muted-foreground">offerId, propertyName, market, businessUnit, <span className="text-foreground font-semibold">channel</span>, country, currency, dealPrice, reportDate, <span className="text-foreground font-semibold">stakeRole</span>, partyId, amount, description, chargedTo, splitPct, amount</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-muted-foreground">
                <p><span className="text-foreground">AGENT_PAYOUT</span> — agent (use splitPct)</p>
                <p><span className="text-foreground">REVENUE_SOURCE</span> — commission/fee/rebate (negative = rebate)</p>
                <p><span className="text-foreground">ACQUISITION_DEDUCTION</span> — co-broker (reduces agent pool; chargedTo = agent-borne)</p>
                <p><span className="text-foreground">OPERATIONAL_DEDUCTION</span> — Huspy-only cost (does not reduce agent pool; chargedTo not allowed)</p>
                <p><span className="text-foreground">DEMAND</span> — buyer / tenant / borrower (no amount; replaces buyerName)</p>
                <p><span className="text-foreground">SUPPLY</span> — seller / developer / landlord / bank (no amount; replaces sellerName)</p>
              </div>
              <p className="text-muted-foreground/70 italic pt-1">Deal metadata only needed on the first row of each offerId group.</p>
            </div>
          </div>
        )}

        {step === "preview" && parsed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{file?.name}</span>
              <span className="text-muted-foreground">— {parsed.dealCount} deal(s), {parsed.rows.length} rows</span>
              <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="border border-border rounded-md overflow-auto max-h-[300px]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-accent/50">
                    {PREVIEW_COLS.map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 15).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {PREVIEW_COLS.map(h => (
                        <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 15 && (
                <p className="text-[11px] text-muted-foreground text-center py-2">…and {parsed.rows.length - 15} more rows</p>
              )}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--deal-paid))] mb-4" />
            <p className="text-[16px] font-semibold text-foreground">{createdCount} Deal(s) Created</p>
            <p className="text-[13px] text-muted-foreground mt-1">Added with status "under-review"</p>
          </div>
        )}

        <DialogFooter className="flex-row items-center">
          <Button variant="outline" size="sm" className="mr-auto gap-1.5" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Download Template
          </Button>
          {step === "upload" && <Button variant="outline" onClick={handleClose}>Cancel</Button>}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleCreate}>Create {parsed?.dealCount} Deal(s)</Button>
            </>
          )}
          {step === "success" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
