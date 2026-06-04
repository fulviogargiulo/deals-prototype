import { Link } from 'react-router-dom';
import { Deal } from '@/types';
import { type PnlEntry, computeAgentCommission, buildWaterfallInput, calculateProjectedPnL } from '@huspy/shared-domain';
import { Clock, ChevronRight } from 'lucide-react';
import { OpportunityIcon } from '@/components/opportunities/opportunity-icon';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';

interface ActionsRequiredSectionProps {
  pendingConfirmation: Deal[];
  pendingInfo: Deal[];
  agentStakeMap?: Map<string, PnlEntry>;
}

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy:   { icon: BuyBareIcon,   color: 'var(--teal-600)' },
  sell:  { icon: SellBareIcon,  color: 'var(--terracota-600)' },
  rent:  { icon: RentBareIcon,  color: 'var(--indigo-600)' },
  lease: { icon: LeaseBareIcon, color: 'var(--orchid-600)' },
};

export function ActionsRequiredSection({ pendingConfirmation, pendingInfo, agentStakeMap }: ActionsRequiredSectionProps) {
  type PendingItem = { kind: 'confirm'; deal: Deal } | { kind: 'info'; deal: Deal };
  const allItems: PendingItem[] = [
    ...pendingConfirmation.map(d => ({ kind: 'confirm' as const, deal: d })),
    ...pendingInfo.map(d => ({ kind: 'info' as const, deal: d })),
  ];

  if (allItems.length === 0) return null;

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
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-tier-warning" />
          <span className="text-[14px] font-semibold leading-[120%] text-foreground">Pending Actions</span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {allItems.length}
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[32px_1fr_100px_120px_100px_160px_24px] px-4 py-2 border-b border-border gap-3">
          <span />
          <span className="text-xs font-semibold text-muted-foreground">Deal</span>
          <span className="text-xs font-semibold text-muted-foreground text-right">Amount</span>
          <span className="text-xs font-semibold text-muted-foreground text-right">Commission</span>
          <span className="text-xs font-semibold text-muted-foreground text-right">Date</span>
          <span className="text-xs font-semibold text-muted-foreground text-center">Action needed</span>
          <span />
        </div>

        {/* Rows — each navigates to the deal page */}
        <div className="divide-y divide-border">
          {allItems.map(({ kind, deal }) => {
            const commission = (() => {
              const stake = agentStakeMap?.get(deal.id);
              const waterfallInput = buildWaterfallInput(deal);
              const projection = waterfallInput ? calculateProjectedPnL(waterfallInput) : null;
              const agentSplit = projection?.splits.find(s => s.partyId === stake?.partyId);
              return agentSplit?.agentPayout ?? computeAgentCommission(deal.grossRevenue ?? 0, stake);
            })();

            return (
              <Link
                key={deal.id}
                to={`/deals/${deal.id}`}
                className="grid grid-cols-[32px_1fr_100px_120px_100px_160px_24px] px-4 py-3 items-center gap-3 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center justify-center">
                  {renderDealIcon(deal.type)}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-[120%]">{deal.title}</p>
                  <p className="text-xs text-muted-foreground leading-[140%] capitalize">{deal.clientName} · {deal.type}</p>
                </div>

                <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                  {deal.currency}{deal.dealAmount.toLocaleString()}
                </span>

                <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                  {deal.currency}{commission.toLocaleString()}
                </span>

                <span className="text-xs text-muted-foreground text-right tabular-nums">
                  {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>

                <div className="flex items-center justify-center">
                  {kind === 'confirm' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-tier-success-bg text-tier-success border border-tier-success/20">
                      Confirm commission
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-tier-warning-bg text-tier-warning border border-tier-warning/20">
                      Provide info
                    </span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
