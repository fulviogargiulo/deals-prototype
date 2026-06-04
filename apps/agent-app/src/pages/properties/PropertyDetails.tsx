import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Share2, Heart, ChevronDown, Copy, ChevronRight, ChevronLeft, Calendar, Send, Users, Pencil, Trash2, Bookmark, ExternalLink, ArrowDown } from "lucide-react";
import { SharePropertyModal } from "@/components/modals/share-property-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StickyToHeader } from "@/components/ui/sticky-to-header";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { ReferenceCodeBadge } from "@/components/ui/reference-code-badge";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { PropertyDetailsDevTool, PropertyOwnershipMode } from "@/components/dev-tools/property-details-dev-tool";
import { OpportunityIcon, getOpportunityConfig } from "@/components/opportunities/opportunity-icon";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullscreenGallery } from "@/components/ui/fullscreen-gallery";
import { SpecPills } from "@/components/ui/spec-pills";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchingPreferencePills } from "@/components/matches/matching-preference-pills";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useData } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import agentPortrait from "@/assets/agent-portrait.jpg";
import apartmentImage from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import apartmentImage4 from "@/assets/apartment-la-latina-4.jpg";

// Mock extended property data
interface ExtendedPropertyData {
  referenceCode: string;
  pricing: {
    price: number;
    originalPrice?: number;
    currency: string;
    communityFees?: number;
    ibi?: number;
    pricePerArea?: number;
  };
  address: {
    street: string;
    city: string;
    lat: number;
    lng: number;
  };
  description: {
    translations: { text: string; language: string; flag: string }[];
  };
  features: {
    size: number;
    usableSize?: number;
    bedrooms: number;
    bathrooms: number;
    condition?: string;
    occupancyStatus?: string;
  };
  additionalInfo: {
    exposure?: {
      view?: string;
      orientation?: string;
    };
    buildAndFinish?: {
      constructionYear?: number;
      renovationYear?: number;
      furnished?: string;
    };
    propertyAmenities?: string[];
    buildingAmenities?: string[];
    energyCertificate?: {
      consumptionType?: string;
      consumption?: number;
      emissionsType?: string;
      emissions?: number;
    };
  };
}

const mockExtendedData: ExtendedPropertyData = {
  referenceCode: 'ARP1F3',
  pricing: {
    price: 700000,
    originalPrice: 750000,
    currency: '€',
    communityFees: 120,
    ibi: 200,
    pricePerArea: 1200,
  },
  address: {
    street: 'Calle de Vallehermoso 34',
    city: '28003 Madrid',
    lat: 40.4378,
    lng: -3.7046,
  },
  description: {
    translations: [
      {
        text: 'Luminoso apartamento de 3 dormitorios con dos baños completos, cocina moderna totalmente equipada y amplio balcón con vistas despejadas en el prestigioso barrio de Chamberí. Esta propiedad excepcional ofrece una oportunidad única para familias o profesionales que buscan comodidad y estilo en una de las ubicaciones más privilegiadas de Madrid.\n\nEl apartamento cuenta con suelos de madera noble en todas las estancias, ventanas de doble acristalamiento que garantizan un excelente aislamiento térmico y acústico, y aire acondicionado por conductos en todas las habitaciones.',
        language: 'Spanish',
        flag: '🇪🇸'
      },
      {
        text: 'Bright 3-bedroom apartment with two full bathrooms, fully equipped modern kitchen and spacious balcony with unobstructed views in the prestigious Chamberí neighborhood. This exceptional property offers a unique opportunity for families or professionals seeking comfort and style in one of Madrid\'s most privileged locations.\n\nThe apartment features hardwood floors throughout, double-glazed windows ensuring excellent thermal and acoustic insulation, and ducted air conditioning in all rooms.',
        language: 'English',
        flag: '🇬🇧'
      }
    ],
  },
  features: {
    size: 200,
    usableSize: 145,
    bedrooms: 3,
    bathrooms: 2,
    condition: 'Good',
    occupancyStatus: 'Vacant',
  },
  additionalInfo: {
    exposure: {
      view: 'Exterior facing',
      orientation: 'South',
    },
    buildAndFinish: {
      constructionYear: 1995,
      renovationYear: 2018,
      furnished: 'Furnished',
    },
    propertyAmenities: [
      'Air conditioning', 'Equipped kitchen', 'Built-in wardrobes', 'Terrace', 
      'Storage room', 'Parking space (-35,000€)', 'Balcony', 'Pet-friendly', 'Private pool',
      'Gym', 'Warehouse', 'Smoke outlet', 'Corner', 'Alarm system', 'Mountain view', 'Sea view'
    ],
    buildingAmenities: [
      'Lift', 'Accessible housing', 'Private garden', 'Shared garden',
      'Public pool', 'Classic facade', 'Concierge', 'Doorman', 'Shared gym'
    ],
    energyCertificate: {
      consumptionType: 'E',
      consumption: 153,
      emissionsType: 'E',
      emissions: 35,
    },
  },
};

// Detail row component
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

// Section Title component - used on mobile
function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-semibold", className)}>{children}</h2>;
}

// Card Section component - used on desktop bento grid
function CardSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-5 flex flex-col", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

// Description Card component - extracted to follow rules of hooks
function DescriptionCard({ 
  description, 
  isExpanded, 
  onToggleExpand 
}: { 
  description: ExtendedPropertyData['description']; 
  isExpanded: boolean; 
  onToggleExpand: () => void;
}) {
  const descriptionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsedHeight, setCollapsedHeight] = useState<number>(0);
  const [fullHeight, setFullHeight] = useState<number>(0);
  
  useEffect(() => {
    if (descriptionRef.current && contentRef.current) {
      const cardHeight = descriptionRef.current.parentElement?.clientHeight || 0;
      const headerHeight = 60;
      const buttonHeight = 40;
      const availableHeight = Math.max(cardHeight - headerHeight - buttonHeight, 100);
      setCollapsedHeight(availableHeight);
      setFullHeight(contentRef.current.scrollHeight);
    }
  }, [description]);
  
  return (
    <Card className="p-5 flex flex-col h-full" ref={descriptionRef}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Description</h3>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3">
          <span>{description.translations[0].flag}</span>
          <span className="text-sm text-muted-foreground">{description.translations[0].language}</span>
        </div>
        <div 
          className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out flex-1"
          style={{ maxHeight: isExpanded ? `${fullHeight}px` : `${collapsedHeight}px` }}
        >
          <div ref={contentRef}>
            <p className="text-sm leading-relaxed whitespace-pre-line">{description.translations[0].text}</p>
            {description.translations.slice(1).map((t) => (
              <div key={t.language} className={cn("space-y-2 pt-3 border-t mt-3", isExpanded ? "opacity-100" : "opacity-0")} style={{ transition: "opacity 0.3s ease-in-out 0.2s" }}>
                <div className="flex items-center gap-2"><span>{t.flag}</span><span className="text-sm text-muted-foreground">{t.language}</span></div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{t.text}</p>
              </div>
            ))}
          </div>
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
        <button onClick={onToggleExpand} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline pt-4 shrink-0">
          {isExpanded ? 'Show less' : 'Show more'} <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      </div>
    </Card>
  );
}

// Props for embedded mode
export interface PropertyDetailsProps {
  /** Property ID - if not provided, uses URL param */
  propertyId?: string;
  /** Embedded mode hides page-level elements and adapts layout */
  embedded?: boolean;
  /** Callback when close button is clicked (embedded mode) */
  onClose?: () => void;
  /** Callback when open full page is clicked (embedded mode) */
  onOpenFullPage?: () => void;
  /** Callback for discard action (embedded mode) */
  onDiscard?: () => void;
  /** Callback for save action (embedded mode) */
  onSave?: () => void;
  /** Show matching preferences section (embedded mode) */
  showMatchingPreferences?: boolean;
  /** Matching preferences data */
  matchingPreferences?: string[];
}

export function PropertyDetails({
  propertyId: propId,
  embedded = false,
  onClose,
  onOpenFullPage,
  onDiscard,
  onSave,
  showMatchingPreferences = false,
  matchingPreferences = [],
}: PropertyDetailsProps = {}) {
  const { id: urlId } = useParams();
  const id = propId || urlId;
  const navigate = useNavigate();
  const { getOpportunityById } = useData();
  const { loadingDelay, skeletonTargets } = useDevTools();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [ownershipMode, setOwnershipMode] = useState<PropertyOwnershipMode>('not-owned');
  const [isLoading, setIsLoading] = useState(!embedded && loadingDelay > 0 && skeletonTargets.propertyDetails);
  const [isEmbeddedLoading, setIsEmbeddedLoading] = useState(embedded); // Loading state for embedded mode
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const property = getOpportunityById(id!);
  const extendedData = mockExtendedData;

  // All hooks must be called before any early returns
  const formattedPrice = useMemo(() => {
    if (!property || !extendedData.pricing) return 'Price on request';
    const { price, currency } = extendedData.pricing;
    return property.type === 'lease' 
      ? `${currency}${price.toLocaleString()}/month`
      : `${currency}${price.toLocaleString()}`;
  }, [property, extendedData.pricing]);

  // Price drop calculations
  const hasPriceDrop = useMemo(() => {
    const { price, originalPrice } = extendedData.pricing;
    return originalPrice && price < originalPrice;
  }, [extendedData.pricing]);

  const formattedOriginalPrice = useMemo(() => {
    if (!extendedData.pricing.originalPrice) return null;
    const { originalPrice, currency } = extendedData.pricing;
    return `${currency}${originalPrice.toLocaleString()}`;
  }, [extendedData.pricing]);

  const priceDropPercentage = useMemo(() => {
    const { price, originalPrice } = extendedData.pricing;
    if (!originalPrice || price >= originalPrice) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }, [extendedData.pricing]);

  // Header title content for the global header
  const headerTitleContent = useMemo(() => (
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold truncate">{formattedPrice}</span>
      <span className="text-xs text-muted-foreground truncate">{property?.title || ''}</span>
    </div>
  ), [formattedPrice, property?.title]);

  // headerTitleContent and formattedPrice will be passed to TrackedTitle component

  // Simulate loading delay
  useEffect(() => {
    if (loadingDelay > 0 && skeletonTargets.propertyDetails) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), loadingDelay);
      return () => clearTimeout(timer);
    }
  }, [id, loadingDelay, skeletonTargets.propertyDetails]);

  // Simulate loading delay for embedded mode
  useEffect(() => {
    if (embedded) {
      const timer = setTimeout(() => setIsEmbeddedLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [embedded]);

  // Sync carousel with galleryInitialIndex
  useEffect(() => {
    if (!carouselApi) return;
    
    // Update galleryInitialIndex when carousel scrolls
    const onSelect = () => {
      setGalleryInitialIndex(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);


  // Property Details Loading Skeleton
  if (isLoading) {
    return (
      <div className="bg-background pb-20 lg:pb-6 animate-fade-in">
        <PageContainer className="pt-6">
          {/* Gallery Skeleton */}
          <Skeleton className="aspect-[4/3] md:aspect-[21/9] rounded-xl mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Price section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-64" />
              </div>
              
              {/* Specs pills */}
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-12 w-24 rounded-lg" />
                <Skeleton className="h-12 w-24 rounded-lg" />
                <Skeleton className="h-12 w-28 rounded-lg" />
              </div>

              {/* Description Card */}
              <Card className="p-5">
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-24 mt-4" />
              </Card>

              {/* Features Card */}
              <Card className="p-5">
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Agent Card */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </Card>

              {/* Map Card */}
              <Card className="p-5">
                <Skeleton className="h-4 w-20 mb-4" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-48 mt-3" />
              </Card>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }
  
  if (!property || (property.type !== 'sell' && property.type !== 'lease')) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Property not found</p>
        </div>
      </div>
    );
  }

  const formatPrice = () => formattedPrice;

  const defaultImages = [apartmentImage, apartmentImage2, apartmentImage3, apartmentImage4];
  const images = property.images?.length ? property.images : defaultImages;
  const isOwnProperty = ownershipMode === 'owned';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${extendedData.address.street}, ${extendedData.address.city}`);
    toast.success('Address copied to clipboard');
  };

  // EMBEDDED MODE - Render as a scrollable preview with header and CTAs
  if (embedded) {
    // Show embedded skeleton while loading
    if (isEmbeddedLoading) {
      return (
        <div className="flex flex-col h-full bg-background animate-fade-in">
          {/* Embedded Header Skeleton */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl bg-white/60 flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="text-center flex-1 min-w-0 px-4 space-y-2">
              <Skeleton className="h-5 w-24 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          {/* Scrollable Content Skeleton */}
          <ScrollArea className="flex-1">
            <div className="pb-24">
              {/* Gallery Skeleton */}
              <Skeleton className="aspect-[16/9] w-full" />

              {/* Content Cards Skeleton */}
              <div className="px-4 pt-4 space-y-4">
                {/* Price & Title Skeleton */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-5 w-48 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </Card>

                {/* Matching Preferences Skeleton */}
                <Card className="p-4">
                  <Skeleton className="h-5 w-40 mb-3" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-8 w-24 rounded-full" />
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

                {/* Address Skeleton */}
                <Card className="p-4">
                  <Skeleton className="h-5 w-20 mb-3" />
                  <Skeleton className="aspect-[3/1] max-h-32 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-48" />
                </Card>

                {/* Description Skeleton */}
                <Card className="p-4">
                  <Skeleton className="h-5 w-24 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
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
      <div className="flex flex-col h-full bg-background @container">
        {/* Embedded Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl bg-white/60 dark:bg-background/60 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center flex-1 min-w-0 px-4">
            <p className="font-semibold truncate">{formattedPrice}</p>
            <p className="text-sm text-muted-foreground truncate">{property.title}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenFullPage || (() => window.open(`/properties/${id}`, '_blank'))}
            className="h-10 w-10 rounded-full"
            title="Open full listing"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1" viewportProps={{ 'data-preview-scroll': true } as any}>
          <div className="pb-6">
            {/* Gallery */}
            <Card className="overflow-hidden border-0 rounded-none">
              <div className="relative">
                <Carousel className="w-full" setApi={setCarouselApi}>
                  <CarouselContent className="-ml-0">
                    {images.map((image, index) => (
                      <CarouselItem key={index} className="pl-0">
                        {/* Images fill the full carousel container width */}
                        <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                          <img 
                            src={image} 
                            alt={`${property.title} - Image ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  
                  {/* Navigation buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (galleryInitialIndex === 0) return;
                          carouselApi?.scrollPrev();
                        }}
                        className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FFFFFF99] text-foreground z-20 flex items-center justify-center",
                          galleryInitialIndex === 0 
                            ? "opacity-40 cursor-not-allowed" 
                            : "hover:bg-white cursor-pointer"
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (galleryInitialIndex === images.length - 1) return;
                          carouselApi?.scrollNext();
                        }}
                        className={cn(
                          "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FFFFFF99] text-foreground z-20 flex items-center justify-center",
                          galleryInitialIndex === images.length - 1 
                            ? "opacity-40 cursor-not-allowed" 
                            : "hover:bg-white cursor-pointer"
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full px-2 py-1.5 bg-white/20 backdrop-blur-sm flex gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            carouselApi?.scrollTo(idx);
                          }}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            idx === galleryInitialIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </Carousel>
              </div>
            </Card>

            {/* Content Cards - always single column in embedded mode */}
            <div className="px-4 pt-4 space-y-4">
              {/* Price & Title */}
              <Card className="p-4">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <ReferenceCodeBadge code={extendedData.referenceCode} />
                  {property.portalBadges?.includes('Exclusive') && (
                    <Badge variant="outline" className="font-medium">Exclusive</Badge>
                  )}
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-semibold">{formattedPrice}</span>
                    {hasPriceDrop && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground line-through">
                          {formattedOriginalPrice}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-sm font-medium text-red-500">
                          <ArrowDown className="h-3 w-3" />
                          -{priceDropPercentage}%
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">2d ago</span>
                </div>
                <h1 className="text-base text-muted-foreground mb-3">{property.title}</h1>
                <SpecPills
                  bedrooms={extendedData.features.bedrooms}
                  bathrooms={extendedData.features.bathrooms}
                  size={extendedData.features.size}
                />
              </Card>

              {/* Matching Preferences - only in embedded mode */}
              {showMatchingPreferences && matchingPreferences.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold leading-heading mb-3">Matching preferences</h3>
                  <MatchingPreferencePills
                    propertyData={{
                      propertyType: property?.propertyTypes?.[0] || 'Apartment',
                      location: extendedData.address.city,
                      price: extendedData.pricing.price,
                      currency: extendedData.pricing.currency,
                      bedrooms: extendedData.features.bedrooms,
                      size: extendedData.features.size,
                      sizeUnit: 'm²',
                    }}
                    variant="light"
                    showAll={true}
                  />
                </Card>
              )}

              {/* Address */}
              <Card className="p-4">
                <h3 className="text-base font-semibold mb-3">Address</h3>
                <LeafletMap 
                  lat={extendedData.address.lat} 
                  lng={extendedData.address.lng} 
                  className="aspect-[3/1] max-h-32 rounded-lg mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{extendedData.address.street}, {extendedData.address.city}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyAddress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Description */}
              <Card className="p-4">
                <h3 className="text-base font-semibold mb-3">Description</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>{extendedData.description.translations[0].flag}</span>
                    <span className="text-sm text-muted-foreground">{extendedData.description.translations[0].language}</span>
                  </div>
                  <p className={cn("text-sm leading-relaxed whitespace-pre-line", !isDescriptionExpanded && "line-clamp-4")}>
                    {extendedData.description.translations[0].text}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} 
                  className="text-sm text-primary font-medium flex items-center gap-1 mt-3 hover:underline"
                >
                  {isDescriptionExpanded ? 'Show less' : 'Show more'} 
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
                </button>
              </Card>

              {/* Pricing */}
              <Card className="p-4">
                <h3 className="text-base font-semibold mb-3">Pricing</h3>
                <DetailRow label="Property price" value={`${extendedData.pricing.price.toLocaleString()} ${extendedData.pricing.currency}`} />
                {extendedData.pricing.communityFees && <DetailRow label="Community fees" value={`${extendedData.pricing.communityFees} ${extendedData.pricing.currency}/month`} />}
                {extendedData.pricing.ibi && <DetailRow label="IBI" value={`${extendedData.pricing.ibi} ${extendedData.pricing.currency}/year`} />}
                {extendedData.pricing.pricePerArea && <DetailRow label="Price per area" value={`${extendedData.pricing.pricePerArea.toLocaleString()} ${extendedData.pricing.currency}/m²`} />}
              </Card>

              {/* Property Features */}
              <Card className="p-4">
                <h3 className="text-base font-semibold mb-3">Property features</h3>
                <DetailRow label="Size" value={`${extendedData.features.size} m²`} />
                {extendedData.features.usableSize && <DetailRow label="Usable size" value={`${extendedData.features.usableSize} m²`} />}
                <DetailRow label="Bedrooms" value={extendedData.features.bedrooms} />
                <DetailRow label="Bathrooms" value={extendedData.features.bathrooms} />
                {extendedData.features.condition && <DetailRow label="Condition" value={extendedData.features.condition} />}
                {extendedData.features.occupancyStatus && <DetailRow label="Occupancy status" value={extendedData.features.occupancyStatus} />}
              </Card>

              {/* Additional Info */}
              <Card className="p-4">
                <h3 className="text-base font-semibold mb-3">Additional information</h3>
                <div className="space-y-4">
                  {extendedData.additionalInfo.exposure && (
                    <div>
                      <p className="text-sm font-medium mb-2">Exposure</p>
                      {extendedData.additionalInfo.exposure.view && <DetailRow label="View" value={extendedData.additionalInfo.exposure.view} />}
                      {extendedData.additionalInfo.exposure.orientation && <DetailRow label="Orientation" value={extendedData.additionalInfo.exposure.orientation} />}
                    </div>
                  )}
                  {extendedData.additionalInfo.buildAndFinish && (
                    <div>
                      <p className="text-sm font-medium mb-2">Build and finish</p>
                      {extendedData.additionalInfo.buildAndFinish.constructionYear && <DetailRow label="Construction year" value={extendedData.additionalInfo.buildAndFinish.constructionYear} />}
                      {extendedData.additionalInfo.buildAndFinish.renovationYear && <DetailRow label="Renovation year" value={extendedData.additionalInfo.buildAndFinish.renovationYear} />}
                      {extendedData.additionalInfo.buildAndFinish.furnished && <DetailRow label="Furnished" value={extendedData.additionalInfo.buildAndFinish.furnished} />}
                    </div>
                  )}
                  {extendedData.additionalInfo.propertyAmenities && extendedData.additionalInfo.propertyAmenities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Property amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extendedData.additionalInfo.propertyAmenities.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-normal">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {extendedData.additionalInfo.buildingAmenities && extendedData.additionalInfo.buildingAmenities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Building amenities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extendedData.additionalInfo.buildingAmenities.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-normal">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {extendedData.additionalInfo.energyCertificate && (
                    <div>
                      <p className="text-sm font-medium mb-2">Energy certificate</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 font-semibold">
                            {extendedData.additionalInfo.energyCertificate.consumptionType}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Consumption</p>
                            <p className="text-sm font-medium">{extendedData.additionalInfo.energyCertificate.consumption} kWh/m²</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-semibold">
                            {extendedData.additionalInfo.energyCertificate.emissionsType}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Emissions</p>
                            <p className="text-sm font-medium">{extendedData.additionalInfo.energyCertificate.emissions} kg CO²/m²</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Listed by */}
              <Card className="overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">Listed by</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={agentPortrait} 
                      alt="Agent" 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-md" 
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} 
                    />
                    <div>
                      <h4 className="font-semibold text-sm">Sarah Johnson</h4>
                      <p className="text-xs text-muted-foreground">Real Estate Agent</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" size="sm">
                      <Phone className="w-4 h-4" />Contact
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" size="sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom CTA - Discard/Save */}
        {onDiscard && onSave && (
          <div className="p-4 border-t bg-background flex-shrink-0">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                size="lg"
                onClick={onDiscard}
              >
                <Trash2 className="w-4 h-4" />
                Discard
              </Button>
              <Button 
                className="flex-1 gap-2"
                size="lg"
                onClick={onSave}
              >
                <Bookmark className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Fullscreen Gallery */}
        <FullscreenGallery images={images} initialIndex={galleryInitialIndex} open={galleryOpen} onOpenChange={setGalleryOpen} />
      </div>
    );
  }

  // REGULAR PAGE MODE
  return (
    <div className="bg-background pb-20 lg:pb-6 animate-fade-in">

      {/* Full-width Hero Gallery */}
      <PageContainer className="pt-6">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative">
            <Carousel className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div 
                      className="aspect-[4/3] md:aspect-[21/9] bg-muted relative cursor-pointer group"
                      onClick={() => { setGalleryInitialIndex(index); setGalleryOpen(true); }}
                    >
                      <img 
                        src={image} 
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Navigation buttons - matching property card styling */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (galleryInitialIndex === 0) return;
                      carouselApi?.scrollPrev();
                    }}
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FFFFFF66] text-white z-20 flex items-center justify-center select-none",
                      galleryInitialIndex === 0 
                        ? "opacity-40 cursor-not-allowed" 
                        : "hover:bg-[#FFFFFF80] cursor-pointer"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4 pointer-events-none" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (galleryInitialIndex === images.length - 1) return;
                      carouselApi?.scrollNext();
                    }}
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FFFFFF66] text-white z-20 flex items-center justify-center select-none",
                      galleryInitialIndex === images.length - 1 
                        ? "opacity-40 cursor-not-allowed" 
                        : "hover:bg-[#FFFFFF80] cursor-pointer"
                    )}
                  >
                    <ChevronRight className="h-4 w-4 pointer-events-none" />
                  </button>
                </>
              )}
            </Carousel>
            
            {/* Carousel dots with sliding window - matching property card styling */}
            {images.length > 1 && (
              (() => {
                const maxVisibleDots = 5;
                const totalImages = images.length;
                const dotWidth = 8; // w-2 = 0.5rem = 8px
                const dotGap = 6; // gap-1.5 = 0.375rem = 6px
                const dotWithGap = dotWidth + dotGap;
                
                // Calculate the container width to show only maxVisibleDots
                const visibleCount = Math.min(maxVisibleDots, totalImages);
                const containerWidth = visibleCount * dotWidth + (visibleCount - 1) * dotGap;
                
                // Add extra width to show partial dots at edges when there are more images
                const hasMoreBefore = totalImages > maxVisibleDots && galleryInitialIndex > Math.floor(maxVisibleDots / 2);
                const hasMoreAfter = totalImages > maxVisibleDots && galleryInitialIndex < totalImages - Math.floor(maxVisibleDots / 2) - 1;
                const partialDotWidth = 4; // Show half of a dot
                const extraWidth = (hasMoreBefore ? partialDotWidth : 0) + (hasMoreAfter ? partialDotWidth : 0);
                
                // Calculate window start to keep current dot centered when possible
                let windowStart = 0;
                if (totalImages > maxVisibleDots) {
                  windowStart = Math.max(0, galleryInitialIndex - Math.floor(maxVisibleDots / 2));
                  windowStart = Math.min(windowStart, totalImages - maxVisibleDots);
                }
                
                // Calculate the translation offset - adjust for partial dot visibility
                const translateX = -windowStart * dotWithGap + (hasMoreBefore ? partialDotWidth : 0);
                
                return (
                  <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full px-2 py-1.5 bg-white/20 backdrop-blur-sm overflow-hidden"
                    style={{ width: `${containerWidth + 16 + extraWidth}px` }} // +16 for px-2 padding (8px each side)
                  >
                    <div 
                      className="flex gap-1.5 transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(${translateX}px)` }}
                    >
                      {Array.from({ length: totalImages }).map((_, imageIndex) => (
                        <div
                          key={imageIndex}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0",
                            imageIndex === galleryInitialIndex 
                              ? "bg-white" 
                              : "bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </Card>
      </PageContainer>


      {/* Content */}
      <PageContainer>
        {/* Universal tracking element for global header - works for both mobile and desktop */}
        <TrackedTitle 
          title={formattedPrice} 
          headerContent={headerTitleContent}
        >
          {/* Invisible tracking sentinel - must have actual height for IntersectionObserver */}
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        {/* === MOBILE LAYOUT === */}
        <div className="lg:hidden space-y-6">
          {/* Price & Title Card */}
          <Card className="p-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <ReferenceCodeBadge code={extendedData.referenceCode} />
              {property.portalBadges.includes('Exclusive') && (
                <Badge variant="outline" className="font-medium">Exclusive</Badge>
              )}
              {property.portalBadges.includes('Off-plan') && (
                <Badge variant="outline" className="font-medium">Off-plan</Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-semibold">{formatPrice()}</span>
                {hasPriceDrop && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground line-through">
                      {formattedOriginalPrice}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-sm font-medium text-red-500">
                      <ArrowDown className="h-3 w-3" />
                      -{priceDropPercentage}%
                    </span>
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">2d ago</span>
            </div>

            {/* Title */}
            <h1 className="text-lg text-muted-foreground mb-3">{property.title}</h1>

            {/* Specs as pills */}
            <SpecPills
              bedrooms={extendedData.features.bedrooms}
              bathrooms={extendedData.features.bathrooms}
              size={extendedData.features.size}
            />
          </Card>

          {/* Edit Property & View Sell Opportunity */}
          {isOwnProperty && (
            <div className="space-y-3">
              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/my-properties/${property.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Pencil className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="flex-1"><p className="font-medium">Edit property</p><p className="text-sm text-muted-foreground">Update listing details and photos</p></div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/opportunities/${property.id}`)}>
                <div className="flex items-center gap-4">
                  <OpportunityIcon type={property.type} className="w-10 h-10" />
                  <div className="flex-1"><p className="font-medium">View {getOpportunityConfig(property.type).label} opportunity</p><p className="text-sm text-muted-foreground">Manage clients and activity</p></div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </div>
          )}

          {/* Address */}
          <Card className="p-4">
            <SectionTitle className="mb-4">Address</SectionTitle>
            <LeafletMap 
              lat={extendedData.address.lat} 
              lng={extendedData.address.lng} 
              className="aspect-[2/1] rounded-lg mb-3"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{extendedData.address.street}, {extendedData.address.city}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyAddress}><Copy className="w-4 h-4" /></Button>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-4">
            <SectionTitle className="mb-4">Pricing</SectionTitle>
            <DetailRow label="Property price" value={`${extendedData.pricing.price.toLocaleString()} ${extendedData.pricing.currency}`} />
            {extendedData.pricing.communityFees && <DetailRow label="Community fees" value={`${extendedData.pricing.communityFees} ${extendedData.pricing.currency}/month`} />}
            {extendedData.pricing.ibi && <DetailRow label="IBI" value={`${extendedData.pricing.ibi} ${extendedData.pricing.currency}/year`} />}
            {extendedData.pricing.pricePerArea && <DetailRow label="Price per area" value={`${extendedData.pricing.pricePerArea.toLocaleString()} ${extendedData.pricing.currency}/m²`} />}
          </Card>

          {/* Description */}
          <Card className="p-4">
            <SectionTitle className="mb-4">Description</SectionTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span>{extendedData.description.translations[0].flag}</span><span className="text-sm text-muted-foreground">{extendedData.description.translations[0].language}</span></div>
              <p className={cn("text-sm leading-relaxed whitespace-pre-line", !isDescriptionExpanded && "line-clamp-4")}>{extendedData.description.translations[0].text}</p>
            </div>
            {isDescriptionExpanded && extendedData.description.translations.slice(1).map((t) => (
              <div key={t.language} className="space-y-2 pt-4 border-t mt-4">
                <div className="flex items-center gap-2"><span>{t.flag}</span><span className="text-sm text-muted-foreground">{t.language}</span></div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{t.text}</p>
              </div>
            ))}
            <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-sm text-primary font-medium flex items-center gap-1 mt-3 hover:underline">
              {isDescriptionExpanded ? 'Show less' : 'Show more'} <ChevronDown className={cn("w-4 h-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
            </button>
          </Card>

          {/* Property Features */}
          <Card className="p-4">
            <SectionTitle className="mb-4">Property features</SectionTitle>
            <DetailRow label="Size" value={`${extendedData.features.size} m²`} />
            {extendedData.features.usableSize && <DetailRow label="Usable size" value={`${extendedData.features.usableSize} m²`} />}
            <DetailRow label="Bedrooms" value={extendedData.features.bedrooms} />
            <DetailRow label="Bathrooms" value={extendedData.features.bathrooms} />
            {extendedData.features.condition && <DetailRow label="Condition" value={extendedData.features.condition} />}
            {extendedData.features.occupancyStatus && <DetailRow label="Occupancy status" value={extendedData.features.occupancyStatus} />}
          </Card>

          {/* Additional Info */}
          <Card className="p-4">
            <SectionTitle className="mb-4">Additional information</SectionTitle>
            <div className="space-y-5">
              {extendedData.additionalInfo.exposure && (
                <div>
                  <p className="text-sm font-medium mb-2">Exposure</p>
                  {extendedData.additionalInfo.exposure.view && <DetailRow label="View" value={extendedData.additionalInfo.exposure.view} />}
                  {extendedData.additionalInfo.exposure.orientation && <DetailRow label="Orientation" value={extendedData.additionalInfo.exposure.orientation} />}
                </div>
              )}
              {extendedData.additionalInfo.buildAndFinish && (
                <div>
                  <p className="text-sm font-medium mb-2">Build and finish</p>
                  {extendedData.additionalInfo.buildAndFinish.constructionYear && <DetailRow label="Construction year" value={extendedData.additionalInfo.buildAndFinish.constructionYear} />}
                  {extendedData.additionalInfo.buildAndFinish.renovationYear && <DetailRow label="Renovation year" value={extendedData.additionalInfo.buildAndFinish.renovationYear} />}
                  {extendedData.additionalInfo.buildAndFinish.furnished && <DetailRow label="Furnished" value={extendedData.additionalInfo.buildAndFinish.furnished} />}
                </div>
              )}
              {extendedData.additionalInfo.propertyAmenities?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Property amenities</p>
                  <div className="flex flex-wrap gap-1.5">{extendedData.additionalInfo.propertyAmenities.map((a, i) => <Badge key={i} variant="outline" className="text-xs font-normal">{a}</Badge>)}</div>
                </div>
              )}
              {extendedData.additionalInfo.buildingAmenities?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Building amenities</p>
                  <div className="flex flex-wrap gap-1.5">{extendedData.additionalInfo.buildingAmenities.map((a, i) => <Badge key={i} variant="outline" className="text-xs font-normal">{a}</Badge>)}</div>
                </div>
              )}
              {extendedData.additionalInfo.energyCertificate && (
                <div>
                  <p className="text-sm font-medium mb-2">Energy certificate</p>
                  {extendedData.additionalInfo.energyCertificate.consumptionType && <DetailRow label="Energy consumption type" value={extendedData.additionalInfo.energyCertificate.consumptionType} />}
                  {extendedData.additionalInfo.energyCertificate.consumption && <DetailRow label="Consumption" value={`${extendedData.additionalInfo.energyCertificate.consumption} kWh/m² year`} />}
                  {extendedData.additionalInfo.energyCertificate.emissionsType && <DetailRow label="Emissions type" value={extendedData.additionalInfo.energyCertificate.emissionsType} />}
                  {extendedData.additionalInfo.energyCertificate.emissions && <DetailRow label="Emissions" value={`${extendedData.additionalInfo.energyCertificate.emissions} kg CO²/m² year`} />}
                </div>
              )}
            </div>
          </Card>

          {/* Listed by - at the end for mobile */}
          {!isOwnProperty && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Listed by</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img src={agentPortrait} alt="Agent" className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-md" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                  <div><h4 className="font-semibold text-sm">Sarah Johnson</h4><p className="text-xs text-muted-foreground">Senior Real Estate Agent</p></div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" size="sm"><Phone className="w-4 h-4" />Contact</Button>
                  <Button variant="outline" className="flex-1 gap-2" size="sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* === DESKTOP LAYOUT: 3 columns (2 main + 1 sticky sidebar) === */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
          {/* Main Content - 2 columns with internal 2-col grid */}
          <div className="col-span-2 space-y-6">
            {/* Price & Title Card - spans both columns */}
            <Card className="p-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <ReferenceCodeBadge code={extendedData.referenceCode} />
                {property.portalBadges.includes('Exclusive') && (
                  <Badge variant="outline" className="font-medium">Exclusive</Badge>
                )}
                {property.portalBadges.includes('Off-plan') && (
                  <Badge variant="outline" className="font-medium">Off-plan</Badge>
                )}
              </div>

              {/* Price row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-3xl font-semibold">{formatPrice()}</span>
                  {hasPriceDrop && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground line-through">
                        {formattedOriginalPrice}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-sm font-medium text-red-500">
                        <ArrowDown className="h-3 w-3" />
                        -{priceDropPercentage}%
                      </span>
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">2d ago</span>
              </div>

              {/* Title */}
              <h1 className="text-lg text-muted-foreground mb-3">{property.title}</h1>
              
              {/* Key specs as pills */}
              <SpecPills
                bedrooms={extendedData.features.bedrooms}
                bathrooms={extendedData.features.bathrooms}
                size={extendedData.features.size}
                className="mb-4"
              />

            </Card>

            {/* 2-column grid for Address + Description */}
            <div className="grid grid-cols-2 gap-6">
            <CardSection title="Address">
                <div className="space-y-3">
                  <LeafletMap 
                    lat={extendedData.address.lat} 
                    lng={extendedData.address.lng} 
                    className="aspect-[3/2] rounded-lg"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{extendedData.address.street}, {extendedData.address.city}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyAddress}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardSection>

              <DescriptionCard 
                description={extendedData.description}
                isExpanded={isDescriptionExpanded}
                onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              />
            </div>

            {/* 2-column grid for Pricing + Features */}
            <div className="grid grid-cols-2 gap-6">
              <CardSection title="Pricing">
                <DetailRow label="Price" value={`${extendedData.pricing.price.toLocaleString()} ${extendedData.pricing.currency}`} />
                {extendedData.pricing.communityFees && <DetailRow label="Community fees" value={`${extendedData.pricing.communityFees} ${extendedData.pricing.currency}/mo`} />}
                {extendedData.pricing.ibi && <DetailRow label="IBI" value={`${extendedData.pricing.ibi} ${extendedData.pricing.currency}/yr`} />}
                {extendedData.pricing.pricePerArea && <DetailRow label="Per m²" value={`${extendedData.pricing.pricePerArea} ${extendedData.pricing.currency}`} />}
              </CardSection>

              <CardSection title="Property Features">
                <DetailRow label="Size" value={`${extendedData.features.size} m²`} />
                {extendedData.features.usableSize && <DetailRow label="Usable size" value={`${extendedData.features.usableSize} m²`} />}
                <DetailRow label="Bedrooms" value={extendedData.features.bedrooms} />
                <DetailRow label="Bathrooms" value={extendedData.features.bathrooms} />
                {extendedData.features.condition && <DetailRow label="Condition" value={extendedData.features.condition} />}
                {extendedData.features.occupancyStatus && <DetailRow label="Occupancy" value={extendedData.features.occupancyStatus} />}
              </CardSection>
            </div>

            {/* Additional Information - single card with subtitles */}
            <CardSection title="Additional Information">
              <div className="space-y-6">
                {/* Exposure */}
                {extendedData.additionalInfo.exposure && (
                  <div>
                    <p className="text-sm font-medium mb-3">Exposure</p>
                    <div>
                      {extendedData.additionalInfo.exposure.view && <DetailRow label="View" value={extendedData.additionalInfo.exposure.view} />}
                      {extendedData.additionalInfo.exposure.orientation && <DetailRow label="Orientation" value={extendedData.additionalInfo.exposure.orientation} />}
                    </div>
                  </div>
                )}

                {/* Build */}
                {extendedData.additionalInfo.buildAndFinish && (
                  <div>
                    <p className="text-sm font-medium mb-3">Build</p>
                    <div>
                      {extendedData.additionalInfo.buildAndFinish.constructionYear && <DetailRow label="Built" value={extendedData.additionalInfo.buildAndFinish.constructionYear} />}
                      {extendedData.additionalInfo.buildAndFinish.renovationYear && <DetailRow label="Renovated" value={extendedData.additionalInfo.buildAndFinish.renovationYear} />}
                      {extendedData.additionalInfo.buildAndFinish.furnished && <DetailRow label="Furnished" value={extendedData.additionalInfo.buildAndFinish.furnished} />}
                    </div>
                  </div>
                )}

                {/* Property Amenities */}
                {extendedData.additionalInfo.propertyAmenities?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">Property Amenities</p>
                    <div className="flex flex-wrap gap-2">{extendedData.additionalInfo.propertyAmenities.map((a, i) => <Badge key={i} variant="outline" className="text-sm font-normal px-3 py-1">{a}</Badge>)}</div>
                  </div>
                )}

                {/* Building Amenities */}
                {extendedData.additionalInfo.buildingAmenities?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">Building Amenities</p>
                    <div className="flex flex-wrap gap-2">{extendedData.additionalInfo.buildingAmenities.map((a, i) => <Badge key={i} variant="outline" className="text-sm font-normal px-3 py-1">{a}</Badge>)}</div>
                  </div>
                )}

                {/* Energy Certificate */}
                {extendedData.additionalInfo.energyCertificate && (
                  <div>
                    <p className="text-sm font-medium mb-3">Energy Certificate</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 font-semibold text-lg">{extendedData.additionalInfo.energyCertificate.consumptionType}</div>
                        <div><p className="text-xs text-muted-foreground">Consumption</p><p className="text-sm font-medium">{extendedData.additionalInfo.energyCertificate.consumption} kWh/m² year</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-semibold text-lg">{extendedData.additionalInfo.energyCertificate.emissionsType}</div>
                        <div><p className="text-xs text-muted-foreground">Emissions</p><p className="text-sm font-medium">{extendedData.additionalInfo.energyCertificate.emissions} kg CO²/m² year</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardSection>
          </div>

          {/* Sticky Sidebar - 1 column */}
          <StickyToHeader className="space-y-4">
            {/* Owner actions - shown when property is owned by agent */}
            {isOwnProperty ? (
              <>
                <Card className="overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">Your listing</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <img src={agentPortrait} alt="You" className="w-10 h-10 rounded-full object-cover ring-2 ring-background shadow-md" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                      <div><h4 className="font-semibold text-sm">Sarah Johnson</h4><p className="text-xs text-muted-foreground">Senior Real Estate Agent</p></div>
                    </div>
                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/my-properties/${property.id}`)}
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><Pencil className="w-4 h-4 text-muted-foreground" /></div>
                      <div className="flex-1"><p className="font-medium text-sm">Edit property</p><p className="text-xs text-muted-foreground">Update details and photos</p></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/opportunities/${property.id}`)}
                    >
                      <OpportunityIcon type={property.type} className="w-9 h-9" />
                      <div className="flex-1"><p className="font-medium text-sm">View {getOpportunityConfig(property.type).label} opportunity</p><p className="text-xs text-muted-foreground">Manage clients and activity</p></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">Listed by</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={agentPortrait} alt="Agent" className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-md" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                      <div><h4 className="font-semibold text-sm">Sarah Johnson</h4><p className="text-xs text-muted-foreground">Senior Real Estate Agent</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2" size="sm"><Phone className="w-4 h-4" />Contact</Button>
                      <Button variant="outline" className="flex-1 gap-2" size="sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
            
            {/* Perfect for a client - always shown */}
            <Card className="overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <div className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 opacity-90" />
                <h3 className="font-semibold text-sm mb-1">Perfect for a client?</h3>
                <p className="text-xs opacity-90 mb-3">Share or schedule a viewing</p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 font-semibold gap-1.5" size="sm" onClick={() => setShareModalOpen(true)}>
                    <Send className="w-3.5 h-3.5" />
                    Share
                  </Button>
                  <Button variant="secondary" className="flex-1 font-semibold gap-1.5" size="sm">
                    <Calendar className="w-3.5 h-3.5" />
                    Book
                  </Button>
                </div>
              </div>
            </Card>
          </StickyToHeader>
        </div>
      </PageContainer>

      {/* Mobile Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden z-50">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" size="lg" onClick={() => setShareModalOpen(true)}>
            <Send className="w-4 h-4" />
            Share
          </Button>
          <Button className="flex-1 gap-2" size="lg">
            <Calendar className="w-4 h-4" />
            Book
          </Button>
        </div>
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery images={images} initialIndex={galleryInitialIndex} open={galleryOpen} onOpenChange={setGalleryOpen} />
      
      {/* Dev Tool */}
      <PropertyDetailsDevTool ownershipMode={ownershipMode} setOwnershipMode={setOwnershipMode} />

      {/* Share Property Modal */}
      <SharePropertyModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        property={{
          id: id || '',
          title: `${property?.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Property'} in ${extendedData.address.street}`,
          image: images[0] || '',
          idealistaLink: `https://idealista.com/property/${id}`
        }}
      />
    </div>
  );
}
