import { useState, useMemo } from 'react';
import { Deal, DealStatus } from '@/types';
import { type PnlEntry, computeAgentCommission } from '@huspy/shared-domain';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { OpportunityIcon } from '@/components/opportunities/opportunity-icon';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { useNavigate } from 'react-router-dom';
import { type AgentDealStatus, getTranchesForDeal } from '@/data/mockDeals';
import { sharedPnlEntries } from '@huspy/shared-domain';

interface DealsTableProps {
  deals: Deal[];
  agentStakeMap?: Map<string, PnlEntry>;
}

const agentStatusConfig: Record<AgentDealStatus, { label: string; color: string; bg: string }> = {
  "action-required": { label: "Action Required", color: "hsl(35 92% 38%)",    bg: "hsl(35 92% 38% / 0.1)" },
  "in-progress":     { label: "In Progress",     color: "hsl(221 83% 53%)",   bg: "hsl(221 83% 53% / 0.1)" },
  "closed":          { label: "Closed",           color: "hsl(142 71% 35%)",   bg: "hsl(142 71% 35% / 0.1)" },
};

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

type SortKey = 'title' | 'dealAmount' | 'grossRevenue' | 'reportDate';
type SortDir = 'asc' | 'desc';

export function DealsTable({ deals, agentStakeMap }: DealsTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('reportDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleHeaderSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover/header:opacity-40 transition-opacity" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sorted = useMemo(() => {
    return [...deals].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [deals, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold leading-[120%] text-[hsl(var(--fg-primary))]">All Deals</h2>
        <p className="text-sm font-medium text-[hsl(var(--fg-secondary))]">{sorted.length} deals</p>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[32px_1.2fr_0.8fr_100px_120px_130px_100px] px-4 py-3 border-b border-border-ds-primary gap-3 group/header">
          <span />
          <span className="text-xs font-semibold text-fg-secondary flex items-center cursor-pointer hover:text-foreground select-none" onClick={() => handleHeaderSort('title')}>
            Deal{getSortIcon('title')}
          </span>
          <span className="text-xs font-semibold text-fg-secondary">Client</span>
          <span className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none" onClick={() => handleHeaderSort('dealAmount')}>
            Amount{getSortIcon('dealAmount')}
          </span>
          <span className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none" onClick={() => handleHeaderSort('grossRevenue')}>
            Commission{getSortIcon('grossRevenue')}
          </span>
          <span className="text-xs font-semibold text-fg-secondary text-center">Status</span>
          <span className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none" onClick={() => handleHeaderSort('reportDate')}>
            Date{getSortIcon('reportDate')}
          </span>
        </div>

        {/* Body */}
        <div className="divide-y divide-border-ds-primary">
          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-[hsl(var(--fg-secondary))] text-sm">No deals found</div>
          ) : (
            sorted.map((deal) => {
              const config = typeConfig[deal.type];
              const agentStatus = deal.agentDealStatus ?? "closed";
              const statusStyle = agentStatusConfig[agentStatus];
              const tranches = getTranchesForDeal(deal.id);
              const primaryTranche = tranches[0];

              // Commission = sum of confirmed AGENT_PAYOUT from finalized tranches only.
              const finalizedTranches = tranches.filter(t => t.status === 'finalized');
              let agentCommission: number | null = null;
              if (finalizedTranches.length > 0) {
                agentCommission = finalizedTranches.reduce((sum, t) => {
                  const stake = agentStakeMap?.get(t.id);
                  if (!stake) return sum;
                  if (stake.amount != null) return sum + Math.abs(stake.amount);
                  const trancheGross = sharedPnlEntries
                    .filter(s => s.trancheId === t.id && s.role === 'REVENUE_SOURCE' && (s.amount ?? 0) > 0)
                    .reduce((r, s) => r + Math.abs(s.amount ?? 0), 0);
                  return sum + computeAgentCommission(trancheGross, stake);
                }, 0);
              }

              return (
                <div
                  key={deal.id}
                  className="grid grid-cols-[32px_1.2fr_0.8fr_100px_120px_130px_100px] px-4 py-3 items-center gap-3 hover:bg-surface-ds-raised/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/deals/${deal.id}`)}
                >
                  <div className="flex items-center justify-center">
                    {config ? <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span> : <OpportunityIcon type={deal.type} className="w-5 h-5" showBackground={false} bare />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-[120%]">{deal.title}</p>
                    <p className="text-xs text-fg-secondary leading-[140%] capitalize">
                      {deal.id} · {deal.type}
                      {deal.description && <span className="ml-1.5 px-1 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border not-capitalize">{deal.description}</span>}
                    </p>
                  </div>
                  <span className="text-sm text-foreground truncate">{deal.clientName}</span>
                  <span className="text-sm text-foreground text-right tabular-nums font-semibold">{deal.currency}{deal.dealAmount.toLocaleString()}</span>
                  <span className="text-sm text-right tabular-nums font-semibold" style={{ color: agentCommission !== null ? undefined : 'hsl(var(--fg-secondary))' }}>
                    {agentCommission !== null ? `${deal.currency}${agentCommission.toLocaleString()}` : '—'}
                  </span>
                  <div className="flex justify-center">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </div>
                  <span className="text-xs text-fg-secondary text-right tabular-nums">
                    {deal.reportDate ? new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
