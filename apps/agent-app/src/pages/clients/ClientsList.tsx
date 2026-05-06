import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, ChevronLeft, ChevronRight, ChevronDown, Check, MoreVertical, Phone, Mail, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { OpportunityType, ClientWithOpportunities } from "@/types";
import { OpportunityTypeIconsRow, computeOpportunityTypeCounts } from "@/components/opportunities/opportunity-type-icons-row";
import { ClientsDevTool } from "@/components/dev-tools/clients-dev-tool";
import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { ReviewInquiryModal, InquiryData } from "@/components/modals/review-inquiry-modal";
import { ContentSkeleton } from "@/components/ui/content-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";

type SortColumn = 'name' | 'phone' | 'email' | 'opportunities' | 'lastInteraction';
type SortDirection = 'asc' | 'desc' | null;
type ClientStatusFilter = 'all' | 'new' | 'active' | 'inactive';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const ITEMS_PER_PAGE_KEY = 'clients-items-per-page';

export function ClientsList() {
  const { dataViewMode, setDataViewMode, getAllClientsWithOpportunities, addClient, addOpportunity, updateClient } = useData();
  const { loadingDelay, showSubtitles, skeletonTargets, sortMode } = useDevTools();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('all');
  const [intentFilters, setIntentFilters] = useState<OpportunityType[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('lastInteraction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 20;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<InquiryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [showOpportunityFilter, setShowOpportunityFilter] = useState(false);
  const [showPerPageControl, setShowPerPageControl] = useState(false);
  
  const navigate = useNavigate();
  
  const allClients = getAllClientsWithOpportunities();

  // Trigger loading when filters change
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
  }, [searchQuery, statusFilter, intentFilters, currentPage, loadingDelay]);

  // Persist items per page preference
  useEffect(() => {
    localStorage.setItem(ITEMS_PER_PAGE_KEY, itemsPerPage.toString());
  }, [itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, intentFilters, dataViewMode]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn, showOnHover: boolean = true) => {
    const isActive = sortColumn === column;
    
    if (!isActive) {
      // Only show inactive icons on hover
      return (
        <ArrowUpDown 
          className={`w-4 h-4 ml-1 opacity-0 group-hover/header:opacity-40 transition-opacity ${showOnHover ? '' : 'hidden'}`} 
        />
      );
    }
    
    // Always show active sort icon
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 ml-1" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Get client status based on their verification status and opportunities
  const getClientStatus = (client: ClientWithOpportunities): ClientStatusFilter => {
    // For now, mock status based on verification status
    if (client.verificationStatus === 'incoming') return 'new';
    if (client.opportunities.length === 0) return 'inactive';
    return 'active';
  };

  const filteredClients = allClients.filter(client => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Search logic as per requirements
    let matchesSearch = true;
    if (normalizedQuery) {
      // Check if it's a phone number search (contains digits)
      const isPhoneSearch = /\d/.test(normalizedQuery);
      
      if (isPhoneSearch) {
        // Phone number search: skip country code, match after 3rd character
        const phoneDigits = normalizedQuery.replace(/\D/g, '');
        if (phoneDigits.length >= 3) {
          const clientPhone = client.phone.replace(/\D/g, '');
          // Skip country code (assume first 1-3 digits) and search in remaining
          const clientPhoneWithoutCode = clientPhone.slice(clientPhone.length > 10 ? clientPhone.length - 10 : 0);
          matchesSearch = clientPhoneWithoutCode.includes(phoneDigits);
        } else {
          matchesSearch = false;
        }
      } else {
        // Name search: match from first character
        const fullName = client.fullName.toLowerCase();
        const firstName = fullName.split(' ')[0];
        const lastName = fullName.split(' ').slice(1).join(' ');
        matchesSearch = firstName.startsWith(normalizedQuery) || 
                       lastName.startsWith(normalizedQuery) ||
                       fullName.startsWith(normalizedQuery);
      }
    }
    
    // Status filter
    const clientStatus = getClientStatus(client);
    const matchesStatus = statusFilter === 'all' || clientStatus === statusFilter;
    
    // Intent filter (hidden by default, controlled via dev tools)
    const matchesIntent = intentFilters.length === 0 || 
                         client.opportunities.some(opp => intentFilters.includes(opp.type));
    
    return matchesSearch && matchesStatus && matchesIntent;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'name':
        aValue = a.fullName.toLowerCase();
        bValue = b.fullName.toLowerCase();
        break;
      case 'phone':
        aValue = a.phone?.toLowerCase() || '';
        bValue = b.phone?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
        break;
      case 'opportunities':
        aValue = a.opportunities.length;
        bValue = b.opportunities.length;
        break;
      case 'lastInteraction':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusCount = (status: ClientStatusFilter) => {
    if (status === 'all') return allClients.length;
    return allClients.filter(client => getClientStatus(client) === status).length;
  };

  const getClientOpportunityData = (clientId: string) => {
    const client = allClients.find(c => c.id === clientId);
    if (!client) return { typeCounts: [], inactiveCount: 0 };
    return computeOpportunityTypeCounts(client.opportunities);
  };

  const formatLastActivity = (activity: string, dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let timeString = '';
    if (diffInMinutes < 60) {
      timeString = `${diffInMinutes}min ago`;
    } else if (diffInHours < 24) {
      timeString = `${diffInHours}h ago`;
    } else if (diffInDays < 365) {
      timeString = `${diffInDays}d ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      timeString = `${years}y ago`;
    }

    return `${activity} ${timeString}`;
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Build inquiry data for an incoming client and open ReviewInquiryModal
  const handleIncomingClientClick = useCallback((client: ClientWithOpportunities) => {
    const oppType: OpportunityType = client.opportunities.length > 0 ? client.opportunities[0].type : 'buy';
    const inquiry: InquiryData = {
      id: `client-inquiry-${client.id}`,
      clientName: client.fullName,
      opportunityType: oppType,
      expiresAt: client.expiresAt || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      properties: client.opportunities.slice(0, 3).map((opp, i) => ({
        id: opp.id,
        title: opp.title || 'Property inquiry',
        image: opp.images?.[0] || apartmentImage1,
        price: opp.priceRange ? `€${opp.priceRange.min.toLocaleString()}` : '€N/A',
        beds: opp.bedrooms || 2,
        isExclusive: false,
        source: (client.source === 'idealista' || client.source === 'fotocasa') ? client.source : 'idealista' as const,
        sourceTime: 'Recently',
      })),
    };
    // If no opportunities with properties, show as note-based inquiry
    if (inquiry.properties.length === 0) {
      inquiry.note = `${client.fullName} is a new incoming client. Accept to reveal contact details and start working together.`;
      inquiry.noteSource = client.source ? `From ${client.source}` : undefined;
    }
    setActiveInquiry(inquiry);
    setReviewModalOpen(true);
  }, []);

  const handleAcceptInquiry = useCallback((inquiry: InquiryData) => {
    // Find the original client by matching the inquiry id pattern
    const clientIdMatch = inquiry.id.match(/client-inquiry-(.+)/);
    if (clientIdMatch) {
      const clientId = clientIdMatch[1];
      // Update the client's verification status to 'verified'
      updateClient(clientId, { verificationStatus: 'verified' });
      return clientId;
    }
    return undefined;
  }, [updateClient]);

  const isIncomingClient = (client: ClientWithOpportunities) => client.verificationStatus === 'incoming';

  // Pagination calculations
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);
  
  const showPagination = sortedClients.length > 0;

  const statusFilters: { value: ClientStatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <PageContainer>
      {/* Invisible tracking sentinel for global header */}
      <TrackedTitle title="Clients">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        {/* Header with title and New button */}
        <div className="flex justify-between items-center animate-fade-in-fast">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            {showSubtitles && <p className="text-muted-foreground">Manage your client relationships and opportunities</p>}
          </div>
          <Button onClick={() => setNewClientModalOpen(true)}>
            + New
          </Button>
        </div>

      <ClientsDevTool 
        showOpportunityFilter={showOpportunityFilter}
        onShowOpportunityFilterChange={setShowOpportunityFilter}
        intentFilters={intentFilters}
        onIntentFiltersChange={setIntentFilters}
        showPerPageControl={showPerPageControl}
        onShowPerPageControlChange={setShowPerPageControl}
      />

      {/* Search Bar and Status Filters on same row */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-fast">
        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10 w-full bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {statusFilters.map((status) => {
            const count = getStatusCount(status.value);
            const isActive = statusFilter === status.value;

            return (
              <Button
                key={status.value}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status.value)}
                className={cn(
                  "shrink-0 gap-2",
                  isActive 
                    ? "bg-foreground text-background hover:bg-foreground/90" 
                    : "bg-card"
                )}
              >
                {status.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center leading-none rounded-full",
                    isActive
                      ? "text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                  style={isActive ? { backgroundColor: '#666666' } : undefined}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results count and sorting row - only in button mode */}
      {sortMode === 'button' && (
        <div className="flex items-center justify-between animate-fade-in-fast gap-2 min-w-0">
          <p className="text-sm font-medium shrink-0">
            {sortedClients.length} clients
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <ArrowUpDown className="w-4 h-4" />
                {sortColumn === 'name' ? `Name: ${sortDirection === 'asc' ? 'A–Z' : 'Z–A'}` :
                 sortColumn === 'lastInteraction' ? `Interaction: ${sortDirection === 'asc' ? 'Oldest' : 'Newest'}` :
                 sortColumn === 'opportunities' ? `Opportunities: ${sortDirection === 'asc' ? 'Low' : 'High'}` :
                 'Interaction: Newest'}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortColumn('lastInteraction'); setSortDirection('desc'); }} className="justify-between">
                Interaction: Newest first
                {sortColumn === 'lastInteraction' && sortDirection === 'desc' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortColumn('lastInteraction'); setSortDirection('asc'); }} className="justify-between">
                Interaction: Oldest first
                {sortColumn === 'lastInteraction' && sortDirection === 'asc' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortColumn('name'); setSortDirection('asc'); }} className="justify-between">
                Name: A–Z
                {sortColumn === 'name' && sortDirection === 'asc' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortColumn('name'); setSortDirection('desc'); }} className="justify-between">
                Name: Z–A
                {sortColumn === 'name' && sortDirection === 'desc' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortColumn('opportunities'); setSortDirection('desc'); }} className="justify-between">
                Opportunities: Most first
                {sortColumn === 'opportunities' && sortDirection === 'desc' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {sortedClients.length === 0 && searchQuery === '' && statusFilter === 'all' && intentFilters.length === 0 ? (
        <div 
          className="border-2 border-dashed border-border rounded-2xl p-12 cursor-pointer hover:border-muted-foreground/50 transition-colors bg-card"
          onClick={() => setNewClientModalOpen(true)}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Plus className="w-8 h-8 text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">No clients</h3>
              <p className="text-muted-foreground">
                Add your first client and start creating opportunities
              </p>
            </div>
          </div>
        </div>
      ) : sortedClients.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 bg-card">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">No clients</h3>
              <p className="text-muted-foreground">
                There are no clients that match this filter
              </p>
            </div>
          </div>
        </div>
      ) : isLoading && skeletonTargets.clients ? (
        // Loading skeletons
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Opportunities</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ContentSkeleton variant="table-row" count={10} />
            </TableBody>
          </Table>
        </Card>
      ) : (
        // List/Table View
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="group/header">
                <TableHead 
                  className={cn(sortMode === 'header' && "cursor-pointer hover:bg-muted/50 select-none")}
                  onClick={() => sortMode === 'header' && handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortMode === 'header' && getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(sortMode === 'header' && "cursor-pointer hover:bg-muted/50 select-none")}
                  onClick={() => sortMode === 'header' && handleSort('phone')}
                >
                  <div className="flex items-center">
                    Phone
                    {sortMode === 'header' && getSortIcon('phone')}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(sortMode === 'header' && "cursor-pointer hover:bg-muted/50 select-none")}
                  onClick={() => sortMode === 'header' && handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortMode === 'header' && getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(sortMode === 'header' && "cursor-pointer hover:bg-muted/50 select-none")}
                  onClick={() => sortMode === 'header' && handleSort('opportunities')}
                >
                  <div className="flex items-center">
                    Opportunities
                    {sortMode === 'header' && getSortIcon('opportunities')}
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(sortMode === 'header' && "cursor-pointer hover:bg-muted/50 select-none")}
                  onClick={() => sortMode === 'header' && handleSort('lastInteraction')}
                >
                  <div className="flex items-center">
                    Last Interaction
                    {sortMode === 'header' && getSortIcon('lastInteraction')}
                  </div>
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody key={`table-${contentKey}`} className="animate-fade-in">
              {paginatedClients.map((client) => {
                const incoming = isIncomingClient(client);
                return (
                <TableRow 
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50 group"
                  onClick={() => {
                    if (incoming) {
                      handleIncomingClientClick(client);
                    } else {
                      navigate(`/clients/${client.id}`);
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={client.fullName} size="sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{client.fullName}</span>
                        {incoming && <NewClientBadge />}
                        {!incoming && client.opportunities.some(o => o.status === 'new' || o.status === 'to-review') && <NewClientBadge />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {incoming ? (
                      <FloatingParticles className="h-8 w-28" particleCount={40} />
                    ) : (
                      client.phone
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {incoming ? (
                      <FloatingParticles className="h-8 w-36" particleCount={55} />
                    ) : (
                      client.email || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const { typeCounts, inactiveCount } = getClientOpportunityData(client.id);
                      return (
                        <OpportunityTypeIconsRow
                          typeCounts={typeCounts}
                          inactiveCount={inactiveCount}
                          variant="table"
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatLastActivity(client.lastActivity, client.updatedAt)}
                  </TableCell>
                  <TableCell>
                    {incoming ? null : (
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
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Contact</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`, '_self'); }}
                          className="gap-3"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank'); }}
                          className="gap-3"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </DropdownMenuItem>
                        {client.email && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); window.open(`mailto:${client.email}`, '_self'); }}
                            className="gap-3"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
                          className="gap-3"
                        >
                          <User className="w-4 h-4" />
                          Go to profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {showPagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>{startIndex + 1}–{Math.min(endIndex, sortedClients.length)}</span>
            <span>of</span>
            <span>{sortedClients.length}</span>
            {showPerPageControl && (
              <>
                <span className="mx-2">·</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1">
                    {itemsPerPage} per page
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <DropdownMenuItem 
                        key={option} 
                        onClick={() => {
                          setItemsPerPage(option);
                          setCurrentPage(1);
                        }}
                        className={cn(itemsPerPage === option && "bg-accent")}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
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
        </div>
      )}
      </div>
      
      <NewClientModal open={newClientModalOpen} onOpenChange={setNewClientModalOpen} />
      <ReviewInquiryModal
        open={reviewModalOpen}
        onOpenChange={(open) => {
          setReviewModalOpen(open);
        }}
        inquiry={activeInquiry}
        onAccept={(inquiry) => {
          return handleAcceptInquiry(inquiry);
        }}
        onDecline={() => {
          setReviewModalOpen(false);
        }}
      />
    </PageContainer>
  );
}