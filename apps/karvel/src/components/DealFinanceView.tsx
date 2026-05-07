import { Deal, InvoiceStatus, PayableStatus, PayableEntry, ReceivableEntry } from "@/data/types";
import { useState, useMemo, useRef, useEffect } from "react";
import { FileText, DollarSign, Send, Plus, X, Download, Upload, CheckCircle, CreditCard, Receipt, ArrowUp, ArrowDown, ArrowUpDown, Filter, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "./DateRangePicker";

import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

interface Props {
  deals: Deal[];
  currency?: string;
  dateRange: DateRange;
  onDealUpdate?: (deal: Deal) => void;
}

interface ReceivableInvoice {
  id: string;
  entityName: string;
  amount: number;
  invoiceNumber?: string;
  status: InvoiceStatus;
  date?: string;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const tileConfig = [
  { key: "awaiting", label: "pending-details", color: "text-[hsl(var(--deal-pending-details))]" },
  { key: "ready", label: "Ready to Invoice", color: "text-[hsl(var(--deal-reported))]" },
  { key: "sent", label: "Invoice Sent", color: "text-[hsl(var(--deal-ready-invoicing))]" },
  { key: "received", label: "Payment Received", color: "text-[hsl(var(--deal-under-review))]" },
  { key: "paid", label: "Agent Paid", color: "text-[hsl(var(--deal-paid))]" },
  { key: "overdue", label: "overdue", color: "text-[hsl(var(--deal-pending-payment))]" },
] as const;

type TileKey = typeof tileConfig[number]["key"];

function computeTiles(deals: Deal[]) {
  const tiles: Record<TileKey, { count: number; volume: number; dealAmount: number }> = {
    awaiting: { count: 0, volume: 0, dealAmount: 0 },
    ready: { count: 0, volume: 0, dealAmount: 0 },
    sent: { count: 0, volume: 0, dealAmount: 0 },
    received: { count: 0, volume: 0, dealAmount: 0 },
    paid: { count: 0, volume: 0, dealAmount: 0 },
    overdue: { count: 0, volume: 0, dealAmount: 0 },
  };

  for (const d of deals) {
    // Check "Payment Received" first — deals with status Pending Payment or Paid
    if (d.status === "pending-receivables" || d.status === "finalized") {
      if (d.payables.every(p => p.status === "paid")) {
        tiles.paid.count++;
        tiles.paid.volume += d.huspyRevenue;
        tiles.paid.dealAmount += d.dealPrice;
      } else {
        tiles.received.count++;
        tiles.received.volume += d.huspyRevenue;
        tiles.received.dealAmount += d.dealPrice;
      }
    } else if (d.status === "under-review") {
      tiles.awaiting.count++;
      tiles.awaiting.volume += d.huspyRevenue;
      tiles.awaiting.dealAmount += d.dealPrice;
    } else if (!d.invoiceStatus || d.invoiceStatus === "issued") {
      tiles.ready.count++;
      tiles.ready.volume += d.huspyRevenue;
      tiles.ready.dealAmount += d.dealPrice;
    } else if (d.payables.some(p => p.status === "overdue")) {
      tiles.overdue.count++;
      tiles.overdue.volume += d.huspyRevenue;
      tiles.overdue.dealAmount += d.dealPrice;
    }
  }

  return tiles;
}

// Invoice creation modal
function CreateInvoiceModal({
  deal,
  currency,
  onClose,
  onSave,
}: {
  deal: Deal;
  currency: string;
  onClose: () => void;
  onSave: (invoices: ReceivableInvoice[]) => void;
}) {
  const totalReceivable = deal.huspyRevenue;

  // From (Huspy) fields
  const [fromName, setFromName] = useState("huspy Technologies S.L.");
  const [fromEmail, setFromEmail] = useState("finance@huspy.com");

  // To (Client) fields
  const [toName, setToName] = useState(deal.clientName || "");
  const [toEmail, setToEmail] = useState(deal.buyerEmail || deal.sellerEmail || "");

  // Dates
  const today = new Date().toISOString().split("T")[0];
  const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);

  // Bank account
  const [bankAccount, setBankAccount] = useState("ES91 2100 0418 4502 0005 1332");

  const isValid = toName.trim() && fromName.trim() && totalReceivable > 0;

  const inputClass = "w-full border border-input rounded-md px-3 py-1.5 text-[13px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClass = "text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-border max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-foreground">Create Receivable Invoice</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{deal.id} — {deal.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* From / To */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">Invoice From</p>
              <div>
                <label className={labelClass}>Entity Name</label>
                <input className={inputClass} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="Email address" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">Invoice To</p>
              <div>
                <label className={labelClass}>Entity Name</label>
                <input className={inputClass} value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Client name" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="Email address" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Issue Date</label>
              <input type="date" className={inputClass} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label className={labelClass}>Huspy Bank Account</label>
            <input className={inputClass} value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Bank account number" />
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Invoice Amount</span>
              <span className="font-semibold text-foreground">{formatAmount(totalReceivable, currency)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-foreground border border-border rounded-md hover:bg-muted">Cancel</button>
          <button onClick={() => isValid && onSave([{ id: crypto.randomUUID(), entityName: toName, amount: totalReceivable, status: "issued" as InvoiceStatus }])} disabled={!isValid} className={cn("px-4 py-2 text-[13px] font-medium rounded-md", isValid ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed")}>
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock Invoice data generator
function generateInvoiceData(payable: PayableEntry, deal: Deal) {
  const entityName = payable.entityLabel.split(" — ")[1] || payable.entityLabel;
  const issueDate = deal.reportDate || "2026-02-28";
  const dueDate = new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().split("T")[0];
  const month = new Date(issueDate).toLocaleString("en-US", { month: "long", year: "numeric" });
  const lines: { description: string; subType: string; type: "Credit" | "Debit"; amount: number }[] = [
    { description: `Commission — ${deal.opportunityName || deal.clientName}`, subType: "Deal Commission", type: "Credit", amount: payable.expectedAmount },
  ];
  if (payable.entityType === "agent" && payable.expectedAmount > 500) {
    lines.push({ description: `Referral commission — Lead from ${deal.agentName}`, subType: "Referral Commission", type: "Credit", amount: Math.round(payable.expectedAmount * 0.12) });
  }
  lines.push({ description: "Platform support fee", subType: "Platform Fee", type: "Debit", amount: Math.round(payable.expectedAmount * 0.05) });
  const totalCredits = lines.filter(l => l.type === "Credit").reduce((s, l) => s + l.amount, 0);
  const totalDebits = lines.filter(l => l.type === "Debit").reduce((s, l) => s + l.amount, 0);
  return { entityName, invoiceRef: payable.entityUploadedInvoice || "", issueDate, dueDate, month, lines, totalCredits, totalDebits, amountDue: totalCredits - totalDebits, status: payable.status };
}

// Entity Invoice Modal
function EntityInvoiceModal({ payable, deal, currency, onClose, onApprove }: { payable: PayableEntry; deal: Deal; currency: string; onClose: () => void; onApprove?: () => void }) {
  const inv = generateInvoiceData(payable, deal);
  const statusLabel = inv.status === "paid" ? "paid" : inv.status === "approved" ? "approved" : "created";
  const statusColor = inv.status === "paid" ? "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]" :
    inv.status === "approved" ? "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]" :
    "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]";
  const canApproveInvoice = inv.status === "pending" && onApprove;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-border max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-[16px] text-foreground">Invoice</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{inv.invoiceRef}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1 rounded-full text-[12px] font-medium", statusColor)}>{statusLabel}</span>
            <button onClick={() => {
              const blob = new Blob([`Invoice: ${inv.invoiceRef}\nEntity: ${inv.entityName}\nAmount Due: ${inv.amountDue}\nIssue Date: ${inv.issueDate}\nDue Date: ${inv.dueDate}\n\nLine Items:\n${inv.lines.map(l => `${l.type === "Credit" ? "+" : "-"} ${l.description}: ${l.amount}`).join("\n")}\n\nTotal Credits: ${inv.totalCredits}\nTotal Debits: ${inv.totalDebits}\nAmount Due: ${inv.amountDue}`], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `${inv.invoiceRef || "invoice"}.txt`; a.click(); URL.revokeObjectURL(url);
            }} className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-foreground border border-border bg-card rounded-md hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* From / To */}
        <div className="px-6 py-5 border-b border-border">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">Invoice From</p>
              <p className="font-semibold text-[14px] text-foreground">{inv.entityName}</p>
              <p className="text-[12px] text-muted-foreground mt-1">Independent Contractor</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">Invoice To</p>
              <p className="font-semibold text-[14px] text-foreground">huspy Technologies S.L.</p>
              <p className="text-[12px] text-muted-foreground mt-1">Calle de Serrano 41, 3ª Planta</p>
              <p className="text-[12px] text-muted-foreground">28001 Madrid, Spain</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-8">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Issue Date:</span>
            <span className="font-semibold text-foreground">{new Date(inv.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-semibold text-foreground">{new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Cycle:</span>
            <span className="font-semibold text-foreground">{inv.month}</span>
          </div>
        </div>

        {/* Line items */}
        <div className="px-6 py-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-[13px] font-semibold text-foreground">Description</th>
                <th className="text-center py-3 text-[13px] font-semibold text-foreground">Type</th>
                <th className="text-right py-3 text-[13px] font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{line.description}</p>
                    <p className="text-[11px] text-muted-foreground">{line.subType}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn("text-[12px] font-medium", line.type === "Credit" ? "text-[hsl(var(--deal-paid))]" : "text-destructive")}>{line.type}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn("font-medium", line.type === "Credit" ? "text-[hsl(var(--deal-paid))]" : "text-destructive")}>
                      {line.type === "Credit" ? "+" : "−"}{formatAmount(line.amount, currency)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-border mt-2 pt-3 space-y-1">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total Credits</span>
              <span className="font-medium text-[hsl(var(--deal-paid))]">+{formatAmount(inv.totalCredits, currency)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total Debits</span>
              <span className="font-medium text-destructive">−{formatAmount(inv.totalDebits, currency)}</span>
            </div>
          </div>
        </div>

        {/* Amount Due */}
        <div className="mx-6 mb-5 bg-muted/50 rounded-lg px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-[14px] text-foreground">Amount Due</span>
          </div>
          <span className="text-[24px] font-bold text-[hsl(var(--deal-paid))]">{formatAmount(inv.amountDue, currency)}</span>
        </div>

        {/* Payment Info */}
        <div className="px-6 py-4 border-t border-border grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Payment Method</p>
            <p className="text-[13px] text-foreground">Bank Transfer (SEPA)</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Bank Account</p>
            <p className="text-[13px] text-foreground">ES91 2100 0418 4502 0005 1332</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Reference</p>
            <p className="text-[13px] text-foreground">{inv.invoiceRef}</p>
          </div>
        </div>

        {/* Footer with Approve */}
        {canApproveInvoice && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-md bg-[hsl(var(--deal-paid))] text-primary-foreground hover:opacity-90 transition-all"
            >
              <CheckCircle className="h-4 w-4" /> Approve Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Receivable Invoice Modal (Huspy → Client)
function generateReceivableInvoiceData(deal: Deal) {
  const issueDate = deal.invoiceDate || deal.reportDate || "2026-02-28";
  const dueDate = new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().split("T")[0];
  const lines: { description: string; subType: string; amount: number }[] = [
    { description: `Brokerage commission — ${deal.opportunityName || deal.buildingName || "Property transaction"}`, subType: "Brokerage Fee", amount: deal.huspyRevenue },
  ];
  if (deal.conveyanceRevenue > 0) {
    lines.push({ description: `Conveyance fee — ${deal.buildingName || deal.clientName}`, subType: "Conveyance", amount: deal.conveyanceRevenue });
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vatRate = deal.country === "ae" ? 5 : deal.country === "es" ? 21 : 15; // VAT % by country
  const vatAmount = Math.round(subtotal * (vatRate / 100));
  const total = subtotal + vatAmount;
  const derivedStatus = deal.status === "under-review" ? undefined
    : deal.status === "finalized" ? "paid" as const
    : deal.invoiceStatus;
  return { issueDate, dueDate, lines, subtotal, vatRate, vatAmount, total, status: derivedStatus };
}

function ReceivableInvoiceModal({ deal, currency, onClose }: { deal: Deal; currency: string; onClose: () => void }) {
  const inv = generateReceivableInvoiceData(deal);
  const statusLabel = inv.status === "paid" ? "paid" : inv.status === "paid-partial" ? "paid-partial" : inv.status === "sent" ? "sent" : inv.status === "overdue" ? "overdue" : "created";
  const statusColor = inv.status === "paid" ? "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]" :
    inv.status === "sent" ? "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]" :
    inv.status === "overdue" ? "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]" :
    "bg-muted text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-border max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-[16px] text-foreground">Invoice</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">{deal.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1 rounded-full text-[12px] font-medium", statusColor)}>{statusLabel}</span>
            <button onClick={() => {
              const blob = new Blob([`Invoice: ${deal.invoiceNumber}\nClient: ${deal.clientName}\nTotal: ${inv.total}\nIssue Date: ${inv.issueDate}\nDue Date: ${inv.dueDate}\n\nLine Items:\n${inv.lines.map(l => `${l.description}: ${l.amount}`).join("\n")}\n\nSubtotal: ${inv.subtotal}\nVAT (${inv.vatRate}%): ${inv.vatAmount}\nTotal Due: ${inv.total}`], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `${deal.invoiceNumber || "invoice"}.txt`; a.click(); URL.revokeObjectURL(url);
            }} className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-foreground border border-border bg-card rounded-md hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="px-6 py-5 border-b border-border">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Invoice From</p>
              <p className="font-semibold text-[14px] text-foreground">huspy Technologies S.L.</p>
              <p className="text-[12px] text-muted-foreground mt-1">Calle de Serrano 41, 3ª Planta</p>
              <p className="text-[12px] text-muted-foreground">28001 Madrid, Spain</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Invoice To</p>
              <p className="font-semibold text-[14px] text-foreground">{deal.clientName}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{deal.buyerEmail || deal.sellerEmail || `${deal.clientName?.toLowerCase().replace(/\s+/g, '.')}@email.com`}</p>
              {deal.fullAddress && (
                <p className="text-[12px] text-muted-foreground mt-0.5">{deal.fullAddress}</p>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-border flex items-center gap-8">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Issue Date:</span>
            <span className="font-semibold text-foreground">{new Date(inv.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-semibold text-foreground">{new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        <div className="px-6 py-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-[13px] font-semibold text-foreground">Description</th>
                <th className="text-right py-3 text-[13px] font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{line.description}</p>
                    <p className="text-[11px] text-muted-foreground">{line.subType}</p>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-medium text-foreground">{formatAmount(line.amount, currency)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border mt-2 pt-3 space-y-1">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatAmount(inv.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">VAT ({inv.vatRate}%)</span>
              <span className="font-medium text-foreground">{formatAmount(inv.vatAmount, currency)}</span>
            </div>
          </div>
        </div>
        <div className="mx-6 mb-5 bg-muted/50 rounded-lg px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-[14px] text-foreground">Total Amount Due</span>
          </div>
          <span className="text-[24px] font-bold text-[hsl(var(--deal-paid))]">{formatAmount(inv.total, currency)}</span>
        </div>
        <div className="px-6 py-4 border-t border-border grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Payment Method</p>
            <p className="text-[13px] text-foreground">Bank Transfer (SEPA)</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Bank Account</p>
            <p className="text-[13px] text-foreground">ES91 2100 0418 4502 0005 1332</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Reference</p>
            <p className="text-[13px] text-foreground">{deal.invoiceNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const invoiceStatusColor = (s?: InvoiceStatus | string) => {
  switch (s) {
    case "paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "issued": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "cancelled": return "bg-muted text-muted-foreground line-through";
    default: return "bg-muted text-muted-foreground";
  }
};

const payableStatusColor = (s?: PayableStatus) => {
  switch (s) {
    case "paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "approved": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "pending": return "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]";
    case "rejected": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "overdue": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    default: return "bg-muted text-muted-foreground";
  }
};

const EXTERNAL_ENTITY_TYPES = new Set(["external_partner", "broker", "referrer"]);
const getEntityCategory = (entityType: string) => EXTERNAL_ENTITY_TYPES.has(entityType) ? "External" : "Internal";



const dealStatusColor = (status: string) => {
  const map: Record<string, string> = {
    "under-review": "bg-[hsl(var(--deal-under-review)/0.1)] text-[hsl(var(--deal-under-review))]",
    "pending-agent-approval": "bg-[hsl(var(--deal-ready-invoicing)/0.1)] text-[hsl(var(--deal-ready-invoicing))]",
    "pending-receivables": "bg-[hsl(var(--deal-pending-receivables)/0.1)] text-[hsl(var(--deal-pending-receivables))]",
    "finalized": "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]",
  };
  return map[status] || "bg-muted text-muted-foreground";
};

/* ---- Shared Sort/Filter Components ---- */
type SortDir = "asc" | "desc" | null;

function FilterDropdown({ options, selected, onChange, onClose }: {
  options: string[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const noneSelected = selected.size === 1 && selected.has("__none__");
  const allSelected = selected.size === 0;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] max-h-[240px] overflow-auto">
      <label className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted rounded cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={() => {
          if (allSelected) onChange(new Set(["__none__"]));
          else onChange(new Set());
        }} className="rounded border-border" />
        Select All
      </label>
      <div className="border-t border-border my-1" />
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-muted rounded cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected || (!noneSelected && selected.has(opt))}
            onChange={() => {
              if (allSelected) {
                onChange(new Set(options.filter(o => o !== opt)));
              } else if (noneSelected) {
                onChange(new Set([opt]));
              } else {
                const next = new Set(selected);
                next.delete("__none__");
                if (next.has(opt)) next.delete(opt); else next.add(opt);
                if (next.size === 0) onChange(new Set(["__none__"]));
                else if (next.size === options.length) onChange(new Set());
                else onChange(next);
              }
            }}
            className="rounded border-border"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

const thBase = "px-4 py-3 font-semibold text-foreground text-[13px] whitespace-nowrap border-b border-border border-r border-r-border/40 last:border-r-0 bg-muted/50";

function SortableHeader({ label, sortKey, currentSortKey, sortDir, onSort, filterable, filterOptions, filterValues, onFilterChange, openFilter, filterKey, onFilterToggle, align, className: extraClassName, sortable = true }: {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  filterable?: boolean;
  filterOptions?: string[];
  filterValues?: Set<string>;
  onFilterChange?: (s: Set<string>) => void;
  openFilter?: string | null;
  filterKey?: string;
  onFilterToggle?: (key: string) => void;
  align?: "right" | "center";
  className?: string;
  sortable?: boolean;
}) {
  const isActive = currentSortKey === sortKey;
  const dir = isActive ? sortDir : null;
  const filterActive = filterValues && filterValues.size > 0;
  const isFilterOpen = openFilter === filterKey;

  return (
    <th className={cn(thBase, align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", extraClassName)}>
      <div className={`relative flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        {sortable ? (
          <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 hover:text-primary transition-colors">
            {label}
            {dir === "asc" ? <ArrowUp className="h-3 w-3" /> :
             dir === "desc" ? <ArrowDown className="h-3 w-3" /> :
             <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
          </button>
        ) : (
          <span>{label}</span>
        )}
        {filterable && filterOptions && onFilterToggle && filterKey && (
          <button
            onClick={(e) => { e.stopPropagation(); onFilterToggle(filterKey); }}
            className={`p-0.5 rounded transition-colors ${filterActive ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
          >
            {filterActive ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
          </button>
        )}
        {isFilterOpen && filterOptions && filterValues !== undefined && onFilterChange && onFilterToggle && (
          <FilterDropdown
            options={filterOptions}
            selected={filterValues}
            onChange={onFilterChange}
            onClose={() => onFilterToggle(filterKey!)}
          />
        )}
      </div>
    </th>
  );
}

/* ---- Sorting helper ---- */
function useTableSort() {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sortKey, sortDir, handleSort };
}

function useTableFilters(keys: string[]) {
  const [filters, setFilters] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    keys.forEach(k => init[k] = new Set());
    return init;
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const setFilter = (key: string, values: Set<string>) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const toggleFilter = (key: string) => {
    setOpenFilter(openFilter === key ? null : key);
  };

  return { filters, openFilter, setFilter, toggleFilter };
}

function applySortAndFilter<T>(
  data: T[],
  sortKey: string | null,
  sortDir: SortDir,
  getValue: (item: T, key: string) => string | number,
  filters: Record<string, Set<string>>,
  getFilterValue: (item: T, key: string) => string
): T[] {
  // Filter
  let result = data.filter(item => {
    for (const [key, values] of Object.entries(filters)) {
      if (values.size > 0 && !values.has(getFilterValue(item, key))) return false;
    }
    return true;
  });

  // Sort
  if (sortKey && sortDir) {
    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  return result;
}

// TimePeriod and date range types now imported from DateRangePicker

export function DealFinanceView({ deals, currency = "EUR", dateRange, onDealUpdate }: Props) {
  const [creatingInvoiceFor, setCreatingInvoiceFor] = useState<Deal | null>(null);
  const [activeTile, setActiveTile] = useState<TileKey | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<{ payable: PayableEntry; deal: Deal } | null>(null);
  const [viewingReceivableInvoice, setViewingReceivableInvoice] = useState<Deal | null>(null);
  const [showDownloadSummary, setShowDownloadSummary] = useState(false);
  const [downloadType, setDownloadType] = useState<"internal" | "external">("internal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">("receivables");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

  const tiles = useMemo(() => computeTiles(deals), [deals]);

  const financeStatuses = ["under-review", "pending-agent-approval", "pending-receivables", "finalized"];
  const financeDeals = useMemo(() => {
    // 1. Status filter
    let filtered = deals.filter((d) => financeStatuses.includes(d.status));

    // 2. Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((d) => {
        const dealDate = startOfDay(new Date(d.reportDate));
        return isWithinInterval(dealDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
      });
    }

    // 3. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((d) =>
        d.agentName.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.market.toLowerCase().includes(q) ||
        (d.invoiceNumber || "").toLowerCase().includes(q)
      );
    }

    // 4. Tile filter
    if (activeTile) {
      filtered = filtered.filter((d) => {
          switch (activeTile) {
            case "awaiting": return d.status === "under-review";
            case "ready": return !d.invoiceStatus || d.invoiceStatus === "issued";
            case "sent": return d.invoiceStatus === "issued";
            case "received": return d.invoiceStatus === "paid" && d.payables.some(p => p.status !== "paid");
            case "paid": return d.invoiceStatus === "paid" && d.payables.every(p => p.status === "paid");
            case "overdue": return d.payables.some(p => p.status === "overdue");
            default: return true;
        }
      });
    }
    return filtered;
  }, [deals, activeTile, dateRange, searchQuery]);

  const handleCreateInvoice = (deal: Deal, invoices: ReceivableInvoice[]) => {
    if (!onDealUpdate) return;
    const updatedDeal: Deal = {
      ...deal,
      invoiceNumber: invoices.map((_, i) => `INV-${deal.id.replace("DEAL-", "")}-${i + 1}`).join(", "),
      invoiceStatus: "issued" as InvoiceStatus,
      invoiceDate: new Date().toISOString().split("T")[0],
      status: "pending-receivables",
    };
    onDealUpdate(updatedDeal);
    setCreatingInvoiceFor(null);
  };

  // Flatten payable rows
  const allPayableRows = useMemo(() => {
    return financeDeals.flatMap((deal) =>
      deal.payables.map((p, idx) => ({ deal, payable: p, idx }))
    );
  }, [financeDeals]);

  const approvedPayableRows = useMemo(() => 
    allPayableRows.filter(({ payable }) => payable.status === "approved"),
    [allPayableRows]
  );

  const approvedInternalRows = useMemo(() =>
    approvedPayableRows.filter(({ payable }) => !EXTERNAL_ENTITY_TYPES.has(payable.entityType)),
    [approvedPayableRows]
  );

  const approvedExternalRows = useMemo(() =>
    approvedPayableRows.filter(({ payable }) => EXTERNAL_ENTITY_TYPES.has(payable.entityType)),
    [approvedPayableRows]
  );

  const downloadPaymentCSV = (rows: typeof approvedPayableRows, label: string) => {
    const headers = ["Deal ID", "Client", "Entity", "Type", "Status", "Amount"];
    const csvRows = rows.map(({ deal, payable }) => [
      deal.id, deal.clientName, payable.entityLabel, getEntityCategory(payable.entityType),
      payable.status, payable.expectedAmount.toString(),
    ]);
    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}-payment-file-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadPaymentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    // Reset input so same file can be re-uploaded
    if (uploadFileRef.current) uploadFileRef.current.value = "";
  };

  const handleConfirmUpload = () => {
    if (!onDealUpdate) return;
    // Mock: change all approved payables to Paid
    const dealsToUpdate = new Map<string, Deal>();
    for (const { deal, payable } of approvedPayableRows) {
      if (!dealsToUpdate.has(deal.id)) {
        dealsToUpdate.set(deal.id, { ...deal, payables: [...deal.payables] });
      }
      const d = dealsToUpdate.get(deal.id)!;
      d.payables = d.payables.map(p =>
        p === payable || (p.entityLabel === payable.entityLabel && p.entityType === payable.entityType)
          ? { ...p, status: "paid" as PayableStatus, paidAmount: p.expectedAmount, paidDate: new Date().toISOString().slice(0, 10) }
          : p
      );
    }
    for (const deal of dealsToUpdate.values()) {
      onDealUpdate(deal);
    }
    setShowUploadModal(false);
    setUploadedFileName(null);
  };

  /* ---- Receivables: flatten to per-entity rows (like payables) ---- */
  const allReceivableRows = useMemo(() => {
    return financeDeals.flatMap((deal) => {
      if (deal.receivables && deal.receivables.length > 0) {
        return deal.receivables.map((r, idx) => ({ deal, receivable: r, idx }));
      }
      // Fallback for deals without receivables array — use legacy fields
      const fallback: ReceivableEntry = {
        entityName: deal.clientName,
        entityType: "buyer" as const,
        amount: deal.huspyRevenue,
        invoiceNumber: deal.invoiceNumber,
        invoiceStatus: deal.invoiceStatus,
        invoiceDate: deal.invoiceDate,
        paymentReceivedDate: deal.paymentReceivedDate,
        paymentReceivedAmount: deal.paymentReceivedAmount,
      };
      return [{ deal, receivable: fallback, idx: 0 }];
    });
  }, [financeDeals]);

  const recSort = useTableSort();
  const recFilters = useTableFilters(["entity", "status", "invoiceStatus"]);
  const recUniqueEntities = useMemo(() => [...new Set(allReceivableRows.map(r => r.receivable.entityName))].sort(), [allReceivableRows]);
  const recUniqueStatuses = useMemo(() => [...new Set(financeDeals.map(d => d.status))].sort(), [financeDeals]);
  const recUniqueInvStatuses = useMemo(() => {
    const fromData = allReceivableRows.map(r => r.receivable.invoiceStatus || "No invoice").filter(Boolean);
    const allStatuses = ["No invoice", "issued", "paid", "cancelled"];
    return [...new Set([...allStatuses, ...fromData])].sort();
  }, [allReceivableRows]);

  const receivableRowsSorted = useMemo(() => applySortAndFilter(
    allReceivableRows, recSort.sortKey, recSort.sortDir,
    (r, k) => {
      switch (k) {
        case "id": return r.deal.id;
        case "reportDate": return new Date(r.deal.reportDate).getTime();
        case "entity": return r.receivable.entityName;
        case "status": return r.deal.status;
        case "revenue": return r.receivable.amount;
        case "invoiceNumber": return r.receivable.invoiceNumber || "";
        case "invoiceStatus": return r.receivable.invoiceStatus || "";
        default: return "";
      }
    },
    recFilters.filters,
    (r, k) => {
      switch (k) {
        case "entity": return r.receivable.entityName;
        case "status": return r.deal.status;
        case "invoiceStatus": return r.receivable.invoiceStatus || "No invoice";
        default: return "";
      }
    }
  ), [allReceivableRows, recSort.sortKey, recSort.sortDir, recFilters.filters]);

  /* ---- Payables sort/filter ---- */
  const paySort = useTableSort();
  const payFilters = useTableFilters(["entity", "type", "status"]);
  const payUniqueTypes = useMemo(() => [...new Set(allPayableRows.map(r => getEntityCategory(r.payable.entityType)))].sort(), [allPayableRows]);
  const payableStatusDisplayLabel = (s: PayableStatus) => s === "pending" ? "created" : s;
  const getDisplayedInvoiceStatus = (p: PayableEntry) =>
    p.entityUploadedInvoice ? payableStatusDisplayLabel(p.status) : "No Invoice";
  const payUniqueStatuses = useMemo(() => [...new Set(allPayableRows.map(r => getDisplayedInvoiceStatus(r.payable)))].sort(), [allPayableRows]);
  const payUniqueEntities = useMemo(() => [...new Set(allPayableRows.map(r => r.payable.entityLabel))].sort(), [allPayableRows]);

  const payablesSorted = useMemo(() => applySortAndFilter(
    allPayableRows, paySort.sortKey, paySort.sortDir,
    (r, k) => {
      switch (k) {
        case "dealId": return r.deal.id;
        case "entity": return r.payable.entityLabel;
        case "type": return getEntityCategory(r.payable.entityType);
        case "ref": return r.payable.refNumber || "";
        case "entityInvoice": return r.payable.entityUploadedInvoice || "";
        case "status": return r.payable.status;
        case "amount": return r.payable.expectedAmount;
        case "paid": return r.payable.paidAmount ?? 0;
        default: return "";
      }
    },
    payFilters.filters,
    (r, k) => {
      switch (k) {
        case "entity": return r.payable.entityLabel;
        case "type": return getEntityCategory(r.payable.entityType);
        case "status": return getDisplayedInvoiceStatus(r.payable);
        default: return "";
      }
    }
  ), [allPayableRows, paySort.sortKey, paySort.sortDir, payFilters.filters]);

  return (
    <div className="space-y-6">
      {/* Summary Tiles */}
      <div className="grid grid-cols-6 gap-2">
        {tileConfig.map((tile) => {
          const data = tiles[tile.key];
          const isActive = activeTile === tile.key;
          return (
            <button
              key={tile.key}
              onClick={() => setActiveTile(isActive ? null : tile.key)}
              className={cn(
                "bg-card border rounded-lg px-3 py-2.5 text-left transition-all hover:shadow-sm",
                isActive ? "border-primary shadow-sm ring-1 ring-ring" : "border-border"
              )}
            >
              <p className="text-[11px] font-medium text-foreground/70 mb-1">{tile.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-[22px] font-bold leading-none", tile.color)}>{data.count}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">{formatAmount(data.volume, currency)}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/70 mt-1">{formatAmount(data.dealAmount, currency)} deal value</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Clients, Agents, Invoices"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-none text-[13px] bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex rounded-lg overflow-hidden bg-accent p-1 gap-2 w-fit">
        <button
          onClick={() => setActiveTab("receivables")}
          className={`flex items-center justify-center gap-2 min-w-[150px] px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${activeTab === "receivables" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <DollarSign className="h-4 w-4" />
          Receivables
        </button>
        <button
          onClick={() => setActiveTab("payables")}
          className={`flex items-center justify-center gap-2 min-w-[150px] px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${activeTab === "payables" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Send className="h-4 w-4" />
          Payables
        </button>
      </div>

      {/* RECEIVABLES */}
      {activeTab === "receivables" && (
        <>
          {/* Bulk download bar */}
          {(() => {
            const downloadableRows = receivableRowsSorted.filter(r => r.receivable.invoiceNumber && r.deal.status !== "under-review");
            const selectedDownloadable = downloadableRows.filter(r => selectedInvoiceIds.has(`${r.deal.id}-${r.idx}`));
            return downloadableRows.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground">
                  {receivableRowsSorted.length} receivable{receivableRowsSorted.length !== 1 ? "s" : ""} across {new Set(receivableRowsSorted.map(r => r.deal.id)).size} deals
                </p>
                {selectedDownloadable.length > 0 && (
                  <button
                    onClick={() => {
                      const invoices = selectedDownloadable.map(r => r.receivable.invoiceNumber).join(", ");
                      alert(`Downloading ${selectedDownloadable.length} invoice(s): ${invoices}`);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Selected
                    <span className="ml-0.5 px-1.5 py-0.5 text-[11px] rounded-full bg-primary/10 font-semibold">{selectedDownloadable.length} of {downloadableRows.length}</span>
                  </button>
                )}
              </div>
            );
          })()}
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[13px] min-w-[1200px]">
              <thead>
                <tr>
                  <th className={`${thBase} w-10`}>
                    <Checkbox
                      checked={(() => {
                        const downloadable = receivableRowsSorted.filter(r => r.receivable.invoiceNumber && r.deal.status !== "under-review");
                        return downloadable.length > 0 && downloadable.every(r => selectedInvoiceIds.has(`${r.deal.id}-${r.idx}`));
                      })()}
                      onCheckedChange={(checked) => {
                        const downloadable = receivableRowsSorted.filter(r => r.receivable.invoiceNumber && r.deal.status !== "under-review");
                        if (checked) {
                          setSelectedInvoiceIds(new Set(downloadable.map(r => `${r.deal.id}-${r.idx}`)));
                        } else {
                          setSelectedInvoiceIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <SortableHeader label="Deal ID" sortKey="id" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false} />
                  <SortableHeader label="Report Date" sortKey="reportDate" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} />
                  <SortableHeader label="Deal Status" sortKey="status" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false}
                    filterable filterOptions={recUniqueStatuses} filterValues={recFilters.filters.status} onFilterChange={(s) => recFilters.setFilter("status", s)}
                    openFilter={recFilters.openFilter} filterKey="status" onFilterToggle={recFilters.toggleFilter} />
                  <SortableHeader label="Entity" sortKey="entity" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false}
                    filterable filterOptions={recUniqueEntities} filterValues={recFilters.filters.entity} onFilterChange={(s) => recFilters.setFilter("entity", s)}
                    openFilter={recFilters.openFilter} filterKey="entity" onFilterToggle={recFilters.toggleFilter} />
                  <SortableHeader label="Type" sortKey="entityType" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false} />
                  <SortableHeader label="Amount" sortKey="revenue" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} align="right" />
                  <SortableHeader label="Invoice" sortKey="invoiceNumber" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false} align="center" />
                  <SortableHeader label="Invoice Status" sortKey="invoiceStatus" currentSortKey={recSort.sortKey} sortDir={recSort.sortDir} onSort={recSort.handleSort} sortable={false} align="center"
                    filterable filterOptions={recUniqueInvStatuses} filterValues={recFilters.filters.invoiceStatus} onFilterChange={(s) => recFilters.setFilter("invoiceStatus", s)}
                    openFilter={recFilters.openFilter} filterKey="invoiceStatus" onFilterToggle={recFilters.toggleFilter} />
                  
                </tr>
              </thead>
              <tbody>
                {receivableRowsSorted.map(({ deal, receivable, idx }) => {
                  const rowKey = `${deal.id}-${idx}`;
                  const canCreateInvoice = deal.status === "pending-agent-approval" && (!receivable.invoiceStatus || receivable.invoiceStatus === "created");
                  const entityTypeLabel = receivable.entityType.charAt(0).toUpperCase() + receivable.entityType.slice(1);

                  return (
                    <tr key={rowKey} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 border-r border-r-border/40">
                        {receivable.invoiceNumber && deal.status !== "under-review" ? (
                          <Checkbox
                            checked={selectedInvoiceIds.has(rowKey)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedInvoiceIds);
                              if (checked) next.add(rowKey); else next.delete(rowKey);
                              setSelectedInvoiceIds(next);
                            }}
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium border-r border-r-border/40">
                        <a href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{deal.id}</a>
                      </td>
                      <td className="px-4 py-3 text-foreground border-r border-r-border/40 whitespace-nowrap">
                        {deal.reportDate ? new Date(deal.reportDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 border-r border-r-border/40">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", dealStatusColor(deal.status))}>{deal.status}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground border-r border-r-border/40">{receivable.entityName}</td>
                      <td className="px-4 py-3 text-foreground border-r border-r-border/40 capitalize text-[12px]">{entityTypeLabel}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground border-r border-r-border/40">{formatAmount(receivable.amount, currency)}</td>
                      <td className="px-4 py-3 text-center border-r border-r-border/40">
                        {deal.status === "under-review" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : receivable.invoiceNumber ? (
                          <button onClick={() => setViewingReceivableInvoice(deal)} className="inline-flex items-center justify-center gap-1.5 min-w-[130px] px-3 py-1.5 text-[12px] font-medium rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                            <Receipt className="h-3.5 w-3.5" /> {receivable.invoiceNumber}
                          </button>
                        ) : canCreateInvoice ? (
                          <button
                            onClick={() => setCreatingInvoiceFor(deal)}
                            className="inline-flex items-center justify-center gap-1.5 min-w-[130px] px-3 py-1.5 text-[12px] font-medium border border-border rounded-md bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Create Invoice
                          </button>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {deal.status === "under-review" ? (
                          <span className="text-muted-foreground text-[11px]">No invoice</span>
                        ) : receivable.invoiceNumber ? (
                          <select
                            value={deal.status === "finalized" ? "paid" : (receivable.invoiceStatus || "issued")}
                            onChange={(e) => {
                              const newStatus = e.target.value as InvoiceStatus;
                              if (onDealUpdate) {
                                const updatedReceivables = [...(deal.receivables || [])];
                                updatedReceivables[idx] = { ...receivable, invoiceStatus: newStatus };
                                const allPaid = updatedReceivables.every((r) => r.invoiceStatus === "paid");
                                const updatedDealStatus = allPaid && deal.status === "pending-receivables" ? "finalized" : deal.status;
                                onDealUpdate({ ...deal, receivables: updatedReceivables, invoiceStatus: newStatus, status: updatedDealStatus });
                              }
                            }}
                            className={cn(
                              "px-2 py-1 rounded-full text-[11px] font-medium border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none pr-5 bg-no-repeat text-center",
                              invoiceStatusColor(deal.status === "finalized" ? "paid" : (receivable.invoiceStatus || "issued"))
                            )}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 6px center", backgroundSize: "10px" }}
                          >
                            {(["issued", "paid", "cancelled"] as InvoiceStatus[]).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">No invoice</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {receivableRowsSorted.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-muted-foreground text-[13px]">No deals matching this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PAYABLES */}
      {activeTab === "payables" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-muted-foreground">
              {payablesSorted.length} payable{payablesSorted.length !== 1 ? "s" : ""} across {new Set(payablesSorted.map(r => r.deal.id)).size} deals
            </p>
            {payablesSorted.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Payment Confirmation File
                </button>
                <button
                  onClick={() => { setShowDownloadSummary(true); setDownloadType("internal"); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Internal Payment File
                </button>
                <button
                  onClick={() => { setShowDownloadSummary(true); setDownloadType("external"); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4" />
                  External Payment File
                </button>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[13px] min-w-[1200px]">
              <thead>
                <tr>
                  <SortableHeader label="Deal ID" sortKey="dealId" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false} />
                  <SortableHeader label="Entity" sortKey="entity" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false}
                    filterable filterOptions={payUniqueEntities} filterValues={payFilters.filters.entity} onFilterChange={(s) => payFilters.setFilter("entity", s)}
                    openFilter={payFilters.openFilter} filterKey="entity" onFilterToggle={payFilters.toggleFilter} />
                  <SortableHeader label="Type" sortKey="type" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false}
                    filterable filterOptions={payUniqueTypes} filterValues={payFilters.filters.type} onFilterChange={(s) => payFilters.setFilter("type", s)}
                    openFilter={payFilters.openFilter} filterKey="type" onFilterToggle={payFilters.toggleFilter} />
                  
                  <SortableHeader label="Entity Invoice" sortKey="entityInvoice" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false} />
                  <SortableHeader label="Invoice Status" sortKey="status" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false}
                    filterable filterOptions={payUniqueStatuses} filterValues={payFilters.filters.status} onFilterChange={(s) => payFilters.setFilter("status", s)}
                    openFilter={payFilters.openFilter} filterKey="status" onFilterToggle={payFilters.toggleFilter} />
                  <SortableHeader label="Amount" sortKey="amount" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} align="right" />
                  <SortableHeader label="Paid Amount" sortKey="paid" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} align="right" />
                  <SortableHeader label="Reference" sortKey="ref2" currentSortKey={paySort.sortKey} sortDir={paySort.sortDir} onSort={paySort.handleSort} sortable={false} />
                </tr>
              </thead>
              <tbody>
                {payablesSorted.map(({ deal, payable, idx }) => {
                  const paidDelta = payable.paidAmount != null ? payable.paidAmount - payable.expectedAmount : null;
                  return (
                    <tr key={`${deal.id}-${idx}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium border-r border-r-border/40">
                        <a href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{deal.id}</a>
                      </td>
                      <td className="px-4 py-3 text-foreground border-r border-r-border/40">{payable.entityLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize border-r border-r-border/40">{getEntityCategory(payable.entityType)}</td>
                      
                      <td className="px-4 py-3 border-r border-r-border/40">
                        {payable.entityUploadedInvoice ? (
                          <button onClick={() => setViewingInvoice({ payable, deal })} className="inline-flex items-center justify-center gap-1 whitespace-nowrap px-2.5 py-1 text-[11px] font-medium rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                            <Receipt className="h-3 w-3 shrink-0" /> {payable.entityUploadedInvoice}
                          </button>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-r-border/40 whitespace-nowrap">
                        {payable.entityUploadedInvoice ? (
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", payableStatusColor(payable.status))}>{payableStatusDisplayLabel(payable.status)}</span>
                        ) : (
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground")}>No Invoice</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground border-r border-r-border/40">{formatAmount(payable.expectedAmount, currency)}</td>
                      <td className="px-4 py-3 text-right border-r border-r-border/40">
                        {payable.paidAmount != null ? (
                          <span className="text-foreground">
                            {formatAmount(payable.paidAmount, currency)}
                            {paidDelta != null && paidDelta !== 0 && (
                              <span className={cn("ml-1 text-[11px]", paidDelta > 0 ? "text-[hsl(var(--deal-paid))]" : "text-destructive")}>
                                ({paidDelta > 0 ? "+" : ""}{formatAmount(paidDelta, currency)})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {payable.status === "paid" && payable.refNumber ? payable.refNumber : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {payablesSorted.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-[13px]">No payables found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {creatingInvoiceFor && (
        <CreateInvoiceModal
          deal={creatingInvoiceFor}
          currency={currency}
          onClose={() => setCreatingInvoiceFor(null)}
          onSave={(invoices) => handleCreateInvoice(creatingInvoiceFor, invoices)}
        />
      )}

      {/* Entity Invoice Modal */}
      {viewingInvoice && (
        <EntityInvoiceModal payable={viewingInvoice.payable} deal={viewingInvoice.deal} currency={currency} onClose={() => setViewingInvoice(null)} onApprove={() => {
          const updatedPayables = viewingInvoice.deal.payables.map(p =>
            p.entityLabel === viewingInvoice.payable.entityLabel ? { ...p, status: "approved" as PayableStatus } : p
          );
          const updatedDeal = { ...viewingInvoice.deal, payables: updatedPayables };
          onDealUpdate(updatedDeal);
          setViewingInvoice({ ...viewingInvoice, deal: updatedDeal, payable: { ...viewingInvoice.payable, status: "approved" as PayableStatus } });
        }} />
      )}

      {/* Receivable Invoice Modal */}
      {viewingReceivableInvoice && (
        <ReceivableInvoiceModal deal={viewingReceivableInvoice} currency={currency} onClose={() => setViewingReceivableInvoice(null)} />
      )}

      {/* Download Summary Modal */}
      {showDownloadSummary && (() => {
        const rows = downloadType === "internal" ? approvedInternalRows : approvedExternalRows;
        const label = downloadType === "internal" ? "Internal" : "External";
        const dealCount = new Set(rows.map(r => r.deal.id)).size;
        const totalAmount = rows.reduce((s, r) => s + r.payable.expectedAmount, 0);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDownloadSummary(false)}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] text-foreground">{label} Payment File Summary</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Only approved {label.toLowerCase()} payables are included</p>
                </div>
              </div>
              <button onClick={() => setShowDownloadSummary(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-[13px] text-muted-foreground">Approved Invoices</span>
                <span className="text-[18px] font-bold text-foreground">{rows.length}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-[13px] text-muted-foreground">Across Deals</span>
                <span className="text-[18px] font-bold text-foreground">{dealCount}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-muted-foreground">Total Amount</span>
                <span className="text-[18px] font-bold text-[hsl(var(--deal-paid))]">{formatAmount(totalAmount, currency)}</span>
              </div>
              {rows.length === 0 && (
                <p className="text-[13px] text-muted-foreground text-center py-2">No approved {label.toLowerCase()} payables to download.</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowDownloadSummary(false)} className="px-4 py-2 text-[13px] font-medium text-foreground border border-border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={() => { downloadPaymentCSV(rows, label.toLowerCase()); setShowDownloadSummary(false); }}
                disabled={rows.length === 0}
                className={cn("inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-md", rows.length > 0 ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed")}
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Upload Payment Confirmation File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowUploadModal(false); setUploadedFileName(null); }}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] text-foreground">Upload Payment Confirmation File</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Upload a CSV to mark approved payables as paid</p>
                </div>
              </div>
              <button onClick={() => { setShowUploadModal(false); setUploadedFileName(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <input
                ref={uploadFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUploadPaymentFile}
              />
              {!uploadedFileName ? (
                <button
                  onClick={() => uploadFileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-foreground">Click to upload CSV</p>
                    <p className="text-[12px] text-muted-foreground mt-1">Select the payment file to process</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{uploadedFileName}</p>
                      <p className="text-[12px] text-muted-foreground">CSV file uploaded</p>
                    </div>
                    <button onClick={() => setUploadedFileName(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-muted-foreground">Approved payables to mark as Paid</span>
                    <span className="text-[18px] font-bold text-foreground">{approvedPayableRows.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-muted-foreground">Across Deals</span>
                    <span className="text-[18px] font-bold text-foreground">{new Set(approvedPayableRows.map(r => r.deal.id)).size}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[13px] text-muted-foreground">Total Amount</span>
                    <span className="text-[18px] font-bold text-[hsl(var(--deal-paid))]">{formatAmount(approvedPayableRows.reduce((s, r) => s + r.payable.expectedAmount, 0), currency)}</span>
                  </div>
                  {approvedPayableRows.length === 0 && (
                    <p className="text-[13px] text-muted-foreground text-center py-2">No approved payables to process.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setShowUploadModal(false); setUploadedFileName(null); }} className="px-4 py-2 text-[13px] font-medium text-foreground border border-border rounded-md hover:bg-muted">Cancel</button>
              <button
                onClick={handleConfirmUpload}
                disabled={!uploadedFileName || approvedPayableRows.length === 0}
                className={cn("inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-md", uploadedFileName && approvedPayableRows.length > 0 ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed")}
              >
                <CheckCircle className="h-4 w-4" />
                Process & Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- FinanceMonthCalendar removed — now using shared DateRangePicker ---- */