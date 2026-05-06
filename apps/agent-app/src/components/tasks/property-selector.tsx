import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, Home, Check, MapPin, Bed, Bath, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PropertySelectorDevScenario = 'default' | 'no-properties' | 'no-results' | 'few-properties' | 'many-properties' | 'loading';

interface Property {
  id: string;
  title: string;
  image?: string;
  images?: string[];
  price?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: string;
  neighborhoods?: string[];
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  sizeUnit?: string;
  sizeRange?: {
    min: number;
    max: number;
    unit: string;
  };
  propertyTypes?: string[];
  type?: string;
}

interface PropertySelectorProps {
  selectedPropertyId?: string;
  onSelectProperty: (property: Property) => void;
  size?: 'default' | 'compact';
  className?: string;
  maxHeight?: string;
  devScenario?: PropertySelectorDevScenario;
  /** External properties to use instead of mock data */
  properties?: Property[];
}

// Mock properties for dev scenarios
const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Modern Apartment in La Latina',
    images: ['/placeholder.svg'],
    priceRange: { min: 450000, max: 450000, currency: '€' },
    neighborhoods: ['La Latina', 'Centro'],
    bedrooms: 3,
    bathrooms: 2,
    sizeRange: { min: 120, max: 120, unit: 'm²' },
    propertyTypes: ['Apartment'],
  },
  {
    id: 'prop-2',
    title: 'Luxury Penthouse in Salamanca',
    images: ['/placeholder.svg'],
    priceRange: { min: 1200000, max: 1200000, currency: '€' },
    neighborhoods: ['Salamanca'],
    bedrooms: 4,
    bathrooms: 3,
    sizeRange: { min: 200, max: 200, unit: 'm²' },
    propertyTypes: ['Penthouse'],
  },
  {
    id: 'prop-3',
    title: 'Cozy Studio in Malasaña',
    images: ['/placeholder.svg'],
    priceRange: { min: 180000, max: 180000, currency: '€' },
    neighborhoods: ['Malasaña'],
    bedrooms: 1,
    bathrooms: 1,
    sizeRange: { min: 45, max: 45, unit: 'm²' },
    propertyTypes: ['Studio'],
  },
  {
    id: 'prop-4',
    title: 'Family House in Pozuelo',
    images: ['/placeholder.svg'],
    priceRange: { min: 850000, max: 850000, currency: '€' },
    neighborhoods: ['Pozuelo'],
    bedrooms: 5,
    bathrooms: 4,
    sizeRange: { min: 300, max: 300, unit: 'm²' },
    propertyTypes: ['House'],
  },
  {
    id: 'prop-5',
    title: 'Investment Flat in Chamberí',
    images: ['/placeholder.svg'],
    priceRange: { min: 320000, max: 320000, currency: '€' },
    neighborhoods: ['Chamberí'],
    bedrooms: 2,
    bathrooms: 1,
    sizeRange: { min: 75, max: 75, unit: 'm²' },
    propertyTypes: ['Apartment'],
  },
];

const mockManyProperties: Property[] = [
  ...mockProperties,
  {
    id: 'prop-6',
    title: 'Duplex in Retiro',
    images: ['/placeholder.svg'],
    priceRange: { min: 580000, max: 580000, currency: '€' },
    neighborhoods: ['Retiro'],
    bedrooms: 3,
    bathrooms: 2,
    sizeRange: { min: 140, max: 140, unit: 'm²' },
    propertyTypes: ['Duplex'],
  },
  {
    id: 'prop-7',
    title: 'Loft in Lavapiés',
    images: ['/placeholder.svg'],
    priceRange: { min: 290000, max: 290000, currency: '€' },
    neighborhoods: ['Lavapiés'],
    bedrooms: 1,
    bathrooms: 1,
    sizeRange: { min: 80, max: 80, unit: 'm²' },
    propertyTypes: ['Loft'],
  },
  {
    id: 'prop-8',
    title: 'Villa in La Moraleja',
    images: ['/placeholder.svg'],
    priceRange: { min: 2500000, max: 2500000, currency: '€' },
    neighborhoods: ['La Moraleja'],
    bedrooms: 6,
    bathrooms: 5,
    sizeRange: { min: 500, max: 500, unit: 'm²' },
    propertyTypes: ['Villa'],
  },
];

export function PropertySelector({
  selectedPropertyId,
  onSelectProperty,
  size = 'default',
  className,
  devScenario = 'default',
  properties: externalProperties
}: PropertySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show scrollbar
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Get properties based on dev scenario or external props
  const properties = useMemo(() => {
    if (externalProperties) return externalProperties;
    switch (devScenario) {
      case 'no-properties':
      case 'no-results':
        return [];
      case 'few-properties':
        return mockProperties.slice(0, 3);
      case 'many-properties':
        return mockManyProperties;
      default:
        return mockProperties;
    }
  }, [devScenario, externalProperties]);

  // Debounce search query with loading state
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, debouncedQuery]);

  const filteredProperties = useMemo(() => {
    if (devScenario === 'no-properties') return [];
    return properties.filter((property) =>
      property.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (property.neighborhoods && property.neighborhoods.some(n => 
        n.toLowerCase().includes(debouncedQuery.toLowerCase())
      )) ||
      (property.propertyTypes && property.propertyTypes.some(t => 
        t.toLowerCase().includes(debouncedQuery.toLowerCase())
      ))
    );
  }, [properties, debouncedQuery, devScenario]);

  const isCompact = size === 'compact';
  const isLoading = devScenario === 'loading' || isSearching;
  const hasNoProperties = (properties.length === 0 && !debouncedQuery) || devScenario === 'no-properties';
  const showSearchEmptyState = (filteredProperties.length === 0 && debouncedQuery && !isSearching) || devScenario === 'no-results';
  const showEmptyState = showSearchEmptyState || hasNoProperties;

  const formatPrice = (property: Property) => {
    if (property.price) return property.price;
    if (!property.priceRange) return 'Price on request';
    const { max, currency } = property.priceRange;
    return `${currency}${max.toLocaleString()}`;
  };

  const formatSize = (property: Property) => {
    if (property.size && property.sizeUnit) {
      return `${property.size} ${property.sizeUnit}`;
    }
    if (!property.sizeRange) return null;
    const { max, unit } = property.sizeRange;
    return `${max} ${unit}`;
  };

  const getLocation = (property: Property) => {
    if (property.location) return property.location;
    if (property.neighborhoods && property.neighborhoods.length > 0) {
      return property.neighborhoods[0];
    }
    return '';
  };

  const getImage = (property: Property) => {
    if (property.image) return property.image;
    if (property.images && property.images.length > 0) return property.images[0];
    return '/placeholder.svg';
  };

  return (
    <div className={cn("flex flex-col h-full", className)} style={{ minHeight: 0 }}>
      {/* Search Input */}
      <div className="flex gap-3 mb-4 shrink-0 px-1 pt-1">
        <div className="relative flex-1">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            isCompact ? "left-3 w-4 h-4" : "left-4 w-5 h-5"
          )} />
          <Input
            placeholder="Search properties by name or location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              isCompact ? "pl-10 pr-10 h-11 rounded-full" : "pl-12 pr-10 h-14 text-lg rounded-full"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                isCompact ? "right-3" : "right-4"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Property List */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 px-1 pb-1 scrollbar-auto-hide",
          (showEmptyState && !isSearching)
            ? "flex items-center justify-center"
            : "overflow-y-auto overscroll-contain",
          isScrolling && "scrollbar-visible"
        )}
        style={{ minHeight: 0, overflow: (showEmptyState && !isSearching) ? 'hidden' : 'auto' }}
      >
        {/* Search Loading State */}
        {isSearching ? (
          <div className={cn(
            "text-center text-muted-foreground animate-fade-in",
            isCompact ? "py-8" : "py-12"
          )}>
            <div className={cn(
              "border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto mb-3",
              isCompact ? "h-5 w-5" : "h-6 w-6"
            )} />
            <p className={isCompact ? "text-base" : "text-lg"}>Searching...</p>
          </div>
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground animate-fade-in px-4">
            <Home className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-base font-medium mb-1">
              {showSearchEmptyState ? "No properties found" : "No properties available"}
            </p>
            <p className="text-sm">
              {showSearchEmptyState
                ? "Try adjusting your search"
                : "No properties to display"
              }
            </p>
          </div>
        ) : (
          <div
            key={debouncedQuery}
            className={cn("pb-2", isCompact ? "space-y-2" : "space-y-3")}
          >
            {filteredProperties.map((property, index) => {
              const isSelected = selectedPropertyId === property.id;

              return (
                <button
                  key={property.id}
                  onClick={() => onSelectProperty(property)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left",
                    "transition-all duration-200 ease-out",
                    "opacity-0 animate-fade-in",
                    isCompact ? "p-3 rounded-lg" : "p-3 rounded-xl border-2",
                    isCompact
                      ? "hover:bg-muted/50"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                  style={{
                    animationDelay: `${Math.min(index * 40, 200)}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  {/* Property Image */}
                  <div className={cn(
                    "rounded-lg overflow-hidden bg-muted shrink-0",
                    isCompact ? "w-16 h-12" : "w-20 h-14"
                  )}>
                    <img
                      src={getImage(property)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Property Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium line-clamp-1",
                      isCompact ? "text-sm" : "text-base"
                    )}>
                      {property.title}
                    </p>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className={cn(
                        "truncate",
                        isCompact ? "text-xs" : "text-sm"
                      )}>
                        {getLocation(property)}
                      </span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 mt-1",
                      isCompact ? "text-xs" : "text-sm"
                    )}>
                      <span className="font-semibold text-foreground">
                        {formatPrice(property)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      {property.bedrooms && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Bed className="w-3 h-3" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Bath className="w-3 h-3" />
                          {property.bathrooms}
                        </span>
                      )}
                      {formatSize(property) && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Square className="w-3 h-3" />
                          {formatSize(property)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && !isCompact && (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}