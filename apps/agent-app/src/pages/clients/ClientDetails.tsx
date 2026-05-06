import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Phone, Plus, MoreHorizontal, MoreVertical, ChevronDown, Calendar, Mail, ArrowLeft, ExternalLink, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, Handshake, CircleOff, Search, Check, CheckCircle2, Loader2, Power } from "lucide-react";
import { SourceBadge, SourceType } from "@/components/ui/source-badge";
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MatchingPreferencePills } from "@/components/matches/matching-preference-pills";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from "@/components/opportunities/opportunity-bare-icons";
import { getOpportunityLabel } from "@/components/opportunities/opportunity-icon";
import { UserAvatar as UserAvatarComp } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { OpportunityThumbnail } from "@/components/opportunities/opportunity-thumbnail";

import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { OpportunityTypeSelector } from "@/components/opportunities/opportunity-type-selector";
import { EmptyOpportunitiesState } from "@/components/opportunities/empty-opportunities-state";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ClientDetailsDevTool, ApiSimulationMode, OpportunityDisplayMode, DescriptionMode, SourceMode, OpportunityCardMatchesMode, OpportunityCardImageMode, OpportunityCardClientMode } from "@/components/dev-tools/client-details-dev-tool";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import { useToast } from "@/hooks/use-toast";
import { NewClientModal } from "@/components/modals/new-client-modal";
import { EditClientDescriptionModal } from "@/components/modals/edit-client-description-modal";
import { DeleteClientModal } from "@/components/modals/delete-client-modal";
import { DeactivateOpportunityModal } from "@/components/modals/deactivate-opportunity-modal";
import { CloseDealModal } from "@/components/modals/close-deal-modal";
import { TrackedTitle } from "@/components/ui/tracked-title";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Opportunity, OpportunityType, OpportunityStatus } from "@/types";
import { Input } from "@/components/ui/input";

const oppTypeConfig: Record<string, { icon: typeof BuyBareIcon; color: string; bgColor: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A', bgColor: 'rgba(0, 138, 138, 0.10)' },
  sell: { icon: SellBareIcon, color: '#D95D28', bgColor: 'rgba(217, 93, 40, 0.10)' },
  rent: { icon: RentBareIcon, color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.10)' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3', bgColor: 'rgba(205, 82, 195, 0.10)' },
};

// Portal logos for embedded mode
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";

const portalLogos: Record<string, string> = {
  'Idealista': idealistaLogo,
  'Fotocasa': fotocasaLogo,
  'Pisos': pisosLogo,
  'idealista': idealistaLogo,
  'fotocasa': fotocasaLogo,
  'pisos': pisosLogo,
};

// Opportunity context for embedded mode
export interface OpportunityContext {
  id: string;
  type: OpportunityType;
  title: string;
  property?: {
    propertyType: string;
    location: string;
    price: number;
    currency: string;
    bedrooms: number;
    size: number;
    sizeUnit: string;
    image?: string;
  };
}

// Props for embedded mode client data
export interface EmbeddedClientData {
  id: string;
  name: string;
  clientSince: string;
  source: string;
  isNew: boolean;
  isTopMatch: boolean;
  description?: string;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
    isYou?: boolean;
  };
  preferences: {
    propertyTypes: string[];
    locations: string[];
    priceRange: { min: number; max: number; currency: string };
    bedrooms: number;
    sizeRange: { min: number; max: number; unit: string };
    extras: string[];
  };
}

// Client Description Card with smooth max-height animation
function ClientDescriptionCard({ 
  description, 
  isExpanded, 
  onToggleExpand,
  onCardClick
}: { 
  description: string; 
  isExpanded: boolean; 
  onToggleExpand: () => void;
  onCardClick: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsedHeight, setCollapsedHeight] = useState<number>(60); // ~3 lines
  const [fullHeight, setFullHeight] = useState<number>(60);
  
  useEffect(() => {
    if (contentRef.current) {
      // Measure full height
      setFullHeight(contentRef.current.scrollHeight);
      // 3 lines at 14px font with 140% line-height = ~59px, rounded to 60
      setCollapsedHeight(60);
    }
  }, [description]);

  const needsExpand = description.length > 150;
  
  return (
    <Card 
      className="w-full max-w-lg p-3 cursor-pointer hover:bg-muted/50 transition-smooth"
      onClick={onCardClick}
    >
      <h3 className="text-base font-semibold leading-heading mb-2">Client description</h3>
      <div 
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: isExpanded ? `${fullHeight}px` : `${collapsedHeight}px` }}
      >
        <div ref={contentRef}>
          <p className="text-sm text-muted-foreground leading-body">
            {description}
          </p>
        </div>
        {needsExpand && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none transition-opacity duration-300"
            style={{ opacity: isExpanded ? 0 : 1 }}
          />
        )}
      </div>
      {needsExpand && (
        <div 
          className="w-full pt-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          <button 
            className="text-sm text-muted-foreground flex items-center gap-1 transition-smooth"
          >
            {isExpanded ? 'Show less' : 'Show more'} 
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </Card>
  );
}


interface ClientDetailsProps {
  /** Client ID when used standalone */
  clientId?: string;
  /** Whether component is embedded in a modal/expand card */
  embedded?: boolean;
  /** Client data for embedded mode (avoids re-fetching) */
  embeddedClientData?: EmbeddedClientData;
  /** Callback when close button is clicked (embedded mode) */
  onClose?: () => void;
  /** Callback when open full page is clicked (embedded mode) */
  onOpenFullPage?: () => void;
  /** Callback for discard action (embedded mode) */
  onDiscard?: () => void;
  /** Callback for save action (embedded mode) */
  onSave?: () => void;
  /** Opportunity context for matching preferences (embedded mode) */
  opportunityContext?: OpportunityContext;
}

export function ClientDetails({
  clientId: propId,
  embedded = false,
  embeddedClientData,
  onClose,
  onOpenFullPage,
  onDiscard,
  onSave,
  opportunityContext,
}: ClientDetailsProps = {}) {
  const { id: urlId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { getClientWithOpportunities, updateClient } = useData();
  const { loadingDelay, skeletonTargets, newMatchesDisplay } = useDevTools();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(!embedded && loadingDelay > 0 && skeletonTargets.clientDetails);
  const [isEmbeddedLoading, setIsEmbeddedLoading] = useState(embedded); // Loading state for embedded mode
  const [showOpportunitySelector, setShowOpportunitySelector] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [apiMode, setApiMode] = useState<ApiSimulationMode>('success');
  const [editOpen, setEditOpen] = useState(false);
  const [opportunityMode, setOpportunityMode] = useState<OpportunityDisplayMode>('default');
  const [descriptionMode, setDescriptionMode] = useState<DescriptionMode>('default');
  const [sourceMode, setSourceMode] = useState<SourceMode>('default');
  const [devMode, setDevMode] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [cardMatchesMode, setCardMatchesMode] = useState<OpportunityCardMatchesMode>('with-matches');
  const [cardImageMode, setCardImageMode] = useState<OpportunityCardImageMode>('with-image');
  const [cardClientMode, setCardClientMode] = useState<OpportunityCardClientMode>('no-client');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityViewMode, setOpportunityViewMode] = useState<'cards' | 'table'>(() => {
    const saved = localStorage.getItem('client-detail-opp-view');
    return (saved === 'table' || saved === 'cards') ? saved : 'cards';
  });
  const [oppTableSort, setOppTableSort] = useState<'title' | 'price' | 'beds' | 'interaction'>('interaction');
  const [oppTableDir, setOppTableDir] = useState<'asc' | 'desc'>('desc');
  
  // Filters for table view
  const [oppSearchQuery, setOppSearchQuery] = useState('');
  const [oppTypeFilters, setOppTypeFilters] = useState<OpportunityType[]>([]);
  const [oppStatusFilters, setOppStatusFilters] = useState<('active' | 'new' | 'inactive' | 'closed')[]>([]);
  
  
  // Opportunity action modals state
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCloseDealModal, setShowCloseDealModal] = useState(false);
  const [opportunityStates, setOpportunityStates] = useState<Record<string, { isDeactivated: boolean; isClosed: boolean; isActivating?: boolean }>>({});
  const [newOpportunityId, setNewOpportunityId] = useState<string | null>(null);
  
  const newOppTypeParam = searchParams.get('newOpportunity');
  
  // Handle opportunity activation with simulated API call
  const handleActivateOpportunity = async (opportunityId: string) => {
    // Set activating state
    setOpportunityStates(prev => ({
      ...prev,
      [opportunityId]: { ...prev[opportunityId], isActivating: true }
    }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update state
    setOpportunityStates(prev => ({
      ...prev,
      [opportunityId]: { ...prev[opportunityId], isDeactivated: false, isActivating: false }
    }));
    
    toast({
      title: "Opportunity activated",
      description: "The opportunity is now active.",
    });
  };
  // Persist opportunity view mode
  useEffect(() => {
    localStorage.setItem('client-detail-opp-view', opportunityViewMode);
  }, [opportunityViewMode]);

  // Simulate loading delay for embedded mode
  useEffect(() => {
    if (embedded) {
      const timer = setTimeout(() => setIsEmbeddedLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [embedded]);

  // For embedded mode, use provided data; otherwise fetch
  const client = embedded && embeddedClientData 
    ? null // We'll use embeddedClientData directly in embedded mode
    : id ? getClientWithOpportunities(id) : undefined;

  // Simulate loading delay
  useEffect(() => {
    if (loadingDelay > 0 && skeletonTargets.clientDetails) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), loadingDelay);
      return () => clearTimeout(timer);
    }
  }, [id, loadingDelay, skeletonTargets.clientDetails]);

  // Handle newOpportunity query param — highlight animation on first opportunity
  useEffect(() => {
    if (newOppTypeParam && !embedded && client?.opportunities?.length) {
      setSearchParams({}, { replace: true });
      setNewOpportunityId(client.opportunities[0].id);
      const timer = setTimeout(() => setNewOpportunityId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newOppTypeParam, client]);

  // Get description based on dev tool mode
  const getDevDescription = (): string => {
    switch (descriptionMode) {
      case 'none':
        return '';
      case 'short':
        return 'Looking for a 2-bedroom apartment in downtown area.';
      case 'long':
        return 'Alejandro is moving to a new city with his family for work. He needs to buy a house within the next 2 months. He has 2 kids and a dog, prefers something with a backyard and close to good schools. Budget is flexible but looking for best value. Previous experience with real estate was positive, expects similar level of service.';
      default:
        return client?.description || '';
    }
  };

  const displayDescription = getDevDescription();

  // Get source based on dev tool mode
  const getDevSource = (): SourceType | undefined => {
    if (sourceMode === 'default') {
      return client?.source as SourceType | undefined;
    }
    return sourceMode as SourceType;
  };

  const displaySource = getDevSource();

  // Reset expanded state when description changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [displayDescription]);

  // Filter opportunities based on dev tool mode
  const getFilteredOpportunities = (): Opportunity[] => {
    if (!client) return [];
    
    // Generate synthetic opportunities for testing
    const generateSyntheticOpportunities = (count: number): Opportunity[] => {
      const types = ['buy', 'rent', 'sell', 'lease', 'mortgage'] as const;
      const configs = {
        buy: {
          title: 'Buy Apartment in Salamanca',
          priceRange: { min: 450000, max: 600000, currency: '€' },
          bedrooms: 3,
          bathrooms: 2,
          neighborhoods: ['Salamanca', 'Recoletos'],
          propertyTypes: ['Apartment', 'Penthouse'],
        },
        rent: {
          title: 'Rent Loft in Malasaña',
          priceRange: { min: 1500, max: 2000, currency: '€' },
          bedrooms: 2,
          bathrooms: 1,
          neighborhoods: ['Malasaña', 'Chueca'],
          propertyTypes: ['Loft', 'Studio'],
        },
        sell: {
          title: 'Sell Villa in Pozuelo',
          priceRange: { min: 750000, max: 900000, currency: '€' },
          bedrooms: 4,
          bathrooms: 3,
          neighborhoods: ['Pozuelo', 'Majadahonda'],
          propertyTypes: ['Villa', 'Detached House'],
        },
        lease: {
          title: 'Lease Office in AZCA',
          priceRange: { min: 3000, max: 5000, currency: '€' },
          bedrooms: 0,
          bathrooms: 2,
          neighborhoods: ['AZCA', 'Chamartín'],
          propertyTypes: ['Office', 'Commercial'],
        },
        mortgage: {
          title: 'Mortgage Pre-Approval',
          priceRange: { min: 500000, max: 700000, currency: '€' },
          bedrooms: 0,
          bathrooms: 0,
          neighborhoods: ['Any'],
          propertyTypes: ['Mortgage', 'Financing'],
        },
      };
      
      const result: Opportunity[] = [];
      for (let i = 0; i < count; i++) {
        const type = types[i % types.length];
        const config = configs[type];
        result.push({
          id: `dev-opp-${type}-${i}`,
          clientId: client.id,
          type,
          status: 'active',
          title: config.title,
          priceRange: config.priceRange,
          bedrooms: config.bedrooms,
          bathrooms: config.bathrooms,
          sizeRange: { min: 100, max: 150, unit: 'm²' },
          neighborhoods: config.neighborhoods,
          tags: [],
          portalBadges: ['idealista'],
          source: 'idealista',
          updatesCount: 0,
          pendingActions: [],
          propertyTypes: config.propertyTypes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return result;
    };
    
    switch (opportunityMode) {
      case 'count-0':
        return [];
      case 'count-1':
        return generateSyntheticOpportunities(1);
      case 'count-2':
        return generateSyntheticOpportunities(2);
      case 'count-5':
        return generateSyntheticOpportunities(5);
      default:
        return client.opportunities;
    }
  };

  const displayedOpportunities = getFilteredOpportunities();

  // Filter displayed opportunities for table view
  const filteredDisplayedOpportunities = displayedOpportunities.filter(opp => {
    const matchesSearch = !oppSearchQuery || 
      opp.title.toLowerCase().includes(oppSearchQuery.toLowerCase());
    const matchesType = oppTypeFilters.length === 0 || oppTypeFilters.includes(opp.type);
    const matchesStatus = oppStatusFilters.length === 0 || 
      oppStatusFilters.some(sf => {
        if (sf === 'inactive') {
          const state = opportunityStates[opp.id];
          return state?.isDeactivated && !state?.isClosed;
        }
        if (sf === 'closed') return opportunityStates[opp.id]?.isClosed;
        if (sf === 'active') return opp.status === 'active' && !opportunityStates[opp.id]?.isDeactivated && !opportunityStates[opp.id]?.isClosed;
        if (sf === 'new') return opp.status === 'new' || opp.status === 'to-review';
        return false;
      });
    return matchesSearch && matchesType && matchesStatus;
  });

  const oppTypes: OpportunityType[] = ['buy', 'sell', 'rent', 'lease'];
  const oppStatusFilterOptions = [
    { value: 'active' as const, label: 'Active' },
    { value: 'new' as const, label: 'New' },
    { value: 'inactive' as const, label: 'Inactive' },
    { value: 'closed' as const, label: 'Closed' },
  ];
  const toggleOppTypeFilter = (type: OpportunityType) => {
    setOppTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleOppStatusFilter = (status: 'active' | 'new' | 'inactive' | 'closed') => {
    setOppStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  // Helper to show dev label construction
  const getDevLabel = (opportunity: Opportunity) => {
    const parts: string[] = [];
    
    // Type
    parts.push('${opportunityType}');
    
    // Property types if available
    if (opportunity.propertyTypes && opportunity.propertyTypes.length > 0) {
      parts.push('${propertyTypes[0]}');
    }
    
    // Location/neighborhoods
    if (opportunity.neighborhoods && opportunity.neighborhoods.length > 0) {
      parts.push('in ${neighborhoods[0]}');
    }
    
    return parts.join(' ');
  };

  const handleSaveDescription = (newDescription: string) => {
    if (!client || !id) return;
    
    if (apiMode === 'error') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save client description. Please try again.",
      });
      return;
    }
    
    // Update client with new description
    updateClient(id, { description: newDescription });
    
    toast({
      title: "Success",
      description: "Client description saved successfully.",
    });
  };

  // =====================================================
  // EMBEDDED MODE RENDER
  // =====================================================
  if (embedded && embeddedClientData) {
    const clientData = embeddedClientData;
    const embeddedDescription = clientData.description || 
      `Looking for a ${clientData.preferences.bedrooms}-bedroom ${clientData.preferences.propertyTypes[0]?.toLowerCase() || 'property'} in ${clientData.preferences.locations[0] || 'Madrid'}. Budget range ${clientData.preferences.priceRange.currency}${(clientData.preferences.priceRange.min / 1000).toFixed(0)}k - ${(clientData.preferences.priceRange.max / 1000).toFixed(0)}k. Interested in properties with ${clientData.preferences.extras.slice(0, 3).join(', ') || 'modern amenities'}.`;

    const handleOpenFullPageClick = () => {
      if (onOpenFullPage) {
        onOpenFullPage();
      } else {
        window.open(`/clients/${clientData.id}`, '_blank');
      }
    };

    // Map source string to SourceType
    const getSourceType = (): SourceType | undefined => {
      const sourceMap: Record<string, SourceType> = {
        'Idealista': 'idealista',
        'Fotocasa': 'fotocasa',
        'Pisos': 'pisos',
        'Huspy': 'huspy',
        'idealista': 'idealista',
        'fotocasa': 'fotocasa',
        'pisos': 'pisos',
        'huspy': 'huspy',
        'Self created': 'self-created',
        'self-created': 'self-created',
        'Marketing campaign': 'marketing-campaign',
        'marketing-campaign': 'marketing-campaign',
        'OPS portal': 'ops-portal',
        'ops-portal': 'ops-portal',
      };
      return sourceMap[clientData.source];
    };

    const embeddedSource = getSourceType();

    // Show embedded skeleton while loading
    if (isEmbeddedLoading) {
      return (
        <div className="flex flex-col h-full bg-background animate-fade-in">
          {/* Embedded Header Skeleton */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl bg-white/60 flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="text-center flex-1 min-w-0 px-4 space-y-2">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          {/* Scrollable Content Skeleton */}
          <ScrollArea className="flex-1">
            <div className="pb-24">
              {/* Client Info Skeleton - Centered */}
              <div className="px-4 pt-6 pb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Source Badge Skeleton */}
                  <Skeleton className="h-8 w-24 rounded-full" />

                  {/* Client Name and Info Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-48 mx-auto" />
                    <Skeleton className="h-5 w-32 mx-auto" />
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Skeleton className="h-11 w-36 rounded-full" />
                    <Skeleton className="h-11 w-32 rounded-full" />
                    <Skeleton className="h-11 w-28 rounded-full" />
                  </div>

                  {/* Description Card Skeleton */}
                  <Skeleton className="w-full max-w-lg h-24 rounded-lg" />
                </div>
              </div>

              {/* Cards section Skeleton */}
              <div className="px-4 space-y-4">
                {/* Matching Preferences Skeleton */}
                <Card className="p-4">
                  <Skeleton className="h-5 w-40 mb-3" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-8 w-24 rounded-full" />
                      <Skeleton className="h-8 w-32 rounded-full" />
                      <Skeleton className="h-8 w-28 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24 mt-2" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-8 w-20 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-full" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                </Card>

                {/* Related Opportunity Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Bottom CTA Skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton className="flex-1 h-12 rounded-xl" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Embedded Header - Same style as PropertyDetails embedded */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl bg-white/60 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center flex-1 min-w-0 px-4">
            <p className="font-semibold truncate">{clientData.name}</p>
            <p className="text-sm text-muted-foreground truncate">Client since {clientData.clientSince}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenFullPageClick}
            className="h-10 w-10 rounded-full"
            title="Open full profile"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content - Same structure as full page */}
        <ScrollArea className="flex-1">
          <div className="pb-24">
            {/* Client Info - Centered (matching full page layout) */}
            <div className="px-4 pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Source Badge */}
                {embeddedSource && (
                  <SourceBadge source={embeddedSource} />
                )}

                {/* Client Name and Info */}
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold leading-heading">{clientData.name}</h1>
                  <p className="text-lg font-semibold leading-heading text-foreground">Client since {clientData.clientSince}</p>
                  
                  {/* Owned by */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <UserAvatar name={clientData.owner.name} size="sm" className="w-5 h-5 text-[10px]" />
                    <span className="text-base font-normal leading-body text-muted-foreground">
                      {clientData.owner.isYou ? 'Owned by you' : `Owned by ${clientData.owner.name}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Same as full page */}
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full px-6"
                    onClick={() => window.open(`tel:+34612345678`)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full px-6"
                    onClick={() => {
                      const phone = '+34612345678'.replace(/\s+/g, '').replace(/^\+/, '');
                      window.open(`https://wa.me/${phone}`, '_blank');
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full px-6"
                    onClick={() => window.open(`mailto:${clientData.name.toLowerCase().replace(' ', '.')}@email.com`)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full px-6"
                    onClick={() => console.log('Book a visit')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book a visit
                  </Button>
                </div>

                {/* Description Section - Same as full page */}
                {embeddedDescription ? (
                  <Card className="w-full max-w-lg p-3 cursor-pointer hover:bg-muted/50 transition-smooth">
                    <h3 className="text-base font-semibold leading-heading mb-2">Client description</h3>
                    <div 
                      className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
                      style={{ maxHeight: isDescriptionExpanded ? '500px' : '60px' }}
                    >
                      <p className="text-sm text-muted-foreground leading-body">
                        {embeddedDescription}
                      </p>
                      {embeddedDescription.length > 150 && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none transition-opacity duration-300"
                          style={{ opacity: isDescriptionExpanded ? 0 : 1 }}
                        />
                      )}
                    </div>
                    {embeddedDescription.length > 150 && (
                      <button 
                        className="text-sm text-muted-foreground flex items-center gap-1 mt-2 transition-smooth"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        {isDescriptionExpanded ? 'Show less' : 'Show more'} 
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </Card>
                ) : (
                  <button 
                    className="text-sm underline font-medium"
                    onClick={() => console.log('Add description')}
                  >
                    Add client description
                  </button>
                )}
              </div>
            </div>

            {/* Cards section */}
            <div className="px-4 space-y-4">
              {/* Matching Preferences - embedded only */}
              {clientData.preferences && (
                <Card className="p-4">
                  {/* Header with title, subtitle, and property image */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold leading-heading">Matching preferences</h3>
                      {opportunityContext?.property && (
                        <p className="text-sm font-normal leading-body text-muted-foreground mt-1">
                          {opportunityContext.property.propertyType} in {opportunityContext.property.location} • {opportunityContext.property.currency}{opportunityContext.property.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {opportunityContext?.property?.image && (
                      <img 
                        src={opportunityContext.property.image} 
                        alt="Property"
                        className="w-12 h-12 rounded-lg object-cover ml-4 flex-shrink-0"
                      />
                    )}
                  </div>
                  <MatchingPreferencePills
                    clientData={{
                      propertyTypes: clientData.preferences.propertyTypes,
                      locations: clientData.preferences.locations,
                      priceRange: clientData.preferences.priceRange,
                      bedrooms: clientData.preferences.bedrooms,
                      sizeRange: clientData.preferences.sizeRange,
                      extras: clientData.preferences.extras,
                    }}
                    variant="light"
                    showAll={true}
                  />
                </Card>
              )}

              {/* Related Opportunity */}
              {opportunityContext && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold leading-heading">Related opportunity</h2>
                  <OpportunityCard
                    id={opportunityContext.id}
                    type={opportunityContext.type}
                    title={opportunityContext.title}
                    priceRange={opportunityContext.property ? {
                      min: opportunityContext.property.price,
                      max: opportunityContext.property.price,
                      currency: opportunityContext.property.currency,
                    } : undefined}
                    bedrooms={opportunityContext.property?.bedrooms}
                    showMatches={false}
                    showImage={false}
                    showClient={false}
                    onClick={() => window.open(`/opportunities/${opportunityContext.id}`, '_blank')}
                    hasNewMatches={parseInt(opportunityContext.id, 10) % 3 === 0}
                  />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 h-12 rounded-xl"
              onClick={onDiscard}
            >
              Discard
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl"
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        {/* Header - matches actual header (only right-side actions) */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-transparent">
          <PageContainer className="flex items-center justify-end py-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
          </PageContainer>
        </div>

        {/* Client Info - centered profile section */}
        <PageContainer className="space-y-5 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Source Badge */}
            <Skeleton className="h-8 w-24 rounded-full" />

            {/* Name and Info */}
            <div className="space-y-1">
              <Skeleton className="h-9 w-48 mx-auto" />
              <Skeleton className="h-6 w-40 mx-auto" />
              
              {/* Owned by you */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Action Buttons - rounded pills matching real layout */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
            
            {/* Description card */}
            <Card className="w-full max-w-lg p-3">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          </div>
        </PageContainer>

        {/* Opportunities section */}
        <PageContainer className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {[1, 2].map(i => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Non-embedded mode: client not found
  if (!embedded && !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Client not found</p>
        </div>
      </div>
    );
  }

  // At this point, we're in non-embedded mode with a valid client
  if (!client) {
    return null; // This shouldn't happen, but TypeScript needs it
  }

  const clientSince = new Date(client.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Floating Dev Tools - bottom right corner */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <ClientDetailsDevTool 
          apiMode={apiMode} 
          setApiMode={setApiMode}
          opportunityMode={opportunityMode}
          setOpportunityMode={setOpportunityMode}
          descriptionMode={descriptionMode}
          setDescriptionMode={setDescriptionMode}
          sourceMode={sourceMode}
          setSourceMode={setSourceMode}
          devMode={devMode}
          setDevMode={setDevMode}
          cardMatchesMode={cardMatchesMode}
          setCardMatchesMode={setCardMatchesMode}
          cardImageMode={cardImageMode}
          setCardImageMode={setCardImageMode}
          cardClientMode={cardClientMode}
          setCardClientMode={setCardClientMode}
        />
      </div>

      {/* Top Bar with Menu - matches opportunity details */}
      <PageContainer className="flex items-center justify-end gap-1 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Edit client
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageContainer>

      {/* Client Info - Centered */}
      <PageContainer className="pb-4 pt-4">
        <div className="flex flex-col items-center text-center space-y-2 max-w-4xl mx-auto">
          {/* Source Badge */}
          {displaySource && (
            <SourceBadge source={displaySource} />
          )}

          {/* Client Name */}
          <TrackedTitle title={client.fullName}>
            <h1 className="text-3xl font-semibold leading-heading">{client.fullName}</h1>
          </TrackedTitle>
          {devMode && (
            <p className="text-xs text-muted-foreground/60 font-mono">
              {'${client.fullName}'}
            </p>
          )}
          
          {/* Subtitle: Client since */}
          <p className="text-lg font-semibold leading-heading text-foreground">Client since {clientSince}</p>
          {devMode && (
            <p className="text-xs text-muted-foreground/60 font-mono">
              {'Client since ${clientSince}'}
            </p>
          )}
          
          {/* Owned by you */}
          <div className="flex items-center gap-2">
            <UserAvatar name="Nino Bouchedid" size="sm" className="w-6 h-6 text-xs" />
            <span className="text-lg font-semibold leading-heading text-muted-foreground">Owned by you</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button 
              variant="secondary" 
              size="lg" 
              className="rounded-full px-6"
              onClick={() => {
                const tel = client.phone.replace(/\s+/g, '');
                window.location.href = `tel:${tel}`;
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </Button>
            {client.phone && (
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-full px-6"
                onClick={() => {
                  const phone = client.phone.replace(/\s+/g, '').replace(/^\+/, '');
                  window.open(`https://wa.me/${phone}`, '_blank');
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </Button>
            )}
            {client.email && (
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-full px-6"
                onClick={() => {
                  window.location.href = `mailto:${client.email}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            <Button 
              variant="secondary" 
              size="lg" 
              className="rounded-full px-6"
              onClick={() => {
                // TODO: Open book a visit modal
                console.log('Book a visit');
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book a visit
            </Button>
          </div>

          {/* Description Section */}
          {displayDescription ? (
            <ClientDescriptionCard
              description={displayDescription}
              isExpanded={isDescriptionExpanded}
              onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              onCardClick={() => setDescriptionModalOpen(true)}
            />
          ) : (
            <button 
              className="text-sm underline font-medium"
              onClick={() => setDescriptionModalOpen(true)}
            >
              Add client description
            </button>
          )}
        </div>
      </PageContainer>

      {/* Opportunities Section */}
      <PageContainer className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Client opportunities</h2>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={opportunityViewMode}
                onValueChange={(val) => val && setOpportunityViewMode(val as 'cards' | 'table')}
                className="border rounded-lg p-1"
              >
                <ToggleGroupItem value="cards" aria-label="Card view" size="sm">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view" size="sm">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button 
                variant="ghost"
                size="icon" 
                className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80"
                onClick={() => setShowOpportunitySelector(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {displayedOpportunities.length === 0 ? (
            <EmptyOpportunitiesState onAddOpportunity={() => setShowOpportunitySelector(true)} />
          ) : opportunityViewMode === 'table' ? (
            /* Table view - matching opportunities page format with filters */
            (() => {
              type OppTableSort = 'title' | 'price' | 'beds' | 'interaction';

              const sortedOpps = [...filteredDisplayedOpportunities];
              
              const getHeaderEl = (label: string, column: OppTableSort, align: string = 'text-left') => {
                const isActive = oppTableSort === column;
                return (
                  <span
                    className={cn(
                      "text-xs font-semibold text-fg-secondary flex items-center gap-1 cursor-pointer hover:text-foreground select-none transition-colors",
                      align === 'text-right' && "justify-end",
                      align === 'text-center' && "justify-center"
                    )}
                    onClick={() => {
                      if (oppTableSort === column) {
                        setOppTableDir(prev => prev === 'desc' ? 'asc' : 'desc');
                      } else {
                        setOppTableSort(column);
                        setOppTableDir('desc');
                      }
                    }}
                  >
                    {label}
                    {isActive ? (
                      oppTableDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-40 transition-opacity" />
                    )}
                  </span>
                );
              };

              sortedOpps.sort((a, b) => {
                const dir = oppTableDir === 'asc' ? 1 : -1;
                switch (oppTableSort) {
                  case 'title': return dir * a.title.localeCompare(b.title);
                  case 'price': {
                    const aP = a.priceRange?.min ?? 0;
                    const bP = b.priceRange?.min ?? 0;
                    return dir * (aP - bP);
                  }
                  case 'beds': return dir * ((a.bedrooms ?? 0) - (b.bedrooms ?? 0));
                  case 'interaction': return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
                  default: return 0;
                }
              });

              return (
                <div className="space-y-4">
                  {/* Search + filter dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search opportunities..."
                        className="pl-10 w-full bg-card rounded-full"
                        value={oppSearchQuery}
                        onChange={(e) => setOppSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Type multi-select dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant={oppTypeFilters.length > 0 ? "default" : "outline"} className={cn(
                          "shrink-0 gap-2 rounded-full",
                          oppTypeFilters.length === 0 && "bg-card"
                        )}>
                          {oppTypeFilters.length === 0 ? 'Type' : oppTypes.filter(t => oppTypeFilters.includes(t)).map(t => getOpportunityLabel(t)).join(', ')}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {oppTypes.map((type) => {
                          const config = oppTypeConfig[type];
                          const Icon = config.icon;
                          const isSelected = oppTypeFilters.includes(type);
                          return (
                            <DropdownMenuItem key={type} onClick={(e) => { e.preventDefault(); toggleOppTypeFilter(type); }} className="gap-3 justify-between">
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
                        <Button variant={oppStatusFilters.length > 0 ? "default" : "outline"} className={cn(
                          "shrink-0 gap-2 rounded-full",
                          oppStatusFilters.length === 0 && "bg-card"
                        )}>
                          {oppStatusFilters.length === 0 ? 'Status' : oppStatusFilters.map(sf => oppStatusFilterOptions.find(s => s.value === sf)?.label).filter(Boolean).join(', ')}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {oppStatusFilterOptions.map((status) => {
                          const isSelected = oppStatusFilters.includes(status.value);
                          return (
                            <DropdownMenuItem key={status.value} onClick={(e) => { e.preventDefault(); toggleOppStatusFilter(status.value); }} className="justify-between">
                              {status.label}
                              {isSelected && <Check className="w-4 h-4" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Table */}
                  <div className="bg-card rounded-2xl overflow-hidden">
                    {/* Header row */}
                    <div className="grid grid-cols-[44px_1.2fr_100px_80px_80px_120px_40px] px-4 py-3 border-b border-border-ds-primary gap-3 group/header">
                      <span />
                      {getHeaderEl('Opportunity', 'title')}
                      {getHeaderEl('Price', 'price', 'text-right')}
                      {getHeaderEl('Beds', 'beds', 'text-center')}
                      <span className="text-xs font-semibold text-fg-secondary text-center">Matches</span>
                      {getHeaderEl('Last interaction', 'interaction', 'text-right')}
                      <span />
                    </div>

                    {/* Body */}
                    <div className="divide-y divide-border-ds-primary">
                      {sortedOpps.length > 0 ? sortedOpps.map((opportunity) => {
                        const config = oppTypeConfig[opportunity.type] || oppTypeConfig.buy;
                        const Icon = config.icon;
                        const images = opportunity.images || (cardImageMode === 'with-image' ? [apartmentImage1] : cardImageMode === 'with-multiple-images' ? [apartmentImage1, apartmentImage2, apartmentImage3] : []);
                        const isBuyRent = opportunity.type === 'buy' || opportunity.type === 'rent';
                        const visibleImages = isBuyRent ? images.slice(0, 3) : images.slice(0, 1);
                        const oppState = opportunityStates[opportunity.id];
                        const isDeactivated = oppState?.isDeactivated || false;
                        const isClosed = oppState?.isClosed || false;
                        const isActivating = oppState?.isActivating || false;
                        const isInactive = isDeactivated || isClosed;

                        const formatPrice = (priceRange?: { min: number; max: number; currency: string }) => {
                          if (!priceRange) return '—';
                          const { min, max, currency } = priceRange;
                          const symbol = currency === 'EUR' || currency === '€' ? '€' : currency;
                          if (min === max) return `${symbol}${(min / 1000).toFixed(0)}k`;
                          return `${symbol}${(min / 1000).toFixed(0)}k – ${(max / 1000).toFixed(0)}k`;
                        };

                        return (
                          <button
                            key={opportunity.id}
                            onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                            className={cn(
                              "grid grid-cols-[44px_1.2fr_100px_80px_80px_120px_40px] px-4 py-3 w-full text-left hover:bg-surface-ds-raised/50 transition-all items-center gap-3 group",
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

                            {/* Title + type icon & label + status badges */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate leading-heading">{opportunity.title}</p>
                              <div className="flex items-center gap-1.5">
                                <span style={{ color: isInactive ? '#999999' : config.color, transition: 'color 1.5s ease' }}>
                                  <Icon className="w-3 h-3" />
                                </span>
                                <p className="text-xs text-muted-foreground leading-body">{getOpportunityLabel(opportunity.type)}</p>
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
                                {parseInt(opportunity.id, 10) % 3 === 0 && !isInactive && (
                                  newMatchesDisplay === 'tag' ? (
                                    <NewClientBadge type="new-matches" className="ml-1 scale-90 origin-left" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full ml-1 shrink-0" style={{ backgroundColor: '#F6445C' }} />
                                  )
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <span className="text-sm text-foreground text-right tabular-nums">
                              {formatPrice(opportunity.priceRange)}
                            </span>

                            {/* Beds */}
                            <span className="text-sm text-foreground text-center tabular-nums">
                              {opportunity.bedrooms ? `${opportunity.bedrooms}` : '—'}
                            </span>

                            {/* Matches */}
                            <div className="flex items-center justify-center">
                              <span className="text-sm text-foreground tabular-nums">3</span>
                            </div>

                            {/* Last interaction */}
                            <div className="text-right min-w-0">
                              <p className="text-xs text-foreground truncate">Property saved</p>
                              <p className="text-[10px] text-muted-foreground">1h ago</p>
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
                                        handleActivateOpportunity(opportunity.id);
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
                                          setSelectedOpportunityId(opportunity.id);
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
                                          setSelectedOpportunityId(opportunity.id);
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
                        <div className="py-12 text-center text-sm text-muted-foreground">
                          No opportunities found matching your criteria
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {displayedOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={cn(
                    "transition-all duration-700 rounded-2xl",
                    newOpportunityId === opportunity.id && "animate-new-card-highlight p-1.5 -m-1.5"
                  )}
                >
                <OpportunityCard
                  key={opportunity.id}
                  id={opportunity.id}
                  type={opportunity.type}
                  title={opportunity.title}
                  priceRange={opportunity.priceRange}
                  bedrooms={opportunity.bedrooms}
                  clientName={client.fullName}
                  image={cardImageMode === 'with-image' ? apartmentImage1 : undefined}
                  images={cardImageMode === 'with-multiple-images' ? [apartmentImage1, apartmentImage2, apartmentImage3] : undefined}
                  matchesCount={6}
                  matchesTime="1d ago"
                  onClick={() => navigate(`/opportunities/${opportunity.id}`)}
                  devMode={devMode}
                  showMatches={cardMatchesMode === 'with-matches'}
                  showImage={cardImageMode !== 'no-image'}
                  showClient={cardClientMode === 'with-client'}
                  neighborhoods={opportunity.neighborhoods}
                  propertyTypes={opportunity.propertyTypes}
                  showActivityFooter={true}
                  activityText="Property saved"
                  activityTime="1h ago"
                  // Menu action props
                  isDeactivated={opportunityStates[opportunity.id]?.isDeactivated || false}
                  isClosed={opportunityStates[opportunity.id]?.isClosed || false}
                  canCloseDeal={true}
                  onCloseDeal={() => {
                    setSelectedOpportunityId(opportunity.id);
                    setShowCloseDealModal(true);
                  }}
                  onDeactivate={() => {
                    setSelectedOpportunityId(opportunity.id);
                    setShowDeactivateModal(true);
                  }}
                  onActivate={() => handleActivateOpportunity(opportunity.id)}
                  isActivating={opportunityStates[opportunity.id]?.isActivating || false}
                  isNew={opportunity.status === 'new' || opportunity.status === 'to-review'}
                  hasNewMatches={parseInt(opportunity.id, 10) % 3 === 0}
                />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Opportunity Type Selector */}
      <OpportunityTypeSelector 
        open={showOpportunitySelector}
        onOpenChange={setShowOpportunitySelector}
        clientId={client.id}
        clientName={client.fullName}
      />

      <NewClientModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialData={{ fullName: client.fullName, phone: client.phone, email: client.email }}
        onSave={async (data) => {
          if (!id) return;
          await new Promise((r) => setTimeout(r, 1000));
          if (apiMode === 'error') {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update client. Please try again.' });
            return;
          }
          updateClient(id, { fullName: data.fullName, phone: data.phone, email: data.email || '' });
          toast({ title: 'Client updated', description: 'The client details have been saved.' });
          setEditOpen(false);
        }}
      />

      <EditClientDescriptionModal
        open={descriptionModalOpen}
        onOpenChange={setDescriptionModalOpen}
        currentDescription={displayDescription}
        onSave={handleSaveDescription}
      />

      <DeleteClientModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        clientName={client.fullName}
        onDelete={async (reason, details) => {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1500));
          toast({
            title: "Client deleted",
            description: `${client.fullName} has been removed from your clients.`,
          });
          navigate("/clients");
        }}
      />

      {/* Opportunity Action Modals */}
      <DeactivateOpportunityModal
        open={showDeactivateModal}
        onOpenChange={(open) => {
          setShowDeactivateModal(open);
          if (!open) setSelectedOpportunityId(null);
        }}
        opportunityType={displayedOpportunities.find(o => o.id === selectedOpportunityId)?.type || 'buy'}
        onDeactivate={async (reason, details) => {
          if (selectedOpportunityId) {
            // Simulate API call
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
        opportunityType={displayedOpportunities.find(o => o.id === selectedOpportunityId)?.type || 'buy'}
        onClose={async (closingPrice, shouldDelist) => {
          if (selectedOpportunityId) {
            // Simulate API call
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
    </div>
  );
}