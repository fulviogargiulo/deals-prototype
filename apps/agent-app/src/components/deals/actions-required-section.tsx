import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Deal } from '@/types';
import { AlertCircle, Clock, AlertTriangle, CheckCircle2, MoreVertical, Timer, ArrowRight } from 'lucide-react';
import { CountdownTimer, CountdownLabels } from '@/components/ui/countdown-timer';
import { Button } from '@/components/ui/button';
import { OpportunityIcon } from '@/components/opportunities/opportunity-icon';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { DealDisputeModal } from '@/components/modals/deal-dispute-modal';
import { ProvideInfoModal } from '@/components/modals/provide-info-modal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ActionsRequiredSectionProps {
  pendingConfirmation: Deal[];
  pendingInfo: Deal[];
  disputedDealIds: Set<string>;
  onDealDisputed?: (dealId: string) => void;
}

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

export function ActionsRequiredSection({ pendingConfirmation, pendingInfo, disputedDealIds, onDealDisputed }: ActionsRequiredSectionProps) {
  const [disputeDeal, setDisputeDeal] = useState<Deal | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [infoDeal, setInfoDeal] = useState<Deal | null>(null);
  const [submittedInfoDealIds, setSubmittedInfoDealIds] = useState<Set<string>>(new Set());
  const [confirmedDealIds, setConfirmedDealIds] = useState<Set<string>>(new Set());

  // Deadline for confirming deals (48h from now, cached)
  const [dealsExpiresAt] = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString());

  const activePendingInfo = pendingInfo.filter(d => !submittedInfoDealIds.has(d.id));
  const remainingConfirmation = pendingConfirmation.filter(d => !confirmedDealIds.has(d.id) && !disputedDealIds.has(d.id));
  const hasActions = remainingConfirmation.length > 0 || activePendingInfo.length > 0;

  if (!hasActions) return null;

  const allSelected = remainingConfirmation.length > 0 && selectedDeals.size === remainingConfirmation.length;
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
    if (allSelected) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(remainingConfirmation.map(d => d.id)));
    }
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

  const renderDealIcon = (type: string) => {
    const config = typeConfig[type];
    if (config) {
      return <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span>;
    }
    return <OpportunityIcon type={type as any} className="w-5 h-5" showBackground={false} bare />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">
        Actions Required
      </h2>

      {/* Confirm Deals for Invoicing */}
      {remainingConfirmation.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-4 border-b border-border-ds-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'hsl(var(--ds-orange))' }} />
              <h3 className="text-[16px] font-semibold leading-[120%] text-foreground">
                Confirm Deals for Invoicing
              </h3>
              <span className="text-[10px] font-semibold text-fg-secondary bg-surface-ds-raised px-2 py-0.5 rounded-full">
                {remainingConfirmation.length}
              </span>
              <span className="text-fg-secondary mx-1">·</span>
              <Timer className="w-3.5 h-3.5 text-fg-secondary" />
              <CountdownTimer expiresAt={dealsExpiresAt} variant="light" size="inline" />
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
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 rounded-full"
                  style={{ color: 'hsl(var(--accent-indigo))' }}
                  onClick={toggleAll}
                >
                  Select All
                </Button>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[32px_1.2fr_0.7fr_100px_120px_100px_40px] px-4 py-2 border-b border-border-ds-primary gap-3">
            <span />
            <span className="text-xs font-semibold text-fg-secondary">Deal</span>
            <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
            <span className="text-xs font-semibold text-fg-secondary text-right">Amount</span>
            <span className="text-xs font-semibold text-fg-secondary text-right">Commission</span>
            <span className="text-xs font-semibold text-fg-secondary text-right">Date</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-ds-primary">
            {remainingConfirmation.map((deal) => {
              const isSelected = selectedDeals.has(deal.id);
              return (
                <div
                  key={deal.id}
                  className={`grid grid-cols-[32px_1.2fr_0.7fr_100px_120px_100px_40px] px-4 py-3 items-center gap-3 transition-colors group ${someSelected ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[hsl(var(--accent-indigo)/0.05)]' : 'hover:bg-surface-ds-raised/50'}`}
                  onClick={() => someSelected && toggleDeal(deal.id)}
                >
                  {/* Icon + selection */}
                  <div className="flex items-center justify-center relative">
                    {someSelected && (
                      <div className={`absolute inset-0 flex items-center justify-center`}>
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all ${isSelected ? 'border-[hsl(var(--accent-indigo))] bg-[hsl(var(--accent-indigo))]' : 'border-[hsl(var(--border-primary))]'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    )}
                    {!someSelected && renderDealIcon(deal.type)}
                  </div>

                  {/* Title + type */}
                  <div className="min-w-0">
                    <Link
                      to={`/deals/${deal.id}`}
                      className="text-sm font-semibold text-foreground truncate leading-[120%] hover:underline block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {deal.title}
                    </Link>
                    <p className="text-xs text-fg-secondary leading-[140%] capitalize">{deal.type}</p>
                  </div>

                  {/* Opportunity */}
                  <Link
                    to={`/opportunities/${deal.opportunityId}`}
                    className="text-sm truncate"
                    style={{ color: 'hsl(var(--accent-indigo))' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deal.opportunityName}
                  </Link>

                  {/* Amount */}
                  <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                    {deal.currency}{deal.dealAmount.toLocaleString()}
                  </span>

                  {/* Commission */}
                  <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                    {deal.currency}{deal.commissionAmount.toLocaleString()}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-fg-secondary text-right tabular-nums">
                    {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
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
                          style={{ color: 'hsl(var(--ds-red))' }}
                          onClick={() => setDisputeDeal(deal)}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Dispute
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deals Pending Information */}
      {activePendingInfo.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-4 border-b border-border-ds-primary flex items-center gap-2">
            <AlertCircle className="w-5 h-5" style={{ color: 'hsl(var(--ds-orange))' }} />
            <h3 className="text-[16px] font-semibold leading-[120%] text-foreground">
              Deals Pending Information
            </h3>
            <span className="ml-auto text-[10px] font-semibold text-fg-secondary bg-surface-ds-raised px-2 py-0.5 rounded-full">
              {activePendingInfo.length}
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[32px_1.2fr_0.7fr_100px_80px] px-4 py-2 border-b border-border-ds-primary gap-3">
            <span />
            <span className="text-xs font-semibold text-fg-secondary">Deal</span>
            <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
            <span className="text-xs font-semibold text-fg-secondary text-right">Date</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-ds-primary">
            {activePendingInfo.map((deal) => (
              <div
                key={deal.id}
                className="grid grid-cols-[32px_1.2fr_0.7fr_100px_80px] px-4 py-3 items-center gap-3 cursor-pointer hover:bg-surface-ds-raised/50 transition-colors group"
                onClick={() => setInfoDeal(deal)}
              >
                {/* Icon */}
                <div className="flex items-center justify-center">
                  {renderDealIcon(deal.type)}
                </div>

                {/* Title + type */}
                <div className="min-w-0">
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-sm font-semibold text-foreground truncate leading-[120%] hover:underline block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deal.title}
                  </Link>
                  <p className="text-xs text-fg-secondary leading-[140%]">
                    {deal.clientName} · <span className="capitalize">{deal.type}</span>
                  </p>
                </div>

                {/* Opportunity */}
                <Link
                  to={`/opportunities/${deal.opportunityId}`}
                  className="text-sm truncate"
                  style={{ color: 'hsl(var(--accent-indigo))' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {deal.opportunityName}
                </Link>

                {/* Date */}
                <span className="text-xs text-fg-secondary text-right tabular-nums">
                  {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>

                {/* Action hint */}
                <span className="text-xs font-semibold text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1" style={{ color: 'hsl(var(--accent-indigo))' }}>
                  Provide Info
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <DealDisputeModal
        open={!!disputeDeal}
        onOpenChange={(open) => !open && setDisputeDeal(null)}
        deal={disputeDeal}
        onDisputeSubmitted={(dealId) => {
          onDealDisputed?.(dealId);
        }}
      />
      <ProvideInfoModal
        open={!!infoDeal}
        onOpenChange={(open) => !open && setInfoDeal(null)}
        deal={infoDeal}
        onInfoSubmitted={(dealId) => {
          setSubmittedInfoDealIds(prev => new Set(prev).add(dealId));
        }}
      />
    </div>
  );
}
