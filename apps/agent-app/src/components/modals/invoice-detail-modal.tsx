import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { StatementOfAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, User, Calendar, Hash, CreditCard } from 'lucide-react';

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: StatementOfAccount;
}

type InvoicePaymentStatus = 'in-review' | 'payment-pending' | 'payment-processing' | 'paid';

function getPaymentStatus(statementStatus: string): InvoicePaymentStatus {
  if (statementStatus === 'paid') return 'paid';
  if (statementStatus === 'confirmed') return 'payment-pending';
  return 'in-review';
}

const paymentStatusConfig: Record<InvoicePaymentStatus, { label: string; color: string; bg: string }> = {
  'in-review': {
    label: 'In Review',
    color: 'hsl(var(--ds-orange))',
    bg: 'hsl(var(--ds-orange) / 0.1)',
  },
  'payment-pending': {
    label: 'Payment Pending',
    color: 'hsl(var(--accent-teal))',
    bg: 'hsl(var(--accent-teal) / 0.1)',
  },
  'payment-processing': {
    label: 'Payment Processing',
    color: 'hsl(var(--accent-indigo))',
    bg: 'hsl(var(--accent-indigo) / 0.1)',
  },
  paid: {
    label: 'Paid',
    color: 'hsl(var(--ds-green))',
    bg: 'hsl(var(--ds-green) / 0.1)',
  },
};

const categoryLabels: Record<string, string> = {
  'deal-commission': 'Deal Commission',
  'referral-commission': 'Referral Commission',
  'support-fee': 'Platform Fee',
  'clawback': 'Clawback',
  'other': 'Other',
};

export function InvoiceDetailModal({ open, onOpenChange, statement }: InvoiceDetailModalProps) {
  const paymentStatus = getPaymentStatus(statement.status);
  const statusConfig = paymentStatusConfig[paymentStatus];

  const invoiceNumber = `INV-${statement.id.replace('stmt-', '').toUpperCase()}-${statement.cycleLabel.replace(/\s/g, '').toUpperCase()}`;
  const issueDate = new Date(statement.generatedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dueDate = new Date(new Date(statement.generatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const credits = statement.lineItems.filter(li => li.type === 'credit');
  const debits = statement.lineItems.filter(li => li.type === 'debit');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">Invoice Details</DialogTitle>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-ds-primary">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}
              >
                <FileText className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">Invoice</h2>
                <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary">{invoiceNumber}</p>
              </div>
            </div>
            <Badge
              className="rounded-full px-3 py-1 text-[12px] font-semibold border-0"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b border-border-ds-primary">
          {/* Invoice From (Agent) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-fg-secondary">
              <User className="w-4 h-4" />
              <span className="text-[12px] font-semibold leading-[140%] uppercase tracking-wide">Invoice From</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-[120%] text-foreground">Alejandro Reyes Inmobiliaria</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">Calle Gran Vía 28, 5º B</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">28013 Madrid, Spain</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">NIF: 12345678A</p>
            </div>
          </div>

          {/* Invoice To (huspy) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-fg-secondary">
              <Building2 className="w-4 h-4" />
              <span className="text-[12px] font-semibold leading-[140%] uppercase tracking-wide">Invoice To</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold leading-[120%] text-foreground">huspy Technologies S.L.</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">Calle de Serrano 41, 3ª Planta</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">28001 Madrid, Spain</p>
              <p className="text-[12px] leading-[140%] text-fg-secondary">CIF: B-12345678</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="px-6 py-3 flex items-center gap-6 border-b border-border-ds-primary">
          <div className="flex items-center gap-2 text-[12px] leading-[140%]">
            <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
            <span className="text-fg-secondary">Issue Date:</span>
            <span className="font-semibold text-foreground">{issueDate}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] leading-[140%]">
            <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
            <span className="text-fg-secondary">Due Date:</span>
            <span className="font-semibold text-foreground">{dueDate}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] leading-[140%]">
            <Hash className="w-3.5 h-3.5 text-fg-secondary" />
            <span className="text-fg-secondary">Cycle:</span>
            <span className="font-semibold text-foreground">{statement.cycleLabel}</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-6 py-4">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_100px_100px] px-3 py-2 text-[12px] font-semibold leading-[140%] text-fg-secondary uppercase tracking-wide">
            <span>Description</span>
            <span className="text-right">Type</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Credits */}
          {credits.length > 0 && (
            <div className="divide-y divide-border-ds-primary">
              {credits.map(item => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_100px_100px] px-3 py-3 items-center"
                >
                  <div>
                    <p className="text-[14px] font-semibold leading-[120%] text-foreground">{item.description}</p>
                    <p className="text-[12px] leading-[140%] text-fg-secondary">{categoryLabels[item.category] || item.category}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-right" style={{ color: 'hsl(var(--ds-green))' }}>
                    Credit
                  </span>
                  <span className="text-[14px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>
                    +€{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Debits */}
          {debits.length > 0 && (
            <div className="divide-y divide-border-ds-primary">
              {debits.map(item => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_100px_100px] px-3 py-3 items-center"
                >
                  <div>
                    <p className="text-[14px] font-semibold leading-[120%] text-foreground">{item.description}</p>
                    <p className="text-[12px] leading-[140%] text-fg-secondary">{categoryLabels[item.category] || item.category}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-right" style={{ color: 'hsl(var(--ds-red))' }}>
                    Debit
                  </span>
                  <span className="text-[14px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>
                    −€{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Subtotals */}
          <div className="mt-4 border-t border-border-ds-primary pt-4 space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Total Credits</span>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>
                +€{statement.totalCredit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between px-3">
              <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Total Debits</span>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>
                −€{statement.totalDebit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total */}
          <div
            className="mt-4 rounded-xl px-4 py-4 flex items-center justify-between"
            style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
              <span className="text-[14px] font-semibold leading-[120%] text-foreground">Amount Due</span>
            </div>
            <span className="text-[24px] font-semibold tabular-nums" style={{ color: 'hsl(var(--accent-teal))' }}>
              €{statement.balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Info Footer */}
        <div className="px-6 py-4 border-t border-border-ds-primary bg-surface-ds-raised/50">
          <div className="grid grid-cols-3 gap-4 text-[12px] leading-[140%]">
            <div>
              <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Payment Method</p>
              <p className="text-foreground">Bank Transfer (SEPA)</p>
            </div>
            <div>
              <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Bank Account</p>
              <p className="text-foreground">ES91 2100 0418 4502 0005 1332</p>
            </div>
            <div>
              <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Reference</p>
              <p className="text-foreground">{invoiceNumber}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
