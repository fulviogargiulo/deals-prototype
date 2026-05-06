import { useState, useEffect, forwardRef } from "react";
import { ArrowLeft, MapPin, Phone, ChevronDown, Copy, ChevronRight, ChevronLeft, Calendar, Send, Users, ExternalLink, Building, Euro, Bed, TrendingUp, Snowflake, PawPrint, Bath, Info, Trash2, Bookmark } from "lucide-react";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpecPills } from "@/components/ui/spec-pills";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Extended property data interface
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

// Mock data for preview
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
        text: 'Luminoso apartamento de 3 dormitorios con dos baños completos, cocina moderna totalmente equipada y amplio balcón con vistas despejadas en el prestigioso barrio de Chamberí. Esta propiedad excepcional ofrece una oportunidad única para familias o profesionales que buscan comodidad y estilo en una de las ubicaciones más privilegiadas de Madrid.\n\nEl apartamento cuenta con suelos de madera noble en todas las estancias, ventanas de doble acristalamiento que garantizan un excelente aislamiento térmico y acústico, y aire acondicionado por conductos en todas las habitaciones.',
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
  return <h2 className={cn("text-base font-semibold", className)}>{children}</h2>;
}

// Matching Preferences Component
interface MatchingPreferencesProps {
  property: {
    propertyType: string;
    location: string;
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    size: number;
    sizeUnit: string;
    matchingPreferences?: string[];
  };
}

function MatchingPreferencesSection({ property }: MatchingPreferencesProps) {
  // Exact matches - core property attributes
  const exactMatches = [
    { icon: Building, label: property.propertyType },
    { icon: MapPin, label: property.location },
    { icon: Euro, label: `${property.currency}${(property.price / 1000).toFixed(0)}k` },
    { icon: Bed, label: String(property.bedrooms) },
  ];
  
  // Add some amenities as exact matches from matchingPreferences
  const amenityIcons: Record<string, typeof Building> = {
    'Air conditioning': Snowflake,
    'Pet-friendly': PawPrint,
  };
  
  const amenities = property.matchingPreferences?.filter(p => 
    ['Air conditioning', 'Pet-friendly', 'Terrace', 'Parking', 'Pool', 'Gym', 'Garden'].includes(p)
  ) || [];
  
  // Close matches - secondary attributes
  const closeMatches = [
    { icon: TrendingUp, label: `${property.size} ${property.sizeUnit}` },
    { icon: Bath, label: String(property.bathrooms) },
  ];

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
                <p className="text-sm text-muted-foreground mb-2">
                  Exact matches happen when a property's features perfectly align with what the buyer requested.
                </p>
                <p className="text-sm text-muted-foreground">
                  For example, if the property is in the selected location or includes specific features like a pool that the buyer asked for, those preferences are considered exact matches.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2">
          {exactMatches.map((match, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ds-green/15 text-ds-green"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ds-green/15 text-ds-green"
              >
                <IconComponent className="h-4 w-4" />
                {amenity}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Close match section */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm text-muted-foreground">Close match</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-4">
                <p className="font-semibold mb-2">What is a close match?</p>
                <p className="text-sm text-muted-foreground mb-2">
                  As we allow a bit of flexibility for certain preferences, close matches are features that don't exactly meet the buyer's preferences but may still offer great value.
                </p>
                <p className="text-sm text-muted-foreground">
                  In some cases, a close match might even be above buyer preferences, for example, a home that's larger, has more rooms, or is priced lower than what the buyer requested.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2">
          {closeMatches.map((match, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ds-orange/15 text-ds-orange"
            >
              <match.icon className="h-4 w-4" />
              {match.label}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export interface MatchPropertyData {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  sizeUnit: string;
  propertyType: string;
  images: string[];
  publishedDate: string;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
    isYou?: boolean;
  };
  matchingPreferences?: string[];
}

interface PropertyPreviewContentProps {
  property: MatchPropertyData;
  onClose: () => void;
  onOpenFullPage?: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
  variant?: 'modal' | 'expand';
  showHeader?: boolean;
  className?: string;
}

export function PropertyPreviewContent({ 
  property,
  onClose,
  onOpenFullPage,
  onDiscard,
  onSave,
  variant = 'modal',
  showHeader = true,
  className
}: PropertyPreviewContentProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const extendedData = mockExtendedData;

  const images = property.images?.length ? property.images : [apartmentImage, apartmentImage2, apartmentImage3, apartmentImage4];
  const formattedPrice = `${property.currency}${property.price.toLocaleString()}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${extendedData.address.street}, ${extendedData.address.city}`);
    toast.success('Address copied to clipboard');
  };

  const handleOpenFullPageClick = () => {
    if (onOpenFullPage) {
      onOpenFullPage();
    } else {
      window.open(`/properties/${property.id}`, '_blank');
    }
  };

  // Sync carousel with gallery index
  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setGalleryIndex(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const isExpand = variant === 'expand';

  return (
    <div className={cn("flex flex-col h-full", isExpand ? "bg-surface-ds-page-dark" : "bg-background", className)}>
      {/* Header */}
      {showHeader && (
        <div className={cn(
          "sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b flex-shrink-0",
          isExpand 
            ? "border-white/10 bg-surface-ds-page-dark" 
            : "backdrop-blur-xl bg-white/60 dark:bg-background/60"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn("h-10 w-10 rounded-full", isExpand && "bg-zinc-800 hover:bg-zinc-700 text-white")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className={cn("text-center flex-1 min-w-0 px-4", isExpand && "text-white")}>
            <p className="font-semibold truncate">{formattedPrice}</p>
            <p className={cn("text-sm truncate", isExpand ? "text-zinc-400" : "text-muted-foreground")}>{property.title}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenFullPageClick}
            className={cn("h-10 w-10 rounded-full", isExpand && "bg-zinc-800 hover:bg-zinc-700 text-white")}
            title="Open full listing"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="pb-24">
          {/* Gallery */}
          <Card className={cn("overflow-hidden border-0 rounded-none", isExpand && "bg-transparent")}>
            <div className="relative">
              <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                  {images.map((image, index) => {
                    // Only render images near the current gallery index to prevent loading all at once
                    const shouldRenderImage = Math.abs(index - galleryIndex) <= 1;
                    
                    return (
                      <CarouselItem key={index}>
                        <div className="aspect-[4/3] bg-muted relative">
                          {shouldRenderImage ? (
                            <img 
                              src={image} 
                              alt={`${property.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted animate-pulse" />
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                
                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (galleryIndex === 0) return;
                        carouselApi?.scrollPrev();
                      }}
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/60 text-foreground z-20 flex items-center justify-center",
                        galleryIndex === 0 
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
                        if (galleryIndex === images.length - 1) return;
                        carouselApi?.scrollNext();
                      }}
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/60 text-foreground z-20 flex items-center justify-center",
                        galleryIndex === images.length - 1 
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
                          idx === galleryIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                        )}
                      />
                    ))}
                  </div>
                )}
              </Carousel>
            </div>
          </Card>

          {/* Content Cards */}
          <div className="px-4 pt-4 space-y-4">
            {/* Price & Title */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10")}>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="secondary" className={cn("font-mono text-xs", isExpand && "bg-zinc-700 text-white")}>{extendedData.referenceCode}</Badge>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className={cn("text-2xl font-bold", isExpand && "text-white")}>{formattedPrice}</span>
                <span className={cn("text-sm", isExpand ? "text-zinc-400" : "text-muted-foreground")}>{property.publishedDate}</span>
              </div>
              <h1 className={cn("text-base mb-3", isExpand ? "text-zinc-400" : "text-muted-foreground")}>{property.title}</h1>
              <SpecPills
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                size={property.size}
              />
            </Card>

            {/* Matching Preferences */}
            <div className={isExpand ? "[&_*]:!bg-zinc-800/50 [&_.card]:!border-white/10" : ""}>
              <MatchingPreferencesSection property={property} />
            </div>

            {/* Address */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10")}>
              <SectionTitle className={cn("mb-3", isExpand && "text-white")}>Address</SectionTitle>
              <LeafletMap 
                lat={extendedData.address.lat} 
                lng={extendedData.address.lng} 
                className="aspect-[2/1] rounded-lg mb-3"
              />
              <div className="flex items-center justify-between">
                <p className={cn("text-sm", isExpand ? "text-zinc-400" : "text-muted-foreground")}>{extendedData.address.street}, {extendedData.address.city}</p>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", isExpand && "text-white hover:bg-zinc-700")} onClick={handleCopyAddress}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Pricing */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10 [&_*]:text-white [&_.text-muted-foreground]:text-zinc-400")}>
              <SectionTitle className={cn("mb-3", isExpand && "text-white")}>Pricing</SectionTitle>
              <DetailRow label="Property price" value={`${property.price.toLocaleString()} ${property.currency}`} />
              {extendedData.pricing.communityFees && <DetailRow label="Community fees" value={`${extendedData.pricing.communityFees} ${property.currency}/month`} />}
              {extendedData.pricing.ibi && <DetailRow label="IBI" value={`${extendedData.pricing.ibi} ${property.currency}/year`} />}
              {extendedData.pricing.pricePerArea && <DetailRow label="Price per area" value={`${extendedData.pricing.pricePerArea.toLocaleString()} ${property.currency}/m²`} />}
            </Card>

            {/* Description */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10")}>
              <SectionTitle className={cn("mb-3", isExpand && "text-white")}>Description</SectionTitle>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>{extendedData.description.translations[0].flag}</span>
                  <span className={cn("text-sm", isExpand ? "text-zinc-400" : "text-muted-foreground")}>{extendedData.description.translations[0].language}</span>
                </div>
                <p className={cn("text-sm leading-relaxed whitespace-pre-line", !isDescriptionExpanded && "line-clamp-4", isExpand && "text-zinc-300")}>
                  {extendedData.description.translations[0].text}
                </p>
              </div>
              <button 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} 
                className={cn("text-sm font-medium flex items-center gap-1 mt-3 hover:underline", isExpand ? "text-[#10B189]" : "text-primary")}
              >
                {isDescriptionExpanded ? 'Show less' : 'Show more'} 
                <ChevronDown className={cn("w-4 h-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
              </button>
            </Card>

            {/* Property Features */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10 [&_*]:text-white [&_.text-muted-foreground]:text-zinc-400")}>
              <SectionTitle className={cn("mb-3", isExpand && "text-white")}>Property features</SectionTitle>
              <DetailRow label="Size" value={`${property.size} ${property.sizeUnit}`} />
              {extendedData.features.usableSize && <DetailRow label="Usable size" value={`${extendedData.features.usableSize} m²`} />}
              <DetailRow label="Bedrooms" value={property.bedrooms} />
              <DetailRow label="Bathrooms" value={property.bathrooms} />
              {extendedData.features.condition && <DetailRow label="Condition" value={extendedData.features.condition} />}
              {extendedData.features.occupancyStatus && <DetailRow label="Occupancy status" value={extendedData.features.occupancyStatus} />}
            </Card>

            {/* Additional Info */}
            <Card className={cn("p-4", isExpand && "bg-zinc-800/50 border-white/10")}>
              <SectionTitle className={cn("mb-3", isExpand && "text-white")}>Additional information</SectionTitle>
              <div className="space-y-4">
                {extendedData.additionalInfo.exposure && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isExpand && "text-white")}>Exposure</p>
                    <div className={isExpand ? "[&_*]:text-white [&_.text-muted-foreground]:text-zinc-400" : ""}>
                      {extendedData.additionalInfo.exposure.view && <DetailRow label="View" value={extendedData.additionalInfo.exposure.view} />}
                      {extendedData.additionalInfo.exposure.orientation && <DetailRow label="Orientation" value={extendedData.additionalInfo.exposure.orientation} />}
                    </div>
                  </div>
                )}
                {extendedData.additionalInfo.buildAndFinish && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isExpand && "text-white")}>Build and finish</p>
                    <div className={isExpand ? "[&_*]:text-white [&_.text-muted-foreground]:text-zinc-400" : ""}>
                      {extendedData.additionalInfo.buildAndFinish.constructionYear && <DetailRow label="Construction year" value={extendedData.additionalInfo.buildAndFinish.constructionYear} />}
                      {extendedData.additionalInfo.buildAndFinish.renovationYear && <DetailRow label="Renovation year" value={extendedData.additionalInfo.buildAndFinish.renovationYear} />}
                      {extendedData.additionalInfo.buildAndFinish.furnished && <DetailRow label="Furnished" value={extendedData.additionalInfo.buildAndFinish.furnished} />}
                    </div>
                  </div>
                )}
                {extendedData.additionalInfo.propertyAmenities && extendedData.additionalInfo.propertyAmenities.length > 0 && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isExpand && "text-white")}>Property amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extendedData.additionalInfo.propertyAmenities.map((a, i) => (
                        <Badge key={i} variant="outline" className={cn("text-xs font-normal", isExpand && "border-white/20 text-zinc-300")}>{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {extendedData.additionalInfo.buildingAmenities && extendedData.additionalInfo.buildingAmenities.length > 0 && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isExpand && "text-white")}>Building amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extendedData.additionalInfo.buildingAmenities.map((a, i) => (
                        <Badge key={i} variant="outline" className={cn("text-xs font-normal", isExpand && "border-white/20 text-zinc-300")}>{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {extendedData.additionalInfo.energyCertificate && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isExpand && "text-white")}>Energy certificate</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">
                          {extendedData.additionalInfo.energyCertificate.consumptionType}
                        </div>
                        <div>
                          <p className={cn("text-xs", isExpand ? "text-zinc-400" : "text-muted-foreground")}>Consumption</p>
                          <p className={cn("text-sm font-medium", isExpand && "text-white")}>{extendedData.additionalInfo.energyCertificate.consumption} kWh/m²</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
                          {extendedData.additionalInfo.energyCertificate.emissionsType}
                        </div>
                        <div>
                          <p className={cn("text-xs", isExpand ? "text-zinc-400" : "text-muted-foreground")}>Emissions</p>
                          <p className={cn("text-sm font-medium", isExpand && "text-white")}>{extendedData.additionalInfo.energyCertificate.emissions} kg CO²/m²</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Listed by */}
            <Card className={cn("overflow-hidden", isExpand && "bg-zinc-800/50 border-white/10")}>
              <div className={cn("p-3 border-b", isExpand ? "bg-zinc-800/30 border-white/10" : "bg-muted/30")}>
                <p className={cn("text-xs font-medium uppercase tracking-wider", isExpand ? "text-zinc-400" : "text-muted-foreground")}>Listed by</p>
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
                    <h4 className={cn("font-semibold text-sm", isExpand && "text-white")}>{property.owner.isYou ? 'You' : property.owner.name}</h4>
                    <p className={cn("text-xs", isExpand ? "text-zinc-400" : "text-muted-foreground")}>Real Estate Agent</p>
                  </div>
                </div>
                {!property.owner.isYou && (
                  <div className="flex gap-2">
                    <Button className={cn("flex-1 gap-2", isExpand && "bg-white text-black hover:bg-zinc-200")} size="sm">
                      <Phone className="w-4 h-4" />Contact
                    </Button>
                    <Button variant="outline" className={cn("flex-1 gap-2", isExpand && "border-white/20 text-white hover:bg-zinc-700")} size="sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </ScrollArea>

      {/* Bottom CTA */}
      <div className={cn("p-4 border-t flex-shrink-0", isExpand ? "bg-[#1A1A1A] border-white/10" : "bg-background")}>
        <div className="flex gap-3">
          {onDiscard && onSave ? (
            <>
              <Button 
                variant="outline" 
                className={cn(
                  "flex-1 gap-2",
                  isExpand && "border-white/20 text-white hover:bg-zinc-700"
                )} 
                size="lg"
                onClick={onDiscard}
              >
                <Trash2 className="w-4 h-4" />
                Discard
              </Button>
              <Button 
                className={cn("flex-1 gap-2", isExpand && "bg-[#10B189] hover:bg-[#0ea57d]")} 
                size="lg"
                onClick={onSave}
              >
                <Bookmark className="w-4 h-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className={cn("flex-1 gap-2", isExpand && "border-white/20 text-white hover:bg-zinc-700")} size="lg">
                <Send className="w-4 h-4" />
                Share
              </Button>
              <Button className={cn("flex-1 gap-2", isExpand && "bg-[#10B189] hover:bg-[#0ea57d]")} size="lg">
                <Calendar className="w-4 h-4" />
                Book
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
