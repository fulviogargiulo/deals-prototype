import { useState } from "react";
import { ChevronRight, ArrowLeft, Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sharedLedgers, sharedPostings, sharedPostingLines } from "@huspy/shared-domain";
import type { Ledger, Posting, PostingLine } from "@huspy/shared-domain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreatePostingDialog } from "@/components/CreatePostingDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTimestamp(s: string) {
  return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

const TYPE_LABEL: Record<string, string> = {
  asset: "Asset",
  liability: "Liability",
  revenue: "Revenue",
  expense: "Expense",
};

const TYPE_ORDER: Record<string, number> = { asset: 0, liability: 1, revenue: 2, expense: 3 };

function getLedgerDisplay(ledgerId: number): { gl: string; sub: string | null } {
  const ledger = sharedLedgers.find((l) => l.id === ledgerId);
  if (!ledger) return { gl: String(ledgerId), sub: null };
  if (ledger.glId) {
    const gl = sharedLedgers.find((l) => l.id === ledger.glId);
    return { gl: gl?.name ?? String(ledger.glId), sub: ledger.name };
  }
  return { gl: ledger.name, sub: null };
}

function computeBalance(ledgerId: number, allLines: PostingLine[], includeSubledgers = false) {
  const ids = new Set([ledgerId]);
  if (includeSubledgers) {
    sharedLedgers.filter((l) => l.glId === ledgerId).forEach((l) => ids.add(l.id));
  }
  const lines = allLines.filter((l) => ids.has(l.ledgerId));
  const credits = lines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0);
  const debits = lines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0);
  return credits - debits;
}

const thClass = "text-left px-4 py-2.5 text-[12px] font-medium text-muted-foreground uppercase tracking-wide";
const tdClass = "px-4 py-3 text-[13px] text-foreground";

const CURRENCIES = ["EUR", "AED", "SAR"] as const;
type Currency = (typeof CURRENCIES)[number];

// ─── Drilldown state ──────────────────────────────────────────────────────────

type DrilldownState =
  | { level: "gl" }
  | { level: "subledger"; glLedger: Ledger }
  | { level: "lines"; ledger: Ledger; glLedger: Ledger | null };

// ─── Main component ───────────────────────────────────────────────────────────

export function LedgerView() {
  const navigate = useNavigate();
  const [drilldown, setDrilldown] = useState<DrilldownState>({ level: "gl" });
  const [currencyFilter, setCurrencyFilter] = useState<Currency | null>(null);
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);

  const [manualPostings, setManualPostings] = useState<Posting[]>([]);
  const [manualPostingLines, setManualPostingLines] = useState<PostingLine[]>([]);
  const [postingOverrides, setPostingOverrides] = useState<Record<string, Partial<Posting>>>({});

  const [createPostingOpen, setCreatePostingOpen] = useState(false);

  const allPostings: Posting[] = [...sharedPostings, ...manualPostings].map((p) =>
    postingOverrides[p.id] ? { ...p, ...postingOverrides[p.id] } : p,
  );
  const allLines: PostingLine[] = [...sharedPostingLines, ...manualPostingLines];

  const selectedPosting = selectedPostingId ? allPostings.find((p) => p.id === selectedPostingId) ?? null : null;
  const selectedPostingAllLines = selectedPosting ? allLines.filter((l) => l.postingId === selectedPosting.id) : [];

  function handleReversePosting(posting: Posting, lines: PostingLine[]) {
    const reversalId = `reversal-${posting.id}-${Date.now()}`;
    const now = new Date().toISOString();
    const reversalPosting: Posting = {
      id: reversalId,
      dealId: posting.dealId,
      businessUnit: posting.businessUnit,
      externalRef: posting.externalRef,
      businessProcess: "reversal",
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
    setPostingOverrides((prev) => ({ ...prev, [posting.id]: { ...prev[posting.id], reversedByPostingId: reversalId } }));
    setManualPostings((prev) => [...prev, reversalPosting]);
    setManualPostingLines((prev) => [...prev, ...reversalLines]);
    setSelectedPostingId(reversalId);
  }

  const glLedgers = sharedLedgers
    .filter((l) => !l.glId && (!currencyFilter || l.currency === currencyFilter))
    .sort((a, b) => {
      const ta = TYPE_ORDER[a.type] ?? 99;
      const tb = TYPE_ORDER[b.type] ?? 99;
      return ta !== tb ? ta - tb : a.id - b.id;
    });

  const currencySelect = (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-muted-foreground font-medium">Currency</span>
      <Select
        value={currencyFilter ?? "all"}
        onValueChange={(v) => setCurrencyFilter(v === "all" ? null : v as Currency)}
      >
        <SelectTrigger className="w-[150px] h-8 text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All currencies</SelectItem>
          <SelectItem value="EUR">EUR</SelectItem>
          <SelectItem value="AED">AED</SelectItem>
          <SelectItem value="SAR">SAR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // ── GL ledger list ──────────────────────────────────────────────────────────
  const glContent = (
    <div>
      <div className="flex items-center justify-between mb-4">
        {currencySelect}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-[13px] font-medium text-foreground bg-card hover:bg-muted transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </button>
          <button
            onClick={() => setCreatePostingOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create Posting
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>Type</th>
              <th className={thClass}>Ledger</th>
              <th className={thClass}>Description</th>
              <th className={thClass}>Currency</th>
              <th className={`${thClass} text-right`}>Balance</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {glLedgers.map((ledger) => {
              const hasSubledgers = sharedLedgers.some((l) => l.glId === ledger.id);
              const net = computeBalance(ledger.id, allLines, true);
              const currency = ledger.currency ?? "EUR";
              return (
                <tr
                  key={ledger.id}
                  onClick={() => {
                    if (hasSubledgers) {
                      setDrilldown({ level: "subledger", glLedger: ledger });
                    } else {
                      setDrilldown({ level: "lines", ledger, glLedger: null });
                    }
                  }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className={tdClass}>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {TYPE_LABEL[ledger.type] ?? ledger.type}
                    </span>
                  </td>
                  <td className={`${tdClass} font-mono text-[12px] font-semibold`}>{ledger.name}</td>
                  <td className={`${tdClass} text-muted-foreground`}>{ledger.description ?? "—"}</td>
                  <td className={tdClass}>
                    <span className="text-[12px] font-mono text-muted-foreground">{currency}</span>
                  </td>
                  <td
                    className={cn(
                      `${tdClass} text-right tabular-nums font-semibold`,
                      net > 0 ? "text-emerald-600" : net < 0 ? "text-red-500" : "text-muted-foreground/40",
                    )}
                  >
                    {net === 0 ? "—" : `${net > 0 ? "+" : "−"}${fmt(Math.abs(net), currency)}`}
                  </td>
                  <td className="px-4 py-3 w-8">
                    <ChevronRight className={cn("h-4 w-4 ml-auto", hasSubledgers ? "text-muted-foreground" : "text-muted-foreground/20")} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Subledger list ──────────────────────────────────────────────────────────
  const subledgerContent = drilldown.level === "subledger" ? (() => {
    const { glLedger } = drilldown;
    const subledgers = sharedLedgers.filter(
      (l) => l.glId === glLedger.id && (!currencyFilter || l.currency === currencyFilter),
    );
    const glNet = computeBalance(glLedger.id, allLines, true);
    const currency = glLedger.currency ?? "EUR";

    return (
      <div>
        <button
          onClick={() => setDrilldown({ level: "gl" })}
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          GL Ledgers
        </button>

        <div className="flex items-center justify-between mb-4">
          {currencySelect}
          <div className="flex items-center justify-end">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5 text-right">Balance</p>
              <p className={cn("text-[20px] font-bold tabular-nums", glNet >= 0 ? "text-emerald-600" : "text-red-500")}>
                {glNet >= 0 ? "+" : "−"}{fmt(Math.abs(glNet), currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-foreground font-mono">{glLedger.name}</h2>
          {glLedger.description && (
            <p className="text-[12px] text-muted-foreground mt-0.5">{glLedger.description}</p>
          )}
        </div>

        <div className="bg-card rounded-xl overflow-hidden border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className={thClass}>Subledger</th>
                <th className={thClass}>Description</th>
                <th className={`${thClass} text-right`}>Balance</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {subledgers.map((sub) => {
                const net = computeBalance(sub.id, allLines);
                const subCurrency = sub.currency ?? currency;
                return (
                  <tr
                    key={sub.id}
                    onClick={() => setDrilldown({ level: "lines", ledger: sub, glLedger })}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className={`${tdClass} font-mono text-[12px] font-semibold`}>{sub.name}</td>
                    <td className={`${tdClass} text-muted-foreground`}>{sub.description ?? "—"}</td>
                    <td
                      className={cn(
                        `${tdClass} text-right tabular-nums font-semibold`,
                        net > 0 ? "text-emerald-600" : net < 0 ? "text-red-500" : "text-muted-foreground/40",
                      )}
                    >
                      {net === 0 ? "—" : `${net > 0 ? "+" : "−"}${fmt(Math.abs(net), subCurrency)}`}
                    </td>
                    <td className="px-4 py-3 w-8">
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  })() : null;

  // ── Posting lines ───────────────────────────────────────────────────────────
  const linesContent = drilldown.level === "lines" ? (() => {
    const { ledger, glLedger } = drilldown;
    const currency = ledger.currency ?? "EUR";

    const lines = allLines
      .filter((l) => l.ledgerId === ledger.id)
      .map((l) => ({ ...l, posting: allPostings.find((p) => p.id === l.postingId) }))
      .sort((a, b) => (a.posting?.valueDate ?? "").localeCompare(b.posting?.valueDate ?? ""));

    const net = lines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0)
              - lines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0);

    return (
      <div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4">
          <button onClick={() => setDrilldown({ level: "gl" })} className="hover:text-foreground transition-colors">
            GL Ledgers
          </button>
          {glLedger && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                onClick={() => setDrilldown({ level: "subledger", glLedger })}
                className="hover:text-foreground transition-colors"
              >
                {glLedger.name}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground font-medium">{ledger.name}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground font-mono">{ledger.name}</h2>
            {ledger.description && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{ledger.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Balance</p>
            <p className={cn("text-[20px] font-bold tabular-nums", net >= 0 ? "text-emerald-600" : "text-red-500")}>
              {net >= 0 ? "+" : "−"}{fmt(Math.abs(net), currency)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl overflow-hidden border border-border">
          {lines.length === 0 ? (
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
                  {lines.map((line) => {
                    const postingCurrency = line.posting?.currency ?? currency;
                    return (
                      <tr
                        key={line.id}
                        onClick={() => setSelectedPostingId(line.postingId)}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className={tdClass}>
                          {line.posting?.createdAt ? fmtTimestamp(line.posting.createdAt) : "—"}
                        </td>
                        <td className={tdClass}>
                          {line.posting ? fmtDate(line.posting.valueDate) : "—"}
                        </td>
                        <td className={`${tdClass} max-w-[220px] truncate text-muted-foreground text-[13px]`}>
                          {line.posting?.description ?? "—"}
                        </td>
                        <td className={tdClass}>
                          {line.posting?.dealId ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/deals/${line.posting!.dealId}`); }}
                              className="text-primary underline underline-offset-2 hover:opacity-80 font-mono text-[12px]"
                            >
                              {line.posting.dealId}
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
                          {line.side === "DEBIT" ? fmt(line.amount, postingCurrency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-[14px] tabular-nums font-semibold">
                          {line.side === "CREDIT" ? fmt(line.amount, postingCurrency) : <span className="text-muted-foreground/30">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  })() : null;

  return (
    <>
      {drilldown.level === "gl" && glContent}
      {drilldown.level === "subledger" && subledgerContent}
      {drilldown.level === "lines" && linesContent}

      {/* ── Posting detail dialog ─────────────────────────────────────────── */}
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

      <CreatePostingDialog
        open={createPostingOpen}
        onOpenChange={setCreatePostingOpen}
        onCreated={(posting, lines) => {
          setManualPostings((prev) => [...prev, posting]);
          setManualPostingLines((prev) => [...prev, ...lines]);
          setSelectedPostingId(posting.id);
        }}
      />
    </>
  );
}
