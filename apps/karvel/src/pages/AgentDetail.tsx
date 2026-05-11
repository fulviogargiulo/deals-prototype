import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Check, Archive, Pencil, Copy, Plus, X } from "lucide-react";
import { sharedAgents, sharedParties, sharedPostingLines, sharedPostings, sharedLedgers } from "@huspy/shared-domain";
import { COMMISSION_RATES, computeDealFinancials } from "@huspy/shared-domain";
import type { Posting, PostingLine } from "@huspy/shared-domain";
import { getDeals } from "@/data/dealStore";
import { DealTypeBadge, DealStatusBadge } from "@/components/DealBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTimestamp(s: string) {
  return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── NonEditableField (mirrors shared-ops structure exactly) ──────────────────

function NonEditableField({
  label,
  value,
  hasCopyButton = false,
}: {
  label: string;
  value: string | { label: string; value: string }[];
  hasCopyButton?: boolean;
}) {
  const valueToCopy = Array.isArray(value) ? value.map((v) => v.label).join(", ") : value;
  return (
    <div className="flex flex-wrap items-center border border-transparent gap-4 p-0 text-sm">
      <div className="flex flex-1 flex-col gap-2 overflow-x-auto">
        <div className="h-3.5 text-sm font-medium leading-snug">{label}</div>
        {Array.isArray(value) ? (
          <div className="flex gap-1 py-1.5 px-3 flex-wrap">
            {value.length > 0
              ? value.map((v) => (
                  <Badge key={v.value} variant="secondary" className="flex shrink-0 items-center gap-1">
                    {v.label}
                  </Badge>
                ))
              : <span className="text-muted-foreground text-sm">—</span>}
          </div>
        ) : (
          <p className="px-3 py-[6.5px] text-muted-foreground text-sm leading-normal">{value || "—"}</p>
        )}
      </div>
      {hasCopyButton && valueToCopy && (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-10 w-10" type="button"
            onClick={() => navigator.clipboard.writeText(valueToCopy)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Line type labels ─────────────────────────────────────────────────────────

const PROCESS_LABELS: Record<string, string> = {
  deal_close: "Deal Close",
  agent_invoice: "Commission",
  bank_statement_inbound_matched: "Payment In",
  bank_statement_outbound_matched: "Payment Out",
  payout_instructed: "Payout",
  bonus: "Bonus",
  incentive: "Incentive",
  platform_fee: "Platform Fee",
  manual_adjustment: "Adjustment",
  reversal: "Reversal",
};

function getBaseGLCode(ledgerId: string): string {
  return ledgerId.replace(/_(?:EUR|AED|SAR)$/, "");
}

function getLedgerDisplay(ledgerId: string): { gl: string; sub: string | null } {
  const ledger = sharedLedgers.find((l) => l.id === ledgerId);
  if (!ledger) return { gl: ledgerId, sub: null };
  if (ledger.glId) return { gl: ledger.glId, sub: ledgerId };
  return { gl: ledgerId, sub: null };
}

// ─── Financials per-agent state (prototype in-memory store) ──────────────────

type AgentFinancials = {
  agentGrossRate: number;
  takeRate: number;
  teamLeadRate: number;
  managerRate: number;
};

const agentFinancialsStore: Record<string, AgentFinancials> = {};

function getAgentFinancials(agentId: string): AgentFinancials {
  return agentFinancialsStore[agentId] ?? {
    agentGrossRate: COMMISSION_RATES.agentGrossRate,
    takeRate: COMMISSION_RATES.takeRate,
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "clients",       label: "Clients" },
  { id: "properties",    label: "Properties" },
  { id: "opportunities", label: "Opportunities" },
  { id: "deals",         label: "Deals" },
  { id: "ledger",        label: "Ledger" },
  { id: "financials",    label: "Financials" },
  { id: "logs",          label: "Logs",       disabled: true },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Posting draft types ──────────────────────────────────────────────────────

type DraftLine = {
  _id: string;
  glLedgerId: string;
  subledgerId: string;
  side: "DEBIT" | "CREDIT";
  amount: string;
  invoiceId: string;
};

type PostingDraft = {
  businessProcess: string;
  externalRef: string;
  dealId: string;
  valueDate: string;
  description: string;
  lines: DraftLine[];
};

function newLine(side: "DEBIT" | "CREDIT" = "CREDIT", glLedgerId = "", subledgerId = ""): DraftLine {
  return { _id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, glLedgerId, subledgerId, side, amount: "", invoiceId: "" };
}

function emptyDraft(defaultSubledgerId = ""): PostingDraft {
  const sub = defaultSubledgerId ? sharedLedgers.find((l) => l.id === defaultSubledgerId) : null;
  const glBase = sub?.glId ?? "";
  const defaultGLId = sub?.currency && glBase
    ? (sharedLedgers.find((l) => l.id === `${glBase}_${sub.currency}`)?.id ?? glBase)
    : "";
  return {
    businessProcess: "manual_adjustment",
    externalRef: "",
    dealId: "",
    valueDate: new Date().toISOString().slice(0, 10),
    description: "",
    lines: [newLine("CREDIT", defaultGLId, defaultSubledgerId), newLine("DEBIT")],
  };
}

const BUSINESS_PROCESSES = [
  { value: "deal_close",                       label: "deal_close" },
  { value: "agent_invoice",                    label: "agent_invoice" },
  { value: "bank_statement_inbound_matched",   label: "bank_statement_inbound_matched" },
  { value: "bank_statement_outbound_matched",  label: "bank_statement_outbound_matched" },
  { value: "payout_instructed",                label: "payout_instructed" },
  { value: "bonus",                            label: "bonus" },
  { value: "incentive",                        label: "incentive" },
  { value: "platform_fee",                     label: "platform_fee" },
  { value: "manual_adjustment",                label: "manual_adjustment" },
  { value: "reversal",                         label: "reversal" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) ?? "overview";
  const setTab = (tab: TabId) => setSearchParams({ tab }, { replace: true });

  const agent = sharedAgents.find((a) => a.id === agentId);
  const party = agent ? sharedParties.find((p) => p.id === agent.partyId) : undefined;

  // Financials local state
  const [fin, setFin] = useState<AgentFinancials>(() => getAgentFinancials(agentId ?? ""));
  const [previewAmount, setPreviewAmount] = useState(300_000);
  const [finEditing, setFinEditing] = useState(false);
  const [finDraft, setFinDraft] = useState<AgentFinancials>(fin);

  // Ledger local state
  const [manualPostings, setManualPostings] = useState<Posting[]>([]);
  const [manualPostingLines, setManualPostingLines] = useState<PostingLine[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);
  const [createPostingOpen, setCreatePostingOpen] = useState(false);
  const [draft, setDraft] = useState<PostingDraft>(emptyDraft);

  if (!agent) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Agent not found</div>;
  }

  const displayName = party?.displayName ?? agent.id;
  const nameParts = displayName.split(" ");
  const isActive = (agent.employmentStatus ?? "active") === "active";

  // Deals
  const agentDeals = getDeals().filter(
    (d) => d.agentName === displayName || (d.agents ?? []).some((e) => e.agentName === displayName),
  );

  // Ledger — all posting lines on this agent's subledger (shared + manual)
  const subledgerId = `AgentLiability_${agent.id}`;
  const allPostings = [...sharedPostings, ...manualPostings];
  const allPostingLines = [...sharedPostingLines, ...manualPostingLines];

  const ledgerLines = allPostingLines
    .filter((l) => l.ledgerId === subledgerId)
    .map((l) => {
      const posting = allPostings.find((p) => p.id === l.postingId);
      return { ...l, posting };
    })
    .sort((a, b) => (a.posting?.valueDate ?? "").localeCompare(b.posting?.valueDate ?? ""));

  const credits = ledgerLines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0);
  const debits = ledgerLines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0);
  const net = credits - debits;
  const primaryCurrency = ledgerLines[0]?.posting?.currency ?? "EUR";

  // Posting popup data
  const selectedPosting = selectedPostingId ? allPostings.find((p) => p.id === selectedPostingId) : null;
  const selectedPostingAllLines = selectedPostingId
    ? allPostingLines.filter((l) => l.postingId === selectedPostingId)
    : [];

  // Financials preview
  const preview = computeDealFinancials(previewAmount, {
    agentGrossRate: fin.agentGrossRate,
    takeRate: fin.takeRate,
    teamLeadRate: fin.teamLeadRate,
    managerOverrideRate: fin.managerRate,
  });

  // ── Draft line helpers ──────────────────────────────────────────────────────
  function updateLine(id: string, updates: Partial<DraftLine>) {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => l._id === id ? { ...l, ...updates } : l) }));
  }
  function addLine() {
    setDraft((d) => ({ ...d, lines: [...d.lines, newLine("DEBIT")] }));
  }
  function removeLine(id: string) {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l._id !== id) }));
  }

  // ── Currency detection (derived from lines) ─────────────────────────────────
  const detectedCurrency = (() => {
    for (const line of draft.lines) {
      const effectiveId = line.subledgerId || line.glLedgerId;
      const ledger = sharedLedgers.find((l) => l.id === effectiveId);
      if (ledger?.currency) return ledger.currency;
    }
    return null;
  })();

  // GL ledgers for the form (non-subledger, currency-aware, currency-filtered)
  const CURRENCIES = ["EUR", "AED", "SAR"] as const;
  const availableGLLedgers = sharedLedgers.filter(
    (l) => !l.glId && l.currency && (!detectedCurrency || l.currency === detectedCurrency),
  );
  const glLedgerGroups = CURRENCIES
    .map((c) => ({ currency: c, ledgers: availableGLLedgers.filter((l) => l.currency === c) }))
    .filter((g) => g.ledgers.length > 0);

  function getSubledgersForGLId(glLedgerId: string) {
    const gl = sharedLedgers.find((l) => l.id === glLedgerId);
    if (!gl) return [];
    const base = getBaseGLCode(glLedgerId);
    return sharedLedgers.filter((l) => l.glId === base && l.currency === gl.currency);
  }

  // Balance summary
  const validLines = draft.lines.filter((l) => (l.subledgerId || l.glLedgerId) && parseFloat(l.amount || "0") > 0);
  const totalDebits  = validLines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalCredits = validLines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + parseFloat(l.amount), 0);
  const isBalanced   = validLines.length >= 2 && Math.abs(totalDebits - totalCredits) < 0.001;
  const canCreate    = !!draft.description.trim() && isBalanced;

  function handleCreatePosting() {
    const currency = (() => {
      for (const l of draft.lines) {
        const effectiveId = l.subledgerId || l.glLedgerId;
        const led = sharedLedgers.find((x) => x.id === effectiveId);
        if (led?.currency) return led.currency;
      }
      return "EUR";
    })();
    const postingId = `manual-posting-${Date.now()}`;
    const now = new Date().toISOString();
    const newPosting: Posting = {
      id: postingId,
      dealId: draft.dealId || undefined,
      businessProcess: draft.businessProcess as any,
      externalRef: draft.externalRef || undefined,
      createdBy: "user-ops",
      createdAt: now,
      valueDate: draft.valueDate,
      currency: currency as any,
      status: "posted",
      description: draft.description,
    };
    const newLines: PostingLine[] = draft.lines.map((line, idx) => ({
      id: `${postingId}-L${idx + 1}`,
      postingId,
      ledgerId: line.subledgerId || line.glLedgerId,
      side: line.side,
      amount: parseFloat(line.amount),
      invoiceId: line.invoiceId || undefined,
    }));
    setManualPostings((prev) => [...prev, newPosting]);
    setManualPostingLines((prev) => [...prev, ...newLines]);
    setCreatePostingOpen(false);
    setDraft(emptyDraft());
  }

  const thClass = "text-left px-4 py-3 text-[13px] font-medium text-muted-foreground whitespace-nowrap";
  const tdClass = "px-4 py-3 text-[14px] text-foreground whitespace-nowrap";

  const StubTab = ({ label }: { label: string }) => (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-[14px]">
      {label} — coming soon
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background overflow-auto">
      <div className="px-6 pt-6 pb-0">

        {/* ── Flat page header ── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              <Badge className={cn("rounded-full font-semibold capitalize",
                isActive ? "bg-green-500 text-white hover:bg-green-500" : "bg-gray-400 text-white hover:bg-gray-400")}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
              {(agent.workingZones ?? [])[0] && <span>{(agent.workingZones ?? [])[0]}</span>}
              {(agent.workingZones ?? [])[0] && <span className="mx-1">•</span>}
              <span className="text-[11px] font-semibold tracking-wider uppercase">Agent</span>
              <span className="mx-1">•</span>
              <span>ID: {agent.uid ?? agent.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <Button variant="outline" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Contact Agent
            </Button>
            <Button variant="outline" disabled={isActive} className="gap-1.5 opacity-50">
              <Check className="h-4 w-4" /> Activate agent
            </Button>
            <Button variant="destructive" className="gap-1.5">
              <Archive className="h-4 w-4" /> Archive Agent
            </Button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-border">
          {TABS.map(({ id, label, disabled }) => (
            <button
              key={id}
              onClick={() => !disabled && setTab(id)}
              disabled={disabled}
              className={cn(
                "px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors",
                activeTab === id
                  ? "border-foreground text-foreground"
                  : disabled
                    ? "border-transparent text-muted-foreground/40 cursor-not-allowed"
                    : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-6 py-6 flex-1">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-4">
              <Card className="h-full">
                <CardHeader className="gap-0">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
                    Agent information
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                  </CardTitle>
                  <CardDescription className="text-xs">Manage the agent's working information</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <NonEditableField label="First name" value={nameParts[0]} />
                    <NonEditableField label="Last name" value={nameParts.slice(1).join(" ") || "—"} />
                    <NonEditableField label="Email" value={party?.email ?? "—"} />
                    <NonEditableField label="Phone number" value={party?.phone ?? "—"} />
                    <NonEditableField
                      label="Working zones"
                      value={(agent.workingZones ?? []).map((z) => ({ label: z, value: z }))}
                    />
                    <NonEditableField
                      label="Tiers"
                      value={agent.experience != null
                        ? [{ label: agent.experience >= 8 ? "SENIOR" : "JUNIOR", value: "tier" }]
                        : []}
                    />
                    <NonEditableField label="Business entity ID"
                      value={(agent.workingZones ?? [])[0]?.includes("Madrid") ? "REBU_ES_MADRID"
                        : (agent.workingZones ?? [])[0]?.includes("Dubai") || (agent.workingZones ?? [])[0]?.includes("JBR") ? "REBU_AE_DUBAI"
                        : (agent.workingZones ?? [])[0]?.includes("Riyadh") ? "REBU_SA_RIYADH"
                        : "—"} />
                    <NonEditableField label="ID" value={String(agent.uid ?? agent.id)} hasCopyButton />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CLIENTS / PROPERTIES / OPPORTUNITIES — stubs */}
        {activeTab === "clients" && <StubTab label="Clients" />}
        {activeTab === "properties" && <StubTab label="Properties" />}
        {activeTab === "opportunities" && <StubTab label="Opportunities" />}

        {/* DEALS */}
        {activeTab === "deals" && (
          <>
            <h2 className="text-[15px] font-semibold text-foreground mb-4">Deals · {agentDeals.length}</h2>
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              {agentDeals.length === 0 ? (
                <div className="px-4 py-10 text-center text-muted-foreground text-[14px]">No deals found for this agent</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className={thClass}>ID</th>
                        <th className={thClass}>Type</th>
                        <th className={`${thClass} text-center`}>Status</th>
                        <th className={thClass}>Market</th>
                        <th className={thClass}>Client</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Commission</th>
                        <th className={thClass}>Report Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentDeals.map((deal) => {
                        const entry = (deal.agents ?? []).find((e) => e.agentName === displayName);
                        return (
                          <tr key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                            <td className={`${tdClass} text-muted-foreground font-mono text-[12px]`}>{deal.id}</td>
                            <td className="px-4 py-3"><DealTypeBadge type={deal.type} /></td>
                            <td className="px-4 py-3 text-center"><DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} /></td>
                            <td className={tdClass}>{deal.market ?? "—"}</td>
                            <td className={tdClass}>{deal.clientName ?? "—"}</td>
                            <td className={tdClass}>{fmt(deal.dealAmount, deal.currency ?? "EUR")}</td>
                            <td className={tdClass}>
                              {entry ? fmt(entry.agentCommissionPayout, deal.currency ?? "EUR")
                                : deal.agentCommissionPayout != null ? fmt(deal.agentCommissionPayout, deal.currency ?? "EUR")
                                : "—"}
                            </td>
                            <td className={tdClass}>{fmtDate(deal.reportDate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* LEDGER */}
        {activeTab === "ledger" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-foreground">{subledgerId}</h2>
              <Button className="gap-1.5" onClick={() => { setDraft(emptyDraft(subledgerId)); setCreatePostingOpen(true); }}>
                <Plus className="h-4 w-4" /> New posting
              </Button>
            </div>

            {/* Net balance summary */}
            <div className="flex items-center gap-6 bg-card rounded-xl border border-border px-5 py-4 mb-4">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Total Credits</p>
                <p className="text-[18px] font-bold text-foreground tabular-nums">{fmt(credits, primaryCurrency)}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Total Debits</p>
                <p className="text-[18px] font-bold text-foreground tabular-nums">{fmt(debits, primaryCurrency)}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Net Balance</p>
                <p className={cn("text-[18px] font-bold tabular-nums", net >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {net >= 0 ? "+" : "−"}{fmt(Math.abs(net), primaryCurrency)}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl overflow-hidden border border-border">
              {ledgerLines.length === 0 ? (
                <div className="px-4 py-10 text-center text-muted-foreground text-[14px]">No ledger entries found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className={thClass}>Created At</th>
                        <th className={thClass}>Value Date</th>
                        <th className={thClass}>Description</th>
                        <th className={thClass}>Deal</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Invoice</th>
                        <th className={`${thClass} text-right`}>Debit</th>
                        <th className={`${thClass} text-right`}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerLines.map((line) => {
                        const dealId = line.posting?.dealId;
                        const currency = line.posting?.currency ?? "EUR";
                        return (
                          <tr
                            key={line.id}
                            onClick={() => setSelectedPostingId(line.postingId)}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <td className={tdClass}>{line.posting?.createdAt ? fmtTimestamp(line.posting.createdAt) : "—"}</td>
                            <td className={tdClass}>{line.posting ? fmtDate(line.posting.valueDate) : "—"}</td>
                            <td className={`${tdClass} max-w-[220px] truncate text-muted-foreground text-[13px]`}>
                              {line.posting?.description ?? "—"}
                            </td>
                            <td className={tdClass}>
                              {dealId ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/deals/${dealId}`); }}
                                  className="text-primary underline underline-offset-2 hover:opacity-80 font-mono text-[12px]"
                                >
                                  {dealId}
                                </button>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="capitalize text-[11px]">
                                {PROCESS_LABELS[line.posting?.businessProcess ?? ""] ?? line.posting?.businessProcess ?? "—"}
                              </Badge>
                            </td>
                            <td className={`${tdClass} font-mono text-[12px] text-muted-foreground`}>
                              {line.invoiceId ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-[14px] tabular-nums font-semibold">
                              {line.side === "DEBIT" ? fmt(line.amount, currency) : <span className="text-muted-foreground/30">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-[14px] tabular-nums font-semibold">
                              {line.side === "CREDIT" ? fmt(line.amount, currency) : <span className="text-muted-foreground/30">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* FINANCIALS */}
        {activeTab === "financials" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Commission Structure */}
            <Card>
              <CardHeader className="gap-0">
                <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
                  Commission Structure
                  <Button variant="ghost" size="icon"
                    onClick={() => { setFinEditing(!finEditing); setFinDraft(fin); }}>
                    {finEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs">Agent commission rates applied to each closed deal</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <RateField label="Take Rate" sublabel="% Huspy charges the client on deal amount"
                  value={finEditing ? finDraft.takeRate : fin.takeRate}
                  editing={finEditing}
                  onChange={(v) => setFinDraft((d) => ({ ...d, takeRate: v }))} />
                <RateField label="Agent Gross Rate" sublabel="% of Huspy revenue paid to this agent"
                  value={finEditing ? finDraft.agentGrossRate : fin.agentGrossRate}
                  editing={finEditing}
                  onChange={(v) => setFinDraft((d) => ({ ...d, agentGrossRate: v }))} />
                {finEditing && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => { setFin(finDraft); agentFinancialsStore[agent.id] = finDraft; setFinEditing(false); }}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setFinDraft(fin); setFinEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connected Agents */}
            <Card>
              <CardHeader className="gap-0">
                <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
                  Connected Agents
                  <Button variant="ghost" size="icon"
                    onClick={() => { setFinEditing(!finEditing); setFinDraft(fin); }}>
                    {finEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs">Team lead and manager cuts — Huspy-borne, do not reduce agent earnings</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-5">
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Team Lead</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NonEditableField label="Name" value={agent.teamLeadName ?? "—"} />
                    <RateField label="Rate" sublabel="% of agent payout"
                      value={finEditing ? finDraft.teamLeadRate : fin.teamLeadRate}
                      editing={finEditing}
                      onChange={(v) => setFinDraft((d) => ({ ...d, teamLeadRate: v }))} />
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Manager</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NonEditableField label="Name" value={agent.managerName ?? "—"} />
                    <RateField label="Rate" sublabel="% of agent payout"
                      value={finEditing ? finDraft.managerRate : fin.managerRate}
                      editing={finEditing}
                      onChange={(v) => setFinDraft((d) => ({ ...d, managerRate: v }))} />
                  </div>
                </div>
                {finEditing && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => { setFin(finDraft); agentFinancialsStore[agent.id] = finDraft; setFinEditing(false); }}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setFinDraft(fin); setFinEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* P&L Preview */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="gap-0">
                  <CardTitle className="text-sm font-bold">P&L Preview</CardTitle>
                  <CardDescription className="text-xs">
                    Simulated deal calculation using this agent's current rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-5">
                    <label className="text-[13px] font-medium text-foreground">Deal amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">€</span>
                      <input
                        type="number"
                        value={previewAmount}
                        onChange={(e) => setPreviewAmount(Number(e.target.value) || 0)}
                        className="pl-7 pr-4 py-2 border border-border rounded-md text-[13px] bg-card w-[160px] focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PnLCard label="Huspy Revenue" sublabel={`${fin.takeRate}% of deal`} amount={preview.huspyRevenue} />
                    <PnLCard label="Agent Payout" sublabel={`${fin.agentGrossRate}% of revenue`} amount={preview.agentCommissionPayout} highlight />
                    <PnLCard label="Team Lead" sublabel={`${fin.teamLeadRate}% of agent payout`} amount={preview.teamLeadShare} muted />
                    <PnLCard label="Manager" sublabel={`${fin.managerRate}% of agent payout`} amount={preview.managerOverride} muted />
                    <PnLCard label="Conveyance" sublabel="12.5% of revenue" amount={preview.conveyanceRevenue} muted />
                    <PnLCard label="Conv. Agent" sublabel="25% of conveyance" amount={preview.conveyanceAgentPayout} muted />
                    <PnLCard label="Huspy Net" sublabel="After all payouts" amount={preview.huspyNet} positive />
                    <div className="bg-muted/40 rounded-lg p-4 border border-border">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Huspy Margin</p>
                      <p className="text-[20px] font-bold text-foreground">
                        {((preview.huspyNet / preview.huspyRevenue) * 100).toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">of Huspy revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* LOGS */}
        {activeTab === "logs" && (
          <p className="text-muted-foreground text-[14px]">Logs coming soon.</p>
        )}
      </div>

      {/* ── Posting detail dialog ── */}
      <Dialog open={!!selectedPostingId} onOpenChange={(open) => !open && setSelectedPostingId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-[14px]">{selectedPosting?.id}</DialogTitle>
            <DialogDescription>
              {selectedPosting?.businessProcess} · {selectedPosting?.valueDate} · {selectedPosting?.currency}
            </DialogDescription>
          </DialogHeader>
          {selectedPosting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                <div>
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Status</p>
                  <p className="font-medium capitalize">{selectedPosting.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">External Ref</p>
                  <p className="font-medium font-mono">{selectedPosting.externalRef ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Deal</p>
                  {selectedPosting.dealId ? (
                    <button
                      onClick={() => { setSelectedPostingId(null); navigate(`/deals/${selectedPosting.dealId}`); }}
                      className="font-medium font-mono text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      {selectedPosting.dealId}
                    </button>
                  ) : <p className="font-medium">—</p>}
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Created by</p>
                  <p className="font-medium">{selectedPosting.createdBy}</p>
                </div>
                {selectedPosting.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Description</p>
                    <p className="font-medium">{selectedPosting.description}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Posting Lines</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground">GL Ledger</th>
                        <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground">Subledger</th>
                        <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground">Type</th>
                        <th className="text-right px-3 py-2 text-[12px] font-medium text-muted-foreground">Debit</th>
                        <th className="text-right px-3 py-2 text-[12px] font-medium text-muted-foreground">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPostingAllLines.map((l) => {
                        const { gl, sub } = getLedgerDisplay(l.ledgerId);
                        return (
                          <tr key={l.id} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 font-mono text-[12px] text-muted-foreground">{gl}</td>
                            <td className={cn("px-3 py-2 font-mono text-[12px]", sub ? "text-primary font-semibold" : "text-muted-foreground/40")}>
                              {sub ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-[12px]">
                              {PROCESS_LABELS[selectedPosting.businessProcess] ?? selectedPosting.businessProcess}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">
                              {l.side === "DEBIT" ? fmt(l.amount, selectedPosting.currency) : <span className="text-muted-foreground/30">—</span>}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">
                              {l.side === "CREDIT" ? fmt(l.amount, selectedPosting.currency) : <span className="text-muted-foreground/30">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30">
                        <td colSpan={3} className="px-3 py-2 text-[12px] font-semibold">Totals</td>
                        <td className="px-3 py-2 text-right text-[12px] font-semibold tabular-nums">
                          {fmt(selectedPostingAllLines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0), selectedPosting.currency)}
                        </td>
                        <td className="px-3 py-2 text-right text-[12px] font-semibold tabular-nums">
                          {fmt(selectedPostingAllLines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0), selectedPosting.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create manual posting dialog ── */}
      <Dialog open={createPostingOpen} onOpenChange={(open) => { setCreatePostingOpen(open); if (!open) setDraft(emptyDraft()); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Posting</DialogTitle>
            <DialogDescription>{subledgerId}</DialogDescription>
          </DialogHeader>

          {/* ── Header fields ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Business process</label>
              <select value={draft.businessProcess}
                onChange={(e) => setDraft((d) => ({ ...d, businessProcess: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                {BUSINESS_PROCESSES.map((bp) => (
                  <option key={bp.value} value={bp.value}>{bp.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">
                Ext. reference <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input type="text" value={draft.externalRef}
                onChange={(e) => setDraft((d) => ({ ...d, externalRef: e.target.value }))}
                placeholder="e.g. AGINV-042"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Value date</label>
              <input type="date" value={draft.valueDate}
                onChange={(e) => setDraft((d) => ({ ...d, valueDate: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">
                Deal ID <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input type="text" value={draft.dealId}
                onChange={(e) => setDraft((d) => ({ ...d, dealId: e.target.value }))}
                placeholder="e.g. deal-001"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[13px] font-medium">Description</label>
              <input type="text" value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="e.g. Q2 2026 performance bonus — Felicia Canovas"
                className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* ── Posting lines ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                Posting Lines
                {detectedCurrency && (
                  <span className="ml-2 normal-case font-normal text-foreground">
                    — currency locked to <strong>{detectedCurrency}</strong>
                  </span>
                )}
              </p>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-[12px]" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground w-[190px]">GL Ledger</th>
                    <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground w-[190px]">Subledger</th>
                    <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground w-[100px]">Side</th>
                    <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground w-[120px]">Amount</th>
                    <th className="text-left px-3 py-2 text-[12px] font-medium text-muted-foreground w-[130px]">Invoice ID</th>
                    <th className="w-[36px]" />
                  </tr>
                </thead>
                <tbody>
                  {draft.lines.map((line) => {
                    const subledgerOptions = getSubledgersForGLId(line.glLedgerId);
                    return (
                    <tr key={line._id} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5">
                        <select
                          value={line.glLedgerId}
                          onChange={(e) => updateLine(line._id, { glLedgerId: e.target.value, subledgerId: "" })}
                          className="w-full border border-border rounded px-2 py-1.5 text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">— select GL —</option>
                          {glLedgerGroups.map((g) => (
                            <optgroup key={g.currency} label={`── ${g.currency} ──`}>
                              {g.ledgers.map((l) => (
                                <option key={l.id} value={l.id}>{l.id}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        {subledgerOptions.length > 0 ? (
                          <select
                            value={line.subledgerId}
                            onChange={(e) => updateLine(line._id, { subledgerId: e.target.value })}
                            className="w-full border border-border rounded px-2 py-1.5 text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="">— none —</option>
                            {subledgerOptions.map((l) => (
                              <option key={l.id} value={l.id}>{l.id}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/40 px-2 py-1.5 block">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={line.side}
                          onChange={(e) => updateLine(line._id, { side: e.target.value as "DEBIT" | "CREDIT" })}
                          className="w-full border border-border rounded px-2 py-1.5 text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="CREDIT">CREDIT</option>
                          <option value="DEBIT">DEBIT</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.amount}
                          onChange={(e) => updateLine(line._id, { amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full border border-border rounded px-2 py-1.5 text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={line.invoiceId}
                          onChange={(e) => updateLine(line._id, { invoiceId: e.target.value })}
                          placeholder="optional"
                          className="w-full border border-border rounded px-2 py-1.5 text-[12px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          disabled={draft.lines.length <= 2}
                          onClick={() => removeLine(line._id)}
                          className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Balance bar */}
            <div className={cn(
              "flex items-center gap-5 mt-3 px-4 py-2.5 rounded-lg text-[13px]",
              isBalanced ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200",
            )}>
              {detectedCurrency && (
                <span className="font-semibold text-muted-foreground">{detectedCurrency}</span>
              )}
              <span>
                Debit: <strong className="tabular-nums">
                  {detectedCurrency ? fmt(totalDebits, detectedCurrency) : totalDebits.toFixed(2)}
                </strong>
              </span>
              <span>
                Credit: <strong className="tabular-nums">
                  {detectedCurrency ? fmt(totalCredits, detectedCurrency) : totalCredits.toFixed(2)}
                </strong>
              </span>
              <span className={cn("ml-auto font-semibold", isBalanced ? "text-emerald-700" : "text-amber-700")}>
                {isBalanced ? "✓ Balanced" : "⚠ Not balanced"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => { setCreatePostingOpen(false); setDraft(emptyDraft()); }}>
              Cancel
            </Button>
            <Button disabled={!canCreate} onClick={handleCreatePosting}>
              Create Posting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RateField({ label, sublabel, value, editing, onChange }: {
  label: string; sublabel: string; value: number; editing: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center border border-transparent gap-4 p-0 text-sm">
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 text-sm font-medium leading-snug">{label}</div>
        {editing ? (
          <div className="flex items-center gap-1.5 px-3 py-[3px]">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-[72px] border border-border rounded px-2 py-1 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-muted-foreground text-[13px]">%</span>
          </div>
        ) : (
          <p className="px-3 py-[6.5px] text-muted-foreground text-sm">
            {value}% <span className="text-[11px]">— {sublabel}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function PnLCard({ label, sublabel, amount, highlight, positive, muted }: {
  label: string; sublabel: string; amount: number;
  highlight?: boolean; positive?: boolean; muted?: boolean;
}) {
  return (
    <div className={cn("rounded-lg p-4 border border-border",
      highlight ? "bg-emerald-50 border-emerald-200" : "bg-muted/40")}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-[20px] font-bold",
        highlight ? "text-emerald-700" : positive ? "text-foreground" : muted ? "text-muted-foreground" : "text-foreground")}>
        {fmt(amount)}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
    </div>
  );
}
