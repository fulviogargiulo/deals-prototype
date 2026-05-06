import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, ChevronDown, Copy, ChevronRight, ChevronLeft, Calendar, Send, Users, Pencil, Building, Euro, Bed, TrendingUp, Snowflake, PawPrint, Bath, Info } from "lucide-react";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullscreenGallery } from "@/components/ui/fullscreen-gallery";
import { SpecPills } from "@/components/ui/spec-pills";
import { ReferenceCodeBadge } from "@/components/ui/reference-code-badge";
import { OpportunityIcon, getOpportunityConfig } from "@/components/opportunities/opportunity-icon";
import { PageContainer } from "@/components/layout/page-container";
import { StickyToHeader } from "@/components/ui/sticky-to-header";
import { TrackedTitle } from "@/components/ui/tracked-title";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        text: 'Luminoso apartamento de 3 dormitorios con dos baños completos, cocina moderna totalmente equipada y amplio balcón con vistas despejadas en el prestigioso barrio de Chamberí.',
        language: 'Spanish',
        flag: '🇪🇸'
      },
    ],
  },
  features: {
    size: 120,
    usableSize: 110,
    bedrooms: 3,
    bathrooms: 2,
    condition: 'Excellent',
    occupancyStatus: 'Vacant',
  },
  additionalInfo: {
    exposure: {
      view: 'City',
      orientation: 'South-facing',
    },
    buildAndFinish: {
      constructionYear: 1985,
      renovationYear: 2020,
      furnished: 'Fully furnished',
    },
    propertyAmenities: ['Air conditioning', 'Terrace', 'Wooden floors', 'Built-in wardrobes', 'Storage room'],
    buildingAmenities: ['Elevator', 'Doorman', 'Communal garden', 'Pool'],
    energyCertificate: {
      consumptionType: 'D',
      consumption: 156,
      emissionsType: 'C',
      emissions: 28,
    },
  },
};

// Detail Row component
function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// Section Title component
function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-semibold text-muted-foreground uppercase", className)}>{children}</h3>;
}

// Card Section component for reuse
function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <SectionTitle className="mb-4">{title}</SectionTitle>
      {children}
    </Card>
  );
}

// Matching Preferences Section for embedded preview
interface MatchingPreferencesSectionProps {
  matchingPreferences?: string[];
  property: {
    propertyType?: string;
    location?: string;
    price?: number;
    currency?: string;
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    sizeUnit?: string;
  };
}

export function MatchingPreferencesSection({ matchingPreferences, property }: MatchingPreferencesSectionProps) {
  // Exact matches - core property attributes
  const exactMatches = [
    property.propertyType && { icon: Building, label: property.propertyType },
    property.location && { icon: MapPin, label: property.location },
    property.price && property.currency && { icon: Euro, label: `${property.currency}${(property.price / 1000).toFixed(0)}k` },
    property.bedrooms && { icon: Bed, label: String(property.bedrooms) },
  ].filter(Boolean) as { icon: typeof Building; label: string }[];
  
  // Add some amenities from matchingPreferences
  const amenityIcons: Record<string, typeof Building> = {
    'Air conditioning': Snowflake,
    'Pet-friendly': PawPrint,
  };
  
  const amenities = matchingPreferences?.filter(p => 
    ['Air conditioning', 'Pet-friendly', 'Terrace', 'Parking', 'Pool', 'Gym', 'Garden'].includes(p)
  ) || [];
  
  // Close matches
  const closeMatches = [
    property.size && property.sizeUnit && { icon: TrendingUp, label: `${property.size} ${property.sizeUnit}` },
    property.bathrooms && { icon: Bath, label: String(property.bathrooms) },
  ].filter(Boolean) as { icon: typeof Building; label: string }[];

  return (
    <Card className="p-4">
      <SectionTitle className="mb-3">Matching preferences</SectionTitle>
      
      {/* Exact match section */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm text-muted-foreground">Exact match</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-4">
                <p className="font-semibold mb-2">What is an exact match?</p>
                <p className="text-sm text-muted-foreground">
                  Exact matches happen when a property's features perfectly align with what the buyer requested.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2">
          {exactMatches.map((match, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'rgba(16, 177, 137, 0.15)', color: 'rgb(16, 137, 107)' }}
            >
              <match.icon className="h-4 w-4" />
              {match.label}
            </div>
          ))}
          {amenities.slice(0, 2).map((amenity, idx) => {
            const IconComponent = amenityIcons[amenity] || Building;
            return (
              <div 
                key={`amenity-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(16, 177, 137, 0.15)', color: 'rgb(16, 137, 107)' }}
              >
                <IconComponent className="h-4 w-4" />
                {amenity}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Close match section */}
      {closeMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm text-muted-foreground">Close match</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {closeMatches.map((match, idx) => (
              <div 
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(237, 153, 23, 0.15)', color: 'rgb(180, 115, 15)' }}
              >
                <match.icon className="h-4 w-4" />
                {match.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Property data interface that works for both embedded and page use
export interface PropertyData {
  id: string;
  title: string;
  type?: 'sell' | 'lease' | 'buy' | 'rent';
  images?: string[];
  portalBadges?: string[];
  // Match data for embedded preview
  location?: string;
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  sizeUnit?: string;
  propertyType?: string;
  matchingPreferences?: string[];
  owner?: {
    name: string;
    initials: string;
    avatar?: string;
    isYou?: boolean;
  };
}

interface PropertyDetailsContentProps {
  property: PropertyData;
  isOwnProperty?: boolean;
  showMatchingPreferences?: boolean;
  embedded?: boolean;
  className?: string;
}

export function PropertyDetailsContent({ 
  property,
  isOwnProperty = false,
  showMatchingPreferences = false,
  embedded = false,
  className
}: PropertyDetailsContentProps) {
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const extendedData = mockExtendedData;
  const defaultImages = [apartmentImage, apartmentImage2, apartmentImage3, apartmentImage4];
  const images = property.images?.length ? property.images : defaultImages;

  const formattedPrice = useMemo(() => {
    const price = property.price || extendedData.pricing.price;
    const currency = property.currency || extendedData.pricing.currency;
    return property.type === 'lease' 
      ? `${currency}${price.toLocaleString()}/month`
      : `${currency}${price.toLocaleString()}`;
  }, [property, extendedData.pricing]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${extendedData.address.street}, ${extendedData.address.city}`);
    toast.success('Address copied to clipboard');
  };

  // Sync carousel
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setGalleryInitialIndex(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi]);

  return (
    <div className={cn("bg-background", embedded ? "pb-6" : "pb-20 lg:pb-6", "animate-fade-in", className)}>
      {/* Hero Gallery */}
      <div className={embedded ? "px-0" : ""}>
        <PageContainer className={embedded ? "px-0" : "pt-6"}>
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="relative">
              <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                  {images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div 
                        className={cn(
                          "bg-muted relative cursor-pointer group",
                          embedded ? "aspect-[4/3]" : "aspect-[4/3] md:aspect-[21/9]"
                        )}
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
                        "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FFFFFF66] text-white z-20 flex items-center justify-center select-none",
                        galleryInitialIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-[#FFFFFF80] cursor-pointer"
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
                        galleryInitialIndex === images.length - 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-[#FFFFFF80] cursor-pointer"
                      )}
                    >
                      <ChevronRight className="h-4 w-4 pointer-events-none" />
                    </button>
                  </>
                )}

                {/* Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full px-2 py-1.5 bg-white/20 backdrop-blur-sm flex gap-1.5">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          idx === galleryInitialIndex ? "bg-white" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                )}
              </Carousel>
            </div>
          </Card>
        </PageContainer>
      </div>

      {/* Content */}
      <PageContainer className={embedded ? "px-4" : ""}>
        <div className="space-y-4 mt-4">
          {/* Price & Title Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <ReferenceCodeBadge code={extendedData.referenceCode} />
              {property.portalBadges?.includes('Exclusive') && (
                <Badge variant="outline" className="font-medium">Exclusive</Badge>
              )}
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold">{formattedPrice}</span>
              <span className="text-sm text-muted-foreground">2d ago</span>
            </div>
            <h1 className="text-base text-muted-foreground mb-3">{property.title}</h1>
            <SpecPills
              bedrooms={property.bedrooms || extendedData.features.bedrooms}
              bathrooms={property.bathrooms || extendedData.features.bathrooms}
              size={property.size || extendedData.features.size}
            />
          </Card>

          {/* Matching Preferences - only shown in embedded preview */}
          {showMatchingPreferences && (
            <MatchingPreferencesSection 
              matchingPreferences={property.matchingPreferences}
              property={{
                propertyType: property.propertyType,
                location: property.location,
                price: property.price,
                currency: property.currency,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                size: property.size,
                sizeUnit: property.sizeUnit,
              }}
            />
          )}

          {/* Address */}
          <Card className="p-4">
            <SectionTitle className="mb-3">Address</SectionTitle>
            <LeafletMap 
              lat={extendedData.address.lat} 
              lng={extendedData.address.lng} 
              className="aspect-[2/1] rounded-lg mb-3"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{extendedData.address.street}, {extendedData.address.city}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyAddress}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-4">
            <SectionTitle className="mb-3">Pricing</SectionTitle>
            <DetailRow label="Property price" value={`${extendedData.pricing.price.toLocaleString()} ${extendedData.pricing.currency}`} />
            {extendedData.pricing.communityFees && <DetailRow label="Community fees" value={`${extendedData.pricing.communityFees} ${extendedData.pricing.currency}/month`} />}
            {extendedData.pricing.ibi && <DetailRow label="IBI" value={`${extendedData.pricing.ibi} ${extendedData.pricing.currency}/year`} />}
          </Card>

          {/* Description */}
          <Card className="p-4">
            <SectionTitle className="mb-3">Description</SectionTitle>
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

          {/* Property Features */}
          <Card className="p-4">
            <SectionTitle className="mb-3">Property features</SectionTitle>
            <DetailRow label="Size" value={`${extendedData.features.size} m²`} />
            {extendedData.features.usableSize && <DetailRow label="Usable size" value={`${extendedData.features.usableSize} m²`} />}
            <DetailRow label="Bedrooms" value={extendedData.features.bedrooms} />
            <DetailRow label="Bathrooms" value={extendedData.features.bathrooms} />
            {extendedData.features.condition && <DetailRow label="Condition" value={extendedData.features.condition} />}
          </Card>

          {/* Additional Info */}
          <Card className="p-4">
            <SectionTitle className="mb-3">Additional information</SectionTitle>
            <div className="space-y-4">
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
            </div>
          </Card>

          {/* Listed by */}
          {!isOwnProperty && property.owner && !property.owner.isYou && (
            <Card className="overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase">Listed by</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={property.owner.avatar || agentPortrait} 
                    alt="Agent" 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-md" 
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} 
                  />
                  <div>
                    <h4 className="font-semibold text-sm">{property.owner.name}</h4>
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
          )}
        </div>
      </PageContainer>

      {/* Fullscreen Gallery */}
      <FullscreenGallery 
        images={images} 
        initialIndex={galleryInitialIndex} 
        open={galleryOpen} 
        onOpenChange={setGalleryOpen} 
      />
    </div>
  );
}
