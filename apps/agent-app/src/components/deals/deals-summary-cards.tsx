import { Deal } from '@/types';
import { FileText, Banknote, TrendingUp } from 'lucide-react';
import { type DealStakeholder, computeAgentCommission } from '@huspy/shared-domain';

interface DealsSummaryCardsProps {
  deals: Deal[];
  agentStakeMap?: Map<string, DealStakeholder>;
}

export function DealsSummaryCards({ deals, agentStakeMap }: DealsSummaryCardsProps) {
  const totalDealValue = deals.reduce((sum, d) => sum + d.dealAmount, 0);
  const totalCommissionsPaid = deals
    .filter(d => d.status === 'finalized')
    .reduce((sum, d) => sum + computeAgentCommission(d.commissionAmount, agentStakeMap?.get(d.id)), 0);

  const cards = [
    {
      label: 'Deals Reported',
      value: deals.length.toString(),
      icon: FileText,
      color: 'hsl(var(--accent-teal))',
      bg: 'hsl(var(--accent-teal) / 0.1)',
    },
    {
      label: 'Total Reported Deal Value',
      value: `€${totalDealValue.toLocaleString()}`,
      icon: Banknote,
      color: 'hsl(var(--accent-indigo))',
      bg: 'hsl(var(--accent-indigo) / 0.1)',
    },
    {
      label: 'Total Commission Earned',
      value: `€${totalCommissionsPaid.toLocaleString()}`,
      icon: TrendingUp,
      color: 'hsl(var(--ds-green))',
      bg: 'hsl(var(--ds-green) / 0.1)',
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
            <span className="text-xs font-semibold text-fg-secondary">{card.label}</span>
          </div>
          <p className="text-[28px] font-semibold leading-[120%] text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}