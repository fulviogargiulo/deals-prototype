import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, CheckCircle } from "lucide-react";
import { Deal, AgentEntry } from "@/data/types";
import {
  calculateProjectedPnL,
  getBlueprint,
  sharedAgents,
  sharedAgentFinancials,
  sharedParties,
  sharedOpportunities,
  sharedPostings,
  sharedPostingLines,
  type AgentFinancials,
  type DealStakeholder,
  type Opportunity,
  type Posting,
  type PostingLine,
  type ProjectedPnL,
} from "@huspy/shared-domain";
import { recalculateDeal, draftPostings } from "@/lib/dealCalculations";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

type WizardStep = "context" | "revenue" | "simulation" | "success";

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

export function AddDealDialog({ open, onClose, onDealCreated }: Props) {
  const [step, setStep] = useState<WizardStep>("context");
  const [createdDealId, setCreatedDealId] = useState("");

  // ─── Step 1: Context ──────────────────────────────────────────────────────
  const [oppSearch, setOppSearch] = useState("");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  // ─── Step 2: Revenue ──────────────────────────────────────────────────────
  const [dealPrice, setDealPrice] = useState("");
  const [takeRate, setTakeRate] = useState("3");
  const [rebatePct, setRebatePct] = useState("0");
  const [subsidyAmt, setSubsidyAmt] = useState("0");
  const [disbursedAmount, setDisbursedAmount] = useState(""); // MBU
  const [bankSlab, setBankSlab] = useState("0.5"); // MBU

  // ─── Step 3: Notes + postings preview ────────────────────────────────────
  const [latestNote, setLatestNote] = useState("");
  const [showPostings, setShowPostings] = useState(false);

  const filteredOpps = useMemo(() => {
    if (!oppSearch) return sharedOpportunities.slice(0, 50);
    const q = oppSearch.toLowerCase();
    return sharedOpportunities.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      (o.clientName?.toLowerCase().includes(q) ?? false) ||
      o.title.toLowerCase().includes(q) ||
      (o.agentName?.toLowerCase().includes(q) ?? false),
    ).slice(0, 100);
  }, [oppSearch]);

  // Derived from selected opportunity.
  const derived = useMemo(() => {
    if (!selectedOpp) return null;
    const businessUnit = selectedOpp.type === "mortgage" ? "mortgage" : "rebu";
    const country = selectedOpp.country ?? "ae";
    const currency = COUNTRY_TO_CURRENCY[country];
    const blueprint = getBlueprint(country, businessUnit);
    const agent = sharedAgents.find((a) => a.id === selectedOpp.agentId);
    const agentParty = agent ? sharedParties.find((p) => p.id === agent.partyId) : undefined;
    const agentFinancials: AgentFinancials | undefined =
      agent ? sharedAgentFinancials.find((af) => af.agentId === agent.id) : undefined;
    return { businessUnit, country, currency, blueprint, agent, agentParty, agentFinancials };
  }, [selectedOpp]);

  // Gross revenue derivation, REBU vs MBU.
  const grossRevenue = useMemo(() => {
    if (!derived) return 0;
    if (derived.businessUnit === "mortgage") {
      const d = parseFloat(disbursedAmount) || 0;
      const s = parseFloat(bankSlab) || 0;
      return d * (s / 100);
    }
    const p = parseFloat(dealPrice) || 0;
    const t = parseFloat(takeRate) || 0;
    return p * (t / 100);
  }, [derived, dealPrice, takeRate, disbursedAmount, bankSlab]);

  // Named deal-level reductions (rebate, subsidy) for the waterfall engine.
  const reductions = useMemo(() => {
    const r: { label: string; amount: number }[] = [];
    const price = parseFloat(dealPrice) || 0;
    const rebate = parseFloat(rebatePct) || 0;
    if (rebate > 0 && price > 0) r.push({ label: "Client Rebate", amount: (rebate / 100) * price });
    const subsidy = parseFloat(subsidyAmt) || 0;
    if (subsidy > 0) r.push({ label: "Client Subsidy", amount: subsidy });
    return r;
  }, [dealPrice, rebatePct, subsidyAmt]);

  // Live projected P&L.
  const projection: ProjectedPnL | null = useMemo(() => {
    if (!derived || !selectedOpp) return null;
    if (grossRevenue <= 0) return null;

    // Build a synthetic agent stakeholder from the opportunity's primary agent.
    const stakeholders: DealStakeholder[] = derived.agent
      ? [{
          id: "ds-new-agent",
          dealId: "new",
          partyId: derived.agent.partyId,
          role: "INTERNAL_PAYOUT",
          splitPercentage: 100,
        }]
      : [];

    const agentFinancialsByAgentId: Record<string, AgentFinancials> = {};
    const partyIdToAgentId: Record<string, string> = {};
    if (derived.agent && derived.agentFinancials) {
      agentFinancialsByAgentId[derived.agent.id] = derived.agentFinancials;
      partyIdToAgentId[derived.agent.partyId] = derived.agent.id;
    }

    return calculateProjectedPnL({
      country: derived.country,
      businessUnit: derived.businessUnit,
      currency: derived.currency,
      grossRevenue,
      stakeholders,
      agentFinancialsByAgentId,
      partyIdToAgentId,
      blueprint: derived.blueprint,
      reductions: reductions.length > 0 ? reductions : undefined,
    });
  }, [derived, selectedOpp, grossRevenue, reductions]);

  const selectOpportunity = (opp: Opportunity) => {
    setSelectedOpp(opp);
  };

  const handleCreate = () => {
    if (!derived || !selectedOpp || !projection) return;
    const id = `DEAL-${String(Date.now()).slice(-6)}`;

    // Minimal legacy AgentEntry for recalculateDeal; strategy-derived agent payout
    // from the engine is the source of truth.
    const split = projection.splits[0];
    const legacyAgent: AgentEntry = {
      agentName: derived.agentParty?.displayName ?? selectedOpp.agentName ?? "Unknown Agent",
      agentId: derived.agent?.id,
      agentEmail: derived.agentParty?.email,
      agentPhone: derived.agentParty?.phone,
      agentShare: 100,
      agentCommissionRate:
        derived.agentFinancials?.strategy.kind === "flat" ? derived.agentFinancials.strategy.pct : 40,
      agentCommissionPayout: split?.agentPayout ?? 0,
      agentIncentive: 0,
      agentDeductions: 0,
      agentTotalAmount: split?.agentPayout ?? 0,
      teamLeadName: derived.agent?.teamLeadName,
      teamLeadRate: derived.agentFinancials?.teamLeadRate ?? 0,
      teamLeadShare: split?.teamLeadPayout ?? 0,
      managerName: derived.agent?.managerName,
      managerOverrideRate: derived.agentFinancials?.managerRate ?? 0,
      managerOverride: split?.managerPayout ?? 0,
      referralPercentage: 0,
      referralAmount: 0,
      clientKickback: 0,
    };

    const deal: Deal = {
      id,
      status: "under-review",
      market: selectedOpp.type === "rent" || selectedOpp.type === "lease" ? "leasing" : "primary",
      businessUnit: derived.businessUnit,
      country: derived.country,
      currency: derived.currency,
      dealAmount:
        derived.businessUnit === "mortgage" ? parseFloat(disbursedAmount) || 0 : parseFloat(dealPrice) || 0,
      reportDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: selectedOpp.clientName ?? "Unknown Client",
      agentName: derived.agentParty?.displayName ?? selectedOpp.agentName ?? "Unknown Agent",
      opportunityId: selectedOpp.id,
      opportunityName: selectedOpp.title,
      title: selectedOpp.title,
      buildingName: selectedOpp.title,
      community: selectedOpp.neighborhoods[0],
      propertyType: selectedOpp.propertyTypes?.[0],

      // Lean waterfall fields — source of truth for the engine
      grossRevenue,
      blueprintId: derived.blueprint.id,

      // Legacy mirror fields (Phase C3 will derive these from the engine)
      dealPrice: derived.businessUnit === "mortgage"
        ? parseFloat(disbursedAmount) || 0
        : parseFloat(dealPrice) || 0,
      takeRate: derived.businessUnit === "mortgage"
        ? parseFloat(bankSlab) || 0
        : parseFloat(takeRate) || 0,
      huspyRevenue: grossRevenue,
      netHuspyRevenue: projection.huspyMargin,
      conveyanceRevenue: 0,
      rebatePercentage: parseFloat(rebatePct) || 0,
      subsidyAmount: parseFloat(subsidyAmt) || 0,
      agents: [legacyAgent],
      externalPartners: [],
      receivables: [],
      payables: [],
      latestNote: latestNote || undefined,
    };

    const finalDeal = recalculateDeal(deal);
    const { posting, lines: postingLines } = draftPostings(projection, {
      id,
      businessUnit: derived.businessUnit,
      currency: derived.currency,
    }, derived.blueprint);
    sharedPostings.push(posting);
    postingLines.forEach((l) => sharedPostingLines.push(l));

    onDealCreated(finalDeal);
    setCreatedDealId(id);
    setStep("success");
    toast({ title: "Deal Created", description: `Deal ${id} has been created.` });
  };

  const reset = () => {
    setStep("context");
    setOppSearch("");
    setSelectedOpp(null);
    setDealPrice("");
    setTakeRate("3");
    setRebatePct("0");
    setSubsidyAmt("0");
    setDisbursedAmount("");
    setBankSlab("0.5");
    setLatestNote("");
    setShowPostings(false);
    setCreatedDealId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ─── Step gating ──────────────────────────────────────────────────────────
  const canLeaveContext = !!selectedOpp;
  const canLeaveRevenue = canLeaveContext && grossRevenue > 0;
  const canCreate = canLeaveRevenue && projection !== null;

  const stepNum = step === "context" ? 1 : step === "revenue" ? 2 : step === "simulation" ? 3 : 3;
  const stepLabel =
    step === "context" ? "Context"
    : step === "revenue" ? "Revenue"
    : step === "simulation" ? "Projected P&L"
    : "Done";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>
              {step === "success" ? "Deal Created" : `New Deal — Step ${stepNum} of 3: ${stepLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "context" && "Select an opportunity. Country, business unit, deal type and primary agent are derived — not entered."}
              {step === "revenue" && "Declare the gross commission Huspy is charging. Internal splits are calculated downstream."}
              {step === "simulation" && "Live waterfall projection. Add external costs via Stakeholders on the deal page after creation."}
              {step === "success" && "Your deal has been created and is now available across all views."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── Step 1: Context ─── */}
        {step === "context" && (
          <div className="px-6 py-5 space-y-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, agent, title, or Opportunity ID..."
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                className="h-9 text-[13px] pl-9"
              />
            </div>

            <ScrollArea className="h-[280px] border border-border rounded-md">
              <div className="divide-y divide-border">
                {filteredOpps.map((opp) => {
                  const isSelected = selectedOpp?.id === opp.id;
                  return (
                    <button
                      key={opp.id}
                      onClick={() => selectOpportunity(opp)}
                      className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-accent/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{opp.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {opp.clientName ?? "—"} • {opp.agentName ?? "—"} • {opp.neighborhoods[0] ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                            {opp.type}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">{opp.id}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredOpps.length === 0 && (
                  <p className="text-center py-8 text-[13px] text-muted-foreground">No opportunities found</p>
                )}
              </div>
            </ScrollArea>

            {derived && selectedOpp && (
              <div className="rounded-md border border-border bg-accent/20 px-4 py-3 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Derived from opportunity</p>
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-4 text-[13px]">
                  <ReadOnlyField label="Country" value={derived.country.toUpperCase()} />
                  <ReadOnlyField label="Business Unit" value={derived.businessUnit.toUpperCase()} />
                  <ReadOnlyField label="Currency" value={derived.currency} />
                  <ReadOnlyField label="Property" value={selectedOpp.title} />
                  <ReadOnlyField label="Client" value={selectedOpp.clientName ?? "—"} />
                  <ReadOnlyField label="Primary Agent" value={derived.agentParty?.displayName ?? selectedOpp.agentName ?? "—"} />
                  <ReadOnlyField label="Blueprint" value={derived.blueprint.id} />
                  <ReadOnlyField
                    label="Agent Strategy"
                    value={derived.agentFinancials ? derived.agentFinancials.strategy.kind : "default (flat 40%)"}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Revenue ─── */}
        {step === "revenue" && derived && (
          <div className="px-6 py-5 space-y-5">
            {derived.businessUnit === "rebu" ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Field label={`Property Price (${derived.currency})`}>
                    <Input type="number" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className="h-9 text-[13px]" />
                  </Field>
                  <Field label="Take Rate %">
                    <Input type="number" step="0.1" value={takeRate} onChange={(e) => setTakeRate(e.target.value)} className="h-9 text-[13px]" />
                  </Field>
                  <Field label={`Gross Commission (${derived.currency}) — derived`}>
                    <Input readOnly value={grossRevenue > 0 ? grossRevenue.toFixed(2) : ""} className="h-9 text-[13px] bg-muted font-mono" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Client Rebate %">
                    <Input type="number" step="0.1" min="0" value={rebatePct} onChange={(e) => setRebatePct(e.target.value)} className="h-9 text-[13px]" />
                  </Field>
                  <Field label={`Client Subsidy (${derived.currency})`}>
                    <Input type="number" min="0" value={subsidyAmt} onChange={(e) => setSubsidyAmt(e.target.value)} className="h-9 text-[13px]" />
                  </Field>
                </div>
                <p className="text-[12px] text-muted-foreground">Payers are added as stakeholders on the deal detail page after creation.</p>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <Field label={`Disbursed Amount (${derived.currency})`}>
                  <Input type="number" value={disbursedAmount} onChange={(e) => setDisbursedAmount(e.target.value)} className="h-9 text-[13px]" />
                </Field>
                <Field label="Bank Slab %">
                  <Input type="number" step="0.01" value={bankSlab} onChange={(e) => setBankSlab(e.target.value)} className="h-9 text-[13px]" />
                </Field>
                <Field label={`Gross Commission (${derived.currency}) — derived`}>
                  <Input readOnly value={grossRevenue.toFixed(2)} className="h-9 text-[13px] bg-muted font-mono" />
                </Field>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Simulation ─── */}
        {step === "simulation" && derived && projection && (() => {
          const tempDealId = "preview";
          const { posting, lines: postingLines } = draftPostings(projection, {
            id: tempDealId,
            businessUnit: derived.businessUnit,
            currency: derived.currency,
          }, derived.blueprint);
          return (
            <ScrollArea className="max-h-[calc(90vh-220px)]">
              <div className="px-6 py-5 space-y-5">
                <WaterfallTable projection={projection} currency={derived.currency} />
                <SplitsTable projection={projection} currency={derived.currency} />

                {/* Postings preview */}
                <div className="rounded-md border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPostings((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-left"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      Proposed Posting — {posting.businessProcess}
                    </p>
                    <span className="text-[11px] text-muted-foreground">{showPostings ? "Hide ▲" : "Show ▼"}</span>
                  </button>
                  {showPostings && (
                    <table className="w-full text-[13px]">
                      <thead className="bg-muted/20">
                        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="px-4 py-2">Ledger ID</th>
                          <th className="px-4 py-2">Side</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postingLines.map((pl) => (
                          <tr key={pl.id} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">{pl.ledgerId}</td>
                            <td className="px-4 py-2">
                              <span className={`text-[11px] font-semibold ${pl.side === "CREDIT" ? "text-emerald-600" : "text-destructive"}`}>
                                {pl.side}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{fmt(pl.amount, derived.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Notes (optional)</Label>
                  <textarea
                    value={latestNote}
                    onChange={(e) => setLatestNote(e.target.value)}
                    className="w-full h-20 mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    placeholder="Anything ops should know about this deal..."
                  />
                </div>
              </div>
            </ScrollArea>
          );
        })()}

        {/* ─── Footer (navigation) ─── */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
            <Button
              variant="outline"
              onClick={() => {
                if (step === "revenue") setStep("context");
                else if (step === "simulation") setStep("revenue");
              }}
              disabled={step === "context"}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {step === "context" && (
                <Button onClick={() => setStep("revenue")} disabled={!canLeaveContext}>Next</Button>
              )}
              {step === "revenue" && (
                <Button onClick={() => setStep("simulation")} disabled={!canLeaveRevenue}>Next</Button>
              )}
              {step === "simulation" && (
                <Button onClick={handleCreate} disabled={!canCreate}>Create Deal</Button>
              )}
            </div>
          </div>
        )}

        {/* ─── Success ─── */}
        {step === "success" && (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="h-14 w-14 mx-auto text-[hsl(var(--deal-paid))] mb-4" />
            <p className="text-[18px] font-semibold text-foreground">Deal Created Successfully</p>
            <Link to={`/deals/${createdDealId}`} className="inline-block text-[15px] font-mono text-primary mt-2 hover:underline cursor-pointer">{createdDealId}</Link>
            <p className="text-[13px] text-muted-foreground mt-2">Status: <span className="font-medium text-foreground">Under Review</span></p>
            <Button onClick={handleClose} className="mt-6">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[13px] text-foreground font-medium truncate">{value}</p>
    </div>
  );
}

function fmt(n: number, currency: string): string {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function WaterfallTable({ projection, currency }: { projection: ProjectedPnL; currency: string }) {
  // Step-by-step waterfall: gross → A → C → D → net → B → margin.
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Waterfall</p>
      </div>
      <table className="w-full text-[13px]">
        <tbody>
          <Row label="Gross Commission" amount={projection.grossRevenue} currency={currency} side="credit" />
          {projection.totalBucketA > 0 && (
            <Row label="Bucket A — Top-level reductions" amount={-projection.totalBucketA} currency={currency} side="debit" bucket="A" />
          )}
          {projection.totalBucketC > 0 && (
            <Row label="Bucket C — Referrals / Agencies" amount={-projection.totalBucketC} currency={currency} side="debit" bucket="C" />
          )}
          {projection.totalBucketD > 0 && (
            <Row label="Bucket D — Service Providers" amount={-projection.totalBucketD} currency={currency} side="debit" bucket="D" />
          )}
          <Row label="Net Revenue" amount={projection.netRevenue} currency={currency} side="credit" emphasised />
          {projection.totalBucketB > 0 && (
            <Row label="Bucket B — Internal Splits (Agent / TL / Manager)" amount={-projection.totalBucketB} currency={currency} side="debit" bucket="B" />
          )}
          <Row label="Huspy Margin" amount={projection.huspyMargin} currency={currency} side="credit" total />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label, amount, currency, side, bucket, emphasised, total,
}: {
  label: string; amount: number; currency: string; side: "debit" | "credit"; bucket?: string; emphasised?: boolean; total?: boolean;
}) {
  const cls = total
    ? "bg-primary/5 font-semibold border-t border-border"
    : emphasised
    ? "bg-muted/30 font-medium"
    : "";
  const amountCls = side === "debit" ? "text-destructive" : "text-foreground";
  return (
    <tr className={cls}>
      <td className="px-4 py-2 text-foreground">
        {bucket && <span className="inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">{bucket}</span>}
        {label}
      </td>
      <td className={`px-4 py-2 text-right font-mono ${amountCls}`}>{fmt(amount, currency)}</td>
    </tr>
  );
}

function SplitsTable({ projection, currency }: { projection: ProjectedPnL; currency: string }) {
  if (projection.splits.length === 0) {
    return (
      <div className="rounded-md border border-border px-4 py-3">
        <p className="text-[12px] text-muted-foreground italic">
          No internal-split agents resolved. (Opportunity has no agent assignment or agent has no AgentFinancials record.)
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Bucket B — Internal Splits (per agent)</p>
      </div>
      <table className="w-full text-[13px]">
        <thead className="bg-muted/20">
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2">Agent</th>
            <th className="px-4 py-2">Strategy</th>
            <th className="px-4 py-2 text-right">Allocated Net</th>
            <th className="px-4 py-2 text-right">Agent</th>
            <th className="px-4 py-2 text-right">Team Lead</th>
            <th className="px-4 py-2 text-right">Manager</th>
          </tr>
        </thead>
        <tbody>
          {projection.splits.map((s) => (
            <tr key={s.agentId} className="border-t border-border">
              <td className="px-4 py-2 font-mono text-[12px]">{s.agentId}</td>
              <td className="px-4 py-2">{s.strategyKind}</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(s.allocatedNet, currency)}</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(s.agentPayout, currency)}</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(s.teamLeadPayout, currency)}</td>
              <td className="px-4 py-2 text-right font-mono">{fmt(s.managerPayout, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
