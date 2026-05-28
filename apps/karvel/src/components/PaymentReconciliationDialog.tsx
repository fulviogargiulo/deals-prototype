import { useState, useRef, useCallback } from "react";
import { sharedInvoices, sharedParties } from "@huspy/shared-domain";
import type { Invoice } from "@huspy/shared-domain";
import { saveSharedInvoices } from "@/data/sharedEntityStore";
import { createPaidPosting, autoFinalizeDealIfComplete } from "@/lib/invoiceActions";
import { Upload, X, Check, Download, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type RowResult = "will-pay" | "already-paid" | "wrong-status" | "not-found" | "invalid-row";

interface ParsedRow {
  lineNumber: number;
  invoiceNumber: string;
  paidDate: string;
  paymentReference: string;
  result: RowResult;
  invoice?: Invoice;
  errorDetail?: string;
}

const RESULT_LABEL: Record<RowResult, string> = {
  "will-pay": "Will mark paid",
  "already-paid": "Already paid",
  "wrong-status": "Wrong status",
  "not-found": "Not found",
  "invalid-row": "Invalid row",
};

const RESULT_CLASSES: Record<RowResult, string> = {
  "will-pay": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "already-paid": "bg-amber-50 text-amber-600 border border-amber-200",
  "wrong-status": "bg-red-50 text-red-600 border border-red-200",
  "not-found": "bg-red-50 text-red-600 border border-red-200",
  "invalid-row": "bg-red-50 text-red-600 border border-red-200",
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function resolveParty(partyId: string): string {
  return sharedParties.find((p) => p.id === partyId)?.displayName ?? partyId;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows: ParsedRow[] = [];

  let startIdx = 0;
  if (lines[0]?.toLowerCase().replace(/\s/g, "").startsWith("invoicenumber")) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const lineNumber = i + 1;
    const parts = lines[i].split(",").map((p) => p.trim());

    if (parts.length < 2) {
      rows.push({ lineNumber, invoiceNumber: lines[i], paidDate: "", paymentReference: "", result: "invalid-row", errorDetail: "Expected at least 2 columns" });
      continue;
    }

    const [invoiceNumber, paidDate, paymentReference = ""] = parts;

    if (!invoiceNumber) {
      rows.push({ lineNumber, invoiceNumber: "", paidDate, paymentReference, result: "invalid-row", errorDetail: "Missing invoice number" });
      continue;
    }

    if (!paidDate || !/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
      rows.push({ lineNumber, invoiceNumber, paidDate, paymentReference, result: "invalid-row", errorDetail: "Invalid date — expected YYYY-MM-DD" });
      continue;
    }

    const invoice = sharedInvoices.find((inv) => inv.invoiceNumber === invoiceNumber);

    if (!invoice) {
      rows.push({ lineNumber, invoiceNumber, paidDate, paymentReference, result: "not-found" });
      continue;
    }

    if (invoice.status === "paid") {
      rows.push({ lineNumber, invoiceNumber, paidDate, paymentReference, result: "already-paid", invoice });
      continue;
    }

    if (invoice.status !== "issued") {
      rows.push({ lineNumber, invoiceNumber, paidDate, paymentReference, result: "wrong-status", invoice, errorDetail: `Status is "${invoice.status}"` });
      continue;
    }

    rows.push({ lineNumber, invoiceNumber, paidDate, paymentReference, result: "will-pay", invoice });
  }

  return rows;
}

function downloadTemplate() {
  const content = "invoiceNumber,paidDate,paymentReference\nINV-2026-001,2026-05-25,HSBC-TXN-4892\nINV-2026-002,2026-05-25,HSBC-TXN-4893\n";
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "payment-reconciliation-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PaymentReconciliationDialog({ open, onClose }: Props) {
  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      setRows(parsed);
      setPhase("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const willPayRows = rows.filter((r) => r.result === "will-pay");
  const skippedCount = rows.filter((r) => r.result === "already-paid").length;
  const errorCount = rows.filter((r) => r.result !== "will-pay" && r.result !== "already-paid").length;

  const handleConfirm = async () => {
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 400));

    const now = new Date().toISOString();
    for (const row of willPayRows) {
      if (!row.invoice) continue;
      row.invoice.status = "paid";
      row.invoice.paidDate = row.paidDate;
      if (row.paymentReference) row.invoice.paymentReference = row.paymentReference;
      row.invoice.updatedAt = now;
      createPaidPosting(row.invoice);
      autoFinalizeDealIfComplete(row.invoice);
    }

    saveSharedInvoices();
    setAppliedCount(willPayRows.length);
    setIsApplying(false);
  };

  const handleClose = () => {
    setPhase("upload");
    setRows([]);
    setAppliedCount(null);
    setIsApplying(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={cn(
          "bg-card border border-border rounded-xl flex flex-col",
          phase === "preview" ? "w-full max-w-3xl max-h-[80vh]" : "w-full max-w-lg"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {phase === "preview" && appliedCount === null && (
              <button
                onClick={() => { setPhase("upload"); setRows([]); }}
                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-[16px] font-semibold text-foreground">Reconcile Payments</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload phase */}
        {phase === "upload" && (
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-muted-foreground">
              Upload a CSV to bulk-mark issued invoices as paid. Only <span className="font-mono text-[12px] bg-muted px-1 py-0.5 rounded">issued</span> invoices are updated — drafts, already-paid, and cancelled are skipped.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Required CSV format</p>
              <pre className="text-[12px] text-foreground font-mono leading-relaxed whitespace-pre-wrap">{`invoiceNumber,paidDate,paymentReference\nINV-2026-001,2026-05-25,HSBC-TXN-4892\nINV-2026-002,2026-05-25,HSBC-TXN-4893`}</pre>
              <p className="text-[11px] text-muted-foreground"><span className="font-mono">paymentReference</span> is optional. Date must be YYYY-MM-DD.</p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              )}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-[13px] font-medium text-foreground">Drop your CSV here or click to browse</p>
              <p className="text-[11px] text-muted-foreground mt-1">.csv files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) processFile(f); e.currentTarget.value = ""; }}
              className="hidden"
            />

            <div className="flex items-center justify-between pt-1">
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-[12px] text-primary hover:underline">
                <Download className="h-3.5 w-3.5" />
                Download template
              </button>
              <button onClick={handleClose} className="px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preview phase — confirm */}
        {phase === "preview" && appliedCount === null && (
          <>
            {/* Summary bar */}
            <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="font-semibold text-foreground">{willPayRows.length}</span>
                <span className="text-muted-foreground">will be marked paid</span>
              </div>
              {skippedCount > 0 && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="font-semibold text-foreground">{skippedCount}</span>
                  <span className="text-muted-foreground">already paid (skipped)</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <span className="font-semibold text-foreground">{errorCount}</span>
                  <span className="text-muted-foreground">errors / not found</span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Invoice #</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Party</th>
                    <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Paid Date</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Reference</th>
                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.lineNumber} className={cn("border-b border-border/50 last:border-0", row.result === "will-pay" ? "" : "opacity-60")}>
                      <td className="px-4 py-2.5 font-mono text-foreground">{row.invoiceNumber || <span className="text-muted-foreground italic">—</span>}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.invoice ? resolveParty(row.invoice.partyId) : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {row.invoice ? fmt(row.invoice.subtotal + (row.invoice.vatAmount ?? 0), row.invoice.currency) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{row.paidDate || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px]">{row.paymentReference || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap", RESULT_CLASSES[row.result])}>
                          {RESULT_LABEL[row.result]}{row.errorDetail ? ` — ${row.errorDetail}` : ""}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
              <button
                onClick={() => { setPhase("upload"); setRows([]); }}
                className="px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isApplying || willPayRows.length === 0}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isApplying
                  ? "Applying…"
                  : `Confirm — Mark ${willPayRows.length} Invoice${willPayRows.length !== 1 ? "s" : ""} Paid`}
              </button>
            </div>
          </>
        )}

        {/* Success state */}
        {phase === "preview" && appliedCount !== null && (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-foreground">
                {appliedCount} invoice{appliedCount !== 1 ? "s" : ""} marked as paid
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">Accounting entries have been created for each payment.</p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
