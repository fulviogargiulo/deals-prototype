import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ChevronLeft, ChevronDown, Plus, ArrowUpDown, ArrowUp, ArrowDown, Check, MoreVertical, Handshake, CircleOff, CheckCircle2, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { OpportunityType, OpportunityStatus } from "@/types";
import { ContentSkeleton } from "@/components/ui/content-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from "@/components/opportunities/opportunity-bare-icons";
import { getOpportunityLabel } from "@/components/opportunities/opportunity-icon";
import { CloseDealModal } from "@/components/modals/close-deal-modal";
import { DeactivateOpportunityModal } from "@/components/modals/deactivate-opportunity-modal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OpportunityThumbnail } from "@/components/opportunities/opportunity-thumbnail";

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string; bgColor: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A', bgColor: 'rgba(0, 138, 138, 0.10)' },
  sell: { icon: SellBareIcon, color: '#D95D28', bgColor: 'rgba(217, 93, 40, 0.10)' },
  rent: { icon: RentBareIcon, color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.10)' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3', bgColor: 'rgba(205, 82, 195, 0.10)' },
};

type StatusFilter = OpportunityStatus | 'all' | 'inactive';

const ITEMS_PER_PAGE = 20;

export function OpportunitiesList() {
  const { opportunities, getClientById } = useData();
  const { loadingDelay, showSubtitles, skeletonTargets, sortMode, newMatchesDisplay } = useDevTools();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilters, setTypeFilters] = useState<OpportunityType[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [sortBy, setSortBy] = useState<'interaction-newest' | 'interaction-oldest' | 'created-newest' | 'created-oldest'>('interaction-newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  
  // Action modal state
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCloseDealModal, setShowCloseDealModal] = useState(false);
  const [opportunityStates, setOpportunityStates] = useState<Record<string, { isDeactivated: boolean; isClosed: boolean; isActivating?: boolean }>>({});
  const { toast } = useToast();
  
  const navigate = useNavigate();
  
  const handleActivate = async (oppId: string) => {
    setOpportunityStates(prev => ({
      ...prev,
      [oppId]: { ...prev[oppId], isActivating: true }
    }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOpportunityStates(prev => ({
      ...prev,
      [oppId]: { isDeactivated: false, isClosed: false, isActivating: false }
    }));
    toast({ title: "Opportunity activated", description: "The opportunity is now active again." });
  };

  useEffect(() => {
    if (loadingDelay > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setContentKey(prev => prev + 1);
      }, loadingDelay);
      return () => clearTimeout(timer);
    } else {
      setContentKey(prev => prev + 1);
    }
  }, [searchQuery, typeFilters, statusFilters, sortBy, loadingDelay]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilters, statusFilters]);

  const filteredOpportunities = useMemo(() => {
    const filtered = opportunities.filter(opportunity => {
      const client = getClientById(opportunity.clientId);
      const matchesSearch = !searchQuery || 
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilters.length === 0 || typeFilters.includes(opportunity.type);
      const matchesStatus = statusFilters.length === 0 || 
        statusFilters.some(sf => {
          if (sf === 'inactive') return opportunity.status !== 'new' && opportunity.status !== 'active' && opportunity.status !== 'closed';
          return opportunity.status === sf;
        });
      return matchesSearch && matchesType && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'interaction-newest': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'interaction-oldest': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'created-newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created-oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });
  }, [opportunities, searchQuery, typeFilters, statusFilters, sortBy, getClientById]);

  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOpportunities = filteredOpportunities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatPrice = (priceRange?: { min: number; max: number; currency: string }) => {
    if (!priceRange) return '—';
    const { min, max, currency } = priceRange;
    const symbol = currency === 'EUR' ? '€' : currency;
    if (min === max) return `${symbol}${(min / 1000).toFixed(0)}k`;
    return `${symbol}${(min / 1000).toFixed(0)}k – ${(max / 1000).toFixed(0)}k`;
  };

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'new', label: 'New' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'closed', label: 'Closed' },
  ];

  const types: OpportunityType[] = ['buy', 'sell', 'rent', 'lease'];

  const toggleTypeFilter = (type: OpportunityType) => {
    setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleStatusFilter = (status: StatusFilter) => {
    setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'interaction-newest': return 'Interaction: Newest first';
      case 'interaction-oldest': return 'Interaction: Oldest first';
      case 'created-newest': return 'Created: Newest first';
      case 'created-oldest': return 'Created: Oldest first';
    }
  };

  type OppSortColumn = 'interaction' | 'created';
  type OppSortDir = 'asc' | 'desc';

  const getHeaderSortState = (): { column: OppSortColumn; dir: OppSortDir } => {
    switch (sortBy) {
      case 'interaction-newest': return { column: 'interaction', dir: 'desc' };
      case 'interaction-oldest': return { column: 'interaction', dir: 'asc' };
      case 'created-newest': return { column: 'created', dir: 'desc' };
      case 'created-oldest': return { column: 'created', dir: 'asc' };
    }
  };

  const handleHeaderSort = (column: OppSortColumn) => {
    const current = getHeaderSortState();
    if (current.column === column) {
      // Toggle direction
      if (column === 'interaction') {
        setSortBy(current.dir === 'desc' ? 'interaction-oldest' : 'interaction-newest');
      } else {
        setSortBy(current.dir === 'desc' ? 'created-oldest' : 'created-newest');
      }
    } else {
      setSortBy(column === 'interaction' ? 'interaction-newest' : 'created-newest');
    }
  };

  const getHeaderSortIcon = (column: OppSortColumn) => {
    const current = getHeaderSortState();
    if (current.column !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover/header:opacity-40 transition-opacity" />;
    }
    return current.dir === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
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
    return lastInteractions[oppId] || { text: 'Updated', time: '1d ago' };
  };

  return (
    <PageContainer>
      <TrackedTitle title="Opportunities">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in-fast">
          <div>
            <h1 className="text-3xl font-bold">Opportunities</h1>
            {showSubtitles && <p className="text-muted-foreground">Manage all client opportunities</p>}
          </div>
          <Button>
            + New
          </Button>
        </div>

        {/* Search + filter dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-fast">
          <div className="relative w-full sm:w-auto sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or opportunity..."
              className="pl-10 w-full bg-card rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type multi-select dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={typeFilters.length > 0 ? "default" : "outline"} className={cn(
                "shrink-0 gap-2 rounded-full",
                typeFilters.length === 0 && "bg-card"
              )}>
                {typeFilters.length === 0 ? 'Type' : types.filter(t => typeFilters.includes(t)).map(t => getOpportunityLabel(t)).join(', ')}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {types.map((type) => {
                const config = typeConfig[type];
                const Icon = config.icon;
                const isSelected = typeFilters.includes(type);
                return (
                  <DropdownMenuItem key={type} onClick={(e) => { e.preventDefault(); toggleTypeFilter(type); }} className="gap-3 justify-between">
                    <span className="flex items-center gap-3">
                      <span style={{ color: config.color }}><Icon className="w-4 h-4" /></span>
                      {getOpportunityLabel(type)}
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
                {statusFilters.length === 0 ? 'Status' : statusFilters.map(sf => statusFilterOptions.find(s => s.value === sf)?.label).filter(Boolean).join(', ')}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {statusFilterOptions.map((status) => {
                const isSelected = statusFilters.includes(status.value);
                return (
                  <DropdownMenuItem key={status.value} onClick={(e) => { e.preventDefault(); toggleStatusFilter(status.value); }} className="justify-between">
                    {status.label}
                    {isSelected && <Check className="w-4 h-4" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results count and sorting row - only in button mode */}
        {sortMode === 'button' && (
          <div className="flex items-center justify-between animate-fade-in-fast gap-2 min-w-0">
            <p className="text-sm font-medium shrink-0">
              {filteredOpportunities.length} opportunities
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <ArrowUpDown className="w-4 h-4" />
                  {getSortLabel()}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('interaction-newest')} className="justify-between">
                  Interaction: Newest first
                  {sortBy === 'interaction-newest' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('interaction-oldest')} className="justify-between">
                  Interaction: Oldest first
                  {sortBy === 'interaction-oldest' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created-newest')} className="justify-between">
                  Created: Newest first
                  {sortBy === 'created-newest' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created-oldest')} className="justify-between">
                  Created: Oldest first
                  {sortBy === 'created-oldest' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Table — same format as home page */}
        {isLoading && skeletonTargets.opportunities ? (
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[44px_1.2fr_1fr_100px_80px_80px_120px_40px] px-4 py-3 border-b border-border-ds-primary gap-3">
              <span />
              <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
              <span className="text-xs font-semibold text-fg-secondary">Client</span>
              <span className="text-xs font-semibold text-fg-secondary text-right">Price</span>
              <span className="text-xs font-semibold text-fg-secondary text-center">Beds</span>
              <span className="text-xs font-semibold text-fg-secondary text-center">Matches</span>
              <span className="text-xs font-semibold text-fg-secondary text-right">Last interaction</span>
              <span />
            </div>
            <div className="p-4 space-y-3">
              <ContentSkeleton variant="table-row" count={10} />
            </div>
          </div>
        ) : (
          <div key={`table-${contentKey}`} className="bg-card rounded-2xl overflow-hidden animate-fade-in">
            {/* Header row */}
            <div className="grid grid-cols-[44px_1.2fr_1fr_100px_80px_80px_120px_40px] px-4 py-3 border-b border-border-ds-primary gap-3 group/header">
              <span />
              <span className="text-xs font-semibold text-fg-secondary">Opportunity</span>
              <span className="text-xs font-semibold text-fg-secondary">Client</span>
              <span className="text-xs font-semibold text-fg-secondary text-right">Price</span>
              <span className="text-xs font-semibold text-fg-secondary text-center">Beds</span>
              <span className="text-xs font-semibold text-fg-secondary text-center">Matches</span>
              <span 
                className={cn(
                  "text-xs font-semibold text-fg-secondary text-right flex items-center justify-end",
                  sortMode === 'header' && "cursor-pointer hover:text-foreground select-none"
                )}
                onClick={() => sortMode === 'header' && handleHeaderSort('interaction')}
              >
                Last interaction
                {sortMode === 'header' && getHeaderSortIcon('interaction')}
              </span>
              <span />
            </div>

            {/* Body */}
            <div className="divide-y divide-border-ds-primary">
              {paginatedOpportunities.length > 0 ? paginatedOpportunities.map((opp) => {
                const config = typeConfig[opp.type];
                const Icon = config.icon;
                const client = getClientById(opp.clientId);
                const oppImages = opp.images || [];
                const isBuyRent = opp.type === 'buy' || opp.type === 'rent';
                const visibleImages = isBuyRent ? oppImages.slice(0, 3) : oppImages.slice(0, 1);
                const oppState = opportunityStates[opp.id];
                const isDeactivated = oppState?.isDeactivated || false;
                const isClosed = oppState?.isClosed || false;
                const isActivating = oppState?.isActivating || false;
                const isInactive = isDeactivated || isClosed;

                return (
                  <button
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className={cn(
                      "grid grid-cols-[44px_1.2fr_1fr_100px_80px_80px_120px_40px] px-4 py-3 w-full text-left hover:bg-surface-ds-raised/50 transition-all items-center gap-3 group",
                      isInactive && "opacity-50"
                    )}
                    style={{ transition: 'opacity 1.5s ease' }}
                  >
                    {/* Property image(s) */}
                    <OpportunityThumbnail
                      images={visibleImages}
                      fallbackIcon={Icon}
                      fallbackColor={config.color}
                      fallbackBgColor={config.bgColor}
                    />

                    {/* Title + type icon & label + status badge */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate leading-heading">{opp.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: isInactive ? '#999999' : config.color, transition: 'color 1.5s ease' }}>
                          <Icon className="w-3 h-3" />
                        </span>
                        <p className="text-xs text-fg-secondary leading-body">{getOpportunityLabel(opp.type)}</p>
                        {/* Status badges */}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-fade-in shrink-0" style={{ backgroundColor: 'rgba(16, 177, 137, 0.15)', color: '#10B189' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Closed
                          </span>
                        )}
                        {isDeactivated && !isClosed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-fade-in shrink-0" style={{ backgroundColor: 'rgba(237, 153, 23, 0.15)', color: '#ED9917' }}>
                            <CircleOff className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                        {['1', '3', '5'].includes(opp.id) && !isInactive && (
                          newMatchesDisplay === 'tag' ? (
                            <NewClientBadge type="new-matches" className="ml-1 scale-90 origin-left" />
                          ) : (
                            <div className="w-2 h-2 rounded-full ml-1 shrink-0 bg-ds-red" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-2 min-w-0">
                      {client ? (
                        <>
                          <UserAvatar name={client.fullName} size="sm" className="w-6 h-6 text-[10px] flex-shrink-0" />
                          <span className="text-sm text-foreground truncate">{client.fullName}</span>
                        </>
                      ) : (
                        <span className="text-sm text-fg-secondary">—</span>
                      )}
                    </div>

                    {/* Price */}
                    <span className="text-sm text-foreground text-right tabular-nums">
                      {formatPrice(opp.priceRange)}
                    </span>

                    {/* Beds */}
                    <span className="text-sm text-foreground text-center tabular-nums">
                      {opp.bedrooms ? `${opp.bedrooms}` : '—'}
                    </span>

                    {/* Matches */}
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-foreground tabular-nums">3</span>
                    </div>

                    {/* Last interaction */}
                    <div className="text-right min-w-0">
                      <p className="text-xs text-foreground truncate">{getLastInteraction(opp.id).text}</p>
                      <p className="text-[10px] text-fg-secondary">{getLastInteraction(opp.id).time}</p>
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4 rotate-90" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                          {isDeactivated && !isClosed ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivate(opp.id);
                              }}
                              className="gap-3"
                              disabled={isActivating}
                            >
                              {isActivating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                              {isActivating ? 'Activating...' : 'Activate'}
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOpportunityId(opp.id);
                                  setShowCloseDealModal(true);
                                }}
                                className="gap-3"
                                disabled={isClosed}
                              >
                                <Handshake className="w-4 h-4" />
                                Close deal
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOpportunityId(opp.id);
                                  setShowDeactivateModal(true);
                                }}
                                className="gap-3"
                                disabled={isClosed}
                              >
                                <CircleOff className="w-4 h-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </button>
                );
              }) : (
                <div className="py-12 text-center text-sm text-fg-secondary">
                  No opportunities found matching your criteria
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination — same style as clients list */}
        {filteredOpportunities.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredOpportunities.length)}</span>
              <span>of</span>
              <span>{filteredOpportunities.length}</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modals */}
      <DeactivateOpportunityModal
        open={showDeactivateModal}
        onOpenChange={(open) => {
          setShowDeactivateModal(open);
          if (!open) setSelectedOpportunityId(null);
        }}
        opportunityType={paginatedOpportunities.find(o => o.id === selectedOpportunityId)?.type || 'buy'}
        onDeactivate={async (reason, details) => {
          if (selectedOpportunityId) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setOpportunityStates(prev => ({
              ...prev,
              [selectedOpportunityId]: { ...prev[selectedOpportunityId], isDeactivated: true }
            }));
            toast({
              title: "Opportunity deactivated",
              description: `Reason: ${details ? `${reason} - ${details}` : reason}`,
            });
          }
        }}
      />

      <CloseDealModal
        open={showCloseDealModal}
        onOpenChange={(open) => {
          setShowCloseDealModal(open);
          if (!open) setSelectedOpportunityId(null);
        }}
        opportunityType={paginatedOpportunities.find(o => o.id === selectedOpportunityId)?.type || 'buy'}
        onClose={async (closingPrice, shouldDelist) => {
          if (selectedOpportunityId) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setOpportunityStates(prev => ({
              ...prev,
              [selectedOpportunityId]: { ...prev[selectedOpportunityId], isClosed: true }
            }));
            toast({
              title: "Deal closed",
              description: `Closing price: €${closingPrice.toLocaleString('es-ES')}`,
            });
          }
        }}
      />
    </PageContainer>
  );
}
