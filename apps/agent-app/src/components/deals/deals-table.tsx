import { useState, useMemo } from 'react';
import { Deal, DealStatus, OpportunityType } from '@/types';
import { Search, ChevronDown, Check, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OpportunityIcon } from '@/components/opportunities/opportunity-icon';
import { getOpportunityLabel } from '@/components/opportunities/opportunity-icon';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DealsTableProps {
  deals: Deal[];
  disputedDealIds?: Set<string>;
}

const statusLabels: Record<DealStatus, string> = {
  reported: 'Reported',
  'pending-details': 'Pending Details',
  'under-review': 'Under Review',
  'ready-for-invoicing': 'Ready For Invoicing',
  'pending-payment': 'Pending Payment',
  'pending-receivables': 'Pending Receivables',
  paid: 'Paid',
  canceled: 'Canceled',
};

const statusColors: Record<DealStatus, { color: string; bg: string }> = {
  reported: { color: 'hsl(var(--accent-indigo))', bg: 'hsl(var(--accent-indigo) / 0.1)' },
  'pending-details': { color: 'hsl(var(--ds-orange))', bg: 'hsl(var(--ds-orange) / 0.1)' },
  'under-review': { color: 'hsl(var(--accent-orchid))', bg: 'hsl(var(--accent-orchid) / 0.1)' },
  'ready-for-invoicing': { color: 'hsl(var(--ds-green))', bg: 'hsl(var(--ds-green) / 0.1)' },
  'pending-payment': { color: 'hsl(var(--accent-teal))', bg: 'hsl(var(--accent-teal) / 0.1)' },
  'pending-receivables': { color: 'hsl(var(--accent-terracotta))', bg: 'hsl(var(--accent-terracotta) / 0.1)' },
  paid: { color: 'hsl(var(--fg-secondary))', bg: 'hsl(var(--fg-secondary) / 0.1)' },
  canceled: { color: 'hsl(var(--ds-red))', bg: 'hsl(var(--ds-red) / 0.1)' },
};

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

type SortKey = 'title' | 'dealAmount' | 'commissionAmount' | 'reportDate';
type SortDir = 'asc' | 'desc';

const allStatuses: DealStatus[] = ['reported', 'pending-details', 'under-review', 'ready-for-invoicing', 'pending-payment', 'pending-receivables', 'paid', 'canceled'];
const allTypes: OpportunityType[] = ['buy', 'sell', 'rent', 'lease', 'mortgage'];

export function DealsTable({ deals, disputedDealIds = new Set() }: DealsTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState<DealStatus[]>([]);
  const [typeFilters, setTypeFilters] = useState<OpportunityType[]>([]);
  const [showDisputedOnly, setShowDisputedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('reportDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleStatus = (s: DealStatus) => {
    setStatusFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleType = (t: OpportunityType) => {
    setTypeFilters(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleHeaderSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover/header:opacity-40 transition-opacity" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = [...deals];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q)
      );
    }
    if (statusFilters.length > 0) result = result.filter(d => statusFilters.includes(d.status));
    if (typeFilters.length > 0) result = result.filter(d => typeFilters.includes(d.type));
    if (showDisputedOnly) result = result.filter(d => disputedDealIds.has(d.id));

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [deals, search, statusFilters, typeFilters, showDisputedOnly, disputedDealIds, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[120%] text-[hsl(var(--fg-primary))]">
        All Deals
      </h2>

      {/* Search + filter dropdowns — pill style matching opportunities */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deals..."
            className="pl-10 w-full bg-card rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type multi-select dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={typeFilters.length > 0 ? "default" : "outline"} className={cn(
              "shrink-0 gap-2 rounded-full",
              typeFilters.length === 0 && "bg-card"
            )}>
              {typeFilters.length === 0 ? 'Type' : typeFilters.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {allTypes.map((type) => {
              const config = typeConfig[type];
              const isSelected = typeFilters.includes(type);
              return (
                <DropdownMenuItem key={type} onClick={(e) => { e.preventDefault(); toggleType(type); }} className="gap-3 justify-between">
                  <span className="flex items-center gap-3">
                    {config && <span style={{ color: config.color }}><config.icon className="w-4 h-4" /></span>}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  {isSelected && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status multi-select dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={statusFilters.length > 0 ? "default" : "outline"} className={cn(
              "shrink-0 gap-2 rounded-full",
              statusFilters.length === 0 && "bg-card"
            )}>
              {statusFilters.length === 0 ? 'Status' : statusFilters.map(s => statusLabels[s]).join(', ')}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {allStatuses.map((status) => {
              const isSelected = statusFilters.includes(status);
              return (
                <DropdownMenuItem key={status} onClick={(e) => { e.preventDefault(); toggleStatus(status); }} className="justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[status].color }} />
                    {statusLabels[status]}
                  </span>
                  {isSelected && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Disputed filter pill */}
        {disputedDealIds.size > 0 && (
          <Button
            variant={showDisputedOnly ? "default" : "outline"}
            className={cn(
              "shrink-0 gap-2 rounded-full",
              !showDisputedOnly && "bg-card",
              showDisputedOnly && "text-white"
            )}
            style={showDisputedOnly ? { backgroundColor: 'hsl(var(--ds-red))' } : {}}
            onClick={() => setShowDisputedOnly(prev => !prev)}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Disputed ({disputedDealIds.size})
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm font-medium text-[hsl(var(--fg-secondary))]">
        {filtered.length} deals
      </p>

      {/* Card-based table matching opportunities styling */}
      <div className="bg-card rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[32px_1.2fr_0.8fr_100px_120px_110px_100px] px-4 py-3 border-b border-border-ds-primary gap-3 group/header">
          <span />
          <span
            className="text-xs font-semibold text-fg-secondary flex items-center cursor-pointer hover:text-foreground select-none"
            onClick={() => handleHeaderSort('title')}
          >
            Deal{getSortIcon('title')}
          </span>
          <span className="text-xs font-semibold text-fg-secondary">Client</span>
          <span
            className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none"
            onClick={() => handleHeaderSort('dealAmount')}
          >
            Amount{getSortIcon('dealAmount')}
          </span>
          <span
            className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none"
            onClick={() => handleHeaderSort('commissionAmount')}
          >
            Commission{getSortIcon('commissionAmount')}
          </span>
          <span className="text-xs font-semibold text-fg-secondary text-center">Status</span>
          <span
            className="text-xs font-semibold text-fg-secondary text-right flex items-center justify-end cursor-pointer hover:text-foreground select-none"
            onClick={() => handleHeaderSort('reportDate')}
          >
            Date{getSortIcon('reportDate')}
          </span>
        </div>

        {/* Body */}
        <div className="divide-y divide-border-ds-primary">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[hsl(var(--fg-secondary))] text-sm">
              No deals found
            </div>
          ) : (
            filtered.map((deal) => {
              const config = typeConfig[deal.type];
              const colors = statusColors[deal.status];
              return (
                <div
                  key={deal.id}
                  className="grid grid-cols-[32px_1.2fr_0.8fr_100px_120px_110px_100px] px-4 py-3 items-center gap-3 hover:bg-surface-ds-raised/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/deals/${deal.id}`)}
                >
                  {/* Type icon */}
                  <div className="flex items-center justify-center">
                    {config ? (
                      <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span>
                    ) : (
                      <OpportunityIcon type={deal.type} className="w-5 h-5" showBackground={false} bare />
                    )}
                  </div>

                  {/* Title + type label */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-[120%]">{deal.title}</p>
                    <p className="text-xs text-fg-secondary leading-[140%] capitalize">{deal.type}</p>
                  </div>

                  {/* Client */}
                  <span className="text-sm text-foreground truncate">{deal.clientName}</span>

                  {/* Amount */}
                  <span className="text-sm text-foreground text-right tabular-nums font-semibold">
                    {deal.currency}{deal.dealAmount.toLocaleString()}
                  </span>

                  {/* Commission */}
                  <span className="text-sm text-foreground text-right tabular-nums font-semibold">
                    {deal.currency}{deal.commissionAmount.toLocaleString()}
                  </span>

                  {/* Status badge */}
                  <div className="flex justify-center gap-1.5">
                    {disputedDealIds.has(deal.id) ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                          style={{ backgroundColor: statusColors[deal.status].bg, color: statusColors[deal.status].color }}
                        >
                          {statusLabels[deal.status]}
                        </span>
                        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--ds-red))' }} />
                      </div>
                    ) : (
                      <span
                        className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {statusLabels[deal.status]}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-xs text-fg-secondary text-right tabular-nums">
                    {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
