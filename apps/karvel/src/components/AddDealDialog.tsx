import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "lucide-react";
import { Deal } from "@/data/types";
import {
  sharedAgents,
  sharedAgentFinancials,
  sharedParties,
  sharedDealStakeholders,
  sharedDealDocumentRequirements,
  sharedDocumentRequirementTemplates,
  getBlueprint,
  type BusinessUnit,
  type Country,
  type Market,
} from "@huspy/shared-domain";
import { PartyPicker } from "@/components/PartyPicker";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onDealCreated: (deal: Deal) => void;
}

type WizardStep = "context" | "revenue" | "success";

interface ConfirmedParty {
  partyId: string;
  displayName: string;
  amount: number | undefined;
}

const COUNTRY_TO_CURRENCY = { ae: "AED", es: "EUR", sa: "SAR" } as const;

const agentOptions = sharedAgents.map((a) => {
  const party = sharedParties.find((p) => p.id === a.partyId);
  return { agentId: a.id, partyId: a.partyId, displayName: party?.displayName ?? a.id };
});

export function AddDealDialog({ open, onClose, onDealCreated }: Props) {
  const [step, setStep] = useState<WizardStep>("context");
  const [createdDealId, setCreatedDealId] = useState("");

  // ─── Step 1: Context ──────────────────────────────────────────────────────
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>("rebu");
  const [country, setCountry] = useState<Country>("ae");
  const [market, setMarket] = useState<Market>("primary");
  const [propertyName, setPropertyName] = useState("");
  const [listerAgentId, setListerAgentId] = useState("");
  const [closerAgentId, setCloserAgentId] = useState("");
  const [listerSplitPct, setListerSplitPct] = useState("100");
  const [closerSplitPct, setCloserSplitPct] = useState("0");

  // ─── Step 2: Revenue ──────────────────────────────────────────────────────
  const [dealPrice, setDealPrice] = useState("");
  const [takeRate, setTakeRate] = useState("3");
  const [disbursedAmount, setDisbursedAmount] = useState("");
  const [bankSlab, setBankSlab] = useState("0.5");

  // Party slots (REBU only) — buyer side and counterparty side.
  const [buyerSlot, setBuyerSlot] = useState<ConfirmedParty | null>(null);
  const [counterpartySlot, setCounterpartySlot] = useState<ConfirmedParty | null>(null);
  const [showBuyerPicker, setShowBuyerPicker] = useState(false);
  const [showCounterpartyPicker, setShowCounterpartyPicker] = useState(false);

  const currency = COUNTRY_TO_CURRENCY[country];

  const listerAgent = useMemo(() => sharedAgents.find((a) => a.id === listerAgentId), [listerAgentId]);
  const closerAgent = useMemo(() => sharedAgents.find((a) => a.id === closerAgentId), [closerAgentId]);

  const grossRevenue = useMemo(() => {
    if (businessUnit === "mortgage") {
      return (parseFloat(disbursedAmount) || 0) * ((parseFloat(bankSlab) || 0) / 100);
    }
    return (parseFloat(dealPrice) || 0) * ((parseFloat(takeRate) || 0) / 100);
  }, [businessUnit, dealPrice, takeRate, disbursedAmount, bankSlab]);

  // Label pair adapts to market type.
  const buyerLabel = market === "leasing" ? "Tenant" : "Buyer";
  const counterpartyLabel = market === "primary" ? "Developer" : market === "leasing" ? "Landlord" : "Seller";

  const handleListerSplitChange = (val: string) => {
    setListerSplitPct(val);
    if (closerAgentId) setCloserSplitPct(String(Math.max(0, 100 - (parseFloat(val) || 0))));
  };

  const handleListerAgentChange = (agentId: string) => {
    setListerAgentId(agentId);
    if (!closerAgentId) { setListerSplitPct("100"); setCloserSplitPct("0"); }
  };

  const handleCloserAgentChange = (agentId: string) => {
    if (agentId === "__none__") agentId = "";
    setCloserAgentId(agentId);
    if (agentId) {
      setCloserSplitPct(String(Math.max(0, 100 - (parseFloat(listerSplitPct) || 100))));
    } else {
      setListerSplitPct("100");
      setCloserSplitPct("0");
    }
  };

  const handleCreate = () => {
    const id = `DEAL-${String(Date.now()).slice(-6)}`;

    const primaryAgent = listerAgent ?? closerAgent;
    const primaryParty = primaryAgent ? sharedParties.find((p) => p.id === primaryAgent.partyId) : undefined;

    const deal: Deal = {
      id,
      status: "under-review",
      market: businessUnit === "mortgage" ? "primary" : market,
      businessUnit,
      country,
      currency,
      blueprintId: getBlueprint(country, businessUnit).id,
      dealAmount: businessUnit === "mortgage" ? parseFloat(disbursedAmount) || 0 : parseFloat(dealPrice) || 0,
      grossRevenue,
      dealPrice: businessUnit === "mortgage" ? parseFloat(disbursedAmount) || 0 : parseFloat(dealPrice) || 0,
      takeRate: businessUnit === "mortgage" ? parseFloat(bankSlab) || 0 : parseFloat(takeRate) || 0,
      commissionPercentage: businessUnit === "mortgage" ? parseFloat(bankSlab) || 0 : parseFloat(takeRate) || 0,
      reportDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentName: primaryParty?.displayName ?? "Unknown Agent",
      title: propertyName || "Untitled Property",
      buildingName: propertyName || "Untitled Property",
      buyerName: buyerSlot?.displayName,
      sellerName: counterpartySlot?.displayName,
      agents: [],
      externalPartners: [],
      receivables: [],
      payables: [],
    };

    // INTERNAL_PAYOUT stakeholders.
    if (listerAgent) {
      sharedDealStakeholders.push({
        id: `ds-${id}-lister`,
        dealId: id,
        partyId: listerAgent.partyId,
        role: "INTERNAL_PAYOUT",
        isPrimary: true,
        splitPercentage: parseFloat(listerSplitPct) || 100,
      });
    }
    if (closerAgent) {
      sharedDealStakeholders.push({
        id: `ds-${id}-closer`,
        dealId: id,
        partyId: closerAgent.partyId,
        role: "INTERNAL_PAYOUT",
        splitPercentage: parseFloat(closerSplitPct) || 0,
      });
    }

    // REVENUE_SOURCE stakeholders — only parties who actually pay something.
    if (businessUnit === "rebu") {
      if (buyerSlot && (buyerSlot.amount ?? 0) > 0) {
        sharedDealStakeholders.push({
          id: `ds-${id}-buyer`,
          dealId: id,
          partyId: buyerSlot.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: buyerSlot.amount!,
        });
      }
      if (counterpartySlot && (counterpartySlot.amount ?? 0) > 0) {
        sharedDealStakeholders.push({
          id: `ds-${id}-counterparty`,
          dealId: id,
          partyId: counterpartySlot.partyId,
          role: "REVENUE_SOURCE",
          financialAmount: counterpartySlot.amount!,
        });
      }
    }

    // Document requirements.
    sharedDocumentRequirementTemplates
      .filter((t) => t.market === deal.market && t.businessUnit === deal.businessUnit && t.country === deal.country)
      .forEach((t, i) => {
        sharedDealDocumentRequirements.push({
          id: `ddr-${id}-${i}`,
          dealId: id,
          label: t.label,
          required: t.required,
          status: "pending",
        });
      });

    onDealCreated(deal);
    setCreatedDealId(id);
    setStep("success");
    toast({ title: "Deal Created", description: `Deal ${id} has been created.` });
  };

  const reset = () => {
    setStep("context");
    setBusinessUnit("rebu");
    setCountry("ae");
    setMarket("primary");
    setPropertyName("");
    setListerAgentId("");
    setCloserAgentId("");
    setListerSplitPct("100");
    setCloserSplitPct("0");
    setDealPrice("");
    setTakeRate("3");
    setDisbursedAmount("");
    setBankSlab("0.5");
    setBuyerSlot(null);
    setCounterpartySlot(null);
    setShowBuyerPicker(false);
    setShowCounterpartyPicker(false);
    setCreatedDealId("");
  };

  const handleClose = () => { reset(); onClose(); };

  // ─── Step gating ──────────────────────────────────────────────────────────
  const splitSum = (parseFloat(listerSplitPct) || 0) + (closerAgentId ? (parseFloat(closerSplitPct) || 0) : 0);
  const splitsValid = !closerAgentId
    ? (parseFloat(listerSplitPct) || 0) === 100
    : Math.abs(splitSum - 100) < 0.01;
  const canLeaveContext = !!listerAgentId && !!propertyName && splitsValid;

  const slotAmountsSum = (buyerSlot?.amount ?? 0) + (counterpartySlot?.amount ?? 0);
  const partySlotsValid =
    businessUnit !== "rebu" ||
    (buyerSlot !== null && counterpartySlot !== null && Math.abs(slotAmountsSum - grossRevenue) < 0.01);

  const canCreate = canLeaveContext && grossRevenue > 0 && partySlotsValid;

  const stepNum = step === "context" ? 1 : 2;
  const stepLabel = step === "context" ? "Context" : step === "revenue" ? "Revenue" : "Done";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle>
              {step === "success" ? "Deal Created" : `New Deal — Step ${stepNum} of 2: ${stepLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "context" && "Declare the property, country, market, and agent splits."}
              {step === "revenue" && "Declare the gross commission and the parties on each side of the deal."}
              {step === "success" && "Your deal has been created and is now available across all views."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── Step 1: Context ─── */}
        {step === "context" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-5">

              {/* Header Data */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Header Data</p>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Business Unit">
                    <Select value={businessUnit} onValueChange={(v) => setBusinessUnit(v as BusinessUnit)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rebu">REBU</SelectItem>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Country">
                    <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ae">UAE (AE)</SelectItem>
                        <SelectItem value="es">Spain (ES)</SelectItem>
                        <SelectItem value="sa">Saudi Arabia (SA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Currency — derived">
                    <Input readOnly value={currency} className="h-9 text-[13px] bg-muted font-mono" />
                  </Field>
                </div>
                {businessUnit === "rebu" && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <Field label="Market">
                      <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary (off-plan / new)</SelectItem>
                          <SelectItem value="secondary">Secondary (resale)</SelectItem>
                          <SelectItem value="leasing">Leasing</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
                <div className="mt-4">
                  <Field label="Property Name">
                    <Input
                      placeholder="e.g. Marina Waterfront Tower, Unit 12A"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="h-9 text-[13px]"
                    />
                  </Field>
                </div>
              </div>

              {/* Agent Splits */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Agent Splits</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Lister (Seller-side) *</p>
                    <Field label="Agent">
                      <Select value={listerAgentId} onValueChange={handleListerAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select agent…" /></SelectTrigger>
                        <SelectContent>
                          {agentOptions.map((a) => (
                            <SelectItem key={a.agentId} value={a.agentId} disabled={a.agentId === closerAgentId}>
                              {a.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Pool Share %">
                      <Input
                        type="number" min="0" max="100"
                        value={listerSplitPct}
                        onChange={(e) => handleListerSplitChange(e.target.value)}
                        className="h-9 text-[13px]"
                      />
                    </Field>
                    {listerAgentId && (() => {
                      const af = sharedAgentFinancials.find((f) => f.agentId === listerAgentId);
                      return af
                        ? <p className="text-[11px] text-muted-foreground">Strategy: <span className="font-medium text-foreground">{af.strategy.kind}{af.strategy.kind === "flat" ? ` ${af.strategy.pct}%` : ""}</span></p>
                        : <p className="text-[11px] text-amber-500">No AgentFinancials record</p>;
                    })()}
                  </div>

                  <div className="space-y-3 p-3 rounded-md border border-border bg-accent/10">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Closer (Buyer-side) — optional</p>
                    <Field label="Agent">
                      <Select value={closerAgentId} onValueChange={handleCloserAgentChange}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="None (single agent)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {agentOptions.map((a) => (
                            <SelectItem key={a.agentId} value={a.agentId} disabled={a.agentId === listerAgentId}>
                              {a.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {closerAgentId && (
                      <>
                        <Field label="Pool Share %">
                          <Input
                            type="number" min="0" max="100"
                            value={closerSplitPct}
                            onChange={(e) => setCloserSplitPct(e.target.value)}
                            className="h-9 text-[13px]"
                          />
                        </Field>
                        {(() => {
                          const af = sharedAgentFinancials.find((f) => f.agentId === closerAgentId);
                          return af
                            ? <p className="text-[11px] text-muted-foreground">Strategy: <span className="font-medium text-foreground">{af.strategy.kind}{af.strategy.kind === "flat" ? ` ${af.strategy.pct}%` : ""}</span></p>
                            : <p className="text-[11px] text-amber-500">No AgentFinancials record</p>;
                        })()}
                      </>
                    )}
                  </div>
                </div>
                {closerAgentId && !splitsValid && (
                  <p className="text-[12px] text-destructive mt-2">Splits must sum to 100% (currently {splitSum.toFixed(0)}%)</p>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* ─── Step 2: Revenue ─── */}
        {step === "revenue" && (
          <ScrollArea className="max-h-[calc(90vh-220px)]">
            <div className="px-6 py-5 space-y-5">
              {businessUnit === "rebu" ? (
                <>
                  {/* Commission inputs */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Commission</p>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label={`Property Price (${currency})`}>
                        <Input type="number" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label="Take Rate %">
                        <Input type="number" step="0.1" value={takeRate} onChange={(e) => setTakeRate(e.target.value)} className="h-9 text-[13px]" />
                      </Field>
                      <Field label={`Gross Commission (${currency}) — derived`}>
                        <Input readOnly value={grossRevenue > 0 ? grossRevenue.toFixed(2) : ""} className="h-9 text-[13px] bg-muted font-mono" />
                      </Field>
                    </div>
                  </div>

                  {/* Deal parties */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Deal Parties</p>
                    <div className="space-y-3">

                      {/* Buyer / Tenant */}
                      {buyerSlot ? (
                        <ConfirmedSlot
                          label={buyerLabel}
                          party={buyerSlot}
                          currency={currency}
                          onClear={() => setBuyerSlot(null)}
                        />
                      ) : showBuyerPicker ? (
                        <PartyPicker
                          label={buyerLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          excludePartyIds={counterpartySlot ? [counterpartySlot.partyId] : []}
                          onConfirm={(partyId, displayName, amount) => {
                            setBuyerSlot({ partyId, displayName, amount });
                            setShowBuyerPicker(false);
                          }}
                          onCancel={() => setShowBuyerPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={buyerLabel} onClick={() => setShowBuyerPicker(true)} />
                      )}

                      {/* Seller / Developer / Landlord */}
                      {counterpartySlot ? (
                        <ConfirmedSlot
                          label={counterpartyLabel}
                          party={counterpartySlot}
                          currency={currency}
                          onClear={() => setCounterpartySlot(null)}
                        />
                      ) : showCounterpartyPicker ? (
                        <PartyPicker
                          label={counterpartyLabel}
                          currency={currency}
                          amountLabel="Commission owed to Huspy"
                          excludePartyIds={buyerSlot ? [buyerSlot.partyId] : []}
                          onConfirm={(partyId, displayName, amount) => {
                            setCounterpartySlot({ partyId, displayName, amount });
                            setShowCounterpartyPicker(false);
                          }}
                          onCancel={() => setShowCounterpartyPicker(false)}
                        />
                      ) : (
                        <AddSlotButton label={counterpartyLabel} onClick={() => setShowCounterpartyPicker(true)} />
                      )}
                    </div>

                    {/* Balance indicator */}
                    {grossRevenue > 0 && buyerSlot && counterpartySlot && (
                      <p className={`mt-3 text-[12px] font-mono ${Math.abs(slotAmountsSum - grossRevenue) < 0.01 ? "text-emerald-600" : "text-destructive"}`}>
                        Assigned: {currency} {slotAmountsSum.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {currency} {grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {Math.abs(slotAmountsSum - grossRevenue) < 0.01
                          ? " ✓"
                          : ` — ${Math.abs(grossRevenue - slotAmountsSum).toLocaleString(undefined, { maximumFractionDigits: 2 })} unassigned`}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Commission</p>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label={`Disbursed Amount (${currency})`}>
                      <Input type="number" value={disbursedAmount} onChange={(e) => setDisbursedAmount(e.target.value)} className="h-9 text-[13px]" />
                    </Field>
                    <Field label="Bank Slab %">
                      <Input type="number" step="0.01" value={bankSlab} onChange={(e) => setBankSlab(e.target.value)} className="h-9 text-[13px]" />
                    </Field>
                    <Field label={`Gross Commission (${currency}) — derived`}>
                      <Input readOnly value={grossRevenue.toFixed(2)} className="h-9 text-[13px] bg-muted font-mono" />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* ─── Footer ─── */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
            <Button
              variant="outline"
              onClick={() => { if (step === "revenue") setStep("context"); }}
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

function AddSlotButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-border text-[13px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      <span className="text-[16px] leading-none">+</span> Add {label}
    </button>
  );
}

function ConfirmedSlot({
  label,
  party,
  currency,
  onClear,
}: {
  label: string;
  party: { displayName: string; amount: number | undefined };
  currency: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-accent/10">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-[13px] font-medium text-foreground">{party.displayName}</p>
        {(party.amount ?? 0) > 0 ? (
          <p className="text-[12px] text-muted-foreground">
            Pays: {currency} {party.amount!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground italic">No commission</p>
        )}
      </div>
      <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground underline">
        Change
      </button>
    </div>
  );
}
