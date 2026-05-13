import { useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Check, Archive, Pencil, Copy, Plus, X, Download } from "lucide-react";
import {
  sharedAgents,
  sharedParties,
  sharedPostingLines,
  sharedPostings,
  sharedLedgers,
  sharedAgentFinancials,
  sharedAgentDocuments,
  COMMISSION_RATES,
} from "@huspy/shared-domain";
import type {
  AgentDocument,
  AgentFinancials as SharedAgentFinancials,
  AgentStrategy,
  DocumentRequirementStatus,
  Posting,
  PostingLine,
} from "@huspy/shared-domain";
import { getDeals } from "@/data/dealStore";
import { DealStatusBadge } from "@/components/DealBadges";
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

function getLedgerDisplay(ledgerId: number): { gl: string; sub: string | null } {
  const ledger = sharedLedgers.find((l) => l.id === ledgerId);
  if (!ledger) return { gl: String(ledgerId), sub: null };
  if (ledger.glId) {
    const gl = sharedLedgers.find((l) => l.id === ledger.glId);
    return { gl: gl?.name ?? String(ledger.glId), sub: ledger.name };
  }
  return { gl: ledger.name, sub: null };
}

// ─── Financials per-agent state (canonical shared fixture) ───────────────────
// Replaces the previous in-memory `agentFinancialsStore`; reads/writes the
// shared-domain fixture array so edits persist across navigation within the
// session. Edit semantics remain in-memory only (no backend).

function findOrSeedAgentFinancials(agentId: string): SharedAgentFinancials {
  const existing = sharedAgentFinancials.find((af) => af.agentId === agentId);
  if (existing) return existing;
  // Seed an entry with the global defaults so the editor always has a record.
  const seeded: SharedAgentFinancials = {
    id: `af-${agentId}`,
    agentId,
    strategy: { kind: "flat", pct: COMMISSION_RATES.agentGrossRate },
    teamLeadRate: COMMISSION_RATES.teamLeadRate,
    managerRate: COMMISSION_RATES.managerOverrideRate,
  };
  sharedAgentFinancials.push(seeded);
  return seeded;
}

function persistAgentFinancials(next: SharedAgentFinancials) {
  const idx = sharedAgentFinancials.findIndex((af) => af.agentId === next.agentId);
  if (idx >= 0) sharedAgentFinancials[idx] = next;
  else sharedAgentFinancials.push(next);
}

function describeStrategy(s: AgentStrategy): string {
  switch (s.kind) {
    case "flat": return `Flat — ${s.pct}% of net`;
    case "max":  return `Max — ${s.pct}% of net, capped at ${s.capAmount.toLocaleString()}`;
    case "slab": return `Slab — ${s.slabs.length} tier${s.slabs.length === 1 ? "" : "s"}`;
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "documents",     label: "Documents" },
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

function emptyDraft(defaultSubledgerName = ""): PostingDraft {
  const sub = defaultSubledgerName ? sharedLedgers.find((l) => l.name === defaultSubledgerName) : null;
  const defaultGLId = sub?.glId != null ? String(sub.glId) : "";
  return {
    businessProcess: "manual_adjustment",
    externalRef: "",
    dealId: "",
    valueDate: new Date().toISOString().slice(0, 10),
    description: "",
    lines: [newLine("CREDIT", defaultGLId, defaultSubledgerName), newLine("DEBIT")],
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

  // Documents local state — seeded from shared fixture, mutated in-memory
  const [agentDocs, setAgentDocs] = useState<AgentDocument[]>(
    () => sharedAgentDocuments.filter((d) => d.agentId === agentId)
  );
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const uploadedFilesRef = useRef<Record<string, File>>({});
  const [textEditing, setTextEditing] = useState<Record<string, string>>({});

  function triggerUpload(docId: string) {
    uploadTargetRef.current = docId;
    uploadInputRef.current?.click();
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetRef.current) return;
    const docId = uploadTargetRef.current;
    uploadedFilesRef.current[docId] = file;
    setAgentDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: "uploaded", documentId: file.name } : d
      )
    );
    uploadTargetRef.current = null;
    e.target.value = "";
  }

  function handleDownload(doc: AgentDocument) {
    const file = uploadedFilesRef.current[doc.id];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveTextValue(docId: string) {
    const value = textEditing[docId]?.trim();
    if (!value) return;
    setAgentDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, value, status: "uploaded" } : d
      )
    );
    setTextEditing((prev) => { const n = { ...prev }; delete n[docId]; return n; });
  }

  function updateDocStatus(docId: string, status: DocumentRequirementStatus) {
    setAgentDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, status, reviewedBy: status === "approved" || status === "waived" ? "user-ops" : undefined, reviewedAt: status === "approved" || status === "waived" ? new Date().toISOString().slice(0, 10) : undefined }
          : d
      )
    );
  }

  // Financials local state — sourced from the shared fixture
  const [fin, setFin] = useState<SharedAgentFinancials>(() => findOrSeedAgentFinancials(agentId ?? ""));
  const [finEditing, setFinEditing] = useState(false);
  const [finDraft, setFinDraft] = useState<SharedAgentFinancials>(fin);

  const saveFinancials = () => {
    persistAgentFinancials(finDraft);
    setFin(finDraft);
    setFinEditing(false);
  };
  const cancelFinancials = () => {
    setFinDraft(fin);
    setFinEditing(false);
  };

  // Ledger local state
  const [manualPostings, setManualPostings] = useState<Posting[]>([]);
  const [manualPostingLines, setManualPostingLines] = useState<PostingLine[]>([]);
  const [postingOverrides, setPostingOverrides] = useState<Record<string, Partial<Posting>>>({});
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
  const subledgerName = `AgentLiability_${agent.id}`;
  const subledgerNumId = sharedLedgers.find((l) => l.name === subledgerName)?.id;
  const allPostings = [...sharedPostings, ...manualPostings].map((p) =>
    postingOverrides[p.id] ? { ...p, ...postingOverrides[p.id] } : p
  );
  const allPostingLines = [...sharedPostingLines, ...manualPostingLines];

  const ledgerLines = allPostingLines
    .filter((l) => l.ledgerId === subledgerNumId)
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
      const effectiveName = line.subledgerId || line.glLedgerId;
      const ledger = sharedLedgers.find((l) => String(l.id) === effectiveName);
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
    return sharedLedgers.filter((l) => l.glId != null && String(l.glId) === glLedgerId);
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
        const effectiveName = l.subledgerId || l.glLedgerId;
        const led = sharedLedgers.find((x) => String(x.id) === effectiveName);
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
      ledgerId: parseInt(line.subledgerId || line.glLedgerId),
      side: line.side,
      amount: parseFloat(line.amount),
      invoiceId: line.invoiceId || undefined,
    }));
    setManualPostings((prev) => [...prev, newPosting]);
    setManualPostingLines((prev) => [...prev, ...newLines]);
    setCreatePostingOpen(false);
    setDraft(emptyDraft());
  }

  function handleReversePosting(posting: Posting, lines: PostingLine[]) {
    const reversalId = `reversal-${posting.id}-${Date.now()}`;
    const now = new Date().toISOString();
    const reversalPosting: Posting = {
      id: reversalId,
      dealId: posting.dealId,
      businessUnit: posting.businessUnit,
      externalRef: posting.externalRef,
      businessProcess: posting.businessProcess,
      createdBy: "user-ops",
      createdAt: now,
      valueDate: now.slice(0, 10),
      currency: posting.currency,
      description: `Reversal of ${posting.id}`,
    };
    const reversalLines: PostingLine[] = lines.map((l, idx) => ({
      id: `${reversalId}-L${idx + 1}`,
      postingId: reversalId,
      ledgerId: l.ledgerId,
      side: l.side === "DEBIT" ? "CREDIT" : "DEBIT",
      amount: l.amount,
    }));
    setPostingOverrides((prev) => ({ ...prev, [posting.id]: { reversedByPostingId: reversalId } }));
    setManualPostings((prev) => [...prev, reversalPosting]);
    setManualPostingLines((prev) => [...prev, ...reversalLines]);
    setSelectedPostingId(reversalId);
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

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <>
            <input ref={uploadInputRef} type="file" className="hidden" onChange={handleFileChosen} />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-foreground">
                Compliance Documents
                {agentDocs.some((d) => d.status === "pending" || d.status === "uploaded") && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5">
                    {agentDocs.filter((d) => d.status === "pending" || d.status === "uploaded").length} pending
                  </span>
                )}
              </h2>
            </div>
            <div className="bg-card rounded-xl overflow-hidden border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className={thClass}>Document</th>
                    <th className={thClass}>Value / File</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Reviewed by</th>
                    <th className={thClass}>Reviewed at</th>
                    <th className={thClass}>Expires</th>
                    <th className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agentDocs.map((doc) => {
                    const isEditingText = doc.kind === "text" && doc.id in textEditing;
                    return (
                      <tr key={doc.id} className="border-b border-border last:border-0">
                        <td className={tdClass}>
                          {doc.label}
                          {!doc.required && <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">(optional)</span>}
                          <span className={cn("ml-1.5 text-[10px] font-semibold uppercase tracking-wide", doc.kind === "text" ? "text-violet-500" : "text-sky-500")}>
                            {doc.kind}
                          </span>
                        </td>

                        {/* Value / File column */}
                        <td className="px-4 py-2.5 min-w-[200px]">
                          {doc.kind === "text" ? (
                            isEditingText ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  autoFocus
                                  type="text"
                                  value={textEditing[doc.id]}
                                  onChange={(e) => setTextEditing((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveTextValue(doc.id); if (e.key === "Escape") setTextEditing((prev) => { const n = { ...prev }; delete n[doc.id]; return n; }); }}
                                  placeholder="Enter value…"
                                  className="w-full border border-border rounded px-2 py-1 text-[12px] bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <Button size="sm" variant="outline" className="h-7 text-[12px] shrink-0" onClick={() => saveTextValue(doc.id)}>Save</Button>
                              </div>
                            ) : (
                              <span
                                className={cn("text-[12px] font-mono cursor-pointer hover:opacity-70", doc.value ? "text-foreground" : "text-muted-foreground/50 italic")}
                                onClick={() => setTextEditing((prev) => ({ ...prev, [doc.id]: doc.value ?? "" }))}
                                title={doc.value ? "Click to edit" : undefined}
                              >
                                {doc.value ?? "—"}
                              </span>
                            )
                          ) : (
                            <span className={cn("text-[12px] font-mono truncate max-w-[180px] block", doc.documentId ? "text-muted-foreground" : "text-muted-foreground/40 italic")} title={doc.documentId}>
                              {doc.documentId ?? "—"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            doc.status === "approved" && "bg-emerald-100 text-emerald-700",
                            doc.status === "uploaded"  && "bg-blue-100 text-blue-700",
                            doc.status === "pending"   && "bg-muted text-muted-foreground",
                            doc.status === "waived"    && "bg-amber-100 text-amber-700",
                          )}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </td>
                        <td className={`${tdClass} text-muted-foreground`}>{doc.reviewedBy ?? "—"}</td>
                        <td className={`${tdClass} text-muted-foreground`}>{doc.reviewedAt ? fmtDate(doc.reviewedAt) : "—"}</td>
                        <td className={cn(tdClass, doc.expiresAt && new Date(doc.expiresAt) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? "text-amber-600 font-semibold" : "text-muted-foreground")}>
                          {doc.expiresAt ? fmtDate(doc.expiresAt) : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {doc.kind === "text" ? (
                              <>
                                {doc.status === "pending" && !isEditingText && (
                                  <Button size="sm" variant="outline" className="h-7 text-[12px]"
                                    onClick={() => setTextEditing((prev) => ({ ...prev, [doc.id]: "" }))}>
                                    Enter value
                                  </Button>
                                )}
                                {doc.status === "uploaded" && (
                                  <Button size="sm" variant="outline" className="h-7 text-[12px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                    onClick={() => updateDocStatus(doc.id, "approved")}>
                                    Approve
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                {doc.status === "pending" && (
                                  <Button size="sm" variant="outline" className="h-7 text-[12px]"
                                    onClick={() => triggerUpload(doc.id)}>
                                    Upload
                                  </Button>
                                )}
                                {doc.status === "uploaded" && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7 text-[12px]"
                                      onClick={() => handleDownload(doc)}>
                                      <Download className="h-3 w-3 mr-1" />Download
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-[12px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                      onClick={() => updateDocStatus(doc.id, "approved")}>
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-[12px]"
                                      onClick={() => triggerUpload(doc.id)}>
                                      Replace
                                    </Button>
                                  </>
                                )}
                                {doc.status === "approved" && (
                                  <Button size="sm" variant="outline" className="h-7 text-[12px]"
                                    onClick={() => handleDownload(doc)}>
                                    <Download className="h-3 w-3 mr-1" />Download
                                  </Button>
                                )}
                              </>
                            )}
                            {(doc.status === "pending" || doc.status === "uploaded") && (
                              <Button size="sm" variant="outline" className="h-7 text-[12px] text-amber-700 border-amber-300 hover:bg-amber-50"
                                onClick={() => updateDocStatus(doc.id, "waived")}>
                                Waive
                              </Button>
                            )}
                            {(doc.status === "approved" || doc.status === "waived") && (
                              <Button size="sm" variant="ghost" className="h-7 text-[12px] text-muted-foreground"
                                onClick={() => updateDocStatus(doc.id, "pending")}>
                                Reset
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {agentDocs.length === 0 && (
                <div className="px-4 py-10 text-center text-muted-foreground text-[14px]">No documents on file for this agent</div>
              )}
            </div>
          </>
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
              <h2 className="text-[15px] font-semibold text-foreground">{subledgerName}</h2>
              <Button className="gap-1.5" onClick={() => { setDraft(emptyDraft(subledgerName)); setCreatePostingOpen(true); }}>
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
                <CardDescription className="text-xs">
                  Agent take rate and commission strategy. Strategy is applied by the waterfall engine to the agent's allocated net revenue.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <StrategyEditor
                  strategy={finEditing ? finDraft.strategy : fin.strategy}
                  editing={finEditing}
                  onChange={(s) => setFinDraft((d) => ({ ...d, strategy: s }))}
                />

                {finEditing && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveFinancials}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelFinancials}>Cancel</Button>
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
                      value={finEditing ? (finDraft.teamLeadRate ?? 0) : (fin.teamLeadRate ?? 0)}
                      editing={finEditing}
                      onChange={(v) => setFinDraft((d) => ({ ...d, teamLeadRate: v }))} />
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Manager</p>
                  <div className="grid grid-cols-2 gap-4">
                    <NonEditableField label="Name" value={agent.managerName ?? "—"} />
                    <RateField label="Rate" sublabel="% of agent payout"
                      value={finEditing ? (finDraft.managerRate ?? 0) : (fin.managerRate ?? 0)}
                      editing={finEditing}
                      onChange={(v) => setFinDraft((d) => ({ ...d, managerRate: v }))} />
                  </div>
                </div>
                {finEditing && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveFinancials}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelFinancials}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-mono text-[14px]">{selectedPosting?.id}</DialogTitle>
                <DialogDescription>
                  {selectedPosting?.businessProcess} · {selectedPosting?.valueDate} · {selectedPosting?.currency}
                </DialogDescription>
              </div>
              {selectedPosting && !selectedPosting.reversedByPostingId && (
                <button
                  onClick={() => handleReversePosting(selectedPosting, selectedPostingAllLines)}
                  className="shrink-0 text-[12px] font-medium text-destructive hover:opacity-80 px-2.5 py-1 rounded border border-destructive/40 hover:bg-destructive/5 transition-colors mr-8"
                >
                  Reverse posting
                </button>
              )}
            </div>
          </DialogHeader>
          {selectedPosting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                <div>
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Reversed by</p>
                  <p className="font-medium font-mono">{selectedPosting.reversedByPostingId ?? "—"}</p>
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
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Business Unit</p>
                  <p className="font-medium">
                    {selectedPosting.businessUnit === "rebu"
                      ? "REBU"
                      : selectedPosting.businessUnit === "mortgage"
                        ? "MBU (Mortgage)"
                        : "—"}
                  </p>
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
            <DialogDescription>{subledgerName}</DialogDescription>
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
                                <option key={l.id} value={String(l.id)}>{l.name}</option>
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
                              <option key={l.id} value={String(l.id)}>{l.name}</option>
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

function StrategyEditor({
  strategy,
  editing,
  onChange,
}: {
  strategy: AgentStrategy;
  editing: boolean;
  onChange: (s: AgentStrategy) => void;
}) {
  if (!editing) {
    return (
      <div className="flex flex-wrap items-center border border-transparent gap-4 p-0 text-sm">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3.5 text-sm font-medium leading-snug">Commission Strategy</div>
          <p className="px-3 py-[6.5px] text-muted-foreground text-sm">{describeStrategy(strategy)}</p>
          {strategy.kind === "slab" && (
            <div className="px-3 pb-1 space-y-0.5">
              {strategy.slabs.map((s, i) => (
                <p key={i} className="text-[11px] text-muted-foreground font-mono">
                  up to {s.upTo == null ? "∞" : s.upTo.toLocaleString()} → {s.pct}%
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium leading-snug">Commission Strategy</div>
      <div className="flex gap-3 px-3">
        {(["flat", "slab", "max"] as const).map((kind) => (
          <label key={kind} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
            <input
              type="radio"
              name="strategy-kind"
              checked={strategy.kind === kind}
              onChange={() => {
                if (kind === "flat") onChange({ kind: "flat", pct: 40 });
                if (kind === "slab") onChange({ kind: "slab", slabs: [{ upTo: 5000, pct: 35 }, { upTo: null, pct: 45 }] });
                if (kind === "max") onChange({ kind: "max", pct: 50, capAmount: 25000 });
              }}
            />
            <span className="capitalize">{kind}</span>
          </label>
        ))}
      </div>

      {strategy.kind === "flat" && (
        <div className="px-3 flex items-center gap-2">
          <input
            type="number" min={0} max={100} step={0.5}
            value={strategy.pct}
            onChange={(e) => onChange({ kind: "flat", pct: Number(e.target.value) })}
            className="w-[80px] border border-border rounded px-2 py-1 text-[13px] bg-background"
          />
          <span className="text-[13px] text-muted-foreground">% of agent's allocated net</span>
        </div>
      )}

      {strategy.kind === "max" && (
        <div className="px-3 grid grid-cols-2 gap-3 max-w-[320px]">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Percent</p>
            <input
              type="number" min={0} max={100} step={0.5}
              value={strategy.pct}
              onChange={(e) => onChange({ kind: "max", pct: Number(e.target.value), capAmount: strategy.capAmount })}
              className="w-full border border-border rounded px-2 py-1 text-[13px] bg-background"
            />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Cap Amount</p>
            <input
              type="number" min={0} step={500}
              value={strategy.capAmount}
              onChange={(e) => onChange({ kind: "max", pct: strategy.pct, capAmount: Number(e.target.value) })}
              className="w-full border border-border rounded px-2 py-1 text-[13px] bg-background"
            />
          </div>
        </div>
      )}

      {strategy.kind === "slab" && (
        <div className="px-3 space-y-2">
          {strategy.slabs.map((slab, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground w-12">up to</span>
              <input
                type="number" min={0} step={500}
                placeholder="∞"
                value={slab.upTo ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  const next = [...strategy.slabs];
                  next[i] = { ...next[i], upTo: v };
                  onChange({ kind: "slab", slabs: next });
                }}
                className="w-[110px] border border-border rounded px-2 py-1 text-[13px] bg-background"
              />
              <span className="text-[12px] text-muted-foreground">→</span>
              <input
                type="number" min={0} max={100} step={0.5}
                value={slab.pct}
                onChange={(e) => {
                  const next = [...strategy.slabs];
                  next[i] = { ...next[i], pct: Number(e.target.value) };
                  onChange({ kind: "slab", slabs: next });
                }}
                className="w-[80px] border border-border rounded px-2 py-1 text-[13px] bg-background"
              />
              <span className="text-[12px] text-muted-foreground">%</span>
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => {
                  const next = strategy.slabs.filter((_, idx) => idx !== i);
                  onChange({ kind: "slab", slabs: next.length > 0 ? next : [{ upTo: null, pct: 40 }] });
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            size="sm" variant="outline"
            onClick={() => onChange({ kind: "slab", slabs: [...strategy.slabs, { upTo: null, pct: 50 }] })}
            className="gap-1.5"
          >
            <Plus className="h-3 w-3" /> Add tier
          </Button>
        </div>
      )}
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
