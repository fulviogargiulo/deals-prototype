import { useState } from "react";
import { Plus, X } from "lucide-react";
import { sharedLedgers } from "@huspy/shared-domain";
import type { Posting, PostingLine, BusinessUnit } from "@huspy/shared-domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  businessUnit: BusinessUnit | "";
  externalRef: string;
  trancheId: string;
  valueDate: string;
  description: string;
  lines: DraftLine[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function newLine(side: "DEBIT" | "CREDIT" = "CREDIT", glLedgerId = "", subledgerId = ""): DraftLine {
  return { _id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, glLedgerId, subledgerId, side, amount: "", invoiceId: "" };
}

function emptyDraft(defaultSubledgerName = ""): PostingDraft {
  const sub = defaultSubledgerName ? sharedLedgers.find((l) => l.name === defaultSubledgerName) : null;
  const defaultGLId = sub?.glId != null ? String(sub.glId) : "";
  const defaultSubId = sub ? String(sub.id) : "";
  return {
    businessProcess: "manual_adjustment",
    businessUnit: "" as BusinessUnit | "",
    externalRef: "",
    trancheId: "",
    valueDate: new Date().toISOString().slice(0, 10),
    description: "",
    lines: [newLine("CREDIT", defaultGLId, defaultSubId), newLine("DEBIT")],
  };
}

const BUSINESS_PROCESSES = [
  { value: "invoice_issued",                   label: "invoice_issued" },
  { value: "commission_accrual",              label: "commission_accrual" },
  { value: "external_cost_accrual",           label: "external_cost_accrual" },
  { value: "bank_statement_inbound_matched",  label: "bank_statement_inbound_matched" },
  { value: "bank_statement_outbound_matched", label: "bank_statement_outbound_matched" },
  { value: "payout_instructed",               label: "payout_instructed" },
  { value: "agent_adjustment",                label: "agent_adjustment" },
  { value: "huspy_fee",                       label: "huspy_fee" },
  { value: "manual_adjustment",               label: "manual_adjustment" },
  { value: "reversal",                        label: "reversal" },
];

const CURRENCIES = ["EUR", "AED", "SAR"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (posting: Posting, lines: PostingLine[]) => void;
  defaultSubledgerName?: string;
}

export function CreatePostingDialog({ open, onOpenChange, onCreated, defaultSubledgerName }: Props) {
  const [draft, setDraft] = useState<PostingDraft>(() => emptyDraft(defaultSubledgerName));

  function reset() {
    setDraft(emptyDraft(defaultSubledgerName));
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function updateLine(id: string, updates: Partial<DraftLine>) {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => l._id === id ? { ...l, ...updates } : l) }));
  }
  function addLine() {
    setDraft((d) => ({ ...d, lines: [...d.lines, newLine("DEBIT")] }));
  }
  function removeLine(id: string) {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l._id !== id) }));
  }

  const detectedCurrency = (() => {
    for (const line of draft.lines) {
      const effectiveName = line.subledgerId || line.glLedgerId;
      const ledger = sharedLedgers.find((l) => String(l.id) === effectiveName);
      if (ledger?.currency) return ledger.currency;
    }
    return null;
  })();

  const availableGLLedgers = sharedLedgers.filter(
    (l) => !l.glId && l.currency && (!detectedCurrency || l.currency === detectedCurrency),
  );
  const glLedgerGroups = CURRENCIES
    .map((c) => ({ currency: c, ledgers: availableGLLedgers.filter((l) => l.currency === c) }))
    .filter((g) => g.ledgers.length > 0);

  function getSubledgersForGLId(glLedgerId: string) {
    return sharedLedgers.filter((l) => l.glId != null && String(l.glId) === glLedgerId);
  }

  const validLines = draft.lines.filter((l) => (l.subledgerId || l.glLedgerId) && parseFloat(l.amount || "0") > 0);
  const totalDebits  = validLines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalCredits = validLines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + parseFloat(l.amount), 0);
  const isBalanced   = validLines.length >= 2 && Math.abs(totalDebits - totalCredits) < 0.001;
  const canCreate    = !!draft.description.trim() && isBalanced;

  function handleCreate() {
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
    const posting: Posting = {
      id: postingId,
      trancheId: draft.trancheId || undefined,
      businessUnit: draft.businessUnit || null,
      businessProcess: draft.businessProcess as any,
      externalRef: draft.externalRef || undefined,
      createdBy: "user-ops",
      createdAt: now,
      valueDate: draft.valueDate,
      currency: currency as any,
      description: draft.description,
    };
    const lines: PostingLine[] = draft.lines.map((line, idx) => ({
      id: `${postingId}-L${idx + 1}`,
      postingId,
      ledgerId: parseInt(line.subledgerId || line.glLedgerId),
      side: line.side,
      amount: parseFloat(line.amount),
      invoiceId: line.invoiceId || undefined,
    }));
    onCreated(posting, lines);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Posting</DialogTitle>
          {defaultSubledgerName && (
            <DialogDescription>{defaultSubledgerName}</DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">Business process</label>
            <select
              value={draft.businessProcess}
              onChange={(e) => setDraft((d) => ({ ...d, businessProcess: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {BUSINESS_PROCESSES.map((bp) => (
                <option key={bp.value} value={bp.value}>{bp.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">
              Business unit <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <select
              value={draft.businessUnit}
              onChange={(e) => setDraft((d) => ({ ...d, businessUnit: e.target.value as BusinessUnit | "" }))}
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— any —</option>
              <option value="rebu">rebu</option>
              <option value="mortgage">mortgage</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">
              Ext. reference <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={draft.externalRef}
              onChange={(e) => setDraft((d) => ({ ...d, externalRef: e.target.value }))}
              placeholder="e.g. AGINV-042"
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">Value date</label>
            <input
              type="date"
              value={draft.valueDate}
              onChange={(e) => setDraft((d) => ({ ...d, valueDate: e.target.value }))}
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">
              Deal ID <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={draft.trancheId}
              onChange={(e) => setDraft((d) => ({ ...d, trancheId: e.target.value }))}
              placeholder="e.g. deal-001"
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[13px] font-medium">Description</label>
            <input
              type="text"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="e.g. Q2 2026 performance bonus — Felicia Canovas"
              className="w-full border border-border rounded-md px-3 py-2 text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

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
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button disabled={!canCreate} onClick={handleCreate}>Create Posting</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
