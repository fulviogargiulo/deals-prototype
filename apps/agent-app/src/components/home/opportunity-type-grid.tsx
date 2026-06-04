import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, ArrowRight, ArrowDown, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OpportunityType } from "@/types";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from "@/components/opportunities/opportunity-bare-icons";
import { getOpportunityLabel } from "@/components/opportunities/opportunity-icon";
import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ViewToggle } from "@/components/opportunities/view-toggle";
import { OpportunityThumbnail } from "@/components/opportunities/opportunity-thumbnail";

export type OpportunitiesLayoutMode = 'cards' | 'rich-cards' | 'pills' | 'bar' | 'stacked' | 'mini-grid' | 'table';
export type TableFilterStyle = 'cards' | 'pills';

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string; bgColor: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A', bgColor: 'rgba(0, 138, 138, 0.10)' },
  sell: { icon: SellBareIcon, color: '#D95D28', bgColor: 'rgba(217, 93, 40, 0.10)' },
  rent: { icon: RentBareIcon, color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.10)' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3', bgColor: 'rgba(205, 82, 195, 0.10)' },
};

const types: OpportunityType[] = ['buy', 'sell', 'rent', 'lease'];

interface OpportunityTypeGridProps {
  layoutMode?: OpportunitiesLayoutMode;
  onLayoutModeChange?: (mode: OpportunitiesLayoutMode) => void;
  tableFilterStyle?: TableFilterStyle;
}

/* ===== Shared: Expandable panel ===== */
function ExpandablePanel({ selectedType, onNavigate }: { selectedType: OpportunityType | 'all' | null; onNavigate: (id: string) => void }) {
  const { opportunities, getClientById } = useData();
  const filteredOpportunities = selectedType === 'all'
    ? opportunities
    : selectedType
      ? opportunities.filter(o => o.type === selectedType)
      : [];

  return (
    <AnimatePresence mode="wait">
      {selectedType && filteredOpportunities.length > 0 && (
        <motion.div
          key={selectedType}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-2 pb-2">
            <div className="max-h-[400px] overflow-y-auto rounded-2xl pr-1 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredOpportunities.map((opp, index) => {
                  const client = getClientById(opp.clientId);
                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <OpportunityCard
                        id={opp.id}
                        type={opp.type}
                        title={opp.title}
                        priceRange={opp.priceRange}
                        bedrooms={opp.bedrooms}
                        clientName={client?.fullName}
                        image={opp.images?.[0]}
                        images={opp.images}
                        matchesCount={3}
                        onClick={() => onNavigate(`/opportunities/${opp.id}`)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===== Layout A: Cards (Current) ===== */
function CardsLayout() {
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const { opportunities } = useData();
  const navigate = useNavigate();

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = countByType(type);
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedType(prev => (prev === type ? 'all' : type))}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 text-left",
                "bg-card hover:shadow-md",
              )}
              style={{
                ...(isSelected ? { boxShadow: `0 0 0 2px ${config.color}` } : {}),
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.bgColor }}
              >
                <span style={{ color: config.color }}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-semibold text-foreground leading-heading">{count}</p>
                <p className="text-sm text-muted-foreground leading-body">{getOpportunityLabel(type)}</p>
              </div>
            </button>
          );
        })}
      </div>
      <ExpandablePanel selectedType={selectedType} onNavigate={navigate} />
    </div>
  );
}

/* ===== Layout B: Rich Cards ===== */
function RichCardsLayout() {
  const [selectedType, setSelectedType] = useState<OpportunityType | null>(null);
  const { opportunities, getClientById } = useData();
  const navigate = useNavigate();

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  const getLatestOpportunity = (type: OpportunityType) => {
    const filtered = opportunities.filter(o => o.type === type);
    return filtered[0];
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = countByType(type);
          const isSelected = selectedType === type;
          const latest = getLatestOpportunity(type);
          const client = latest ? getClientById(latest.clientId) : null;

          return (
            <button
              key={type}
              onClick={() => setSelectedType(prev => (prev === type ? null : type))}
              className={cn(
                "flex flex-col p-4 rounded-2xl transition-all duration-300 text-left",
                "bg-card hover:shadow-md",
              )}
              style={{
                ...(isSelected ? { boxShadow: `0 0 0 2px ${config.color}` } : {}),
              }}
            >
              {/* Top row: icon + count */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <span style={{ color: config.color }}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <span className="text-2xl font-semibold text-foreground leading-heading">{count}</span>
              </div>
              {/* Type label */}
              <p className="text-sm font-semibold text-foreground leading-body">{getOpportunityLabel(type)}</p>
              {/* Latest opportunity preview */}
              {latest ? (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground truncate">{latest.title}</p>
                  {client && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.fullName}</p>
                  )}
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">No opportunities yet</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <ExpandablePanel selectedType={selectedType} onNavigate={navigate} />
    </div>
  );
}

/* ===== Layout C: Pills (tab-style) ===== */
function PillsLayout() {
  const [selectedType, setSelectedType] = useState<OpportunityType>(types[0]);
  const { opportunities, getClientById } = useData();
  const navigate = useNavigate();

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  const filteredOpportunities = opportunities.filter(o => o.type === selectedType);

  return (
    <div className="space-y-4">
      {/* Pill tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {types.map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = countByType(type);
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 text-sm font-semibold",
                isSelected
                  ? "text-white"
                  : "bg-card text-foreground hover:shadow-sm",
              )}
              style={{
                ...(isSelected ? { backgroundColor: config.color } : {}),
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {getOpportunityLabel(type)}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center",
                isSelected ? "bg-white/20" : "bg-secondary"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Always-visible list */}
      {filteredOpportunities.length > 0 ? (
        <div className="max-h-[400px] overflow-y-auto rounded-2xl pr-1 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredOpportunities.map((opp, index) => {
              const client = getClientById(opp.clientId);
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                >
                  <OpportunityCard
                    id={opp.id}
                    type={opp.type}
                    title={opp.title}
                    priceRange={opp.priceRange}
                    bedrooms={opp.bedrooms}
                    clientName={client?.fullName}
                    image={opp.images?.[0]}
                    images={opp.images}
                    matchesCount={3}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No {getOpportunityLabel(selectedType).toLowerCase()} opportunities</p>
        </div>
      )}
    </div>
  );
}

/* ===== Layout D: Summary Bar ===== */
function BarLayout() {
  const [selectedType, setSelectedType] = useState<OpportunityType | null>(null);
  const { opportunities } = useData();
  const navigate = useNavigate();

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  const total = opportunities.length;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
        {types.map((type, i) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = countByType(type);
          const isSelected = selectedType === type;

          return (
            <div key={type} className="flex items-center gap-3">
              {i > 0 && <div className="w-px h-8 bg-border" />}
              <button
                onClick={() => setSelectedType(prev => (prev === type ? null : type))}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300",
                  isSelected ? "bg-secondary" : "hover:bg-secondary/50",
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <span style={{ color: config.color }}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-foreground leading-heading">{count}</p>
                  <p className="text-xs text-muted-foreground leading-body">{getOpportunityLabel(type)}</p>
                </div>
              </button>
            </div>
          );
        })}
        {/* Total */}
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-semibold text-foreground">{total}</p>
        </div>
      </div>
      <ExpandablePanel selectedType={selectedType} onNavigate={navigate} />
    </div>
  );
}

/* ===== Layout E: Stacked Sections ===== */
function StackedLayout() {
  const { opportunities, getClientById } = useData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {types.map((type) => {
        const config = typeConfig[type];
        const Icon = config.icon;
        const filtered = opportunities.filter(o => o.type === type);
        const count = filtered.length;

        return (
          <div key={type} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.bgColor }}
              >
                <span style={{ color: config.color }}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{getOpportunityLabel(type)}</h3>
              <span className="text-sm text-muted-foreground">{count}</span>
              <button
                onClick={() => navigate('/opportunities')}
                className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {/* Cards (show max 2) */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.slice(0, 2).map((opp) => {
                  const client = getClientById(opp.clientId);
                  return (
                    <OpportunityCard
                      key={opp.id}
                      id={opp.id}
                      type={opp.type}
                      title={opp.title}
                      priceRange={opp.priceRange}
                      bedrooms={opp.bedrooms}
                      clientName={client?.fullName}
                      image={opp.images?.[0]}
                      images={opp.images}
                      matchesCount={3}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border p-6 flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-semibold">Add {getOpportunityLabel(type).toLowerCase()} opportunity</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Layout F: Mini Grid (compact counters + always-visible recent) ===== */
function MiniGridLayout() {
  const { opportunities, getClientById } = useData();
  const navigate = useNavigate();

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  // Show 4 most recent opportunities across all types
  const recentOpportunities = [...opportunities].slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Compact type counters row */}
      <div className="flex items-center gap-3">
        {types.map((type) => {
          const config = typeConfig[type];
          const Icon = config.icon;
          const count = countByType(type);

          return (
            <button
              key={type}
              onClick={() => navigate('/opportunities')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:shadow-sm transition-all"
            >
              <span style={{ color: config.color }}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-base font-semibold text-foreground">{count}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{getOpportunityLabel(type)}</span>
            </button>
          );
        })}
        <button
          onClick={() => navigate('/opportunities')}
          className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent opportunities */}
      {recentOpportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentOpportunities.map((opp) => {
            const client = getClientById(opp.clientId);
            return (
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                type={opp.type}
                title={opp.title}
                priceRange={opp.priceRange}
                bedrooms={opp.bedrooms}
                clientName={client?.fullName}
                image={opp.images?.[0]}
                images={opp.images}
                matchesCount={3}
                onClick={() => navigate(`/opportunities/${opp.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===== Layout G: Table ===== */
function TableLayout() {
  const { opportunities, getClientById } = useData();
  const { newMatchesDisplay } = useDevTools();
  const navigate = useNavigate();
  const [activeTypeFilter, setActiveTypeFilter] = useState<OpportunityType | 'all'>('all');

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  const formatPrice = (priceRange?: { min: number; max: number; currency: string }) => {
    if (!priceRange) return '—';
    const { min, max, currency } = priceRange;
    const symbol = currency === 'EUR' ? '€' : currency;
    if (min === max) return `${symbol}${(min / 1000).toFixed(0)}k`;
    return `${symbol}${(min / 1000).toFixed(0)}k – ${(max / 1000).toFixed(0)}k`;
  };

  const lastInteractions: Record<string, { text: string; time: string }> = {
    '1': { text: 'Property saved', time: '1h ago' },
    '2': { text: 'Visit scheduled', time: '3h ago' },
    '3': { text: 'Note added', time: '2d ago' },
    '4': { text: 'Price updated', time: '1d ago' },
    '5': { text: 'Client contacted', time: '4h ago' },
    '6': { text: 'Document uploaded', time: '5h ago' },
    '7': { text: 'Match reviewed', time: '1d ago' },
    '8': { text: 'Property shared', time: '6h ago' },
  };

  const getLastInteraction = (oppId: string) => {
    return lastInteractions[oppId] || { text: 'Property saved', time: '1h ago' };
  };

  /** Parse relative time string like "1h ago", "2d ago" into minutes for sorting */
  const parseTimeAgo = (time: string): number => {
    const match = time.match(/(\d+)\s*(m|h|d|w)/);
    if (!match) return Infinity;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'm') return value;
    if (unit === 'h') return value * 60;
    if (unit === 'd') return value * 1440;
    if (unit === 'w') return value * 10080;
    return Infinity;
  };

  const filteredOpportunities = useMemo(() => {
    const list = activeTypeFilter !== 'all'
      ? opportunities.filter(o => o.type === activeTypeFilter)
      : [...opportunities];
    
    // Sort by last interaction (newest first)
    list.sort((a, b) => {
      const timeA = parseTimeAgo(getLastInteraction(a.id).time);
      const timeB = parseTimeAgo(getLastInteraction(b.id).time);
      return timeA - timeB;
    });

    return list;
  }, [opportunities, activeTypeFilter]);

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[3fr_2fr_0.6fr_0.3fr_0.4fr_minmax(72px,120px)] justify-items-start">
          {/* Header row */}
          <div className="contents">
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center pl-5">Opportunity</span>
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center pl-3">Client</span>
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center pl-3">Price</span>
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center pl-3">Beds</span>
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center pl-3">Matches</span>
            <span className="text-xs font-semibold text-muted-foreground py-3 border-b border-border self-stretch justify-self-stretch flex items-center justify-end gap-1 pr-5">Interaction <ArrowDown className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[560px] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-[3fr_2fr_0.6fr_0.3fr_0.4fr_minmax(72px,120px)] justify-items-start">
          {filteredOpportunities.length > 0 ? filteredOpportunities.map((opp) => {
            const config = typeConfig[opp.type];
            const Icon = config.icon;
            const client = getClientById(opp.clientId);
            const oppImages = opp.images || [];
            const isBuyRent = opp.type === 'buy' || opp.type === 'rent';
            const visibleImages = isBuyRent ? oppImages.slice(0, 3) : oppImages.slice(0, 1);

            return (
              <button
                key={opp.id}
                onClick={() => navigate(`/opportunities/${opp.id}`)}
                className="contents group"
              >
                {/* Opportunity: thumbnail + title merged */}
                <div className="flex items-center gap-3 min-w-0 justify-self-stretch self-stretch py-3.5 pl-5 border-b border-border group-hover:bg-secondary/50 transition-colors">
                  <OpportunityThumbnail
                    images={visibleImages}
                    fallbackIcon={Icon}
                    fallbackColor={config.color}
                    fallbackBgColor={config.bgColor}
                    className="w-[52px] h-[52px]"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-semibold text-foreground truncate leading-body">{opp.title}</p>
                        </TooltipTrigger>
                        <TooltipContent side="top"><p>{opp.title}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: config.color }}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-xs text-muted-foreground leading-body">{getOpportunityLabel(opp.type)}</p>
                      {['1', '3', '5'].includes(opp.id) && (
                        newMatchesDisplay === 'tag' ? (
                          <NewClientBadge type="new-matches" className="ml-1 scale-90 origin-left" />
                        ) : (
                          <div className="w-2 h-2 rounded-full ml-1 shrink-0 bg-tier-danger" />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2.5 min-w-0 justify-self-stretch self-stretch py-3.5 pl-3 border-b border-border group-hover:bg-secondary/50 transition-colors">
                  {client ? (
                    <>
                      <UserAvatar name={client.fullName} size="sm" className="w-8 h-8 text-[11px] flex-shrink-0" />
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-foreground truncate leading-body">{client.fullName}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top"><p>{client.fullName}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center text-sm text-foreground tabular-nums leading-body text-left py-3.5 pl-3 border-b border-border group-hover:bg-secondary/50 transition-colors justify-self-stretch self-stretch">
                  {formatPrice(opp.priceRange)}
                </div>

                {/* Beds */}
                <div className="flex items-center text-sm text-foreground tabular-nums leading-body text-left py-3.5 pl-3 border-b border-border group-hover:bg-secondary/50 transition-colors justify-self-stretch self-stretch">
                  {opp.bedrooms ? `${opp.bedrooms}` : '—'}
                </div>

                {/* Matches */}
                <div className="flex items-center text-sm text-foreground tabular-nums leading-body text-left py-3.5 pl-3 border-b border-border group-hover:bg-secondary/50 transition-colors justify-self-stretch self-stretch">3</div>

                {/* Last interaction */}
                <div className="flex items-center justify-end text-right min-w-0 justify-self-stretch self-stretch py-3.5 border-b border-border pr-5 group-hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="text-xs text-foreground truncate leading-body">{getLastInteraction(opp.id).text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-body">{getLastInteraction(opp.id).time}</p>
                  </div>
                </div>

              </button>
            );
          }) : (
            <div className="py-12 px-6 col-span-6">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <Plus className="w-8 h-8 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">No opportunities</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first opportunity and start managing your pipeline
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        {filteredOpportunities.length > 0 && (
          <button
            onClick={() => navigate('/opportunities')}
            className="w-full px-4 py-3 border-t border-border flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            View all opportunities <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ===== Summary Cards (always visible above fold) ===== */
function OpportunitySummaryCards({ onCardClick }: { onCardClick?: (type: OpportunityType) => void }) {
  const { opportunities } = useData();
  const [selectedType, setSelectedType] = useState<OpportunityType | null>(null);

  const countByType = (type: OpportunityType) =>
    opportunities.filter(o => o.type === type).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {types.map((type) => {
        const config = typeConfig[type];
        const Icon = config.icon;
        const count = countByType(type);
        const isSelected = selectedType === type;

        return (
          <button
            key={type}
            onClick={() => {
              setSelectedType(prev => (prev === type ? null : type));
              onCardClick?.(type);
            }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 text-left",
              "bg-card hover:shadow-md",
            )}
            style={isSelected ? { boxShadow: `0 0 0 2px ${config.color}` } : undefined}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: config.bgColor }}
            >
              <span style={{ color: config.color }}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold text-foreground leading-[120%]">{count}</p>
              <p className="text-sm text-muted-foreground leading-[140%]">{getOpportunityLabel(type)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function OpportunityTypeGrid({ layoutMode = 'cards', onLayoutModeChange, tableFilterStyle = 'cards' }: OpportunityTypeGridProps) {
  const navigate = useNavigate();
  const [localMode, setLocalMode] = useState<'cards' | 'table'>(layoutMode === 'table' ? 'table' : 'cards');
  const [expanded, setExpanded] = useState(false);

  const activeMode = onLayoutModeChange ? layoutMode : (localMode === 'table' ? 'table' : layoutMode);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-2 group"
        >
          <h2 className="text-xl font-semibold text-foreground">My opportunities</h2>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            expanded && "rotate-180"
          )} />
        </button>
        <button
          onClick={() => navigate('/opportunities')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary cards always visible */}
      <OpportunitySummaryCards onCardClick={() => { if (!expanded) setExpanded(true); }} />

      {/* Expandable detail listing */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {activeMode === 'table' && <TableLayout />}
            {activeMode !== 'table' && <TableLayout />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
