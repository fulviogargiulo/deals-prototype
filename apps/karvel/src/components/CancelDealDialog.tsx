import { useEffect, useMemo, useState } from "react";
import { Ban } from "lucide-react";
import type { Deal } from "@/data/types";
import { sharedInvoices, sharedPostings } from "@huspy/shared-domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  deal: Deal;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function CancelDealDialog({ open, deal, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const effects = useMemo<string[]>(() => {
    if (!open) return [];
    const list: string[] = [];
    const dealInvs = sharedInvoices.filter((i) => i.trancheId === deal.id);
    const openInvs = dealInvs.filter((i) => i.status === "draft" || i.status === "issued");
    if (openInvs.length > 0) {
      const total = openInvs.reduce((s, i) => s + i.subtotal + (i.vatAmount ?? 0), 0);
      list.push(
        `Void ${openInvs.length} open invoice${openInvs.length === 1 ? "" : "s"} (${formatMoney(total, deal.currency ?? "EUR")} total)`
      );
    }
    const postings = sharedPostings.filter((p) => p.trancheId === deal.id).length;
    if (postings > 0) {
      list.push(`Reverse ${postings} accounting posting${postings === 1 ? "" : "s"}`);
    }
    list.push("Notify the agent and finance team");
    list.push("Lock all sections from further edits");
    return list;
  }, [open, deal.id, deal.currency]);

  const canConfirm = reason.trim().length >= 5;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[520px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 space-y-0">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Ban className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-[17px] leading-tight font-semibold tracking-tight">
                Cancel this deal?
              </DialogTitle>
              <DialogDescription className="text-[13.5px] text-muted-foreground leading-relaxed mt-1.5">
                Cancellation is permanent and cannot be undone.{" "}
                <span className="font-mono text-[12.5px] text-foreground">{deal.id}</span> will be moved to Canceled.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="bg-muted rounded-lg p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-2">
              This will
            </div>
            <ul className="flex flex-col gap-1.5">
              {effects.map((e, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-muted-foreground">
                  <span className="mt-2 w-2 h-px bg-muted-foreground/50 shrink-0" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-6 pb-4">
          <label className="block text-[12px] font-semibold text-foreground mb-1.5">
            Reason for cancellation <span className="text-destructive">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Buyer pulled out after due diligence. Property to be re-listed Q3."
            className="w-full h-20 resize-none px-3 py-2 rounded-md border border-border bg-background text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-1.5 text-[11.5px] text-muted-foreground">
            Required. Visible to ops, finance, and the agent.
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background/40 sm:justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center h-8 px-3 rounded-md border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            Keep deal open
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!canConfirm}
            className={`inline-flex items-center h-8 px-3.5 rounded-md text-[13px] font-semibold transition-opacity ${
              canConfirm
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Cancel deal
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatMoney(n: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
