import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useMemo } from "react";
import { sharedInvoices, sharedParties, sharedDeals, sharedLedgers, sharedPostings, getPostingLinesForInvoice } from "@huspy/shared-domain";
import type { Invoice } from "@huspy/shared-domain";
import { ArrowLeft, Upload, X, AlertTriangle, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-amber-50 text-amber-700 border border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
};

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function resolveParty(partyId: string): string {
  return sharedParties.find((p) => p.id === partyId)?.displayName ?? partyId;
}

function resolveDeal(dealId?: string): string | undefined {
  if (!dealId) return undefined;
  return sharedDeals.find((d) => d.id === dealId)?.id ?? dealId;
}

function resolveLedger(ledgerId: number): string {
  return sharedLedgers.find((l) => l.id === ledgerId)?.name ?? `Ledger ${ledgerId}`;
}

function PostingsSection({ invoiceId }: { invoiceId: string }) {
  const postingLines = useMemo(() => getPostingLinesForInvoice(invoiceId), [invoiceId]);

  if (postingLines.length === 0) {
    return null;
  }

  // Map posting lines for the invoice
  const postingsByLine = postingLines.map((line) => {
    const posting = sharedPostings.find((p) => p.id === line.postingId);
    return { line, posting };
  });

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h2 className="text-[14px] font-semibold text-foreground">Accounting Entries</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                ID
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                Date
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                Process
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                Account
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                Side
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {postingsByLine.map(({ line, posting }) => (
              <tr key={line.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">{line.id}</td>
                <td className="px-3 py-2 text-muted-foreground">{posting?.valueDate ?? "—"}</td>
                <td className="px-3 py-2 text-foreground capitalize text-[11px] font-medium">
                  {posting?.businessProcess?.replace(/_/g, " ") ?? "—"}
                </td>
                <td className="px-3 py-2 text-foreground font-mono text-[11px]">{resolveLedger(line.ledgerId)}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", {
                      "bg-blue-50 text-blue-700": line.side === "DEBIT",
                      "bg-amber-50 text-amber-700": line.side === "CREDIT",
                    })}
                  >
                    {line.side}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                  {fmt(line.amount, posting?.currency ?? "EUR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invoice = sharedInvoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  const [paymentReference, setPaymentReference] = useState(invoice.paymentReference || "");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (file: File) => {
    setProofFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleMarkAsPaid = async () => {
    if (!proofFile && !invoice.proofFileName) {
      alert("Please upload a proof document.");
      return;
    }
    if (!paymentReference) {
      alert("Please enter a payment reference.");
      return;
    }

    setIsSaving(true);
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update invoice in fixture
    invoice.status = "paid";
    invoice.paymentReference = paymentReference;
    if (proofFile) {
      invoice.proofFileName = proofFile.name;
      invoice.proofUploadedAt = new Date().toISOString();
    }
    invoice.paidDate = new Date().toISOString().slice(0, 10);
    invoice.updatedAt = new Date().toISOString();

    setIsSaving(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    invoice.status = "cancelled";
    invoice.cancelReason = cancelReason;
    invoice.cancelledAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();

    setShowCancelDialog(false);
    setIsSaving(false);
  };

  const dealId = resolveDeal(invoice.dealId);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/deals")}
            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[18px] font-semibold text-foreground">{invoice.invoiceNumber}</h1>
            <p className="text-[12px] text-muted-foreground">{resolveParty(invoice.partyId)}</p>
          </div>
        </div>
        <span className={cn("px-3 py-1.5 rounded-full text-[12px] font-medium", STATUS_COLOR[invoice.status])}>
          {STATUS_LABEL[invoice.status]}
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Overview */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">Overview</h2>
              {invoice.invoiceFileName && invoice.status !== "paid" && (
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download invoice
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
                <p className="text-[20px] font-bold text-foreground">{fmt(invoice.amount, invoice.currency)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Direction</p>
                <p className="text-[14px] font-medium text-foreground capitalize">
                  {invoice.direction === "outbound" ? "Outbound" : "Inbound"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Issue Date</p>
                <p className="text-[14px] text-foreground">{invoice.issueDate}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                <p className="text-[14px] text-foreground">{invoice.dueDate ?? "—"}</p>
              </div>
              {dealId && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Deal</p>
                  <button
                    onClick={() => navigate(`/deals/${dealId}`)}
                    className="text-[14px] text-primary hover:underline transition-colors"
                  >
                    {dealId}
                  </button>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Paid Date</p>
                  <p className="text-[14px] text-foreground">{invoice.paidDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Postings */}
          <PostingsSection invoiceId={invoiceId!} />

          {/* Payment Proof Section */}
          {invoice.status === "issued" && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-[14px] font-semibold text-foreground">Record Payment</h2>

              {/* File Upload */}
              <div>
                <p className="text-[12px] text-muted-foreground mb-3">Proof of Payment</p>
                {invoice.proofFileName ? (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-3">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{invoice.proofFileName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded {new Date(invoice.proofUploadedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        invoice.proofFileName = undefined;
                        invoice.proofUploadedAt = undefined;
                      }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {proofFile && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <p className="text-[13px] font-medium text-emerald-700">{proofFile.name}</p>
                    </div>
                    <button
                      onClick={() => setProofFile(null)}
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {!proofFile && !invoice.proofFileName && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-[13px] text-foreground font-medium">Drag proof document here or click to upload</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, image, or statement file</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Payment Reference */}
              <div>
                <label className="text-[12px] text-muted-foreground mb-2 block">Payment Reference</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Bank TX ID, check number, wire reference"
                  className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Required to mark as paid</p>
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isSaving || (!proofFile && !invoice.proofFileName) || !paymentReference}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {isSaving ? "Saving…" : "Mark as Paid"}
                </button>
              </div>
            </div>
          )}

          {/* Paid Section */}
          {invoice.status === "paid" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-emerald-900">Payment Recorded</h3>
                  <p className="text-[12px] text-emerald-700 mt-1">Paid on {invoice.paidDate}</p>
                </div>
                {invoice.invoiceFileName && (
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-[12px] font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download invoice
                  </button>
                )}
              </div>

              {invoice.proofFileName && (
                <div className="bg-white rounded p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Proof Document</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">{invoice.proofFileName}</p>
                    <button className="p-1 hover:bg-muted rounded text-muted-foreground">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {invoice.paymentReference && (
                <div className="bg-white rounded p-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Payment Reference</p>
                  <p className="text-[13px] font-mono text-foreground">{invoice.paymentReference}</p>
                </div>
              )}
            </div>
          )}

          {/* Cancellation Section */}
          {invoice.status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-[14px] font-semibold text-red-900">Invoice Cancelled</h3>
                  <p className="text-[12px] text-red-700 mt-1">Reason: {invoice.cancelReason}</p>
                  <p className="text-[11px] text-red-600 mt-2">Cancelled on {invoice.cancelledAt?.slice(0, 10)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Always-visible Cancel Section */}
          {invoice.status !== "cancelled" && (
            <div className="border-t border-border pt-6">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-[16px] font-semibold text-foreground">Cancel Invoice?</h2>
            <p className="text-[13px] text-muted-foreground">
              This action will mark {invoice.invoiceNumber} as cancelled. Please provide a reason.
            </p>

            <div>
              <label className="text-[12px] text-muted-foreground mb-2 block">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Overbilled, client request, deal cancelled"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Keep Invoice
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isSaving || !cancelReason.trim()}
                className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isSaving ? "Cancelling…" : "Cancel Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
