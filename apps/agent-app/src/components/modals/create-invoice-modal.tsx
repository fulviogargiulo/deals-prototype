import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { StatementOfAccount } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Building2, User, Calendar, Hash, CreditCard, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createInvoice } from '@/data/earningsStore';
import { sharedAgents } from '@huspy/shared-domain';

const MARKET_CONFIG = {
  es: {
    vatLabel: 'IVA', vatRate: 21,
    hasWithholding: true, withholdingLabel: 'IRPF', defaultWithholdingRate: 15,
    currency: 'EUR', symbol: '€',
    paymentMethod: 'Bank Transfer (SEPA)',
    taxIdLabel: 'NIF',
    agentAddressPlaceholder: 'Calle Gran Vía 28, 5º B, 28013 Madrid',
    agentTaxIdPlaceholder: '12345678A',
    bankPlaceholder: 'ES91 2100 0418 4502 0005 1332',
    huspy: { name: 'huspy Technologies S.L.', address: 'Calle de Serrano 41, 3ª Planta', city: '28001 Madrid, Spain', taxId: 'CIF: B-12345678' },
  },
  ae: {
    vatLabel: 'VAT', vatRate: 5,
    hasWithholding: false, withholdingLabel: '', defaultWithholdingRate: 0,
    currency: 'AED', symbol: 'د.إ',
    paymentMethod: 'Bank Transfer (Wire)',
    taxIdLabel: 'TRN',
    agentAddressPlaceholder: 'DIFC, Gate Building, Dubai, UAE',
    agentTaxIdPlaceholder: '100XXXXXXXXX003',
    bankPlaceholder: 'AE07 0331 2345 6789 0123 456',
    huspy: { name: 'Huspy Real Estate L.L.C.', address: 'DIFC, Gate Building, Level 1', city: 'Dubai, UAE', taxId: 'TRN: 100123456789003' },
  },
  sa: {
    vatLabel: 'VAT', vatRate: 15,
    hasWithholding: false, withholdingLabel: '', defaultWithholdingRate: 0,
    currency: 'SAR', symbol: '﷼',
    paymentMethod: 'Bank Transfer (Wire)',
    taxIdLabel: 'VAT No.',
    agentAddressPlaceholder: 'King Fahd Road, Olaya, Riyadh',
    agentTaxIdPlaceholder: '310XXXXXXXXX003',
    bankPlaceholder: 'SA03 8000 0000 6080 1016 7519',
    huspy: { name: 'Huspy Real Estate Co.', address: 'King Fahd Road', city: 'Riyadh 12214, Saudi Arabia', taxId: 'VAT: 310123456789003' },
  },
} as const;

type MarketKey = keyof typeof MARKET_CONFIG;

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: StatementOfAccount;
  agentId: string;
  country?: string;
  onInvoiceCreated?: () => void;
}

const categoryLabels: Record<string, string> = {
  'deal-commission': 'Deal Commission',
  'referral-commission': 'Referral Commission',
  'support-fee': 'Platform Fee',
  'clawback': 'Clawback',
  'other': 'Other',
};

export function CreateInvoiceModal({ open, onOpenChange, statement, agentId, country, onInvoiceCreated }: CreateInvoiceModalProps) {
  const cfg = MARKET_CONFIG[(country as MarketKey) ?? 'ae'] ?? MARKET_CONFIG.ae;

  const [isCreated, setIsCreated] = useState(false);

  const defaultInvoiceNumber = `INV-${statement.id.replace('stmt-', '').toUpperCase()}-${statement.cycleLabel.replace(/\s/g, '').toUpperCase()}`;
  const defaultIssueDate = new Date(statement.generatedAt).toISOString().slice(0, 10);
  const defaultDueDate = new Date(new Date(statement.generatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [issueDate, setIssueDate] = useState(defaultIssueDate);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [agentName, setAgentName] = useState('');
  const [agentAddress, setAgentAddress] = useState('');
  const [agentTaxId, setAgentTaxId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [withholdingRate, setWithholdingRate] = useState(cfg.defaultWithholdingRate);

  const base = statement.balance;
  const vatAmount = Math.round(base * (cfg.vatRate / 100) * 100) / 100;
  const withholdingAmount = cfg.hasWithholding ? Math.round(base * (withholdingRate / 100) * 100) / 100 : 0;
  const grossAmount = Math.round((base + vatAmount) * 100) / 100;
  const netPayout = Math.round((grossAmount - withholdingAmount) * 100) / 100;

  const sym = cfg.symbol;
  const credits = statement.lineItems.filter(li => li.type === 'credit');
  const debits  = statement.lineItems.filter(li => li.type === 'debit');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleCreate = () => {
    const now = new Date().toISOString();
    const lineIds = statement.lineItems.map(li => li.id);
    const agentPartyId = sharedAgents.find((a) => a.id === agentId)?.partyId ?? agentId;
    createInvoice(
      {
        id: `inv-${Date.now()}`,
        direction: 'inbound',
        partyId: agentPartyId,
        invoiceNumber,
        period: statement.period,
        status: 'issued',
        currency: cfg.currency,
        subtotal: base,
        vatAmount,
        withholdingAmount: cfg.hasWithholding ? withholdingAmount : undefined,
        issueDate,
        dueDate,
        createdAt: now,
        updatedAt: now,
      },
      lineIds
    );
    setIsCreated(true);
    toast.success('Invoice created successfully and is now under review');
    onInvoiceCreated?.();
  };

  const handleClose = (openState: boolean) => {
    if (!openState) setTimeout(() => setIsCreated(false), 300);
    onOpenChange(openState);
  };

  const statusConfig = { label: 'In Review', color: 'hsl(var(--ds-orange))', bg: 'hsl(var(--ds-orange) / 0.1)' };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">
          {isCreated ? 'Invoice Details' : 'Please create your invoice'}
        </DialogTitle>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border-ds-primary">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">
                    {isCreated ? 'Invoice' : 'Generate Statement'}
                  </h2>
                  <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary">
                    {isCreated ? invoiceNumber : `Statement: ${statement.cycleLabel}`}
                  </p>
                </div>
              </div>
              {isCreated && (
                <Badge className="rounded-full px-3 py-1 text-[12px] font-semibold border-0" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                  {statusConfig.label}
                </Badge>
              )}
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
              {isCreated ? (
                <div>
                  <p className="text-[14px] font-semibold leading-[120%] text-foreground">{agentName || '—'}</p>
                  <p className="text-[12px] leading-[140%] text-fg-secondary">{agentAddress}</p>
                  <p className="text-[12px] leading-[140%] text-fg-secondary">{cfg.taxIdLabel}: {agentTaxId}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-8 text-[14px] rounded-lg" placeholder="Business / legal name" />
                  <Input value={agentAddress} onChange={(e) => setAgentAddress(e.target.value)} className="h-8 text-[12px] rounded-lg" placeholder={cfg.agentAddressPlaceholder} />
                  <Input value={agentTaxId} onChange={(e) => setAgentTaxId(e.target.value)} className="h-8 text-[12px] rounded-lg" placeholder={`${cfg.taxIdLabel}: ${cfg.agentTaxIdPlaceholder}`} />
                </div>
              )}
            </div>

            {/* Invoice To (Huspy) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-fg-secondary">
                <Building2 className="w-4 h-4" />
                <span className="text-[12px] font-semibold leading-[140%] uppercase tracking-wide">Invoice To</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold leading-[120%] text-foreground">{cfg.huspy.name}</p>
                <p className="text-[12px] leading-[140%] text-fg-secondary">{cfg.huspy.address}</p>
                <p className="text-[12px] leading-[140%] text-fg-secondary">{cfg.huspy.city}</p>
                <p className="text-[12px] leading-[140%] text-fg-secondary">{cfg.huspy.taxId}</p>
              </div>
            </div>
          </div>

          {/* Dates & Invoice Number */}
          <div className="px-6 py-3 flex items-center gap-4 border-b border-border-ds-primary flex-wrap">
            {isCreated ? (
              <>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Hash className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary">Invoice #:</span>
                  <span className="font-semibold text-foreground">{invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary">Issue Date:</span>
                  <span className="font-semibold text-foreground">{formatDate(issueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary">Due Date:</span>
                  <span className="font-semibold text-foreground">{formatDate(dueDate)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Hash className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary whitespace-nowrap">Invoice #</span>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="h-7 text-[12px] rounded-lg w-48" />
                </div>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary whitespace-nowrap">Issue</span>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-7 text-[12px] rounded-lg w-36" />
                </div>
                <div className="flex items-center gap-2 text-[12px] leading-[140%]">
                  <Calendar className="w-3.5 h-3.5 text-fg-secondary" />
                  <span className="text-fg-secondary whitespace-nowrap">Due</span>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-7 text-[12px] rounded-lg w-36" />
                </div>
              </>
            )}
          </div>

          {/* Line Items */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-[1fr_100px_100px] px-3 py-2 text-[12px] font-semibold leading-[140%] text-fg-secondary uppercase tracking-wide">
              <span>Description</span>
              <span className="text-right">Type</span>
              <span className="text-right">Amount</span>
            </div>

            {credits.length > 0 && (
              <div className="divide-y divide-border-ds-primary">
                {credits.map(item => (
                  <div key={item.id} className="grid grid-cols-[1fr_100px_100px] px-3 py-3 items-center">
                    <div>
                      <p className="text-[14px] font-semibold leading-[120%] text-foreground">{item.description}</p>
                      <p className="text-[12px] leading-[140%] text-fg-secondary">{categoryLabels[item.category] || item.category}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-right" style={{ color: 'hsl(var(--ds-green))' }}>Credit</span>
                    <span className="text-[14px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>
                      +{sym}{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {debits.length > 0 && (
              <div className="divide-y divide-border-ds-primary">
                {debits.map(item => (
                  <div key={item.id} className="grid grid-cols-[1fr_100px_100px] px-3 py-3 items-center">
                    <div>
                      <p className="text-[14px] font-semibold leading-[120%] text-foreground">{item.description}</p>
                      <p className="text-[12px] leading-[140%] text-fg-secondary">{categoryLabels[item.category] || item.category}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-right" style={{ color: 'hsl(var(--ds-red))' }}>Debit</span>
                    <span className="text-[14px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>
                      −{sym}{item.amount.toLocaleString()}
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
                  +{sym}{statement.totalCredit.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Total Debits</span>
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>
                  −{sym}{statement.totalDebit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tax breakdown */}
            <div className="mt-4 border-t border-border-ds-primary pt-4 space-y-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Base</span>
                <span className="text-[14px] font-semibold tabular-nums text-foreground">{sym}{base.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between px-3">
                <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">{cfg.vatLabel} ({cfg.vatRate}%)</span>
                <span className="text-[14px] font-semibold tabular-nums text-foreground">+{sym}{vatAmount.toLocaleString()}</span>
              </div>
              {cfg.hasWithholding && (
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">{cfg.withholdingLabel}</span>
                    {isCreated ? (
                      <span className="text-[12px] font-semibold text-fg-secondary">({withholdingRate}%)</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input type="number" value={withholdingRate} onChange={(e) => setWithholdingRate(Number(e.target.value))} className="h-6 text-[12px] rounded-lg w-14 text-center" min={0} max={25} />
                        <span className="text-[12px] text-fg-secondary">%</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[14px] font-semibold tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>
                    −{sym}{withholdingAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Amount Due */}
            <div className="mt-4 rounded-xl px-4 py-4 space-y-2" style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold leading-[140%] text-fg-secondary">Invoice Total (incl. {cfg.vatLabel})</span>
                <span className="text-[16px] font-semibold tabular-nums text-foreground">{sym}{grossAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
                  <span className="text-[14px] font-semibold leading-[120%] text-foreground">Net Payout to You</span>
                </div>
                <span className="text-[24px] font-semibold tabular-nums" style={{ color: 'hsl(var(--accent-teal))' }}>
                  {sym}{netPayout.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="px-6 py-4 border-t border-border-ds-primary bg-surface-ds-raised/50">
            <div className="grid grid-cols-3 gap-4 text-[12px] leading-[140%]">
              <div>
                <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Payment Method</p>
                <p className="text-foreground">{cfg.paymentMethod}</p>
              </div>
              <div>
                <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Bank Account</p>
                {isCreated ? (
                  <p className="text-foreground">{bankAccount || '—'}</p>
                ) : (
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="h-7 text-[12px] rounded-lg mt-0.5" placeholder={cfg.bankPlaceholder} />
                )}
              </div>
              <div>
                <p className="font-semibold text-fg-secondary uppercase tracking-wide mb-1">Reference</p>
                <p className="text-foreground">{invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        {!isCreated && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-border-ds-primary bg-card">
            <Button
              className="w-full h-11 rounded-full text-[14px] font-semibold"
              style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
              onClick={handleCreate}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
