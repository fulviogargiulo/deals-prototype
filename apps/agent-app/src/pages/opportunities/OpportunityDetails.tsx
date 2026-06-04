import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MoreHorizontal, MapPin, Euro, Bed, Maximize2, Search, Info, HelpCircle, Eye, Mail, Phone, Calendar, MessageSquare, FileText, Home, Handshake, CircleOff, CheckCircle2, Trash2, Undo2, StickyNote } from "lucide-react";
import { AnimatedListItem } from "@/components/ui/animated-list-item";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PropertyStatusIcon, getStatusIconCutoutMask } from "@/components/ui/property-status-icon";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { PropertyCard } from "@/components/properties/property-card";
import { UnderOfferCard } from "@/components/opportunities/under-offer-card";
import { PropertyTable } from "@/components/opportunities/property-table-row";
import { BuyerCard } from "@/components/opportunities/buyer-card";
import { BuyerUnderOfferCard } from "@/components/opportunities/buyer-under-offer-card";
import { AddPropertyDialog } from "@/components/properties/add-property-dialog/add-property-dialog";
import { MatchesBanner } from "@/components/opportunities/matches-banner";
import { MatchesModal } from "@/components/modals/matches-modal";
import { DeactivateOpportunityModal } from "@/components/modals/deactivate-opportunity-modal";
import { DeactivationDetailsModal } from "@/components/modals/deactivation-details-modal";
import { CloseDealModal } from "@/components/modals/close-deal-modal";
import { DeactivatedStatusBanner } from "@/components/opportunities/deactivated-status-banner";
import { ClosedStatusBanner } from "@/components/opportunities/closed-status-banner";
import { ViewToggle, ViewMode } from "@/components/opportunities/view-toggle";
import { SavedPropertiesTable, SavedBuyersTable, BulkActionBar } from "@/components/opportunities/saved-items-table";
import { AnnotationOverlay } from "@/components/opportunities/annotation-overlay";
import { EditPreferencesModal } from "@/components/modals/edit-preferences-modal";
import { OpportunityIcon, getOpportunityConfig } from "@/components/opportunities/opportunity-icon";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";
import { ActivityWidget } from "@/components/schedule/activity-widget";
import { OpportunityStatsWidget } from "@/components/opportunities/opportunity-stats-widget";
import { useSchedule } from "@/contexts/schedule-context";
import { OpportunityDetailsDevTool, SavedCount, LayoutVariant, HeaderVariant } from "@/components/dev-tools/opportunity-details-dev-tool";
import { OpportunityType, PropertyStatus } from "@/types";
import { toast } from "sonner";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { SharePropertyModal } from "@/components/modals/share-property-modal";
import { BulkShareModal, BulkShareItem } from "@/components/modals/bulk-share-modal";
import { NotesSideMenu, NotesSideMenuHandle } from "@/components/notes/notes-side-menu";
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import apartmentImage4 from "@/assets/apartment-la-latina-4.jpg";
import propertyInterior1 from "@/assets/property-interior-1.jpg";
import propertyInterior2 from "@/assets/property-interior-2.jpg";
import propertyLuxury1 from "@/assets/property-luxury-1.jpg";
import propertyLuxury2 from "@/assets/property-luxury-2.jpg";
import propertyModern1 from "@/assets/property-modern-1.jpg";
import propertyModern2 from "@/assets/property-modern-2.jpg";
import propertyPenthouse1 from "@/assets/property-penthouse-1.jpg";
import propertyPenthouse2 from "@/assets/property-penthouse-2.jpg";
import propertyVilla1 from "@/assets/property-villa-1.jpg";
import propertyVilla2 from "@/assets/property-villa-2.jpg";
import propertyStudio1 from "@/assets/property-studio-1.jpg";
import propertyStudio2 from "@/assets/property-studio-2.jpg";
import idealistaLogo from "@/assets/idealista-logo.ico";
import fotocasaLogo from "@/assets/fotocasa-logo.png";
import buyerAvatar from "@/assets/buyer-avatar.png";

export function OpportunityDetails() {
  
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const { setTransparentHeader } = usePageTitle();
  const {
    getOpportunityById,
    getClientById
  } = useData();
  const {
    loadingDelay,
    skeletonTargets
  } = useDevTools();
  const { activities } = useSchedule();
  const [isLoading, setIsLoading] = useState(loadingDelay > 0 && skeletonTargets.opportunityDetails);
  const [activeTab, setActiveTab] = useState("properties");
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeactivationDetailsModal, setShowDeactivationDetailsModal] = useState(false);
  const [showCloseDealModal, setShowCloseDealModal] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [closingPrice, setClosingPrice] = useState<number | undefined>();
  const [isActivating, setIsActivating] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState<string | undefined>();
  const [deactivatedAt, setDeactivatedAt] = useState<Date | undefined>();
  const [underOfferView, setUnderOfferView] = useState<ViewMode>('card-horizontal');
  
  // State for animating banner exit - keeps content in DOM during exit animation
  const [showBannerContent, setShowBannerContent] = useState(false);
  const [bannerType, setBannerType] = useState<'closed' | 'deactivated' | null>(null);
  const [savedItemsView, setSavedItemsView] = useState<'cards' | 'table'>('cards');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<Set<string>>(new Set());
  const [matchesBannerDismissed, setMatchesBannerDismissed] = useState(false);
  
  // State for removed items (framer-motion handles animation automatically)
  const [removedBuyerIds, setRemovedBuyerIds] = useState<Set<string>>(new Set());
  const [removedPropertyIds, setRemovedPropertyIds] = useState<Set<string>>(new Set());
  
  // State for share property modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePropertyData, setSharePropertyData] = useState<{
    id: string;
    title: string;
    image: string;
    images?: string[];
    idealistaLink?: string;
    fotocasaLink?: string;
    huspyLink?: string;
  } | null>(null);
  const [sharePreSelectedClient, setSharePreSelectedClient] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  
  // State for bulk share modal
  const [bulkShareModalOpen, setBulkShareModalOpen] = useState(false);
  const [bulkShareItems, setBulkShareItems] = useState<BulkShareItem[]>([]);
  const [bulkShareDirection, setBulkShareDirection] = useState<'properties-to-client' | 'property-to-buyers'>('properties-to-client');
  
  // Ref for notes side menu
  const notesSideMenuRef = useRef<NotesSideMenuHandle>(null);
  
  // Check if this is a draft opportunity (newly created, not in mock data)
  const isDraftOpportunity = id?.startsWith('opp-') && id?.includes('draft');
  
  // Extract opportunity type from draft ID (format: opp-{type}-draft-{timestamp})
  const getDraftOpportunityType = (): OpportunityType | null => {
    if (!isDraftOpportunity || !id) return null;
    const parts = id.split('-');
    if (parts.length >= 2) {
      const type = parts[1] as OpportunityType;
      if (['buy', 'sell', 'rent', 'lease'].includes(type)) {
        return type;
      }
    }
    return 'buy'; // default
  };
  
  const draftOpportunityType = getDraftOpportunityType();
  
  const opportunity = id ? getOpportunityById(id) : undefined;
  const client = opportunity ? getClientById(opportunity.clientId) : undefined;
  const opportunityConfig = opportunity 
    ? getOpportunityConfig(opportunity.type) 
    : (draftOpportunityType ? getOpportunityConfig(draftOpportunityType) : null);

  // Check if this is a sell/lease opportunity (showing buyers instead of properties)
  const isSellingOpportunity = opportunity?.type === 'sell' || opportunity?.type === 'lease';
  
  // Calculate overdue count for this opportunity
  const overdueCount = id 
    ? activities.filter(a => a.opportunityId === id && a.status === "overdue").length 
    : 0;

  // Dev tool states - use draft defaults for draft opportunities
  const [devOpportunityType, setDevOpportunityType] = useState<OpportunityType>(
    opportunity?.type || draftOpportunityType || 'buy'
  );
  const [hasPropertyAssigned, setHasPropertyAssigned] = useState(!isDraftOpportunity);
  const [savedCount, setSavedCount] = useState<SavedCount>(isDraftOpportunity ? 0 : 10);
  const [hasPreferencesAdded, setHasPreferencesAdded] = useState(!isDraftOpportunity);
  const [matchCount, setMatchCount] = useState(isDraftOpportunity ? 0 : 7);
  const [newMatchCount, setNewMatchCount] = useState(isDraftOpportunity ? 0 : 3);
  const [devPropertyStatus, setDevPropertyStatus] = useState<import("@/types").PropertyStatus>('draft');
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>('current');
  const [headerVariant, setHeaderVariant] = useState<HeaderVariant>('full-gradient');
  
  // State for assigned property (when created via Add Property flow)
  const [assignedProperty, setAssignedProperty] = useState<{
    id: string;
    title: string;
    image: string;
    status: 'draft' | 'published';
  } | null>(null);

  // Use dev tool opportunity type to derive display
  const displayOpportunityType = isDraftOpportunity ? (draftOpportunityType || devOpportunityType) : devOpportunityType;
  const isSellingOpportunityDisplay = displayOpportunityType === 'sell' || displayOpportunityType === 'lease';

  // Enable transparent header for this page (only for full gradient header)
  useEffect(() => {
    const useTransparent = headerVariant === 'full-gradient';
    setTransparentHeader(useTransparent);
    return () => setTransparentHeader(false);
  }, [setTransparentHeader, headerVariant, layoutVariant]);

  // Simulate loading delay
  useEffect(() => {
    if (loadingDelay > 0 && skeletonTargets.opportunityDetails) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), loadingDelay);
      return () => clearTimeout(timer);
    }
  }, [id, loadingDelay, skeletonTargets.opportunityDetails]);

  // Manage banner content for animated exit - keeps content in DOM during exit animation
  useEffect(() => {
    if (isClosed) {
      setBannerType('closed');
      setShowBannerContent(true);
    } else if (isDeactivated) {
      setBannerType('deactivated');
      setShowBannerContent(true);
    } else {
      // Start exit animation - keep content visible during animation
      setShowBannerContent(false);
      // After animation completes, remove content from DOM
      const timer = setTimeout(() => {
        setBannerType(null);
      }, 500); // Match the duration-500 animation
      return () => clearTimeout(timer);
    }
  }, [isClosed, isDeactivated]);

  // ALL useMemo hooks MUST be called before any early returns to follow Rules of Hooks
  // Memoize under offer properties
  const underOfferProperties = React.useMemo(() => [{
    id: 'under-offer-1',
    image: apartmentImage1,
    title: 'Apartment for sale in La Latina',
    price: '€500k',
    bedrooms: 3,
    size: 200,
    sizeUnit: 'm²',
    statusText: 'Offer sent',
    statusTime: '1 day ago'
  }], []);

  // Memoize under offer buyers (for sell/lease opportunities)
  const underOfferBuyers = React.useMemo(() => [{
    id: 'buyer-under-offer-1',
    name: 'Alejandro Ramírez',
    location: 'La Latina, Madrid',
    budgetRange: '€550k - €650k',
    bedrooms: '2 - 3 beds',
    size: '150-250 m²',
    statusText: 'Offer accepted',
    statusTime: '1 day ago'
  }], []);

  // Memoize saved properties
  const savedProperties = React.useMemo(() => {
    const propertyImages = [apartmentImage1, propertyPenthouse1, propertyVilla1, propertyModern1, propertyStudio1, propertyLuxury1, propertyInterior1, apartmentImage2, propertyPenthouse2, propertyVilla2, propertyModern2, propertyStudio2, propertyLuxury2, propertyInterior2, apartmentImage3, apartmentImage4];
    const propertyTypes = ['Apartment', 'Penthouse', 'Villa', 'Loft', 'Studio', 'Duplex', 'Townhouse', 'Chalet', 'Flat'];
    const actions = ['sale', 'rent'];
    const neighborhoods = ['Chamberí', 'Salamanca', 'Pozuelo', 'La Latina', 'Retiro', 'Chamartín', 'Malasaña', 'Arturo Soria', 'Chueca', 'Moncloa', 'Argüelles', 'Sol', 'Lavapiés', 'Prosperidad', 'Tetuán', 'Atocha', 'Castellana', 'Barrio de las Letras', 'Ópera', 'Aravaca', 'El Viso', 'Jerónimos', 'Almagro', 'Trafalgar', 'Justicia'];
    const badgesPool = [['Exclusive'], ['Premium'], ['Off plan'], ['New listing'], [], [], [], []];
    const portals: (null | { portal: 'idealista' | 'fotocasa' | 'pisos'; timestamp: string })[] = [
      { portal: 'idealista', timestamp: '2h ago' }, { portal: 'fotocasa', timestamp: '3h ago' },
      null, { portal: 'pisos', timestamp: '1d ago' }, null, { portal: 'idealista', timestamp: '5d ago' },
      { portal: 'fotocasa', timestamp: '1d ago' }, null,
    ];

    return Array.from({ length: 25 }, (_, i) => {
      const type = propertyTypes[i % propertyTypes.length];
      const hood = neighborhoods[i % neighborhoods.length];
      const price = 280000 + Math.round((i * 47000 + (i % 3) * 85000) / 1000) * 1000;
      const portal = portals[i % portals.length];
      return {
        id: `${i + 1}`,
        image: propertyImages[i % propertyImages.length],
        title: `${type} for ${actions[i % 2]} in ${hood}`,
        location: `${hood}, Madrid`,
        price,
        originalPrice: i % 4 === 0 ? Math.round(price * 1.1) : undefined,
        bedrooms: 1 + (i % 5),
        bathrooms: 1 + (i % 4),
        size: 55 + i * 18,
        sizeUnit: 'm²',
        badges: badgesPool[i % badgesPool.length],
        createdAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000).toISOString(),
        portalInquired: portal ? portal : undefined,
        propertySaved: portal ? undefined : { timestamp: `${i + 1}h ago` },
      };
    });
  }, []);

  // Memoize saved buyers (for sell/lease opportunities)
  const savedBuyers = React.useMemo(() => {
    const firstNames = ['Alejandro', 'Pedro', 'Isabel', 'David', 'Laura', 'Miguel', 'Sofía', 'Carlos', 'Ana', 'Javier', 'Elena', 'Marcos', 'Lucía', 'Pablo', 'Marta', 'Hugo', 'Claudia', 'Adrián', 'Natalia', 'Sergio', 'Raquel', 'Diego', 'Teresa', 'Roberto', 'Carmen'];
    const lastNames = ['Ramírez', 'Escobar', 'López', 'Fernández', 'Sánchez', 'Torres', 'García', 'Martín', 'Ruiz', 'Hernández', 'Moreno', 'Jiménez', 'Álvarez', 'Romero', 'Díaz', 'Muñoz', 'Ortega', 'Gutiérrez', 'Navarro', 'Domínguez', 'Vázquez', 'Ramos', 'Serrano', 'Blanco', 'Molina'];
    const neighborhoods = ['La Latina', 'Salamanca', 'Retiro', 'Chueca', 'Chamberí', 'Malasaña', 'Moncloa', 'Sol', 'Argüelles', 'Lavapiés', 'Prosperidad', 'Chamartín', 'Tetuán', 'Atocha', 'Castellana', 'El Viso', 'Almagro', 'Justicia', 'Ópera', 'Aravaca', 'Pozuelo', 'Trafalgar', 'Jerónimos', 'Arturo Soria', 'Barrio de las Letras'];
    const portals: (null | { portal: 'idealista' | 'fotocasa' | 'pisos'; timestamp: string })[] = [
      { portal: 'idealista', timestamp: '2h ago' }, { portal: 'fotocasa', timestamp: '3h ago' },
      null, { portal: 'pisos', timestamp: '5h ago' }, null,
      { portal: 'idealista', timestamp: '1w ago' }, null, { portal: 'fotocasa', timestamp: '1d ago' },
    ];

    return Array.from({ length: 25 }, (_, i) => {
      const name = `${firstNames[i]} ${lastNames[i]}`;
      const budget = 350 + i * 30;
      const portal = portals[i % portals.length];
      return {
        id: `buyer-${i + 1}`,
        name,
        phone: `+34 6${String(10 + i).padStart(2, '0')} ${String(100 + i * 37).slice(0, 3)} ${String(600 + i * 13).slice(0, 3)}`,
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
        location: `${neighborhoods[i]}, Madrid`,
        budgetRange: `€${budget}k - €${budget + 100}k`,
        bedrooms: `${1 + (i % 4)}${i % 3 === 0 ? ` - ${2 + (i % 4)}` : ''} beds`,
        size: `${80 + i * 10}-${150 + i * 12} m²`,
        portalInquired: portal ? portal : undefined,
        buyerSaved: portal ? undefined : { timestamp: `${i + 1}d ago` },
      };
    });
  }, []);

  // Handle remove buyer from saved - framer-motion handles animation automatically
  const handleRemoveBuyer = useCallback((buyerId: string, buyerName: string) => {
    // Add to removed set - framer-motion AnimatePresence handles exit animation
    setRemovedBuyerIds(prev => new Set(prev).add(buyerId));
    
    const itemLabel = devOpportunityType === 'lease' ? 'Renter' : 'Buyer';
    
    toast.custom((t) => (
      <div className="bg-card rounded-full px-4 py-3 shadow-lg border border-border flex items-center gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
            <Trash2 className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium">{itemLabel} removed</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          onClick={() => {
            // Remove from removed set - framer-motion handles enter animation
            setRemovedBuyerIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(buyerId);
              return newSet;
            });
            toast.dismiss(t);
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      </div>
    ), {
      duration: 4000,
      position: 'bottom-center',
      className: '!bg-transparent !border-none !shadow-none !p-0',
    });
  }, [devOpportunityType]);

  // Handle remove property from saved - framer-motion handles animation automatically
  const handleRemoveProperty = useCallback((propertyId: string, propertyTitle: string) => {
    // Add to removed set - framer-motion AnimatePresence handles exit animation
    setRemovedPropertyIds(prev => new Set(prev).add(propertyId));
    
    toast.custom((t) => (
      <div className="bg-card rounded-full px-4 py-3 shadow-lg border border-border flex items-center gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
            <Trash2 className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium">Property removed</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          onClick={() => {
            // Remove from removed set - framer-motion handles enter animation
            setRemovedPropertyIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(propertyId);
              return newSet;
            });
            toast.dismiss(t);
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      </div>
    ), {
      duration: 4000,
      position: 'bottom-center',
      className: '!bg-transparent !border-none !shadow-none !p-0',
    });
  }, []);

  // Header content is now handled by TrackedTitle's default behavior
  // No custom headerContent - let top-bar apply consistent styling

  if (isLoading) {
    // Use actual opportunity data to determine skeleton type (data is fetched before loading delay)
    const skeletonIsSellingType = opportunity?.type === 'sell' || opportunity?.type === 'lease' || isSellingOpportunity;
    
    return (
      <div className="min-h-screen bg-surface-page animate-fade-in -mt-16">
        {/* Header with gradient background placeholder */}
        <div className="relative pt-16">
          {/* Gradient background placeholder */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-muted/40 to-muted/20" />
          
          {/* Top Bar */}
          <PageContainer className="relative z-10 flex items-center justify-end gap-1 py-3">
            <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
            <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
          </PageContainer>

          {/* Hero Content - centered like the actual page */}
          <PageContainer className="relative z-10 pb-4 pt-4">
            <div className="flex flex-col items-center text-center space-y-2 max-w-4xl mx-auto">
              {/* Opportunity Type Badge */}
              <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
              
              {/* Title */}
              <Skeleton className="h-10 w-72 md:w-96 bg-white/20" />
              
              {/* Client Badge */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-white/20" />
                <Skeleton className="h-5 w-32 bg-white/20" />
              </div>
            </div>
          </PageContainer>

          {/* Property/Preferences Banner */}
          <PageContainer className="relative z-10 pb-4 pt-4">
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
              {skeletonIsSellingType ? (
                /* Property Card skeleton for sell/lease */
                <div className="w-full bg-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl bg-white/20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40 bg-white/20" />
                      <Skeleton className="h-4 w-32 bg-white/20" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Preference Pills skeleton for buy/rent */
                <div className="w-full flex flex-wrap justify-center gap-2">
                  <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
                  <Skeleton className="h-9 w-24 rounded-full bg-white/20" />
                  <Skeleton className="h-9 w-16 rounded-full bg-white/20" />
                  <Skeleton className="h-9 w-20 rounded-full bg-white/20" />
                  <Skeleton className="h-9 w-20 rounded-full bg-white/20" />
                </div>
              )}
            </div>
          </PageContainer>
        </div>

        {/* White Content Section with rounded top */}
        <div className="bg-surface-page -mt-4 rounded-t-3xl relative z-10 pt-2 min-h-[calc(100vh-200px)]">
          <PageContainer className="w-full">
            {/* Tab Switcher */}
            <div className="flex justify-center mb-6">
              <div className="relative bg-card rounded-full p-1.5 w-full max-w-md">
                <div className="grid grid-cols-2 gap-1">
                  <Skeleton className="h-10 rounded-full" />
                  <Skeleton className="h-10 rounded-full bg-muted/30" />
                </div>
              </div>
            </div>

            {/* Matches Banner skeleton */}
            <div className="mb-6">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>

            {/* Grid skeleton - responsive based on type */}
            {skeletonIsSellingType ? (
              /* Buyers grid - 2 columns */
              <div className="flex flex-wrap gap-3 w-full">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="w-full md:w-[calc(50%-6px)] p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2 pt-1">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Properties grid - 4 columns */
              <div className="flex flex-wrap gap-5 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Card key={i} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] overflow-hidden">
                    <Skeleton className="aspect-[4/3]" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-5 w-20" />
                      <div className="flex gap-3">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </PageContainer>
        </div>
      </div>
    );
  }
  // For draft opportunities, we show a special draft UI
  // For non-draft opportunities that don't exist, show not found
  if (!isDraftOpportunity && (!opportunity || !client)) {
    return <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Opportunity not found</p>
        </div>
      </div>;
  }
  
  // For draft opportunities, create placeholder data
  const draftClient = isDraftOpportunity ? {
    id: 'draft-client',
    fullName: 'Client Name',
    phone: '',
    email: '',
  } : null;
  
  // Use real data or draft placeholders
  const displayClient = client || draftClient;
  const displayOpportunity = opportunity || (isDraftOpportunity && draftOpportunityType ? {
    id: id!,
    type: draftOpportunityType,
    title: `New ${draftOpportunityType} opportunity`,
    clientId: 'draft-client',
    status: 'draft' as const,
    neighborhoods: [] as string[],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Optional fields for draft - undefined means not set
    priceRange: undefined as { min: number; max: number; currency: string } | undefined,
    bedrooms: undefined as number | undefined,
    sizeRange: undefined as { min: number; max: number } | undefined,
  } : null);
  
  if (!displayOpportunity || !displayClient) {
    return <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Opportunity not found</p>
        </div>
      </div>;
  }

  const handleAddProperty = () => {
    setShowAddPropertyDialog(true);
  };
  const getActionButtonsForProperty = (propertySource: string) => {
    switch (propertySource) {
      case 'portal':
        return {
          primary: {
            label: 'Book visit',
            onClick: () => toast("Booking visit")
          },
          secondary: {
            label: 'Submit offer',
            variant: 'outline' as const,
            onClick: () => toast("Submitting offer")
          }
        };
      case 'match':
        return {
          primary: {
            label: 'Contact agent',
            onClick: () => toast("Contacting agent")
          },
          secondary: {
            label: 'Share',
            variant: 'outline' as const,
            onClick: () => toast("Sharing property")
          }
        };
      case 'property-hub':
        return {
          primary: {
            label: 'Contact agent',
            onClick: () => toast("Contacting agent")
          },
          secondary: {
            label: 'Share',
            variant: 'outline' as const,
            onClick: () => toast("Sharing property")
          }
        };
      case 'my-property':
        return {
          primary: {
            label: 'Book viewing',
            onClick: () => toast("Booking viewing")
          },
          secondary: {
            label: 'Send offer',
            variant: 'outline' as const,
            onClick: () => toast("Sending offer")
          }
        };
      default:
        return {
          primary: {
            label: 'View details',
            onClick: () => toast("Viewing details")
          }
        };
    }
  };

  // Get gradient background based on opportunity type (active state only)
  const getActiveHeaderGradient = () => {
    switch (displayOpportunityType) {
      case 'sell':
        return 'linear-gradient(189.58deg, #B85C38 6.77%, #7D3F27 33.51%, #1A1A1A 92.33%)';
      case 'lease':
        return 'linear-gradient(189.58deg, #9C4F96 6.77%, #7E3E79 33.51%, #1A1A1A 92.33%)';
      case 'buy':
        return 'linear-gradient(189.58deg, #006D77 6.77%, #08535A 33.51%, #1A1A1A 92.33%)';
      case 'rent':
        return 'linear-gradient(189.58deg, #3F3FB4 6.77%, #373799 33.51%, #1A1A1A 92.33%)';
      default:
        return 'linear-gradient(189.58deg, #5C6B4F 6.77%, #3D472F 33.51%, #1A1A1A 92.33%)';
    }
  };

  // Deactivated gradient (gray)
  const deactivatedGradient = 'linear-gradient(189.58deg, #343434 33.51%, #1A1A1A 92.33%)';

  // Handle deactivation
  const handleDeactivate = async (reason: string, details?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fullReason = details ? `${reason} - ${details}` : reason;
    setDeactivationReason(fullReason);
    setDeactivatedAt(new Date());
    setIsDeactivated(true);
    toast("Opportunity deactivated", {
      description: `Reason: ${fullReason}`,
    });
  };

  // Handle activation
  const handleActivate = async () => {
    setIsActivating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsDeactivated(false);
      setDeactivationReason(undefined);
      setDeactivatedAt(undefined);
      toast("Opportunity activated", {
        description: "The opportunity is now active again.",
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Handle closing deal
  const handleCloseDeal = async (price: number, shouldDelist: boolean) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setClosingPrice(price);
    setIsClosed(true);
    
    // If should delist, update property status
    if (shouldDelist) {
      setDevPropertyStatus('delisted');
    }
    
    toast("Deal closed", {
      description: `Closing price: €${price.toLocaleString("es-ES")}${shouldDelist ? " - Property delisted" : ""}`,
    });
  };

  // Handle book a visit (coming soon)
  const handleBookVisit = () => {
    toast("Coming soon", {
      description: "Book a visit feature is coming soon!",
    });
  };

  // Handle share property (from saved properties) - opens share modal with opportunity client pre-selected
  const handleShareProperty = (prop: typeof savedProperties[0]) => {
    setSharePropertyData({
      id: prop.id,
      title: prop.title,
      image: prop.image,
      images: [prop.image],
      idealistaLink: `https://www.idealista.com/inmueble/${prop.id}/`,
      fotocasaLink: `https://www.fotocasa.es/es/comprar/vivienda/${prop.id}`,
      huspyLink: `https://huspy.com/property/${prop.id}`,
    });
    // Pre-select the opportunity's client for Buy/Rent opportunities
    if (displayClient) {
      setSharePreSelectedClient({
        id: displayClient.id,
        name: displayClient.fullName,
        phone: displayClient.phone || '+34 612 345 678', // Fallback for demo
      });
    } else {
      setSharePreSelectedClient(null);
    }
    setShareModalOpen(true);
  };

  // Handle share property with buyer/renter (from saved buyers/renters) - shares opportunity property with selected buyer
  const handleShareWithBuyer = (buyer: typeof savedBuyers[0]) => {
    // For sell/lease opportunities, share the assigned property with this buyer/renter
    // Use the first saved property or mock property data as the opportunity's assigned property
    const opportunityProperty = savedProperties[0] || {
      id: 'opp-property',
      title: displayOpportunity?.title || 'Property',
      image: apartmentImage1,
    };
    
    setSharePropertyData({
      id: opportunityProperty.id,
      title: opportunityProperty.title,
      image: opportunityProperty.image,
      images: [opportunityProperty.image],
      idealistaLink: `https://www.idealista.com/inmueble/${opportunityProperty.id}/`,
      fotocasaLink: `https://www.fotocasa.es/es/comprar/vivienda/${opportunityProperty.id}`,
      huspyLink: `https://huspy.com/property/${opportunityProperty.id}`,
    });
    // Pre-select this buyer/renter
    setSharePreSelectedClient({
      id: buyer.id,
      name: buyer.name,
      phone: buyer.phone || '+34 612 345 678', // Fallback for demo
    });
    setShareModalOpen(true);
  };

  // Handle contact methods
  const handleCall = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast("Phone number not available");
    }
  };

  const handleWhatsApp = (phone?: string) => {
    if (phone) {
      // Remove non-numeric characters for WhatsApp
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      toast("Phone number not available");
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast("Email not available");
    }
  };

  // Get gradient - use deactivated/closed gradient when inactive
  const isInactive = isDeactivated || isClosed;
  const displayOpportunityConfig = getOpportunityConfig(displayOpportunityType);
  
  // === SHARED ELEMENTS (used across layouts) ===
  
  // Gradient header background element
  const headerGradientBg = (
    <>
      <div className="absolute inset-0 z-0" style={{ background: deactivatedGradient }} />
      <div className="absolute inset-0 z-0" style={{ background: getActiveHeaderGradient(), opacity: isInactive ? 0 : 1, transition: 'opacity 1500ms ease-in-out', willChange: 'opacity' }} />
    </>
  );

  // Timestamps below title
  const headerTimestamps = (variant: 'dark' | 'light') => {
    const createdDate = displayOpportunity?.createdAt ? format(new Date(displayOpportunity.createdAt), 'dd MMM yyyy') : null;
    const lastInteraction = displayOpportunity?.updatedAt 
      ? formatDistanceToNow(new Date(displayOpportunity.updatedAt), { addSuffix: true })
      : null;
    if (!createdDate) return null;
    return (
      <div className={cn("flex items-center gap-2 text-xs font-normal leading-body", variant === 'light' ? "text-white/50" : "text-muted-foreground")}>
        {createdDate && <span>Created {createdDate}</span>}
        {lastInteraction && <span>·</span>}
        {lastInteraction && <span>Last interaction {lastInteraction}</span>}
      </div>
    );
  };

  // Top bar with actions
  const topBarActions = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className={cn(headerVariant === 'compact-bar' ? "text-muted-foreground hover:bg-muted" : "text-white/90 hover:bg-white/10 hover:text-white")} onClick={() => notesSideMenuRef.current?.open()}>
        <StickyNote className="w-5 h-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn(headerVariant === 'compact-bar' ? "text-muted-foreground hover:bg-muted" : "text-white/90 hover:bg-white/10 hover:text-white")}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(() => {
            const canCloseDeal = !isClosed && !isDeactivated && (isSellingOpportunityDisplay ? (hasPropertyAssigned && devPropertyStatus === 'published') : true);
            return (
              <DropdownMenuItem onClick={() => canCloseDeal && setShowCloseDealModal(true)} className="gap-2" disabled={!canCloseDeal}>
                <Handshake className="w-4 h-4" />
                Close deal
              </DropdownMenuItem>
            );
          })()}
          <DropdownMenuItem onClick={() => { if (isClosed) return; if (isDeactivated) { handleActivate(); } else { setShowDeactivateModal(true); } }} className="gap-2" disabled={isClosed}>
            {isDeactivated ? (<><CheckCircle2 className="w-4 h-4" />Activate</>) : (<><CircleOff className="w-4 h-4" />Deactivate</>)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Opportunity type badge
  const opportunityTypeBadge = (variant: 'light' | 'dark' = 'light') => {
    const badgeColors: Record<string, { bg: string; icon: string }> = {
      buy: { bg: 'rgba(0, 109, 119, 0.2)', icon: '#006D77' },
      rent: { bg: 'rgba(63, 63, 180, 0.2)', icon: '#3F3FB4' },
      sell: { bg: 'rgba(184, 92, 56, 0.2)', icon: '#B85C38' },
      lease: { bg: 'rgba(156, 79, 150, 0.2)', icon: '#9C4F96' },
      mortgage: { bg: 'rgba(92, 107, 79, 0.2)', icon: '#5C6B4F' },
    };
    const colors = badgeColors[displayOpportunityType] || badgeColors.buy;
    const isDarkVariant = variant === 'dark';
    
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: isDarkVariant ? colors.bg : (isInactive ? 'rgba(255, 255, 255, 0.2)' : colors.bg), transition: 'background-color 1500ms ease-in-out' }}>
        <span style={{ color: isDarkVariant ? colors.icon : (isInactive ? 'rgba(255, 255, 255, 0.3)' : colors.icon), transition: 'color 1500ms ease-in-out' }}>
          {displayOpportunityType && OpportunityBareIcons[displayOpportunityType as keyof typeof OpportunityBareIcons] && (() => { const BareIcon = OpportunityBareIcons[displayOpportunityType as keyof typeof OpportunityBareIcons]; return <BareIcon className="w-3.5 h-3.5" />; })()}
        </span>
        <span className="text-sm font-semibold" style={{ color: isDarkVariant ? colors.icon : (isInactive ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF'), transition: 'color 1500ms ease-in-out' }}>
          {displayOpportunityConfig?.label}
        </span>
      </div>
    );
  };

  // Matches banner element
  const matchesBannerElement = hasPreferencesAdded && !matchesBannerDismissed ? (
    <MatchesBanner matchCount={matchCount} newCount={newMatchCount} onViewMatches={() => setShowMatchesModal(true)} onDismiss={matchCount === 0 ? () => setMatchesBannerDismissed(true) : undefined} description={isSellingOpportunityDisplay ? (displayOpportunityType === 'lease' ? "Review and add them to the Saved renters" : "Review and add them to the Saved buyers") : "Review and add them to the Saved properties"} hasMatches={matchCount > 0} variant={isSellingOpportunityDisplay ? 'buyers' : 'properties'} />
  ) : null;

  // Filtered lists
  const visibleBuyers = savedBuyers.slice(0, savedCount).filter(buyer => !removedBuyerIds.has(buyer.id));
  const visibleProperties = savedProperties.slice(0, savedCount).filter(prop => !removedPropertyIds.has(prop.id));

  // Bulk action handlers
  const handleBulkShare = () => {
    if (isSellingOpportunityDisplay) {
      // Sell/Lease: share property with selected buyers
      const selectedBuyers = visibleBuyers.filter(b => selectedBuyerIds.has(b.id));
      setBulkShareItems(selectedBuyers.map(b => ({
        id: b.id,
        title: b.name,
        name: b.name,
        phone: b.phone,
      })));
      setBulkShareDirection('property-to-buyers');
    } else {
      // Buy/Rent: share selected properties with client
      const selectedProps = visibleProperties.filter(p => selectedPropertyIds.has(p.id));
      setBulkShareItems(selectedProps.map((p, i) => {
        const propIndex = visibleProperties.indexOf(p);
        const isOwn = propIndex === 0 || propIndex === 3;
        return {
          id: p.id,
          title: p.title,
          image: p.image,
          portalLink: !isOwn ? `https://www.idealista.com/inmueble/${p.id}/` : undefined,
        };
      }));
      setBulkShareDirection('properties-to-client');
    }
    setBulkShareModalOpen(true);
  };
  const handleBulkBookVisit = () => {
    const count = isSellingOpportunityDisplay ? selectedBuyerIds.size : selectedPropertyIds.size;
    toast(`Booking visits for ${count} item${count !== 1 ? 's' : ''}...`);
  };
  const handleBulkRemove = () => {
    if (isSellingOpportunityDisplay) {
      selectedBuyerIds.forEach(id => {
        const buyer = savedBuyers.find(b => b.id === id);
        if (buyer) handleRemoveBuyer(id, buyer.name);
      });
      setSelectedBuyerIds(new Set());
    } else {
      selectedPropertyIds.forEach(id => {
        const prop = savedProperties.find(p => p.id === id);
        if (prop) handleRemoveProperty(id, prop.title);
      });
      setSelectedPropertyIds(new Set());
    }
  };

  // Saved items section (buyers or properties)
  const savedItemsSection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {isSellingOpportunityDisplay ? (displayOpportunityType === 'lease' ? 'Saved renters' : 'Saved buyers') : 'Saved properties'}
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-6 h-6 cursor-default">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3">
                {isSellingOpportunityDisplay ? (
                  displayOpportunityType === 'lease' ? (
                    <p className="text-sm">Here you can see all the renters you've saved for this opportunity, including those from matches, renters you've shared this property with and renters coming from portal inquiry. Easily review and manage them in one place.</p>
                  ) : (
                    <p className="text-sm">Here you can see all the buyers you've saved for this opportunity, including those from matches, buyers you've shared this property with and buyers coming from portal inquiry. Easily review and manage them in one place.</p>
                  )
                ) : (
                  <p className="text-sm">Here you can see all the properties you've saved for this opportunity, including from matches, manual searches, and client inquiries. Easily review and manage them in one place.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {savedCount > 0 && (
          <ViewToggle
            value={savedItemsView === 'table' ? 'table' : 'card-vertical'}
            onValueChange={(val) => {
              setSavedItemsView(val === 'table' ? 'table' : 'cards');
              // Clear selection when switching views
              setSelectedPropertyIds(new Set());
              setSelectedBuyerIds(new Set());
            }}
            simple
          />
        )}
      </div>

      {savedCount === 0 ? (
        <Card className="border border-border">
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isSellingOpportunityDisplay ? (displayOpportunityType === 'lease' ? 'No saved renters' : 'No saved buyers') : 'No saved properties'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isSellingOpportunityDisplay ? (displayOpportunityType === 'lease' ? "Review matches or share a listing with this client to save renters" : "Review matches or share a listing with this client to save buyers") : "Review matches or share a property with this client to save properties"}
            </p>
          </div>
        </Card>
      ) : savedItemsView === 'table' ? (
        // TABLE VIEW
        isSellingOpportunityDisplay ? (
          <SavedBuyersTable
            buyers={visibleBuyers}
            selectedIds={selectedBuyerIds}
            onSelectionChange={setSelectedBuyerIds}
            opportunityType={displayOpportunityType}
            onShareProperty={(buyer) => handleShareWithBuyer(buyer as any)}
            onBookVisit={handleBookVisit}
            onCall={(buyer) => handleCall(buyer.phone || "+34 612 345 678")}
            onWhatsApp={(buyer) => handleWhatsApp(buyer.phone || "+34 612 345 678")}
            onEmail={(buyer) => handleEmail(buyer.email || "client@example.com")}
            onGoToProfile={(_buyer, index) => navigate(`/clients/${index + 1}`)}
            onCloseDeal={() => setShowCloseDealModal(true)}
            onRemove={(id, name) => handleRemoveBuyer(id, name)}
            onClick={(_buyer, index) => navigate(`/clients/${index + 1}`)}
          />
        ) : (
          <SavedPropertiesTable
            properties={visibleProperties.map((prop, propIndex) => ({
              ...prop,
              agentName: (propIndex === 0 || propIndex === 3) ? undefined : "Carlos García",
              isOwnProperty: propIndex === 0 || propIndex === 3,
            }))}
            selectedIds={selectedPropertyIds}
            onSelectionChange={setSelectedPropertyIds}
            onShareProperty={(prop) => handleShareProperty(prop as any)}
            onBookVisit={handleBookVisit}
            onCall={(prop) => handleCall(prop.isOwnProperty ? "+34 698 765 432" : "+34 612 345 678")}
            onWhatsApp={(prop) => handleWhatsApp(prop.isOwnProperty ? "+34 698 765 432" : "+34 612 345 678")}
            onEmail={(prop) => handleEmail(prop.isOwnProperty ? "landlord@example.com" : "agent@example.com")}
            onGoToProfile={(prop) => prop.isOwnProperty ? navigate(`/clients/1`) : undefined}
            onCloseDeal={() => setShowCloseDealModal(true)}
            onRemove={(id, title) => handleRemoveProperty(id, title)}
            onClick={(prop) => navigate(`/properties/${prop.id}`)}
          />
        )
      ) : isSellingOpportunityDisplay ? (
        // CARD VIEW - BUYERS
        <LayoutGroup>
          <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }} className="flex flex-wrap gap-3 w-full">
            <AnimatePresence mode="popLayout">
              {visibleBuyers.map((buyer, index) => (
                <AnimatedListItem key={buyer.id} itemKey={buyer.id} duration={0.45} className="w-full md:w-[calc(50%-6px)]">
                  <BuyerCard id={buyer.id} name={buyer.name} phone={buyer.phone || "+34 612 345 678"} email={buyer.email || "client@example.com"} location={buyer.location} budgetRange={buyer.budgetRange} bedrooms={buyer.bedrooms} size={buyer.size} portalInquired={buyer.portalInquired} buyerSaved={buyer.buyerSaved} opportunityType={displayOpportunityType} onClick={() => navigate(`/clients/${index + 1}`)} onShareProperty={() => handleShareWithBuyer(buyer)} onBookVisit={handleBookVisit} onCall={() => handleCall(buyer.phone || "+34 612 345 678")} onWhatsApp={() => handleWhatsApp(buyer.phone || "+34 612 345 678")} onEmail={() => handleEmail(buyer.email || "client@example.com")} onGoToProfile={() => navigate(`/clients/${index + 1}`)} onCloseDeal={() => setShowCloseDealModal(true)} onRemove={() => handleRemoveBuyer(buyer.id, buyer.name)} />
                </AnimatedListItem>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      ) : (
        // CARD VIEW - PROPERTIES
        <LayoutGroup>
          <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }} className="flex flex-wrap gap-5 w-full">
            <AnimatePresence mode="popLayout">
              {visibleProperties.map((prop, propIndex) => (
                <AnimatedListItem key={prop.id} itemKey={prop.id} duration={0.45} className={cn("w-full sm:w-[calc(50%-10px)]", layoutVariant === 'current' ? "lg:w-[calc(25%-15px)]" : "lg:w-[calc(33.333%-14px)]")}>
                  <PropertyCard property={{ id: prop.id, title: prop.title, image: prop.image, price: prop.price, originalPrice: 'originalPrice' in prop ? prop.originalPrice : undefined, bedrooms: prop.bedrooms, bathrooms: prop.bathrooms, size: prop.size, sizeUnit: prop.sizeUnit, location: prop.location, badges: 'badges' in prop ? prop.badges : undefined, createdAt: prop.createdAt, portalInquired: 'portalInquired' in prop ? prop.portalInquired : undefined, propertySaved: 'propertySaved' in prop ? prop.propertySaved : undefined, agentName: (propIndex === 0 || propIndex === 3) ? undefined : "Carlos García", agentPhone: (propIndex === 0 || propIndex === 3) ? undefined : "+34 612 345 678", agentEmail: (propIndex === 0 || propIndex === 3) ? undefined : "agent@example.com", isOwnProperty: propIndex === 0 || propIndex === 3, landlordName: (propIndex === 0 || propIndex === 3) ? "María López" : undefined, landlordPhone: (propIndex === 0 || propIndex === 3) ? "+34 698 765 432" : undefined, landlordEmail: (propIndex === 0 || propIndex === 3) ? "landlord@example.com" : undefined }} variant="opportunities" onClick={() => navigate(`/properties/${prop.id}`)} onShareProperty={() => handleShareProperty(prop)} onBookVisit={handleBookVisit} onCall={() => handleCall((propIndex === 0 || propIndex === 3) ? "+34 698 765 432" : "+34 612 345 678")} onWhatsApp={() => handleWhatsApp((propIndex === 0 || propIndex === 3) ? "+34 698 765 432" : "+34 612 345 678")} onEmail={() => handleEmail((propIndex === 0 || propIndex === 3) ? "landlord@example.com" : "agent@example.com")} onGoToProfile={(propIndex === 0 || propIndex === 3) ? () => navigate(`/clients/1`) : undefined} onCloseDeal={() => setShowCloseDealModal(true)} onRemove={() => handleRemoveProperty(prop.id, prop.title)} />
                </AnimatedListItem>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {savedItemsView === 'table' && (isSellingOpportunityDisplay ? selectedBuyerIds.size > 0 : selectedPropertyIds.size > 0) && (
          <BulkActionBar
            count={isSellingOpportunityDisplay ? selectedBuyerIds.size : selectedPropertyIds.size}
            itemLabel={isSellingOpportunityDisplay ? (displayOpportunityType === 'lease' ? 'renter' : 'buyer') : 'property'}
            onShare={handleBulkShare}
            onBookVisit={handleBulkBookVisit}
            onRemove={handleBulkRemove}
            onClearSelection={() => {
              setSelectedPropertyIds(new Set());
              setSelectedBuyerIds(new Set());
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // Find more properties CTA
  const findMoreCta = !isSellingOpportunityDisplay ? (
    <div className="flex justify-center pt-2">
      <Button variant="outline" className="rounded-full" onClick={() => navigate('/properties')}>
        <Search className="w-4 h-4 mr-2" />
        Find more properties
      </Button>
    </div>
  ) : null;

  // Activity widget element
  const activityWidgetElement = (
    <ActivityWidget opportunityId={id} opportunity={opportunity} displayMode="few" variant="minimal" calendarVariant="compact" />
  );

  // Preferences pills / property card for header
  const preferencesOrPropertyContent = (variant: 'light' | 'dark' = 'light') => {
    const isDark = variant === 'dark';
    const pillBg = isDark ? "bg-muted" : "bg-[#FFFFFF1A]";
    const pillBorder = isDark ? "border-border" : "border-[#FFFFFF33]";
    const pillText = isDark ? "text-foreground" : "text-white";
    const pillHover = isDark ? "hover:bg-muted/80" : "hover:bg-white/20";
    
    if (isSellingOpportunityDisplay) {
      if (!hasPropertyAssigned) {
        return (
          <div className={cn("w-full rounded-2xl p-6 space-y-4", isDark ? "bg-muted" : "bg-[#FFFFFF1A]")}>
            <div className="space-y-1">
              <h3 className={cn("text-lg font-semibold leading-heading", isDark ? "text-foreground" : "text-white")}>
                No property up for {displayOpportunityType === 'lease' ? 'lease' : 'sale'}
              </h3>
              <p className={cn("text-sm font-normal leading-body", isDark ? "text-muted-foreground" : "text-[#FFFFFFB2]")}>
                Add a property to reach potential {displayOpportunityType === 'lease' ? 'renters' : 'buyers'}
              </p>
            </div>
            <Button className={cn("w-full", isDark ? "" : "bg-white text-foreground hover:bg-white/90")} onClick={() => setShowAddPropertyDialog(true)}>
              Add property
            </Button>
          </div>
        );
      }
      return (
        <Card className={cn("w-full border-0 cursor-pointer transition-colors", isDark ? "bg-muted hover:bg-muted/80" : "bg-[#FFFFFF1A] hover:bg-white/20")} onClick={() => navigate(`/my-properties/${assignedProperty?.id || id}`)}>
          <div className="flex items-center gap-4 p-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-full h-full rounded-xl overflow-hidden" style={getStatusIconCutoutMask('sm')}>
                <img src={assignedProperty?.image || apartmentImage1} alt="Property" className="w-full h-full object-cover" />
              </div>
              <PropertyStatusIcon status={assignedProperty?.status || devPropertyStatus} size="sm" className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold mb-0.5", isDark ? "text-foreground" : "text-white")}>
                {assignedProperty?.title || 'View property details'}
              </h3>
              <p className={cn("text-sm", isDark ? "text-muted-foreground" : "text-white/70")}>
                {assignedProperty ? (assignedProperty.status === 'draft' ? 'Draft · Complete details to publish' : 'Published') : (<>{displayOpportunity.priceRange && `€${displayOpportunity.priceRange.max.toLocaleString()}`}{displayOpportunity.bedrooms && ` · ${displayOpportunity.bedrooms} beds`}{displayOpportunity.sizeRange && ` · ${displayOpportunity.sizeRange.max} m²`}</>)}
              </p>
            </div>
            <ArrowLeft className={cn("w-5 h-5 rotate-180 flex-shrink-0", isDark ? "text-muted-foreground" : "text-white/60")} />
          </div>
        </Card>
      );
    }
    
    // Buy/Rent preferences
    if (!hasPreferencesAdded) {
      return (
        <div className={cn("w-full rounded-2xl p-6 space-y-4", isDark ? "bg-muted" : "bg-[#FFFFFF1A]")}>
          <div className="space-y-1">
            <h3 className={cn("text-lg font-semibold leading-heading", isDark ? "text-foreground" : "text-white")}>No preferences added yet</h3>
            <p className={cn("text-sm font-normal leading-body", isDark ? "text-muted-foreground" : "text-[#FFFFFFB2]")}>Add preferences to reach potential properties</p>
          </div>
          <Button className={cn("w-full", isDark ? "" : "bg-white text-foreground hover:bg-white/90")} onClick={() => setShowEditPreferences(true)}>Add preferences</Button>
        </div>
      );
    }
    return (
      <div className={cn("w-full flex flex-wrap gap-2", layoutVariant === 'current' ? "justify-center" : "justify-start")}>
        {displayOpportunity.neighborhoods?.[0] && (
          <button className={cn("flex items-center gap-2 h-9 px-3 py-2 rounded-full border text-sm transition-colors", pillBg, pillBorder, pillText, pillHover)} onClick={() => setShowEditPreferences(true)}>
            <MapPin className="w-4 h-4" />{displayOpportunity.neighborhoods[0]}
          </button>
        )}
        {displayOpportunity.priceRange && (
          <button className={cn("flex items-center gap-2 h-9 px-3 py-2 rounded-full border text-sm transition-colors", pillBg, pillBorder, pillText, pillHover)} onClick={() => setShowEditPreferences(true)}>
            <Euro className="w-4 h-4" />max. €{(displayOpportunity.priceRange.max / 1000).toFixed(1)}k{displayOpportunityType === 'rent' ? '/month' : ''}
          </button>
        )}
        {displayOpportunity.bedrooms && (
          <button className={cn("flex items-center gap-2 h-9 px-3 py-2 rounded-full border text-sm transition-colors", pillBg, pillBorder, pillText, pillHover)} onClick={() => setShowEditPreferences(true)}>
            <Bed className="w-4 h-4" />{displayOpportunity.bedrooms}
          </button>
        )}
        {displayOpportunity.sizeRange && (
          <button className={cn("flex items-center gap-2 h-9 px-3 py-2 rounded-full border text-sm transition-colors", pillBg, pillBorder, pillText, pillHover)} onClick={() => setShowEditPreferences(true)}>
            <Maximize2 className="w-4 h-4" />min. {displayOpportunity.sizeRange.min} m²
          </button>
        )}
        <button className={cn("flex items-center gap-2 h-9 px-3 py-2 rounded-full border text-sm transition-colors", pillBg, pillBorder, pillText, pillHover)} onClick={() => setShowEditPreferences(true)}>View all</button>
      </div>
    );
  };

  // Status banner element
  const statusBannerElement = (
    <div className={cn("w-full grid transition-all duration-500 ease-out", showBannerContent ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
      <div className="overflow-hidden">
        {bannerType === 'closed' && (<div className={showBannerContent ? "animate-scale-in-slow" : ""}><ClosedStatusBanner closingPrice={closingPrice} /></div>)}
        {bannerType === 'deactivated' && (<div className={showBannerContent ? "animate-scale-in-slow" : ""}><DeactivatedStatusBanner opportunityType={displayOpportunityType} onActivate={handleActivate} onViewActivity={() => setShowDeactivationDetailsModal(true)} isActivating={isActivating} /></div>)}
      </div>
    </div>
  );

  // Modals (shared across all layouts)
  const modalsElement = (
    <>
      <AddPropertyDialog open={showAddPropertyDialog} onOpenChange={setShowAddPropertyDialog} initialData={{ intent: displayOpportunityType === 'lease' ? 'lease' : 'sell', clientId: displayClient?.id }} onPropertyCreated={(property) => { setAssignedProperty({ id: property.id, title: property.title, image: apartmentImage1, status: 'draft' }); setHasPropertyAssigned(true); setDevPropertyStatus('draft'); }} />
      {showAnnotations && <AnnotationOverlay onClose={() => setShowAnnotations(false)} />}
      <EditPreferencesModal open={showEditPreferences} onOpenChange={setShowEditPreferences} clientName={displayClient?.fullName || 'Client'} opportunityType={displayOpportunityType} onSave={() => { toast("Preferences updated successfully"); }} />
      {showMatchesModal && (<MatchesModal open={showMatchesModal} onOpenChange={setShowMatchesModal} opportunityId={id || ''} opportunityTitle={displayOpportunity?.title || ''} opportunityType={opportunityConfig?.label || 'Buy'} opportunityClient={displayClient ? { id: displayClient.id, name: displayClient.fullName, phone: displayClient.phone || '+34 612 345 678' } : undefined} opportunityProperty={isSellingOpportunity && displayOpportunity ? { id: displayOpportunity.id, type: displayOpportunity.type, propertyType: (displayOpportunity as any).propertyTypes?.[0] || 'Apartment', location: displayOpportunity.neighborhoods?.[0] || 'Madrid', price: displayOpportunity.priceRange?.max || 0, currency: displayOpportunity.priceRange?.currency || '€', bedrooms: displayOpportunity.bedrooms || 0, size: displayOpportunity.sizeRange?.max || 120, sizeUnit: (displayOpportunity as any).sizeRange?.unit || 'm²', image: (displayOpportunity as any).images?.[0] } : undefined} />)}
      <DeactivateOpportunityModal open={showDeactivateModal} onOpenChange={setShowDeactivateModal} opportunityType={displayOpportunityType} onDeactivate={handleDeactivate} />
      <DeactivationDetailsModal open={showDeactivationDetailsModal} onOpenChange={setShowDeactivationDetailsModal} deactivatedAt={deactivatedAt} reason={deactivationReason} />
      <CloseDealModal open={showCloseDealModal} onOpenChange={setShowCloseDealModal} opportunityType={displayOpportunityType} isPropertyPublished={devPropertyStatus === 'published'} onClose={handleCloseDeal} />
      {sharePropertyData && (<SharePropertyModal open={shareModalOpen} onOpenChange={(open) => { setShareModalOpen(open); if (!open) { setSharePreSelectedClient(null); } }} property={sharePropertyData} preSelectedClient={sharePreSelectedClient || undefined} />)}
      <BulkShareModal
        open={bulkShareModalOpen}
        onOpenChange={setBulkShareModalOpen}
        items={bulkShareItems}
        direction={bulkShareDirection}
        client={displayClient ? { id: displayClient.id, name: displayClient.fullName, phone: displayClient.phone || '+34 612 345 678' } : undefined}
        property={savedProperties[0] ? { id: savedProperties[0].id, title: savedProperties[0].title, image: savedProperties[0].image } : undefined}
        onComplete={() => {
          setSelectedPropertyIds(new Set());
          setSelectedBuyerIds(new Set());
        }}
      />
      {id && <NotesSideMenu ref={notesSideMenuRef} opportunityId={id} />}
    </>
  );

  // === LAYOUT: TWO-COLUMN (LEFT or RIGHT sidebar) ===
  const isTwoColumn = layoutVariant === 'two-column-left' || layoutVariant === 'two-column-right';
  const sidebarOnRight = layoutVariant === 'two-column-right';
  if (isTwoColumn) {
    return (
      <div className={cn("min-h-screen bg-surface-page animate-fade-in", headerVariant === 'full-gradient' ? "-mt-16" : "")}>
        {/* Compact or full header - no client info, client is in sidebar */}
        {headerVariant === 'compact-bar' ? (
          <div className="border-b bg-card">
            <PageContainer className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {opportunityTypeBadge('dark')}
                <div>
                  <h1 className="text-2xl font-semibold">{displayOpportunity.title}</h1>
                  {headerTimestamps('dark')}
                </div>
              </div>
              {topBarActions}
            </PageContainer>
          </div>
        ) : (
          <div className="relative pt-16">
            {headerGradientBg}
            <PageContainer className="relative z-10 flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {opportunityTypeBadge('light')}
                <div>
                  <h1 className="text-2xl font-semibold text-white">{displayOpportunity.title}</h1>
                  {headerTimestamps('light')}
                </div>
              </div>
              {topBarActions}
            </PageContainer>
          </div>
        )}

        <PageContainer className="py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar column */}
            <div className={cn("col-span-4 space-y-5", sidebarOnRight && "order-2")}>
              {/* Client Card */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Client</h3>
                <div className="flex items-start gap-3">
                  <div className="cursor-pointer" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                    <UserAvatar 
                      name={displayClient.fullName} 
                      size="md" 
                      className="w-12 h-12 flex-shrink-0" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                    <h3 className="text-lg font-semibold leading-heading text-foreground truncate">{displayClient.fullName}</h3>
                    <div className="text-sm font-normal leading-body text-muted-foreground">
                      {displayClient.phone && <div>{displayClient.phone}</div>}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary hover:bg-secondary/80">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card min-w-[200px]">
                      <div className="-mx-2 -mt-2 px-4 py-3 border-b border-border mb-2">
                        <span className="text-sm font-semibold">{displayClient.fullName}</span>
                      </div>
                      <DropdownMenuItem className="px-3 py-2.5 gap-3" onClick={() => handleCall(displayClient.phone || '+34 612 345 678')}>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2.5 gap-3" onClick={() => handleWhatsApp(displayClient.phone || '+34 612 345 678')}>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2.5 gap-3" onClick={() => handleEmail(displayClient.email || 'client@example.com')}>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2.5 gap-3" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        Go to profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>

              {/* Preferences / Property */}
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {isSellingOpportunityDisplay ? 'Property' : 'Preferences'}
                </h3>
                {preferencesOrPropertyContent('dark')}
                {statusBannerElement}
              </Card>

              {/* Stats Overview */}
              <OpportunityStatsWidget opportunityType={devOpportunityType} />

              {/* Activity */}
              <Card className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
                {activityWidgetElement}
              </Card>
            </div>

            {/* Main column: saved items */}
            <div className={cn("col-span-8 space-y-6", sidebarOnRight && "order-1")}>
              {matchesBannerElement}
              {savedItemsSection}
              {findMoreCta}
            </div>
          </div>
        </PageContainer>

        {modalsElement}
        <div className="fixed bottom-6 right-6 z-[9999]">
          <OpportunityDetailsDevTool opportunityType={devOpportunityType} setOpportunityType={setDevOpportunityType} hasPropertyAssigned={hasPropertyAssigned} setHasPropertyAssigned={setHasPropertyAssigned} hasPreferencesAdded={hasPreferencesAdded} setHasPreferencesAdded={setHasPreferencesAdded} savedCount={savedCount} setSavedCount={setSavedCount} matchCount={matchCount} setMatchCount={setMatchCount} newMatchCount={newMatchCount} setNewMatchCount={setNewMatchCount} propertyStatus={devPropertyStatus} setPropertyStatus={setDevPropertyStatus} isClosed={isClosed} setIsClosed={setIsClosed} layoutVariant={layoutVariant} setLayoutVariant={setLayoutVariant} headerVariant={headerVariant} setHeaderVariant={setHeaderVariant} />
        </div>
      </div>
    );
  }


  // === LAYOUT: COMPACT HEADER + WIDE GRID ===
  if (layoutVariant === 'compact-wide') {
    return (
      <div className={cn("min-h-screen bg-surface-page animate-fade-in", headerVariant === 'full-gradient' ? "-mt-16" : "")}>
        {/* Compact header always */}
        <div className={cn("border-b", headerVariant === 'full-gradient' ? "relative pt-16" : "bg-card")}>
          {headerVariant === 'full-gradient' && headerGradientBg}
          <PageContainer className={cn("relative z-10 flex items-center justify-between py-4")}>
            <div className="flex items-center gap-4">
              
              {opportunityTypeBadge(headerVariant === 'full-gradient' ? 'light' : 'dark')}
              <div>
                <h1 className={cn("text-2xl font-semibold", headerVariant === 'full-gradient' ? "text-white" : "")}>{displayOpportunity.title}</h1>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                  <UserAvatar name={displayClient.fullName} size="sm" className={cn("w-5 h-5 text-[10px]", headerVariant === 'full-gradient' ? "bg-white text-foreground" : "")} />
                  <span className={cn("text-sm font-medium", headerVariant === 'full-gradient' ? "text-white/70" : "text-muted-foreground")}>{displayClient.fullName}</span>
                </div>
                {headerTimestamps(headerVariant === 'full-gradient' ? 'light' : 'dark')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Inline preferences pills */}
              <div className="hidden xl:flex items-center gap-2">
                {preferencesOrPropertyContent(headerVariant === 'full-gradient' ? 'light' : 'dark')}
              </div>
              {topBarActions}
            </div>
          </PageContainer>
        </div>

        <PageContainer className="py-6">
          {/* Preferences on smaller screens */}
          <div className="xl:hidden mb-6">
            {preferencesOrPropertyContent('dark')}
          </div>
          
          {statusBannerElement}

          <div className="grid grid-cols-12 gap-6">
            {/* Main content - full width */}
            <div className="col-span-9 space-y-6">
              {matchesBannerElement}
              {savedItemsSection}
              {findMoreCta}
            </div>

            {/* Side panel - activity */}
            <div className="col-span-3 space-y-5">
              {/* Stats Overview */}
              <OpportunityStatsWidget opportunityType={devOpportunityType} />

              <Card className="p-5 space-y-3 sticky top-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
                {activityWidgetElement}
              </Card>
            </div>
          </div>
        </PageContainer>

        {modalsElement}
        <div className="fixed bottom-6 right-6 z-[9999]">
          <OpportunityDetailsDevTool opportunityType={devOpportunityType} setOpportunityType={setDevOpportunityType} hasPropertyAssigned={hasPropertyAssigned} setHasPropertyAssigned={setHasPropertyAssigned} hasPreferencesAdded={hasPreferencesAdded} setHasPreferencesAdded={setHasPreferencesAdded} savedCount={savedCount} setSavedCount={setSavedCount} matchCount={matchCount} setMatchCount={setMatchCount} newMatchCount={newMatchCount} setNewMatchCount={setNewMatchCount} propertyStatus={devPropertyStatus} setPropertyStatus={setDevPropertyStatus} isClosed={isClosed} setIsClosed={setIsClosed} layoutVariant={layoutVariant} setLayoutVariant={setLayoutVariant} headerVariant={headerVariant} setHeaderVariant={setHeaderVariant} />
        </div>
      </div>
    );
  }

  // === LAYOUT: CURRENT (original) ===
  return <div className={cn("min-h-screen bg-surface-page animate-fade-in", headerVariant === 'full-gradient' ? "-mt-16" : "")}>
      {/* Header with Gradient Background - extends behind global header */}
      {headerVariant === 'full-gradient' ? (
        <div className="relative pt-16">
          {headerGradientBg}
          {/* Top Bar with Menu */}
          <PageContainer className="relative z-10 flex items-center justify-end gap-1 py-3">
            {topBarActions}
          </PageContainer>

          {/* Hero Content */}
          <PageContainer className="relative z-10 pb-4 pt-4">
            <div className="flex flex-col items-center text-center space-y-2 max-w-4xl mx-auto">
              {opportunityTypeBadge('light')}
              <TrackedTitle title={displayOpportunity.title}>
                <h1 className="text-3xl md:text-4xl font-semibold text-white">{displayOpportunity.title}</h1>
              </TrackedTitle>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                <UserAvatar name={displayClient.fullName} size="sm" className="w-6 h-6 text-xs bg-white text-foreground" />
                <span className="text-lg font-semibold leading-heading text-white">{displayClient.fullName}</span>
              </div>
            </div>
          </PageContainer>

          {/* Property/Preferences Banner */}
          <PageContainer className="relative z-10 pb-4 pt-4">
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-4 transition-all duration-500 ease-out">
              <div className="w-full flex items-center justify-center min-h-[56px]">
                {preferencesOrPropertyContent('light')}
              </div>
              {statusBannerElement}
            </div>
          </PageContainer>
        </div>
      ) : (
        /* Compact Bar Header */
        <div className="border-b bg-card">
          <PageContainer className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              
              {opportunityTypeBadge('dark')}
              <div>
                <h1 className="text-xl font-semibold">{displayOpportunity.title}</h1>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => !isDraftOpportunity && navigate(`/clients/${displayClient.id}`)}>
                  <UserAvatar name={displayClient.fullName} size="sm" className="w-5 h-5 text-[10px]" />
                  <span className="text-sm text-muted-foreground font-medium">{displayClient.fullName}</span>
                </div>
                {headerTimestamps('dark')}
              </div>
            </div>
            {topBarActions}
          </PageContainer>
        </div>
      )}

      {/* White Content Section with rounded top */}
      <div className={cn(headerVariant === 'full-gradient' ? "bg-surface-page -mt-4 rounded-t-3xl relative z-10 pt-2" : "", "min-h-[calc(100vh-200px)]")}>
        {/* Compact bar: show preferences below header */}
        {headerVariant === 'compact-bar' && (
          <PageContainer className="py-4">
            <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
              {preferencesOrPropertyContent('dark')}
              {statusBannerElement}
            </div>
          </PageContainer>
        )}

      {/* Content Section */}
      <PageContainer className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <div className="relative bg-card rounded-full p-1.5 w-full max-w-md">
              <div className={cn("absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-background rounded-full shadow-sm transition-transform duration-300 ease-out", activeTab === 'activity' ? "translate-x-[100%]" : "translate-x-0")} />
              <TabsList className="bg-transparent rounded-full p-0 h-auto w-full grid grid-cols-2">
                <TabsTrigger value="properties" className="relative z-10 rounded-full px-6 py-2.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-colors duration-200">
                  {isSellingOpportunity ? 'Buyers' : 'Properties'}
                </TabsTrigger>
                <TabsTrigger value="activity" className="relative z-10 rounded-full px-6 py-2.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-colors duration-200 flex items-center justify-center gap-1.5">
                  {overdueCount > 0 && (<div className="w-2 h-2 rounded-full bg-destructive" />)}
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="properties" className="mt-0">
            <div key={`properties-content-${activeTab}`} className="space-y-6 animate-fade-in-fast">
              {matchesBannerElement}
              {savedItemsSection}
              {findMoreCta}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <div key={`activity-content-${activeTab}`} className="mt-6 animate-fade-in-fast">
              {activityWidgetElement}
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>
      </div>

      {modalsElement}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <OpportunityDetailsDevTool opportunityType={devOpportunityType} setOpportunityType={setDevOpportunityType} hasPropertyAssigned={hasPropertyAssigned} setHasPropertyAssigned={setHasPropertyAssigned} hasPreferencesAdded={hasPreferencesAdded} setHasPreferencesAdded={setHasPreferencesAdded} savedCount={savedCount} setSavedCount={setSavedCount} matchCount={matchCount} setMatchCount={setMatchCount} newMatchCount={newMatchCount} setNewMatchCount={setNewMatchCount} propertyStatus={devPropertyStatus} setPropertyStatus={setDevPropertyStatus} isClosed={isClosed} setIsClosed={setIsClosed} layoutVariant={layoutVariant} setLayoutVariant={setLayoutVariant} headerVariant={headerVariant} setHeaderVariant={setHeaderVariant} />
      </div>
    </div>;
}