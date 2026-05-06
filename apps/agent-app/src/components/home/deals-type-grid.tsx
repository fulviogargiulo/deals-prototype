import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, TrendingUp, Clock, CheckCircle2, Banknote } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { mockDeals } from "@/data/mockDeals";
import { DealStatus } from "@/types";
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from "@/components/opportunities/opportunity-bare-icons";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

interface StatusGroup {
  key: string;
  label: string;
  statuses: DealStatus[];
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
}

const statusGroups: StatusGroup[] = [
  {
    key: 'active',
    label: 'In progress',
    statuses: ['reported', 'pending-details', 'under-review'],
    icon: Clock,
    color: 'hsl(var(--ds-orange))',
    bgColor: 'hsl(var(--ds-orange) / 0.1)',
  },
  {
    key: 'ready',
    label: 'Invoice Pending',
    statuses: ['ready-for-invoicing'],
    icon: CheckCircle2,
    color: 'hsl(var(--ds-green))',
    bgColor: 'hsl(var(--ds-green) / 0.1)',
  },
  {
    key: 'payment',
    label: 'Payment Pending',
    statuses: ['pending-payment', 'pending-receivables'],
    icon: Banknote,
    color: 'hsl(var(--accent-indigo))',
    bgColor: 'hsl(var(--accent-indigo) / 0.1)',
  },
  {
    key: 'paid',
    label: 'Payment Complete',
    statuses: ['paid'],
    icon: TrendingUp,
    color: 'hsl(var(--ds-green))',
    bgColor: 'hsl(var(--ds-green) / 0.1)',
  },
];

const statusLabels: Record<DealStatus, string> = {
  'reported': 'Reported',
  'pending-details': 'Pending Details',
  'under-review': 'Under Review',
  'ready-for-invoicing': 'Finalised',
  'pending-payment': 'Pending Payment',
  'pending-receivables': 'Pending Receivables',
  'paid': 'Paid',
  'canceled': 'Canceled',
};

const statusDotColors: Record<DealStatus, string> = {
  'reported': 'hsl(var(--ds-orange))',
  'pending-details': 'hsl(var(--ds-orange))',
  'under-review': 'hsl(var(--ds-orange))',
  'ready-for-invoicing': 'hsl(var(--ds-green))',
  'pending-payment': 'hsl(var(--accent-indigo))',
  'pending-receivables': 'hsl(var(--accent-indigo))',
  'paid': 'hsl(var(--ds-green))',
  'canceled': 'hsl(var(--ds-red))',
};

export function DealsTypeGrid() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const deals = mockDeals;

  const getGroupCount = (group: StatusGroup) =>
    deals.filter(d => group.statuses.includes(d.status)).length;

  const getGroupCommission = (group: StatusGroup) =>
    deals.filter(d => group.statuses.includes(d.status)).reduce((sum, d) => sum + d.commissionAmount, 0);

  const filteredDeals = activeFilter
    ? deals.filter(d => {
        const group = statusGroups.find(g => g.key === activeFilter);
        return group ? group.statuses.includes(d.status) : true;
      })
    : deals;

  const renderDealIcon = (type: string) => {
    const config = typeConfig[type];
    if (config) {
      return <span style={{ color: config.color }}><config.icon className="w-4 h-4" /></span>;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-2 group"
        >
          <h2 className="text-xl font-semibold text-foreground">My deals</h2>
          <ChevronDown className={cn(
            "w-4 h-4 text-fg-secondary transition-transform duration-300",
            expanded && "rotate-180"
          )} />
        </button>
        <button
          onClick={() => navigate('/deals')}
          className="text-sm font-medium text-fg-secondary hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusGroups.map((group) => {
          const Icon = group.icon;
          const count = getGroupCount(group);
          const commission = getGroupCommission(group);
          const isSelected = activeFilter === group.key;

          return (
            <button
              key={group.key}
              onClick={() => {
                setActiveFilter(prev => prev === group.key ? null : group.key);
                if (!expanded) setExpanded(true);
              }}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 text-left",
                "bg-card hover:shadow-md",
              )}
              style={isSelected ? { boxShadow: `0 0 0 2px ${group.color}` } : undefined}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: group.bgColor }}
              >
                <Icon className="w-4 h-4" style={{ color: group.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-foreground leading-[120%]">{count}</p>
                <p className="text-sm text-fg-secondary leading-[140%]">{group.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expandable deals table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[32px_1.2fr_0.7fr_100px_120px_100px] px-4 py-2.5 border-b border-border-ds-primary gap-3">
                <span />
                <span className="text-xs font-semibold text-fg-secondary">Deal</span>
                <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
                <span className="text-xs font-semibold text-fg-secondary text-right">Amount</span>
                <span className="text-xs font-semibold text-fg-secondary text-right">Commission</span>
                <span className="text-xs font-semibold text-fg-secondary text-right">Status</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border-ds-primary max-h-[400px] overflow-y-auto scrollbar-hide">
                {filteredDeals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                    className="grid grid-cols-[32px_1.2fr_0.7fr_100px_120px_100px] px-4 py-3 items-center gap-3 hover:bg-surface-ds-raised/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/deals')}
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center">
                      {renderDealIcon(deal.type)}
                    </div>

                    {/* Title + client */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate leading-[120%]">{deal.title}</p>
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

                    {/* Amount */}
                    <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                      €{deal.dealAmount.toLocaleString()}
                    </span>

                    {/* Commission */}
                    <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                      €{deal.commissionAmount.toLocaleString()}
                    </span>

                    {/* Status */}
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusDotColors[deal.status] }} />
                      <span className="text-xs text-fg-secondary truncate">{statusLabels[deal.status]}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <button
                onClick={() => navigate('/deals')}
                className="w-full px-4 py-3 border-t border-border-ds-primary flex items-center justify-center gap-2 text-sm font-semibold text-fg-secondary hover:text-foreground transition-colors"
              >
                View all deals <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
