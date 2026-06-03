import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Deal } from '@/types';
import { type PnlEntry, computeAgentCommission, buildWaterfallInput, calculateProjectedPnL } from '@huspy/shared-domain';
import { Clock, CheckCircle2, MoreVertical, Timer, RotateCcw } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { Button } from '@/components/ui/button';
import { OpportunityIcon } from '@/components/opportunities/opportunity-icon';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { ProvideInfoModal } from '@/components/modals/provide-info-modal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ActionsRequiredSectionProps {
  pendingConfirmation: Deal[];
  pendingInfo: Deal[];
  agentStakeMap?: Map<string, PnlEntry>;
}

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

export function ActionsRequiredSection({ pendingConfirmation, pendingInfo, agentStakeMap }: ActionsRequiredSectionProps) {
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [infoDeal, setInfoDeal] = useState<Deal | null>(null);
  const [submittedInfoDealIds, setSubmittedInfoDealIds] = useState<Set<string>>(new Set());
  const [confirmedDealIds, setConfirmedDealIds] = useState<Set<string>>(new Set());
  const [reviewRequestedIds, setReviewRequestedIds] = useState<Set<string>>(new Set());
  const [dealsExpiresAt] = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString());

  const activePendingInfo = pendingInfo.filter(d => !submittedInfoDealIds.has(d.id));
  const remainingConfirmation = pendingConfirmation.filter(d => !confirmedDealIds.has(d.id) && !reviewRequestedIds.has(d.id));

  type PendingItem = { kind: 'confirm'; deal: Deal } | { kind: 'info'; deal: Deal };
  const allItems: PendingItem[] = [
    ...remainingConfirmation.map(d => ({ kind: 'confirm' as const, deal: d })),
    ...activePendingInfo.map(d => ({ kind: 'info' as const, deal: d })),
  ];

  if (allItems.length === 0) return null;

  const hasConfirmItems = remainingConfirmation.length > 0;
  const allSelected = hasConfirmItems && selectedDeals.size === remainingConfirmation.length;
  const someSelected = selectedDeals.size > 0;

  const toggleDeal = (id: string) => {
    setSelectedDeals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedDeals(new Set());
    else setSelectedDeals(new Set(remainingConfirmation.map(d => d.id)));
  };

  const handleConfirmSelected = () => {
    toast.success(`${selectedDeals.size} deal${selectedDeals.size > 1 ? 's' : ''} confirmed for invoicing`);
    setConfirmedDealIds(prev => {
      const next = new Set(prev);
      selectedDeals.forEach(id => next.add(id));
      return next;
    });
    setSelectedDeals(new Set());
  };

  const handleConfirmSingle = (deal: Deal) => {
    toast.success(`"${deal.title}" confirmed for invoicing`);
    setConfirmedDealIds(prev => new Set(prev).add(deal.id));
  };

  const handleRequestReview = (deal: Deal) => {
    setReviewRequestedIds(prev => new Set(prev).add(deal.id));
    toast.success(`"${deal.title}" sent back to Ops for review`);
  };

  const renderDealIcon = (type: string) => {
    const config = typeConfig[type];
    if (config) return <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span>;
    return <OpportunityIcon type={type as any} className="w-5 h-5" showBackground={false} bare />;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">Actions Required</h2>

      <div className="bg-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border-ds-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: 'hsl(var(--ds-orange))' }} />
            <span className="text-[16px] font-semibold leading-[120%] text-foreground">Pending Actions</span>
            <span className="text-[10px] font-semibold text-fg-secondary bg-surface-ds-raised px-2 py-0.5 rounded-full">
              {allItems.length}
            </span>
            {hasConfirmItems && (
              <>
                <span className="text-fg-secondary mx-1">·</span>
                <Timer className="w-3.5 h-3.5 text-fg-secondary" />
                <CountdownTimer expiresAt={dealsExpiresAt} variant="light" size="inline" />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {someSelected ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-fg-secondary h-7 rounded-full"
                  onClick={() => setSelectedDeals(new Set())}
                >
                  Deselect ({selectedDeals.size})
                </Button>
                <Button
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
                  onClick={handleConfirmSelected}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Confirm {selectedDeals.size}
                </Button>
              </>
            ) : hasConfirmItems ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 rounded-full"
                style={{ color: 'hsl(var(--accent-indigo))' }}
                onClick={toggleAll}
              >
                Select All
              </Button>
            ) : null}
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[32px_1.4fr_0.8fr_100px_120px_100px_130px_40px] px-4 py-2 border-b border-border-ds-primary gap-3">
          <span />
          <span className="text-xs font-semibold text-fg-secondary">Deal</span>
          <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
          <span className="text-xs font-semibold text-fg-secondary text-right">Amount</span>
          <span className="text-xs font-semibold text-fg-secondary text-right">Commission</span>
          <span className="text-xs font-semibold text-fg-secondary text-right">Date</span>
          <span className="text-xs font-semibold text-fg-secondary text-center">Pending Action</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border-ds-primary">
          {allItems.map(({ kind, deal }) => {
            const isConfirm = kind === 'confirm';
            const isSelected = isConfirm && selectedDeals.has(deal.id);

            return (
              <div
                key={deal.id}
                className={`grid grid-cols-[32px_1.4fr_0.8fr_100px_120px_100px_130px_40px] px-4 py-3 items-center gap-3 transition-colors group ${isConfirm && someSelected ? 'cursor-pointer' : !isConfirm ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[hsl(var(--accent-indigo)/0.05)]' : 'hover:bg-surface-ds-raised/50'}`}
                onClick={() => {
                  if (isConfirm && someSelected) toggleDeal(deal.id);
                  else if (!isConfirm) setInfoDeal(deal);
                }}
              >
                {/* Icon / checkbox */}
                <div className="flex items-center justify-center relative">
                  {isConfirm && someSelected ? (
                    <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all ${isSelected ? 'border-[hsl(var(--accent-indigo))] bg-[hsl(var(--accent-indigo))]' : 'border-[hsl(var(--border-primary))]'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  ) : (
                    renderDealIcon(deal.type)
                  )}
                </div>

                {/* Deal */}
                <div className="min-w-0">
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-sm font-semibold text-foreground truncate leading-[120%] hover:underline block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deal.title}
                  </Link>
                  <p className="text-xs text-fg-secondary leading-[140%] capitalize">{deal.clientName} · {deal.type}</p>
                </div>

                {/* Property */}
                <span className="text-sm truncate text-muted-foreground">
                  {deal.title ?? "—"}
                </span>

                {/* Amount */}
                <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                  {deal.currency}{deal.dealAmount.toLocaleString()}
                </span>

                {/* Commission */}
                <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                  {(() => {
                    const stake = agentStakeMap?.get(deal.id);
                    const waterfallInput = buildWaterfallInput(deal);
                    const projection = waterfallInput ? calculateProjectedPnL(waterfallInput) : null;
                    const agentSplit = projection?.splits.find(s => s.partyId === stake?.partyId);
                    const commission = agentSplit?.agentPayout ?? computeAgentCommission(deal.grossRevenue ?? 0, stake);
                    return `${deal.currency}${commission.toLocaleString()}`;
                  })()}
                </span>

                {/* Date */}
                <span className="text-xs text-fg-secondary text-right tabular-nums">
                  {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>

                {/* Pending Action badge */}
                <div className="flex items-center justify-center">
                  {isConfirm ? (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--ds-green) / 0.1)', color: 'hsl(var(--ds-green))' }}>
                      Confirm Deal
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.1)', color: 'hsl(var(--ds-orange))' }}>
                      Provide Info
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  {isConfirm ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          style={{ color: 'hsl(var(--ds-green))' }}
                          onClick={() => handleConfirmSingle(deal)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          style={{ color: 'hsl(var(--ds-orange))' }}
                          onClick={() => handleRequestReview(deal)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Request Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setInfoDeal(deal)}
                    >
                      <MoreVertical className="h-4 w-4 rotate-90" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProvideInfoModal
        open={!!infoDeal}
        onOpenChange={(open) => !open && setInfoDeal(null)}
        deal={infoDeal}
        onInfoSubmitted={(dealId) => setSubmittedInfoDealIds(prev => new Set(prev).add(dealId))}
      />
    </div>
  );
}
