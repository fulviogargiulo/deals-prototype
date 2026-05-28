import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useMemo } from "react";
import { sharedInvoices, sharedParties, sharedDeals, sharedLedgers, sharedPostings, sharedPostingLines, getPostingLinesForInvoice } from "@huspy/shared-domain";
import type { Invoice } from "@huspy/shared-domain";
import { saveSharedInvoices } from "@/data/sharedEntityStore";
import { createPaidPosting, autoFinalizeDealIfComplete } from "@/lib/invoiceActions";
import { PostingDetailDialog } from "@/components/PostingDetailDialog";
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

const LEDGERS: Record<string, { AR: number; REV: number; VAT: number; EXP: number; AP: number; BANK: number }> = {
  EUR: { AR: 2, REV: 6, VAT: 5, EXP: 7, AP: 4, BANK: 1 },
  AED: { AR: 9, REV: 13, VAT: 12, EXP: 14, AP: 11, BANK: 8 },
  SAR: { AR: 16, REV: 20, VAT: 19, EXP: 21, AP: 18, BANK: 15 },
};

function createIssuedPosting(inv: Invoice): void {
  const l = LEDGERS[inv.currency] ?? LEDGERS.EUR;
  const deal = sharedDeals.find((d) => d.id === inv.dealId);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const pid = `posting-auto-${inv.id}-${Date.now()}`;
  const vat = inv.vatAmount ?? 0;
  const gross = inv.subtotal + vat;

  const posting = {
    id: pid,
    dealId: inv.dealId,
    businessUnit: deal?.businessUnit ?? null,
    businessProcess: (inv.direction === "outbound" ? "invoice_issued" : "external_cost_accrual") as any,
    createdBy: "ops",
    createdAt: now,
    valueDate: today,
    currency: inv.currency,
    description: `${inv.direction === "outbound" ? "Invoice issued" : "Cost accrual"} — ${inv.invoiceNumber}`,
  };
  sharedPostings.push(posting);

  if (inv.direction === "outbound") {
    sharedPostingLines.push({ id: `${pid}-1`, postingId: pid, ledgerId: l.AR,  side: "DEBIT",  amount: gross,        invoiceId: inv.id });
    sharedPostingLines.push({ id: `${pid}-2`, postingId: pid, ledgerId: l.REV, side: "CREDIT", amount: inv.subtotal });
    if (vat > 0)
      sharedPostingLines.push({ id: `${pid}-3`, postingId: pid, ledgerId: l.VAT, side: "CREDIT", amount: vat });
  } else {
    sharedPostingLines.push({ id: `${pid}-1`, postingId: pid, ledgerId: l.EXP, side: "DEBIT",  amount: inv.subtotal });
    if (vat > 0)
      sharedPostingLines.push({ id: `${pid}-2`, postingId: pid, ledgerId: l.VAT, side: "DEBIT",  amount: vat });
    sharedPostingLines.push({ id: `${pid}-3`, postingId: pid, ledgerId: l.AP,  side: "CREDIT", amount: gross,        invoiceId: inv.id });
  }
}

function PostingsSection({ invoiceId, version }: { invoiceId: string; version: number }) {
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);
  const postingLines = useMemo(() => getPostingLinesForInvoice(invoiceId), [invoiceId, version]);

  if (postingLines.length === 0) {
    return null;
  }

  const postingsByLine = postingLines
    .map((line) => {
      const posting = sharedPostings.find((p) => p.id === line.postingId);
      return { line, posting };
    })
    .sort((a, b) => (a.posting?.valueDate ?? "").localeCompare(b.posting?.valueDate ?? ""));

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-[14px] font-semibold text-foreground">Accounting Entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                  Posting
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
                  Line ID
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
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelectedPostingId(line.postingId)}
                      className="font-mono text-[11px] text-primary hover:underline underline-offset-2"
                    >
                      {line.postingId}
                    </button>
                  </td>
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
      <PostingDetailDialog
        postingId={selectedPostingId}
        allPostings={sharedPostings}
        allLines={sharedPostingLines}
        open={!!selectedPostingId}
        onOpenChange={(open) => !open && setSelectedPostingId(null)}
      />
    </>
  );
}

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

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
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [postingsVersion, setPostingsVersion] = useState(0);

  // Draft edit state (outbound only)
  const [draftDueDate, setDraftDueDate] = useState(invoice.dueDate || "");
  const [draftVatAmount, setDraftVatAmount] = useState(
    invoice.vatAmount != null ? String(invoice.vatAmount) : ""
  );
  const [draftInvoiceNumber, setDraftInvoiceNumber] = useState(invoice.invoiceNumber);

  const handleFileSelect = (file: File) => {
    setProofFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setInvoiceFile(file);
  };

  const handleMarkAsPaid = async () => {
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

    autoFinalizeDealIfComplete(invoice);
    saveSharedInvoices();
    createPaidPosting(invoice);
    setPostingsVersion((v) => v + 1);
    setIsSaving(false);
  };

  const handleMarkAsIssued = async () => {
    if (!draftDueDate) {
      alert("Please set a due date before issuing.");
      return;
    }
    if (invoice.direction === "inbound" && !invoiceFile && !invoice.invoiceFileName) {
      alert("Please upload the received invoice document.");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    invoice.status = "issued";
    invoice.invoiceNumber = draftInvoiceNumber;
    invoice.dueDate = draftDueDate;
    invoice.vatAmount = draftVatAmount ? parseFloat(draftVatAmount) : undefined;
    if (invoiceFile) {
      invoice.invoiceFileName = invoiceFile.name;
    }
    invoice.updatedAt = new Date().toISOString();
    saveSharedInvoices();
    createIssuedPosting(invoice);
    setPostingsVersion((v) => v + 1);
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

  const gross = invoice.subtotal + (invoice.vatAmount ?? 0);
  const netPayout = invoice.withholdingAmount != null
    ? gross - invoice.withholdingAmount
    : undefined;

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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  {netPayout != null ? "Net Payout" : "Gross Amount"}
                </p>
                <p className="text-[20px] font-bold text-foreground">
                  {fmt(netPayout ?? gross, invoice.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Direction</p>
                <p className="text-[14px] font-medium text-foreground capitalize">
                  {invoice.direction === "outbound" ? "Outbound" : "Inbound"}
                </p>
              </div>
              {invoice.vatAmount != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Subtotal</p>
                  <p className="text-[14px] text-foreground">{fmt(invoice.subtotal, invoice.currency)}</p>
                </div>
              )}
              {invoice.vatAmount != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">VAT</p>
                  <p className="text-[14px] text-foreground">{fmt(invoice.vatAmount, invoice.currency)}</p>
                </div>
              )}
              {invoice.withholdingAmount != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Withholding</p>
                  <p className="text-[14px] text-foreground">−{fmt(invoice.withholdingAmount, invoice.currency)}</p>
                </div>
              )}
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

          {/* Draft — outbound: complete & send to party */}
          {invoice.status === "draft" && invoice.direction === "outbound" && (
            <div className="bg-card border border-amber-200 rounded-lg p-6 space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Complete &amp; Issue</h2>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Review the pre-filled values, set the due date, then download the PDF and send it to the party before marking as Issued.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">Invoice Number</label>
                  <input
                    type="text"
                    value={draftInvoiceNumber}
                    onChange={(e) => setDraftInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">
                    Due Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={draftDueDate}
                    onChange={(e) => setDraftDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">
                    VAT Amount ({invoice.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftVatAmount}
                    onChange={(e) => setDraftVatAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{fmt(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT</span>
                  <span className="font-mono">{fmt(parseFloat(draftVatAmount) || 0, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2 mt-1">
                  <span>Total to collect</span>
                  <span className="font-mono">{fmt(invoice.subtotal + (parseFloat(draftVatAmount) || 0), invoice.currency)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={handleMarkAsIssued}
                  disabled={isSaving || !draftDueDate}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {isSaving ? "Saving…" : "Mark as Issued"}
                </button>
              </div>
            </div>
          )}

          {/* Draft — inbound: waiting for counterparty invoice, then upload & record */}
          {invoice.status === "draft" && invoice.direction === "inbound" && (
            <div className="bg-card border border-amber-200 rounded-lg p-6 space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Upload Received Invoice</h2>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Waiting for the counterparty to send their invoice. Once received, upload it here and confirm the details before processing the payout.
                </p>
              </div>

              {/* Invoice file upload */}
              <div>
                <p className="text-[12px] text-muted-foreground mb-2">
                  Invoice Document <span className="text-destructive">*</span>
                </p>
                {invoiceFile ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <p className="text-[13px] font-medium text-emerald-700">{invoiceFile.name}</p>
                    </div>
                    <button
                      onClick={() => setInvoiceFile(null)}
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : invoice.invoiceFileName ? (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <p className="text-[13px] font-medium text-foreground">{invoice.invoiceFileName}</p>
                    <button
                      onClick={() => { invoice.invoiceFileName = undefined; }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleInvoiceDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => invoiceFileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-[13px] text-foreground font-medium">Drop the invoice here or click to upload</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF or image</p>
                  </div>
                )}
                <input
                  ref={invoiceFileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f) setInvoiceFile(f);
                  }}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">Invoice Number</label>
                  <input
                    type="text"
                    value={draftInvoiceNumber}
                    onChange={(e) => setDraftInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">
                    Due Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={draftDueDate}
                    onChange={(e) => setDraftDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">
                    VAT Amount ({invoice.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draftVatAmount}
                    onChange={(e) => setDraftVatAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-border rounded-lg text-[13px] bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{fmt(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT</span>
                  <span className="font-mono">{fmt(parseFloat(draftVatAmount) || 0, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2 mt-1">
                  <span>Total to pay out</span>
                  <span className="font-mono">{fmt(invoice.subtotal + (parseFloat(draftVatAmount) || 0), invoice.currency)}</span>
                </div>
              </div>

              <button
                onClick={handleMarkAsIssued}
                disabled={isSaving || !draftDueDate || (!invoiceFile && !invoice.invoiceFileName)}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isSaving ? "Saving…" : "Confirm Receipt & Process"}
              </button>
            </div>
          )}

          {/* Postings */}
          <PostingsSection invoiceId={invoiceId!} version={postingsVersion} />

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
                  disabled={isSaving}
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
