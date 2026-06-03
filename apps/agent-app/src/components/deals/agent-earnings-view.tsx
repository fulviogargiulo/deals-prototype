import { useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { sharedPostings, sharedAgents, sharedLedgers } from '@huspy/shared-domain';
import type { PostingLine } from '@huspy/shared-domain';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, TrendingUp, ArrowDownLeft, ArrowUpRight, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateInvoiceModal } from '@/components/modals/create-invoice-modal';
import { UploadInvoiceModal } from '@/components/modals/upload-invoice-modal';
import { getPostingLines, getInvoices } from '@/data/earningsStore';
import { useDevTools } from '@/contexts/dev-tools-context';
import type { StatementOfAccount } from '@/types';


const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', AED: 'د.إ', SAR: '﷼' };

function formatAmount(amount: number, side: PostingLine['side'], currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sign = side === 'CREDIT' ? '+' : '−';
  const color = side === 'CREDIT' ? 'hsl(var(--ds-green))' : 'hsl(var(--ds-red))';
  return { text: `${sign}${symbol}${amount.toLocaleString()}`, color };
}

const PROCESS_LABELS: Record<string, string> = {
  commission_accrual: 'commission',
  agent_adjustment:   'adjustment',
  huspy_fee:          'fee',
  manual_adjustment: 'adjustment',
};

function processLabel(businessProcess: string): string {
  return PROCESS_LABELS[businessProcess] ?? businessProcess.replace(/_/g, ' ');
}

function invoiceStatusStyle(status: string) {
  switch (status) {
    case 'paid':         return { color: 'hsl(var(--ds-green))',      bg: 'hsl(var(--ds-green)      / 0.1)' };
    case 'issued':       return { color: 'hsl(var(--accent-indigo))', bg: 'hsl(var(--accent-indigo) / 0.1)' };
    case 'acknowledged': return { color: 'hsl(var(--accent-teal))',   bg: 'hsl(var(--accent-teal)   / 0.1)' };
    case 'disputed':     return { color: 'hsl(var(--ds-red))',        bg: 'hsl(var(--ds-red)        / 0.1)' };
    default:             return { color: 'hsl(var(--fg-secondary))',   bg: 'hsl(var(--fg-secondary)  / 0.1)' };
  }
}

type EarningsMode = 'all' | 'custom';

export function AgentEarningsView() {
  const { activeAgentId } = useDevTools();
  const activeAgent = sharedAgents.find(a => a.id === activeAgentId) ?? sharedAgents[0];
  const agentPartyId = activeAgent.partyId;
  const agentLedgerId = sharedLedgers.find(l => l.name === `AgentLiability_${activeAgent.id}`)?.id;
  const isSpain = activeAgent.country === 'es';
  const isSalaried = activeAgent.employmentType === 'salaried';

  const [mode, setMode] = useState<EarningsMode>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [showGenerateStatement, setShowGenerateStatement] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const dateRange = mode === 'custom' && customFrom && customTo ? { from: customFrom, to: customTo } : null;

  const handleModeChange = (m: EarningsMode) => {
    setMode(m);
    if (m !== 'custom') { setCustomFrom(undefined); setCustomTo(undefined); }
  };

  const pillClass = (active: boolean) => cn(
    'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
    active
      ? 'bg-foreground text-background'
      : 'bg-surface-ds-raised text-fg-secondary hover:bg-surface-ds-raised/80'
  );

  const allAgentInvoices = getInvoices().filter(i => i.direction === "inbound" && i.partyId === agentPartyId);
  // Map invoiceId → invoiceNumber for the Invoice column in the ledger table.
  const invoiceNumberMap = new Map(allAgentInvoices.map(i => [i.id, i.invoiceNumber]));

  // All PostingLines on this agent's subledger, joined with parent Posting.
  // Settlement entries are excluded — they are internal bookkeeping (payout cash movement)
  // and have no meaning for the agent's earnings view.
  const agentLines = getPostingLines()
    .filter(l => l.ledgerId === agentLedgerId)
    .map(l => ({ ...l, posting: sharedPostings.find(p => p.id === l.postingId)! }))
    .filter(l => !!l.posting)
    .sort((a, b) => a.posting.valueDate.localeCompare(b.posting.valueDate));

  const filteredLines = dateRange
    ? agentLines.filter(l => isWithinInterval(parseISO(l.posting.valueDate), { start: dateRange.from, end: dateRange.to }))
    : agentLines;

  const filteredInvoices = dateRange
    ? allAgentInvoices.filter(i => isWithinInterval(parseISO(i.issueDate), { start: dateRange.from, end: dateRange.to }))
    : allAgentInvoices;

  const STATEMENT_ELIGIBLE_PROCESSES = new Set(['commission_accrual', 'agent_adjustment', 'huspy_fee']);
  const statementEligibleLines = filteredLines.filter(l => !l.invoiceId && STATEMENT_ELIGIBLE_PROCESSES.has(l.posting.businessProcess));
  const canGenerateStatement = statementEligibleLines.length > 0;

  const periodNet = filteredLines.reduce((s, l) => l.side === 'CREDIT' ? s + l.amount : s - l.amount, 0);

  const cycleLabel = dateRange
    ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
    : 'All periods';

  const pendingStatement: StatementOfAccount = {
    id: 'pending-stmt',
    cycleLabel,
    period: dateRange ? dateRange.from.toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7),
    lineItems: statementEligibleLines.map(l => ({
      id: l.id,
      description: l.posting.description ?? 'Posting',
      type: l.side === 'CREDIT' ? 'credit' : 'debit',
      category: l.posting.businessProcess === 'huspy_fee'          ? 'support-fee'
              : l.posting.businessProcess === 'commission_accrual' ? 'deal-commission'
              : 'other',
      amount: l.amount,
      dealId: l.posting.trancheId,
    })),
    totalCredit: statementEligibleLines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0),
    totalDebit:  statementEligibleLines.filter(l => l.side === 'DEBIT').reduce((s, l)  => s + l.amount, 0),
    balance: statementEligibleLines.reduce((s, l) => l.side === 'CREDIT' ? s + l.amount : s - l.amount, 0),
    status: 'draft',
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <div className="space-y-6">

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => handleModeChange('all')} className={pillClass(mode === 'all')}>
          All
        </button>
        <button onClick={() => handleModeChange('custom')} className={pillClass(mode === 'custom')}>
          Custom
        </button>
        {mode === 'custom' && (
          <div className="flex items-center gap-2">
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs font-semibold bg-surface-ds-raised border-0">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customFrom ? format(customFrom, 'MMM d, yyyy') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setFromOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-fg-secondary">–</span>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs font-semibold bg-surface-ds-raised border-0">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customTo ? format(customTo, 'MMM d, yyyy') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={customTo} onSelect={(d) => { setCustomTo(d); setToOpen(false); }} disabled={(date) => customFrom ? date < customFrom : false} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Ledger movements */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-4 border-b border-border-ds-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
            <h3 className="text-sm font-semibold text-foreground">Ledger Movements</h3>
            <span className="text-[10px] font-semibold text-fg-secondary bg-surface-ds-raised px-2 py-0.5 rounded-full">
              {filteredLines.length}
            </span>
          </div>
          {canGenerateStatement && !isSalaried && (
            <Button
              size="sm"
              className="h-7 rounded-full text-xs"
              style={{ backgroundColor: 'hsl(var(--accent-indigo))', color: 'white' }}
              onClick={() => setShowGenerateStatement(true)}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              {isSpain ? 'Upload Invoice' : 'Generate Statement'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-[90px_1fr_100px_110px_130px_110px] px-4 py-2 border-b border-border-ds-primary gap-3">
          <span className="text-xs font-semibold text-fg-secondary">Date</span>
          <span className="text-xs font-semibold text-fg-secondary">Description</span>
          <span className="text-xs font-semibold text-fg-secondary">Deal</span>
          <span className="text-xs font-semibold text-fg-secondary">Type</span>
          <span className="text-xs font-semibold text-fg-secondary">Invoice</span>
          <span className="text-xs font-semibold text-fg-secondary text-right">Amount</span>
        </div>

        {filteredLines.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-fg-secondary">
            No ledger movements for this period.
          </div>
        ) : (
          <div className="divide-y divide-border-ds-primary">
            {filteredLines.map(line => {
              const { text, color } = formatAmount(line.amount, line.side, line.posting.currency);
              const dealId = line.posting.trancheId;
              const invoiceNumber = line.invoiceId
                ? (invoiceNumberMap.get(line.invoiceId) ?? line.invoiceId)
                : null;
              return (
                <div
                  key={line.id}
                  className="grid grid-cols-[90px_1fr_100px_110px_130px_110px] px-4 py-3 items-center gap-3"
                >
                  <span className="text-xs text-fg-secondary tabular-nums">
                    {new Date(line.posting.valueDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: '2-digit',
                    })}
                  </span>
                  <span className="text-sm text-foreground leading-[140%] truncate">
                    {line.posting.description ?? '—'}
                  </span>
                  <span className="text-xs text-fg-secondary font-mono truncate">
                    {dealId ?? <span className="not-italic text-fg-secondary/50">—</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    {line.side === 'CREDIT'
                      ? <ArrowDownLeft className="w-3 h-3 shrink-0" style={{ color: 'hsl(var(--ds-green))' }} />
                      : <ArrowUpRight  className="w-3 h-3 shrink-0" style={{ color: 'hsl(var(--ds-red))' }} />
                    }
                    <span className="text-xs text-fg-secondary capitalize">{processLabel(line.posting.businessProcess)}</span>
                  </div>
                  <span className="text-xs font-mono truncate" style={{ color: invoiceNumber ? 'hsl(var(--accent-indigo))' : 'hsl(var(--fg-secondary) / 0.4)' }}>
                    {invoiceNumber ?? '—'}
                  </span>
                  <span className="text-sm font-semibold text-right tabular-nums" style={{ color }}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {filteredLines.length > 0 && (
          <div className="border-t border-border-ds-primary px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-fg-secondary">
              {cycleLabel} net
            </span>
            <span
              className="text-[18px] font-semibold tabular-nums"
              style={{ color: periodNet >= 0 ? 'hsl(var(--ds-green))' : 'hsl(var(--ds-red))' }}
            >
              {periodNet >= 0 ? '+' : '−'}{CURRENCY_SYMBOLS['EUR']}{Math.abs(periodNet).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Statements */}
      {filteredInvoices.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="px-4 py-4 border-b border-border-ds-primary flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
            <h3 className="text-sm font-semibold text-foreground">Statements</h3>
            <span className="text-[10px] font-semibold text-fg-secondary bg-surface-ds-raised px-2 py-0.5 rounded-full">
              {filteredInvoices.length}
            </span>
          </div>
          <div className="divide-y divide-border-ds-primary">
            {filteredInvoices.map(inv => {
              const { color, bg } = invoiceStatusStyle(inv.status);
              const symbol = CURRENCY_SYMBOLS[inv.currency] ?? inv.currency;
              return (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'hsl(var(--accent-indigo) / 0.1)' }}
                    >
                      <FileText className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-[120%] truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-fg-secondary leading-[140%] mt-0.5">{new Date(inv.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[15px] font-semibold tabular-nums"
                      style={{ color: 'hsl(var(--accent-teal))' }}
                    >
                      {symbol}{(inv.subtotal + (inv.vatAmount ?? 0)).toLocaleString()}
                    </span>
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={{ color, backgroundColor: bg }}
                    >
                      {inv.status}
                    </span>
                    {(inv.status === 'paid' || inv.status === 'issued') && (
                      <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs text-fg-secondary">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isSpain ? (
        <UploadInvoiceModal
          open={showGenerateStatement}
          onOpenChange={setShowGenerateStatement}
          statement={pendingStatement}
          agentId={activeAgent.id}
          onInvoiceCreated={() => {
            setShowGenerateStatement(false);
            setRefreshKey(k => k + 1);
          }}
        />
      ) : (
        <CreateInvoiceModal
          open={showGenerateStatement}
          onOpenChange={setShowGenerateStatement}
          statement={pendingStatement}
          agentId={activeAgent.id}
          country={activeAgent.country}
          onInvoiceCreated={() => {
            setShowGenerateStatement(false);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}
