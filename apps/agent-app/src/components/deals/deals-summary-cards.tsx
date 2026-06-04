import { Deal } from '@/types';
import { FileText, Banknote, TrendingUp } from 'lucide-react';
import { type PnlEntry, sharedPnlEntries, computeAgentCommission } from '@huspy/shared-domain';
import { getTranchesForDeal } from '@/data/mockDeals';

interface DealsSummaryCardsProps {
  deals: Deal[];
  agentStakeMap?: Map<string, PnlEntry>;
}

export function DealsSummaryCards({ deals, agentStakeMap }: DealsSummaryCardsProps) {
  const totalDealValue = deals.reduce((sum, d) => sum + d.dealAmount, 0);
  // Sum confirmed AGENT_PAYOUT amounts from finalized tranches across all deals.
  const totalCommissionsPaid = deals.reduce((sum, d) => {
    const finalizedTranches = getTranchesForDeal(d.id).filter(t => t.status === 'finalized');
    return sum + finalizedTranches.reduce((s, t) => {
      const stake = agentStakeMap?.get(t.id);
      if (!stake) return s;
      if (stake.amount != null) return s + Math.abs(stake.amount);
      const trancheGross = sharedPnlEntries
        .filter(sk => sk.trancheId === t.id && sk.role === 'REVENUE_SOURCE' && (sk.amount ?? 0) > 0)
        .reduce((r, sk) => r + Math.abs(sk.amount ?? 0), 0);
      return s + computeAgentCommission(trancheGross, stake);
    }, 0);
  }, 0);

  const cards = [
    {
      label: 'Deals Reported',
      value: deals.length.toString(),
      icon: FileText,
      color: 'var(--grey-900)',
      bg: 'var(--grey-100)',
    },
    {
      label: 'Total Reported Deal Value',
      value: `€${totalDealValue.toLocaleString()}`,
      icon: Banknote,
      color: 'var(--grey-900)',
      bg: 'var(--grey-100)',
    },
    {
      label: 'Total Commission Earned',
      value: `€${totalCommissionsPaid.toLocaleString()}`,
      icon: TrendingUp,
      color: 'hsl(var(--tier-success-fg))',
      bg: 'hsl(var(--tier-success-bg))',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: card.bg }}
            >
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-[28px] font-semibold leading-[120%] text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}