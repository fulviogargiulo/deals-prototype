import { useNavigate } from "react-router-dom";
import { sharedLedgers, sharedPostingLines } from "@huspy/shared-domain";
import type { Posting, PostingLine } from "@huspy/shared-domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PROCESS_LABELS: Record<string, string> = {
  invoice_issued: "Invoice Issued",
  commission_accrual: "Commission",
  external_cost_accrual: "External Cost",
  bank_statement_inbound_matched: "Payment In",
  bank_statement_outbound_matched: "Payment Out",
  payout_instructed: "Payout",
  agent_adjustment: "Adjustment",
  huspy_fee: "Huspy Fee",
  manual_adjustment: "Adjustment",
  reversal: "Reversal",
};

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function getLedgerDisplay(ledgerId: number): { gl: string; sub: string | null } {
  const ledger = sharedLedgers.find((l) => l.id === ledgerId);
  if (!ledger) return { gl: String(ledgerId), sub: null };
  if (ledger.glId) {
    const gl = sharedLedgers.find((l) => l.id === ledger.glId);
    return { gl: gl?.name ?? String(ledger.glId), sub: ledger.name };
  }
  return { gl: ledger.name, sub: null };
}

interface PostingDetailDialogProps {
  postingId: string | null;
  allPostings: Posting[];
  allLines: PostingLine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReverse?: (posting: Posting, lines: PostingLine[]) => void;
}

export function PostingDetailDialog({
  postingId,
  allPostings,
  allLines,
  open,
  onOpenChange,
  onReverse,
}: PostingDetailDialogProps) {
  const navigate = useNavigate();

  const posting = postingId ? allPostings.find((p) => p.id === postingId) ?? null : null;
  const lines = posting ? allLines.filter((l) => l.postingId === posting.id) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-mono text-[14px]">{posting?.id}</DialogTitle>
              <DialogDescription>
                {posting?.businessProcess} · {posting?.valueDate} · {posting?.currency}
              </DialogDescription>
            </div>
            {posting && !posting.reversedByPostingId && onReverse && (
              <button
                onClick={() => onReverse(posting, lines)}
                className="shrink-0 text-[12px] font-medium text-destructive hover:opacity-80 px-2.5 py-1 rounded border border-destructive/40 hover:bg-destructive/5 transition-colors mr-8"
              >
                Reverse posting
              </button>
            )}
          </div>
        </DialogHeader>
        {posting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Business Process</p>
                <p className="font-medium">{posting.businessProcess}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Reversed by</p>
                <p className="font-medium font-mono">{posting.reversedByPostingId ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">External Ref</p>
                <p className="font-medium font-mono">{posting.externalRef ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Deal</p>
                {posting.trancheId ? (
                  <button
                    onClick={() => { onOpenChange(false); navigate(`/deals/${posting.trancheId}`); }}
                    className="font-medium font-mono text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {posting.trancheId}
                  </button>
                ) : <p className="font-medium">—</p>}
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Business Unit</p>
                <p className="font-medium">
                  {posting.businessUnit === "rebu" ? "REBU" : posting.businessUnit === "mortgage" ? "MBU (Mortgage)" : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Created by</p>
                <p className="font-medium">{posting.createdBy}</p>
              </div>
              {posting.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Description</p>
                  <p className="font-medium">{posting.description}</p>
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
                    {lines.map((l) => {
                      const { gl, sub } = getLedgerDisplay(l.ledgerId);
                      return (
                        <tr key={l.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-[12px] text-muted-foreground">{gl}</td>
                          <td className={cn("px-3 py-2 font-mono text-[12px]", sub ? "text-primary font-semibold" : "text-muted-foreground/40")}>
                            {sub ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-[12px]">
                            {posting.businessProcess}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">
                            {l.side === "DEBIT" ? fmt(l.amount, posting.currency) : <span className="text-muted-foreground/30">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">
                            {l.side === "CREDIT" ? fmt(l.amount, posting.currency) : <span className="text-muted-foreground/30">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={3} className="px-3 py-2 text-[12px] font-semibold">Totals</td>
                      <td className="px-3 py-2 text-right text-[12px] font-semibold tabular-nums">
                        {fmt(lines.filter((l) => l.side === "DEBIT").reduce((s, l) => s + l.amount, 0), posting.currency)}
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] font-semibold tabular-nums">
                        {fmt(lines.filter((l) => l.side === "CREDIT").reduce((s, l) => s + l.amount, 0), posting.currency)}
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
  );
}
